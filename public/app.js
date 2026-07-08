// Front-end logic for Joe's Learning App: fetches subjects/topics, requests a
// lesson + quiz from the backend, walks the learner through the quiz, and
// adapts difficulty (level 1-3) based on how they did — mirroring the
// "reconsider my app's inputs" / "refine interactions" feedback loop from the
// prototype -> production journey.

const state = {
  subjectsBySubject: {},
  currentLesson: null,
  quizIndex: 0,
  correctCount: 0,
  level: 1,
};

const el = (id) => document.getElementById(id);

async function init() {
  const health = await fetchJSON("/api/subjects");
  el("ai-badge").textContent = health.aiEnabled
    ? "🤖 AI generation enabled — any topic works"
    : "📚 Using offline sample lessons (no AI key configured)";

  const subjectSelect = el("subject");
  health.subjects.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subjectSelect.appendChild(opt);
  });

  await loadTopics(subjectSelect.value);
  subjectSelect.addEventListener("change", () => loadTopics(subjectSelect.value));

  el("start-btn").addEventListener("click", startLesson);
  el("quiz-btn").addEventListener("click", showQuizScreen);
  el("next-btn").addEventListener("click", nextQuestion);
  el("again-btn").addEventListener("click", resetToPicker);
}

async function loadTopics(subject) {
  const data = await fetchJSON(`/api/topics?subject=${encodeURIComponent(subject)}`);
  const topicSelect = el("topic");
  topicSelect.innerHTML = "";
  data.topics.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    topicSelect.appendChild(opt);
  });
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function startLesson() {
  const subject = el("subject").value;
  const topic = el("topic").value;
  const grade = el("grade").value;

  el("start-btn").disabled = true;
  el("start-btn").textContent = "Generating lesson…";

  try {
    const lesson = await fetchJSON("/api/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topic, grade, level: state.level }),
    });
    state.currentLesson = lesson;
    state.quizIndex = 0;
    state.correctCount = 0;

    el("lesson-title").textContent = `${lesson.subject}: ${lesson.topic}`;
    el("lesson-body").innerHTML = lesson.lesson.map((p) => `<p>${p}</p>`).join("");

    show("lesson-screen");
  } catch (err) {
    alert("Sorry, something went wrong generating the lesson. Please try again.");
    console.error(err);
  } finally {
    el("start-btn").disabled = false;
    el("start-btn").textContent = "Start Lesson";
  }
}

function showQuizScreen() {
  show("quiz-screen");
  renderQuestion();
}

function renderQuestion() {
  const q = state.currentLesson.questions[state.quizIndex];
  el("quiz-progress").textContent = `Question ${state.quizIndex + 1} of ${state.currentLesson.questions.length}`;
  el("level-badge").textContent = `Level ${state.currentLesson.level}`;
  el("question-text").textContent = q.q;
  el("feedback").textContent = "";
  el("feedback").className = "";
  el("next-btn").classList.add("hidden");

  const choicesEl = el("choices");
  choicesEl.innerHTML = "";
  q.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => selectAnswer(btn, choice, q.answer));
    choicesEl.appendChild(btn);
  });
}

function selectAnswer(button, choice, correctAnswer) {
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = choice === correctAnswer;
  if (isCorrect) {
    button.classList.add("correct");
    state.correctCount += 1;
    el("feedback").textContent = "✅ Correct! Nice work.";
    el("feedback").className = "correct";
  } else {
    button.classList.add("incorrect");
    el("feedback").textContent = `❌ Not quite — the correct answer is "${correctAnswer}".`;
    el("feedback").className = "incorrect";
    buttons.forEach((b) => {
      if (b.textContent === correctAnswer) b.classList.add("correct");
    });
  }
  el("next-btn").classList.remove("hidden");
  el("next-btn").textContent =
    state.quizIndex + 1 < state.currentLesson.questions.length ? "Next →" : "See Results →";
}

function nextQuestion() {
  state.quizIndex += 1;
  if (state.quizIndex < state.currentLesson.questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  const total = state.currentLesson.questions.length;
  const score = state.correctCount;
  const ratio = score / total;

  // Adaptive difficulty: do great -> level up, struggle -> level down.
  let newLevel = state.level;
  if (ratio === 1 && state.level < 3) newLevel += 1;
  else if (ratio < 0.5 && state.level > 1) newLevel -= 1;
  state.level = newLevel;

  el("results-summary").textContent = `You scored ${score} out of ${total} on ${state.currentLesson.topic}.`;
  el("results-level").textContent =
    newLevel > 0
      ? `Next time we'll try level ${newLevel} — ${
          newLevel > state.currentLesson.level
            ? "leveling up!"
            : newLevel < state.currentLesson.level
            ? "let's build confidence first."
            : "same level, keep practicing."
        }`
      : "";
  show("results-screen");
}

function resetToPicker() {
  show("picker");
}

function show(id) {
  ["picker", "lesson-screen", "quiz-screen", "results-screen"].forEach((s) => {
    el(s).classList.toggle("hidden", s !== id);
  });
}

init();
