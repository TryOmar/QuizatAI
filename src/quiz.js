import { showToast } from "./utils/ui.js";

class Quiz {
  constructor() {
    this.currentQuiz = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.timer = null;
    this.timeRemaining = 0;
    this.questions = [];
    this.isQuizComplete = false;

    // Initialize quiz when document is ready
    $(document).ready(() => {
      this.initializeQuiz();
    });
  }

  initializeQuiz() {
    this.loadQuizFromStorage();
    if (!this.currentQuiz) {
      showToast(
        "No quiz found. Please go back and set up a quiz first.",
        "error"
      );
      return;
    }

    // Set quiz title
    document.getElementById("quiz-title").textContent = this.currentQuiz.title;

    this.questions = this.shuffleArray([...this.currentQuiz.questions]);
    this.timeRemaining = this.currentQuiz.settings.timeLimit * 60;

    if (this.currentQuiz.settings.timeLimit > 0) {
      this.startTimer();
    } else {
      document.querySelector(".timer").style.display = "none";
    }

    this.displayQuestion();
    this.setupEventListeners();
  }

  loadQuizFromStorage() {
    const storedQuiz = localStorage.getItem("currentQuiz");
    if (storedQuiz) {
      this.currentQuiz = JSON.parse(storedQuiz);
    }
  }

  setupEventListeners() {
    // Only set up navigation button listeners once
    document
      .getElementById("next-btn")
      .addEventListener("click", () => this.nextQuestion());
    document
      .getElementById("prev-btn")
      .addEventListener("click", () => this.previousQuestion());
  }

  displayQuestion() {
    const question = this.questions[this.currentQuestionIndex];
    const questionContainer = document.querySelector(".question-container");
    const options = this.shuffleArray([...question.options]);

    document.querySelector(".question-text").textContent = question.text;

    const optionsContainer = document.querySelector(".options-container");
    optionsContainer.innerHTML = options
      .map(
        (option, index) => `
      <div class="option-item${
        this.userAnswers[this.currentQuestionIndex] !== undefined
          ? " disabled"
          : ""
      }${
          this.userAnswers[this.currentQuestionIndex] === index
            ? " selected"
            : ""
        }" data-index="${index}">
        ${option}
      </div>
    `
      )
      .join("");

    // Add click listeners to new options
    optionsContainer.querySelectorAll(".option-item").forEach((option) => {
      option.addEventListener("click", (e) => this.handleAnswerSelection(e));
    });

    // Update progress
    document.getElementById("current-question").textContent =
      this.currentQuestionIndex + 1;
    document.getElementById("total-questions").textContent =
      this.questions.length;
    document.getElementById("progress-fill").style.width = `${
      ((this.currentQuestionIndex + 1) / this.questions.length) * 100
    }%`;

    // Reset feedback section
    const feedbackSection = document.getElementById("feedback-section");
    feedbackSection.style.display = "none";

    // Update navigation buttons
    document.getElementById("prev-btn").disabled =
      this.currentQuestionIndex === 0;

    const nextButton = document.getElementById("next-btn");
    const isLastQuestion =
      this.currentQuestionIndex === this.questions.length - 1;

    // Update next button text and icon based on position
    nextButton.innerHTML = isLastQuestion
      ? '<i class="fas fa-flag-checkered"></i> Complete Quiz'
      : 'Next <i class="fas fa-arrow-right"></i>';

    // Enable next button if question is answered
    const hasCurrentAnswer =
      this.userAnswers[this.currentQuestionIndex] !== undefined;
    nextButton.disabled = !hasCurrentAnswer;

    // Restore previous answer and feedback if it exists
    if (hasCurrentAnswer) {
      const selectedOption =
        optionsContainer.children[this.userAnswers[this.currentQuestionIndex]];

      // Show answer feedback
      this.showAnswerFeedback(selectedOption, true);

      // Show explanation if in immediate review mode
      if (this.currentQuiz.settings.reviewMode === "Immediate") {
        this.showFeedback(selectedOption);
      }
    }
  }

  handleAnswerSelection(e) {
    const selectedOption = e.target.closest(".option-item");
    if (!selectedOption || this.isQuizComplete) return;

    // If user has already answered this question, prevent changing
    if (this.userAnswers[this.currentQuestionIndex] !== undefined) {
      return;
    }

    const optionIndex = parseInt(selectedOption.dataset.index);
    this.userAnswers[this.currentQuestionIndex] = optionIndex;

    this.showAnswerFeedback(selectedOption);
    document.getElementById("next-btn").disabled = false;

    // Disable all options after selection for current question only
    document.querySelectorAll(".option-item").forEach((option) => {
      option.classList.add("disabled");
    });

    if (this.currentQuiz.settings.reviewMode === "Immediate") {
      this.showFeedback(selectedOption);
    }
  }

  showAnswerFeedback(selectedOption, isRestoring = false) {
    // Remove previous selections if not restoring
    if (!isRestoring) {
      document.querySelectorAll(".option-item").forEach((option) => {
        option.classList.remove(
          "selected",
          "correct",
          "incorrect",
          "correct-answer"
        );
      });
    }

    const currentQuestion = this.questions[this.currentQuestionIndex];
    const isCorrect =
      selectedOption.textContent.trim() ===
      currentQuestion.correctAnswer.trim();

    selectedOption.classList.add("selected");
    if (this.currentQuiz.settings.reviewMode === "Immediate") {
      selectedOption.classList.add(isCorrect ? "correct" : "incorrect");

      if (!isCorrect) {
        const correctOption = Array.from(
          document.querySelectorAll(".option-item")
        ).find(
          (option) =>
            option.textContent.trim() === currentQuestion.correctAnswer.trim()
        );
        if (correctOption) {
          correctOption.classList.add("correct-answer");
        }
      }
    }
  }

  showFeedback(selectedOption) {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const isCorrect =
      selectedOption.textContent.trim() ===
      currentQuestion.correctAnswer.trim();

    const feedbackSection = document.getElementById("feedback-section");
    const explanationText = feedbackSection.querySelector(".explanation-text");

    explanationText.textContent = isCorrect
      ? "Correct! " + currentQuestion.explanation
      : "Incorrect. " + currentQuestion.explanation;

    feedbackSection.style.display = "block";
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
    } else {
      this.completeQuiz();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
    }
  }

  startTimer() {
    const timerDisplay = document.querySelector(".timer");

    this.timer = setInterval(() => {
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
        this.completeQuiz();
        return;
      }

      this.timeRemaining--;
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      timerDisplay.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }, 1000);
  }

  completeQuiz() {
    this.isQuizComplete = true;
    if (this.timer) {
      clearInterval(this.timer);
    }

    const correctAnswers = this.questions.reduce((count, question, index) => {
      const userAnswer =
        this.userAnswers[index] !== undefined
          ? this.questions[index].options[this.userAnswers[index]]
          : null;
      return count + (userAnswer === question.correctAnswer ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / this.questions.length) * 100);
    const resultsContainer = document.querySelector(".results-container");
    const quizContainer = document.querySelector(".quiz-container");

    // Generate detailed results HTML
    const questionsReview = this.questions
      .map((question, index) => {
        const userAnswer =
          this.userAnswers[index] !== undefined
            ? this.questions[index].options[this.userAnswers[index]]
            : "Not answered";
        const isCorrect = userAnswer === question.correctAnswer;

        return `
        <div class="review-item ${isCorrect ? "correct" : "incorrect"}">
          <div class="review-header">
            <h4>Question ${index + 1}</h4>
            <span class="review-status">
              ${
                isCorrect
                  ? '<i class="fas fa-check-circle"></i> Correct'
                  : '<i class="fas fa-times-circle"></i> Incorrect'
              }
            </span>
          </div>
          <p class="review-question">${question.question}</p>
          <div class="review-answers">
            <p class="user-answer">
              <strong>Your Answer:</strong> 
              <span class="${
                isCorrect ? "correct-text" : "incorrect-text"
              }">${userAnswer}</span>
            </p>
            ${
              !isCorrect
                ? `
              <p class="correct-answer">
                <strong>Correct Answer:</strong> 
                <span class="correct-text">${question.correctAnswer}</span>
              </p>
            `
                : ""
            }
          </div>
          <p class="review-explanation">
            <i class="fas fa-info-circle"></i> ${question.explanation}
          </p>
        </div>
      `;
      })
      .join("");

    // Update results container
    resultsContainer.innerHTML = `
      <div class="results-header">
        <h2><i class="fas fa-trophy"></i> Quiz Results</h2>
        <div class="score-display">
          <div class="score-circle">
            <span class="score-number">${score}%</span>
          </div>
          <p class="score-details">
            <span class="correct-count">${correctAnswers}</span> out of 
            <span class="total-count">${this.questions.length}</span> questions correct
          </p>
        </div>
      </div>
      
      <div class="results-actions">
        <button id="print-results" class="ui-btn ui-corner-all">
          <i class="fas fa-print"></i> Print Results
        </button>
        <button id="export-questions" class="ui-btn ui-corner-all ui-btn-b">
          <i class="fas fa-file-export"></i> Export Questions
        </button>
      </div>

      <div class="questions-review">
        ${questionsReview}
      </div>
    `;

    // Hide quiz container and show results
    quizContainer.style.display = "none";
    resultsContainer.style.display = "block";

    // Add event listeners for print and export
    document
      .getElementById("print-results")
      .addEventListener("click", () => this.printResults());
    document
      .getElementById("export-questions")
      .addEventListener("click", () => this.exportQuestions());
  }

  printResults() {
    window.print();
  }

  exportQuestions() {
    const questionsData = {
      title: this.currentQuiz.title,
      questions: this.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };

    const dataStr = JSON.stringify(questionsData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${this.currentQuiz.title.replace(
      /\s+/g,
      "_"
    )}_questions.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  setupReview() {
    const reviewButton = document.querySelector("#review-btn");
    if (reviewButton) {
      reviewButton.style.display = "block";
      reviewButton.addEventListener("click", () => {
        this.currentQuestionIndex = 0;
        document.querySelector(".quiz-container").style.display = "block";
        document.querySelector(".results-container").style.display = "none";
        this.displayQuestion();
      });
    }
  }

  shuffleArray(array) {
    if (!this.currentQuiz.settings.randomizeQuestions) return array;

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

new Quiz();
