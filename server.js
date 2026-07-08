// Joe's homeschool "Dynamic Learning App".
// Serves a small API for generating lessons + adaptive quizzes, and static
// front-end assets. Lesson generation tries three tiers, from most to least
// "production": an Azure AI Foundry Agent (agentClient.js), a direct model
// call via OpenAI/Azure OpenAI (aiGenerator.js), then a built-in offline
// content bank (contentBank.js) so the app always runs with zero setup.

// "Monitor my app's usage and performance" step: if APPLICATIONINSIGHTS_CONNECTION_STRING
// is set (wired up automatically by infra/main.bicep), auto-collect requests,
// dependencies (e.g. calls to the Agent/model), and exceptions.
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  const appInsights = require("applicationinsights");
  appInsights.setup().setSendLiveMetrics(true).start();
}

const express = require("express");
const path = require("path");
const contentBank = require("./lib/contentBank");
const aiGenerator = require("./lib/aiGenerator");
const agentClient = require("./lib/agentClient");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/subjects", (req, res) => {
  res.json({
    subjects: contentBank.listSubjects(),
    aiEnabled: aiGenerator.isConfigured() || agentClient.isConfigured(),
    agentEnabled: agentClient.isConfigured(),
  });
});

app.get("/api/topics", (req, res) => {
  const { subject } = req.query;
  res.json({ topics: contentBank.listTopics(subject) });
});

// Generates a lesson + quiz. Body: { subject, topic, grade, level }
// `level` (1-3) drives adaptive difficulty based on the learner's recent performance.
app.post("/api/lesson", async (req, res) => {
  const { subject, topic, grade, level } = req.body || {};
  if (!subject || !topic) {
    return res.status(400).json({ error: "subject and topic are required" });
  }
  const numericLevel = Math.min(3, Math.max(1, Number(level) || 1));

  if (agentClient.isConfigured()) {
    try {
      const lesson = await agentClient.generateLesson({ subject, topic, grade: grade || "elementary", level: numericLevel });
      return res.json(lesson);
    } catch (err) {
      console.error("Agent generation failed, falling back to direct model call:", err.message);
    }
  }

  if (aiGenerator.isConfigured()) {
    try {
      const lesson = await aiGenerator.callOpenAI({ subject, topic, grade: grade || "elementary", level: numericLevel });
      return res.json(lesson);
    } catch (err) {
      console.error("AI generation failed, falling back to offline content:", err.message);
    }
  }

  const fallback = contentBank.getLesson(subject, topic, numericLevel);
  if (!fallback) {
    return res.status(404).json({ error: `No offline content for ${subject} / ${topic}. Try a listed topic, or configure an AI key for open-ended topics.` });
  }
  res.json(fallback);
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: aiGenerator.isConfigured() || agentClient.isConfigured(),
    agentEnabled: agentClient.isConfigured(),
  });
});

app.listen(PORT, () => {
  console.log(`Learning app running at http://localhost:${PORT}`);
  console.log(`Agent Service ${agentClient.isConfigured() ? "ENABLED" : "not configured"}`);
  console.log(`Direct AI generation ${aiGenerator.isConfigured() ? "ENABLED" : "disabled"} (offline content bank always available as final fallback)`);
});
