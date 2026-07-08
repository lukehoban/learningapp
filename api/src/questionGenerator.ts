import type { Difficulty, QuizQuestion, QuizRequest } from "./types.js";

/**
 * A tiny deterministic pseudo-random number generator (mulberry32).
 * Deterministic output keeps the offline generator testable and lets a
 * caller reproduce a quiz by passing the same seed.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Build four unique options around a numeric answer and shuffle them. */
function numericOptions(
  rng: () => number,
  answer: number
): { options: string[]; answerIndex: number } {
  const values = new Set<number>([answer]);
  let guard = 0;
  while (values.size < 4 && guard < 50) {
    guard++;
    const delta = randInt(rng, 1, Math.max(3, Math.abs(answer)) + 2);
    const candidate = rng() < 0.5 ? answer - delta : answer + delta;
    if (candidate >= 0 || answer < 0) {
      values.add(candidate);
    }
  }
  // Guarantee four options even if the loop could not find distinct distractors.
  let filler = answer + 1;
  while (values.size < 4) {
    values.add(filler++);
  }
  const options = shuffle(rng, [...values]).map(String);
  return { options, answerIndex: options.indexOf(String(answer)) };
}

function shuffle<T>(rng: () => number, items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Scale the size of the numbers used in math questions to grade & difficulty. */
function numberRange(grade: number, difficulty: Difficulty): number {
  const base = Math.max(10, grade * 10);
  const multiplier = difficulty === "easy" ? 0.5 : difficulty === "hard" ? 2 : 1;
  return Math.max(5, Math.round(base * multiplier));
}

function makeMathQuestion(
  rng: () => number,
  grade: number,
  difficulty: Difficulty
): QuizQuestion {
  const max = numberRange(grade, difficulty);
  const operations = difficulty === "easy" ? ["+", "-"] : ["+", "-", "×"];
  const op = operations[randInt(rng, 0, operations.length - 1)];

  let a: number;
  let b: number;
  let answer: number;
  if (op === "×") {
    const factorMax = Math.max(3, Math.min(12, Math.round(max / 5)));
    a = randInt(rng, 2, factorMax);
    b = randInt(rng, 2, factorMax);
    answer = a * b;
  } else if (op === "-") {
    a = randInt(rng, 1, max);
    b = randInt(rng, 0, a); // keep the answer non-negative for young learners
    answer = a - b;
  } else {
    a = randInt(rng, 1, max);
    b = randInt(rng, 1, max);
    answer = a + b;
  }

  const { options, answerIndex } = numericOptions(rng, answer);
  return {
    question: `What is ${a} ${op} ${b}?`,
    options,
    answerIndex,
    explanation: `${a} ${op} ${b} = ${answer}.`,
  };
}

/**
 * A small curated bank of questions for non-math topics so the offline
 * experience is genuinely useful, not just placeholder text.
 */
const TOPIC_BANK: Record<string, QuizQuestion[]> = {
  science: [
    {
      question: "Which planet is closest to the Sun?",
      options: ["Earth", "Mercury", "Mars", "Venus"],
      answerIndex: 1,
      explanation: "Mercury is the first planet from the Sun.",
    },
    {
      question: "What gas do plants take in from the air to make food?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
      answerIndex: 2,
      explanation: "Plants use carbon dioxide during photosynthesis.",
    },
    {
      question: "What is water made of?",
      options: [
        "Hydrogen and oxygen",
        "Carbon and oxygen",
        "Hydrogen and nitrogen",
        "Oxygen only",
      ],
      answerIndex: 0,
      explanation: "Water (H₂O) is made of hydrogen and oxygen.",
    },
    {
      question: "How many legs does an insect have?",
      options: ["4", "6", "8", "10"],
      answerIndex: 1,
      explanation: "All adult insects have six legs.",
    },
  ],
  animals: [
    {
      question: "Which animal is known as the King of the Jungle?",
      options: ["Tiger", "Lion", "Elephant", "Bear"],
      answerIndex: 1,
      explanation: "The lion is often called the King of the Jungle.",
    },
    {
      question: "Which of these animals can fly?",
      options: ["Penguin", "Ostrich", "Bat", "Frog"],
      answerIndex: 2,
      explanation: "A bat is a mammal that can truly fly.",
    },
    {
      question: "What do you call a baby dog?",
      options: ["Kitten", "Cub", "Puppy", "Calf"],
      answerIndex: 2,
      explanation: "A baby dog is called a puppy.",
    },
  ],
  geography: [
    {
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      answerIndex: 3,
      explanation: "The Pacific Ocean is the largest ocean.",
    },
    {
      question: "Which continent is the Sahara Desert on?",
      options: ["Asia", "Africa", "Australia", "Europe"],
      answerIndex: 1,
      explanation: "The Sahara Desert is in Africa.",
    },
    {
      question: "How many continents are there on Earth?",
      options: ["5", "6", "7", "8"],
      answerIndex: 2,
      explanation: "There are seven continents.",
    },
  ],
};

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

function isMathTopic(topic: string): boolean {
  const t = normalizeTopic(topic);
  return (
    t.includes("math") ||
    t.includes("arithmetic") ||
    t.includes("addition") ||
    t.includes("subtraction") ||
    t.includes("multiplication")
  );
}

/**
 * Generate a quiz entirely offline. Math topics are generated procedurally so
 * every request is fresh; other known topics draw from a curated bank.
 */
export function generateOfflineQuestions(
  req: QuizRequest,
  seed = Date.now()
): QuizQuestion[] {
  const rng = createRng(seed);
  const questions: QuizQuestion[] = [];

  const topicKey = normalizeTopic(req.topic);
  const bank = TOPIC_BANK[topicKey];

  if (bank && !isMathTopic(req.topic)) {
    const pool = shuffle(rng, bank);
    for (let i = 0; i < req.count; i++) {
      // Cycle through the curated pool if more questions are requested.
      const base = pool[i % pool.length];
      questions.push({
        ...base,
        options: [...base.options],
      });
    }
    return questions;
  }

  // Default to math questions for math topics and anything not in the bank.
  for (let i = 0; i < req.count; i++) {
    questions.push(makeMathQuestion(rng, req.grade, req.difficulty));
  }
  return questions;
}
