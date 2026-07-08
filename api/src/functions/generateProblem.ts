import { randomUUID } from 'crypto';
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import type { Grade, MathProblem } from '../types';
import { generateLocalProblem } from '../problemGenerator';
import { getOpenAIClient, isOpenAIConfigured } from '../openaiClient';

const GRADE_TOPICS: Record<Grade, string> = {
  1: 'addition and subtraction with numbers 1-20',
  2: 'addition and subtraction with numbers up to 100',
  3: 'multiplication tables (1-10) and simple division',
  4: 'multi-digit multiplication, long division, and introduction to fractions',
};

async function generateProblemWithAI(
  grade: Grade,
  streak: number,
  correct: number,
  incorrect: number,
): Promise<MathProblem | null> {
  try {
    const client = getOpenAIClient();
    const topic = GRADE_TOPICS[grade];
    const difficulty =
      streak >= 5 ? 'challenging' : streak >= 3 ? 'moderate' : 'standard';
    const performanceNote =
      incorrect > correct
        ? 'The student is struggling, so make it a bit easier.'
        : correct > incorrect
          ? 'The student is doing well, so you can make it a bit harder.'
          : '';

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly math teacher creating ${difficulty} problems for a ${grade}th-grade student learning ${topic}. ${performanceNote}
Return ONLY valid JSON matching this schema:
{
  "question": "string (e.g. '7 + 5 = ?')",
  "correctAnswer": number,
  "operation": "addition" | "subtraction" | "multiplication" | "division",
  "hint": "string (optional short hint)"
}
No markdown, no explanation, just the JSON object.`,
        },
        {
          role: 'user',
          content: `Generate one math problem for grade ${grade}.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      question: string;
      correctAnswer: number;
      operation: MathProblem['operation'];
      hint?: string;
    };

    return {
      id: randomUUID(),
      question: parsed.question,
      correctAnswer: parsed.correctAnswer,
      grade,
      operation: parsed.operation,
      hint: parsed.hint,
    };
  } catch (err) {
    console.error('AI problem generation failed, using local fallback:', err);
    return null;
  }
}

export async function generateProblemHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log('generateProblem called');

  const grade = (parseInt(request.query.get('grade') ?? '1', 10) || 1) as Grade;
  const validGrade: Grade = ([1, 2, 3, 4] as Grade[]).includes(grade) ? grade : 1;
  const streak = parseInt(request.query.get('streak') ?? '0', 10) || 0;
  const correct = parseInt(request.query.get('correct') ?? '0', 10) || 0;
  const incorrect = parseInt(request.query.get('incorrect') ?? '0', 10) || 0;

  let problem: MathProblem | null = null;

  if (isOpenAIConfigured()) {
    problem = await generateProblemWithAI(validGrade, streak, correct, incorrect);
  }

  if (!problem) {
    problem = generateLocalProblem(validGrade, streak);
  }

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  };
}

app.http('generateProblem', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: generateProblemHandler,
});
