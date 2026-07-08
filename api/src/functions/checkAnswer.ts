import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import type { AnswerCheckRequest, AnswerResult, Grade } from '../types';
import { getOpenAIClient, isOpenAIConfigured } from '../openaiClient';

const ENCOURAGEMENTS_CORRECT = [
  '🌟 You are a math superstar!',
  '🚀 Incredible! Keep it up!',
  '🎉 Fantastic work!',
  '💪 You nailed it!',
  '🏆 Champion move!',
];

const ENCOURAGEMENTS_WRONG = [
  '💪 Almost there — try the next one!',
  '🌱 Every mistake helps you grow!',
  '🤝 Math takes practice — you can do it!',
  '⭐ Good try! You\'ll get the next one!',
  '🔄 Let\'s keep going — you\'re learning!',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateFeedbackWithAI(
  req: AnswerCheckRequest,
  correct: boolean,
): Promise<{ feedback: string; encouragement: string } | null> {
  try {
    const client = getOpenAIClient();
    const gradeOrdinals: Record<Grade, string> = {
      1: '1st', 2: '2nd', 3: '3rd', 4: '4th',
    };

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a warm, encouraging math teacher for ${gradeOrdinals[req.grade]}-grade students.
Return ONLY valid JSON matching this schema:
{
  "feedback": "string (1–2 sentences explaining the answer clearly)",
  "encouragement": "string (short motivational phrase with an emoji)"
}
No markdown, no explanation — only the JSON object.`,
        },
        {
          role: 'user',
          content: correct
            ? `The student answered ${req.question} correctly with ${req.answer}. Provide positive feedback.`
            : `The student answered ${req.question} incorrectly with ${req.answer}. The correct answer is ${req.correctAnswer}. Explain kindly and show the correct answer.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    return JSON.parse(content) as { feedback: string; encouragement: string };
  } catch (err) {
    console.error('AI feedback generation failed, using fallback:', err);
    return null;
  }
}

function generateLocalFeedback(
  req: AnswerCheckRequest,
  correct: boolean,
): { feedback: string; encouragement: string } {
  const feedback = correct
    ? `Great job! ${req.question.replace('= ?', `= ${req.correctAnswer}`)} ✓`
    : `The correct answer is ${req.correctAnswer}. ${req.question.replace('= ?', `= ${req.correctAnswer}`)}`;

  const encouragement = correct
    ? randomElement(ENCOURAGEMENTS_CORRECT)
    : randomElement(ENCOURAGEMENTS_WRONG);

  return { feedback, encouragement };
}

export async function checkAnswerHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log('checkAnswer called');

  let body: AnswerCheckRequest;
  try {
    body = (await request.json()) as AnswerCheckRequest;
  } catch {
    return { status: 400, body: 'Invalid JSON body' };
  }

  const { answer, correctAnswer } = body;
  if (typeof answer !== 'number' || typeof correctAnswer !== 'number') {
    return { status: 400, body: 'answer and correctAnswer must be numbers' };
  }

  const correct = answer === correctAnswer;

  let feedbackData: { feedback: string; encouragement: string } | null = null;
  if (isOpenAIConfigured()) {
    feedbackData = await generateFeedbackWithAI(body, correct);
  }

  if (!feedbackData) {
    feedbackData = generateLocalFeedback(body, correct);
  }

  const result: AnswerResult = {
    correct,
    feedback: feedbackData.feedback,
    encouragement: feedbackData.encouragement,
    correctAnswer,
  };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

app.http('checkAnswer', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: checkAnswerHandler,
});
