// Azure AI Foundry Agent Service integration — the "Deploy an Agent" +
// "Connect my app to the Agent" steps of the prototype -> production journey.
//
// When PROJECT_ENDPOINT is set (pointing at an Azure AI Foundry project),
// this module creates/reuses a persistent Agent backed by the deployed model,
// opens a thread per lesson request, asks it to produce the same structured
// lesson/quiz JSON as the direct-model path, and returns the parsed result.
//
// Auth is keyless: it uses DefaultAzureCredential, so locally that's your
// `az login` session, and in Azure it's the Web App's system-assigned
// managed identity (granted the "Azure AI User" / Cognitive Services
// OpenAI User role on the Foundry project by infra/main.bicep).

const PROJECT_ENDPOINT = process.env.PROJECT_ENDPOINT;
const MODEL_DEPLOYMENT_NAME = process.env.MODEL_DEPLOYMENT_NAME || "gpt-4o-mini";
const AGENT_NAME = process.env.AGENT_NAME || "joes-learning-app-agent";

const AGENT_INSTRUCTIONS = `You are a friendly homeschool teaching assistant creating a short lesson
for a child. Respond ONLY with strict JSON (no markdown fences) in this exact shape:
{
  "lesson": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "questions": [
    {"q": "question text", "choices": ["a","b","c","d"], "answer": "the correct choice, must match one entry in choices exactly"}
  ]
}
Write 3 short lesson paragraphs suited to the requested grade level and difficulty,
then 3 multiple-choice questions (4 choices each) that check understanding of the lesson.
Keep the language age-appropriate, encouraging, and clear.`;

function isConfigured() {
  return Boolean(PROJECT_ENDPOINT);
}

let clientPromise;
let agentPromise;

// Lazily require + construct so this module has no hard dependency on
// @azure/ai-agents / @azure/ai-projects / @azure/identity unless the app is
// actually configured to use the Agent Service (they're optional deps).
async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { AgentsClient } = require("@azure/ai-agents");
      const { DefaultAzureCredential } = require("@azure/identity");
      return new AgentsClient(PROJECT_ENDPOINT, new DefaultAzureCredential());
    })();
  }
  return clientPromise;
}

async function getOrCreateAgent() {
  if (!agentPromise) {
    agentPromise = (async () => {
      const client = await getClient();
      // Reuse an existing agent with our name if one exists, so repeated
      // deploys/restarts don't spawn duplicate agents.
      for await (const existing of client.listAgents()) {
        if (existing.name === AGENT_NAME) return existing;
      }
      return client.createAgent(MODEL_DEPLOYMENT_NAME, {
        name: AGENT_NAME,
        instructions: AGENT_INSTRUCTIONS,
      });
    })();
  }
  return agentPromise;
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "");
  return JSON.parse(cleaned);
}

async function generateLesson({ subject, topic, grade, level }) {
  const client = await getClient();
  const agent = await getOrCreateAgent();

  const thread = await client.threads.create();
  await client.messages.create(
    thread.id,
    "user",
    `Subject: ${subject}\nTopic: ${topic}\nGrade level: ${grade}\nDifficulty (1=easiest,3=hardest): ${level}`,
  );

  const run = await client.runs.createAndPoll(thread.id, agent.id, {
    pollingOptions: { intervalInMs: 1000 },
  });

  if (run.status !== "completed") {
    throw new Error(`Agent run did not complete: status=${run.status} lastError=${JSON.stringify(run.lastError)}`);
  }

  const messages = client.messages.list(thread.id, { order: "desc" });
  for await (const message of messages) {
    if (message.role !== "assistant") continue;
    const textPart = message.content.find((c) => c.type === "text");
    if (!textPart) continue;
    const parsed = extractJson(textPart.text.value);
    return {
      subject,
      topic,
      level,
      lesson: parsed.lesson,
      questions: parsed.questions,
      source: "azure-ai-foundry-agent",
    };
  }

  throw new Error("Agent run completed but produced no assistant message");
}

module.exports = { isConfigured, generateLesson };
