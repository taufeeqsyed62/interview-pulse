let questions = [];
let currentQuestionIndex = 0;
let selectedSubject = "All";
let scoreData = JSON.parse(localStorage.getItem("scoreData")) || {};
let wrongAnswers = JSON.parse(localStorage.getItem("wrongAnswers")) || [];

// Load questions
fetch("questions.json")
  .then((response) => response.json())
  .then((data) => {
    questions = data;
    initializeApp();
  })
  .catch((error) => console.error("Error loading questions:", error));

function initializeApp() {
  updateHomePage();
  populateSubjectFilters();
  showQuestion();
  showAnswers();
  navigatePage("home");
  setupEventListeners();
}

// Navigation
function navigatePage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const pageElement = document.querySelector(`#${page}`);
  if (pageElement) {
    pageElement.classList.add("active");
  } else {
    console.error(`Page with ID ${page} not found`);
  }
}

// Home Page
function updateHomePage() {
  const total = questions.length;
  const completed = Object.keys(scoreData).filter(
    (key) => questions[key] !== undefined
  ).length; // Count all answered questions
  const percentage = total ? (completed / total) * 100 : 0;

  document.getElementById("total-questions").textContent = total;
  document.getElementById("completed-questions").textContent = completed;

// Update horizontal progress bar
const progressBarFill = document.querySelector("#home .progress-bar__fill");
progressBarFill.style.width = `${percentage}%`;

document.querySelector(".progress-text").textContent = `${Math.round(percentage)}%`;

  document.querySelector(".progress-text").textContent = `${Math.round(percentage)}%`;
}

function setupEventListeners() {
  document.getElementById("start-quiz").addEventListener("click", () => {
    // Find the first unanswered question for the selected subject
    const filteredQuestions =
      selectedSubject === "All"
        ? questions
        : questions.filter((q) => q.subject === selectedSubject);
    currentQuestionIndex = findFirstUnansweredQuestion(filteredQuestions);
    navigatePage("quiz");
    showQuestion();
  });

  document.getElementById("answers-page").addEventListener("click", () => {
    navigatePage("answers");
    showAnswers();
  });

  document.getElementById("play-again").addEventListener("click", () => {
    localStorage.removeItem("scoreData");
    localStorage.removeItem("wrongAnswers");
    scoreData = {};
    wrongAnswers = [];
    currentQuestionIndex = 0;
    updateHomePage();
    showQuestion();
    navigatePage("home");
  });

  document.getElementById("review-answers").addEventListener("click", () => {
    navigatePage("answers");
    showAnswers(true);
  });

  document.getElementById("quiz-back").addEventListener("click", () => {
    navigatePage("home"); // Fixed case sensitivity
  });

  document.getElementById("answers-back").addEventListener("click", () => {
    navigatePage("home");
  });

  document.getElementById("random-question").addEventListener("click", () => {
    const filteredQuestions =
      selectedSubject === "All"
        ? questions
        : questions.filter((q) => q.subject === selectedSubject);
    currentQuestionIndex = Math.floor(Math.random() * filteredQuestions.length);
    showQuestion();
  });
}

// Find the first unanswered question
function findFirstUnansweredQuestion(filteredQuestions) {
  for (let i = 0; i < filteredQuestions.length; i++) {
    const questionId = questions.indexOf(filteredQuestions[i]);
    if (!(questionId in scoreData)) {
      return i;
    }
  }
  return 0; // If all answered, start from beginning
}

// Quiz Page
function populateSubjectFilters() {
  const subjects = ["All", ...new Set(questions.map((q) => q.subject))];
  const quizFilter = document.getElementById("subject-filter");
  const answersFilter = document.getElementById("answers-subject-filter");

  quizFilter.innerHTML = "";
  answersFilter.innerHTML = "";

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    quizFilter.appendChild(option.cloneNode(true));
    answersFilter.appendChild(option);
  });

  quizFilter.addEventListener("change", (e) => {
    selectedSubject = e.target.value;
    const filteredQuestions =
      selectedSubject === "All"
        ? questions
        : questions.filter((q) => q.subject === selectedSubject);
    currentQuestionIndex = findFirstUnansweredQuestion(filteredQuestions);
    showQuestion();
  });

  answersFilter.addEventListener("change", () => showAnswers());
}

function showQuestion() {
  const filteredQuestions =
    selectedSubject === "All"
      ? questions
      : questions.filter((q) => q.subject === selectedSubject);
  if (filteredQuestions.length === 0) {
    document.getElementById("quiz-question").textContent =
      "No questions available for this subject.";
    document.getElementById("options").innerHTML = "";
    document.getElementById("question-index").textContent = "0/0";
    document.querySelector(".progress-bar__fill").style.width = "0%";
    return;
  }

  const question = filteredQuestions[currentQuestionIndex];
  document.getElementById("quiz-question").textContent = question.question;
  document.getElementById(
    "question-index"
  ).textContent = `Question ${currentQuestionIndex + 1} of ${
    filteredQuestions.length
  }`;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.classList.add("option-btn");
    const letter = String.fromCharCode(65 + index); // A, B, C, D
    button.innerHTML = `
      <span class="option-letter">${letter}</span>
      <span class="option-text">${option}</span>
    `;
    button.addEventListener("click", () =>
      handleAnswer(option, question.correct, filteredQuestions, button)
    );
    optionsDiv.appendChild(button);
  });

  const progress = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;
  document.querySelector(".progress-bar__fill").style.width = `${progress}%`;
}

function handleAnswer(selected, correct, filteredQuestions, selectedButton) {
  const buttons = document.querySelectorAll(".options .option-btn");
  buttons.forEach((button) => {
    button.disabled = true;
    const optionText = button.querySelector(".option-text").textContent;
    if (optionText === correct) {
      button.classList.add("correct");
    }
    if (optionText === selected) {
      button.classList.add(selected === correct ? "correct" : "incorrect");
      if (selected !== correct) {
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        if (!wrongAnswers.some((q) => q.question === currentQuestion.question)) {
          wrongAnswers.push(currentQuestion);
          localStorage.setItem("wrongAnswers", JSON.stringify(wrongAnswers));
        }
      }
    }
  });

  const questionId = questions.indexOf(filteredQuestions[currentQuestionIndex]);
  scoreData[questionId] = selected; // Store the selected answer
  localStorage.setItem("scoreData", JSON.stringify(scoreData));

  setTimeout(() => {
    const nextUnanswered = findFirstUnansweredQuestion(filteredQuestions);
    currentQuestionIndex = nextUnanswered;
    showQuestion();
    updateHomePage();
  }, 1000);
}

// Answers Page
function showAnswers(showWrongOnly = false) {
  const filter = document.getElementById("answers-subject-filter").value;
  const answersList = document.getElementById("answers-list");
  answersList.innerHTML = "";

  const filteredQuestions =
    filter === "All" ? questions : questions.filter((q) => q.subject === filter);
  const questionsToShow = showWrongOnly ? wrongAnswers : filteredQuestions;

  if (questionsToShow.length === 0) {
    const message = document.createElement("div");
    message.classList.add("card");
    message.textContent = showWrongOnly
      ? "No wrong answers to review."
      : "No questions available for this subject.";
    answersList.appendChild(message);
    return;
  }

  questionsToShow.forEach((q) => {
    if (filter !== "All" && q.subject !== filter) return;
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <span class="subject">${q.subject}</span>
      <h3 class="question">${q.question}</h3>
      <p class="answer">Answer: ${q.correct}</p>
    `;
    answersList.appendChild(card);
  });
}