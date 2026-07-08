// Offline fallback content so the app works instantly with no API key.
// Organized by subject -> topic -> difficulty level (1 = easiest, 3 = hardest).
// This is what the "prototype on my laptop" step looks like before an AI model
// (e.g. via Azure AI Foundry) is wired in to generate lessons/questions dynamically.

const BANK = {
  Math: {
    "Addition & Subtraction": {
      lesson: [
        "Addition means putting numbers together to make a bigger number. " +
          "Subtraction means taking a number away to make a smaller number.",
        "When numbers get bigger, we can add or subtract in parts. For example, " +
          "47 + 26 = 47 + 20 + 6 = 67 + 6 = 73.",
        "Two-step word problems combine addition and subtraction, so read carefully " +
          "and decide which operation each part needs.",
      ],
      questions: {
        1: [
          { q: "What is 3 + 4?", choices: ["6", "7", "8", "5"], answer: "7" },
          { q: "What is 9 - 5?", choices: ["3", "4", "5", "6"], answer: "4" },
        ],
        2: [
          { q: "What is 27 + 15?", choices: ["42", "32", "40", "41"], answer: "42" },
          { q: "What is 54 - 28?", choices: ["24", "26", "36", "16"], answer: "26" },
        ],
        3: [
          { q: "A farm has 138 chickens. 47 are sold and 25 more hatch. How many now?", choices: ["116", "106", "126", "156"], answer: "116" },
        ],
      },
    },
    "Multiplication": {
      lesson: [
        "Multiplication is repeated addition. 4 x 3 means adding 4 three times: 4+4+4 = 12.",
        "Learning your times tables helps you multiply quickly without counting.",
        "Multiplying bigger numbers can be broken into parts, like 12 x 4 = (10 x 4) + (2 x 4) = 48.",
      ],
      questions: {
        1: [
          { q: "What is 2 x 3?", choices: ["5", "6", "8", "9"], answer: "6" },
          { q: "What is 5 x 1?", choices: ["1", "5", "0", "10"], answer: "5" },
        ],
        2: [
          { q: "What is 6 x 7?", choices: ["42", "36", "48", "40"], answer: "42" },
          { q: "What is 9 x 8?", choices: ["81", "72", "63", "64"], answer: "72" },
        ],
        3: [
          { q: "What is 14 x 6?", choices: ["84", "74", "94", "64"], answer: "84" },
        ],
      },
    },
  },
  Science: {
    "The Water Cycle": {
      lesson: [
        "The water cycle describes how water moves between the sky, land, and oceans.",
        "Evaporation happens when the sun heats water and turns it into vapor that rises into the air.",
        "That vapor cools and forms clouds (condensation), then falls back as rain or snow (precipitation).",
      ],
      questions: {
        1: [
          { q: "What is it called when water turns into vapor?", choices: ["Freezing", "Evaporation", "Melting", "Sinking"], answer: "Evaporation" },
        ],
        2: [
          { q: "What forms clouds?", choices: ["Evaporation", "Condensation", "Precipitation", "Erosion"], answer: "Condensation" },
        ],
        3: [
          { q: "Put in order: evaporation, precipitation, condensation.", choices: [
            "Evaporation, condensation, precipitation",
            "Condensation, evaporation, precipitation",
            "Precipitation, evaporation, condensation",
            "Evaporation, precipitation, condensation",
          ], answer: "Evaporation, condensation, precipitation" },
        ],
      },
    },
    "Simple Machines": {
      lesson: [
        "Simple machines help us do work with less effort. There are six kinds: lever, wheel and axle, pulley, inclined plane, wedge, and screw.",
        "A lever uses a pivot point (fulcrum) to lift heavy things, like a seesaw.",
        "An inclined plane is a ramp that makes it easier to move things up or down.",
      ],
      questions: {
        1: [
          { q: "Which is a simple machine?", choices: ["Lever", "Computer", "Car", "Phone"], answer: "Lever" },
        ],
        2: [
          { q: "What does an inclined plane help you do?", choices: ["Fly", "Move things up/down easily", "Make electricity", "Cook food"], answer: "Move things up/down easily" },
        ],
        3: [
          { q: "A seesaw is an example of which simple machine?", choices: ["Pulley", "Screw", "Lever", "Wedge"], answer: "Lever" },
        ],
      },
    },
  },
  Reading: {
    "Story Elements": {
      lesson: [
        "Every story has a setting (where/when it happens), characters (who it's about), and a plot (what happens).",
        "The plot usually has a problem the characters need to solve, and a resolution at the end.",
        "Noticing these parts helps you understand and retell a story clearly.",
      ],
      questions: {
        1: [
          { q: "What tells us WHERE and WHEN a story happens?", choices: ["Character", "Setting", "Plot", "Theme"], answer: "Setting" },
        ],
        2: [
          { q: "The problem a character must solve is part of the...", choices: ["Setting", "Plot", "Illustration", "Cover"], answer: "Plot" },
        ],
        3: [
          { q: "What is it called when the story's problem gets solved?", choices: ["Introduction", "Climax", "Resolution", "Setting"], answer: "Resolution" },
        ],
      },
    },
  },
};

function listSubjects() {
  return Object.keys(BANK);
}

function listTopics(subject) {
  return BANK[subject] ? Object.keys(BANK[subject]) : [];
}

function getLesson(subject, topic, level) {
  const entry = BANK[subject] && BANK[subject][topic];
  if (!entry) return null;
  const lvl = Math.min(3, Math.max(1, level || 1));
  const questions = entry.questions[lvl] || entry.questions[1];
  return {
    subject,
    topic,
    level: lvl,
    lesson: entry.lesson,
    questions,
    source: "offline-fallback",
  };
}

module.exports = { listSubjects, listTopics, getLesson, BANK };
