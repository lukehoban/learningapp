// Joe's homeschool "Dynamic Learning App" prototype.
// Serves a small API for generating lessons + adaptive quizzes, and static
// front-end assets. Uses an AI model when configured (OpenAI or Azure OpenAI /
// Azure AI Foundry), and otherwise falls back to a built-in content bank so
// the prototype always runs with zero setup.

const express = require("express");
const path = require("path");
const contentBank = require("./lib/contentBank");
const aiGenerator = require("./lib/aiGenerator");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/subjects", (req, res) => {
  res.json({
    subjects: contentBank.listSubjects(),
    aiEnabled: aiGenerator.isConfigured(),
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
  res.json({ status: "ok", aiEnabled: aiGenerator.isConfigured() });
});

app.listen(PORT, () => {
  console.log(`Learning app running at http://localhost:${PORT}`);
  console.log(`AI generation ${aiGenerator.isConfigured() ? "ENABLED" : "disabled (using offline content bank)"}`);
});
