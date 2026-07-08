// Optional AI-powered lesson generation. If OPENAI_API_KEY (or AZURE_OPENAI_*)
// env vars are set, we call the model to generate a fresh lesson + quiz for
// literally any topic a kid types in. If not configured, callers should fall
// back to the offline content bank so the app always works out of the box.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Azure OpenAI / Azure AI Foundry support (matches the "Find a capable model
// in Foundry" step of the prototype -> production journey).
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://<resource>.openai.azure.com
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

function isConfigured() {
  return Boolean(OPENAI_API_KEY) || Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY && AZURE_OPENAI_DEPLOYMENT);
}

const SYSTEM_PROMPT = `You are a friendly homeschool teaching assistant creating a short lesson
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

async function callOpenAI({ subject, topic, grade, level }) {
  const userPrompt = `Subject: ${subject}\nTopic: ${topic}\nGrade level: ${grade}\nDifficulty (1=easiest,3=hardest): ${level}`;

  let url, headers, body;
  if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY && AZURE_OPENAI_DEPLOYMENT) {
    url = `${AZURE_OPENAI_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    headers = { "Content-Type": "application/json", "api-key": AZURE_OPENAI_API_KEY };
    body = {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    };
  } else {
    url = "https://api.openai.com/v1/chat/completions";
    headers = { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` };
    body = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    };
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI response had no content");

  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "");
  const parsed = JSON.parse(cleaned);
  return {
    subject,
    topic,
    level,
    lesson: parsed.lesson,
    questions: parsed.questions,
    source: AZURE_OPENAI_ENDPOINT ? "azure-openai" : "openai",
  };
}

module.exports = { isConfigured, callOpenAI };
