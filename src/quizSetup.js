import { AIModelService } from "./aiModels.js";
import {
  constructTopicSuggestionPrompt,
  constructQuestionGenerationPrompt,
} from "./prompts.js";
import { showToast } from "./utils/ui.js";
import { getSettings } from "./settings.js";

class QuizSetup {
  constructor() {
    this.aiService = new AIModelService();
    this.initializeEventListeners();
    this.topicDescriptions = new Map(); // Store topic descriptions
    this.currentQuiz = null; // Store current quiz data
  }

  initializeEventListeners() {
    document
      .getElementById("suggest-topic")
      .addEventListener("click", () => this.handleTopicSuggestion());
    document
      .getElementById("close-suggestions")
      .addEventListener("click", () => this.toggleSuggestionBox(false));
    document
      .getElementById("generate-questions")
      .addEventListener("click", () => this.handleQuestionGeneration());
    document
      .getElementById("import-questions")
      .addEventListener("click", () => this.handleQuestionImport());
    document
      .getElementById("export-questions")
      .addEventListener("click", () => this.handleQuestionExport());
  }

  toggleSuggestionBox(show) {
    const contentArea = document.getElementById("custom-content");
    const suggestionsBox = document.getElementById("topic-suggestions");

    contentArea.style.display = show ? "none" : "block";
    suggestionsBox.style.display = show ? "block" : "none";
  }

  createTopicButton(title, icon, description) {
    const button = document.createElement("button");
    button.className = "topic-button ui-btn ui-corner-all";
    button.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span class="topic-title">${title}</span>
    `;

    // Store description for later use
    this.topicDescriptions.set(title, description);

    button.addEventListener("click", () => {
      const contentArea = document.getElementById("custom-content");
      contentArea.value = description;
      this.toggleSuggestionBox(false);
    });

    return button;
  }

  parseTopicResponse(response) {
    const topics = [];
    const lines = response.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      const [title, icon, description] = line.split("|").map((s) => s.trim());
      if (title && icon && description) {
        topics.push({ title, icon, description });
      }
    }

    return topics;
  }

  async handleTopicSuggestion() {
    try {
      const suggestButton = document.getElementById("suggest-topic");
      const topicButtons = document.querySelector(".topic-buttons");

      // Disable button and show loading state
      suggestButton.disabled = true;
      suggestButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Suggesting...';

      const prompt = constructTopicSuggestionPrompt();
      const response = await this.aiService.getTopicSuggestion(prompt);

      // Parse the response and create buttons
      const topics = this.parseTopicResponse(response);
      topicButtons.innerHTML = ""; // Clear existing buttons

      topics.forEach(({ title, icon, description }) => {
        const button = this.createTopicButton(title, icon, description);
        topicButtons.appendChild(button);
      });

      // Show the suggestions box
      this.toggleSuggestionBox(true);

      // Reset button state
      suggestButton.disabled = false;
      suggestButton.innerHTML =
        '<i class="fas fa-lightbulb"></i> Suggest Topic';
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    showToast(errorMessage, "error");
  }

  saveQuizToLocalStorage() {
    try {
      if (!this.currentQuiz) {
        throw new Error("No quiz to save");
      }
      localStorage.setItem("currentQuiz", JSON.stringify(this.currentQuiz));
      showToast("Quiz saved successfully!");
    } catch (error) {
      this.handleError(error);
    }
  }

  displayQuestions(quizData) {
    const questionsPreview = document.getElementById("questions-preview");
    this.currentQuiz = quizData;

    // Get current settings for the quiz
    const currentSettings = getSettings();
    this.currentQuiz.settings = {
      answerExplanations: currentSettings.answerExplanations,
      quizTiming: currentSettings.quizTiming,
      reviewMode: currentSettings.reviewMode,
      randomize: currentSettings.randomize,
    };

    // Save quiz to local storage
    this.saveQuizToLocalStorage();

    const settingsHtml = `
      <div class="quiz-settings" style="display: none;">
        <h3>Quiz Settings</h3>
        <div class="setting-item">
          <label for="quizTitle"><i class="fas fa-heading"></i> Quiz Title:</label>
          <input type="text" name="quizTitle" id="quizTitle" value="${
            quizData.title
          }" class="ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset">
        </div>
        <div class="setting-item">
          <label for="quizAnswerExplanations"><i class="fas fa-info-circle"></i> Answer Explanations:</label>
          <select name="quizAnswerExplanations" id="quizAnswerExplanations" data-native-menu="false">
            <option value="Always" ${
              this.currentQuiz.settings.answerExplanations === "Always"
                ? "selected"
                : ""
            }>Always Show</option>
            <option value="OnWrong" ${
              this.currentQuiz.settings.answerExplanations === "OnWrong"
                ? "selected"
                : ""
            }>On Wrong Answers</option>
            <option value="Never" ${
              this.currentQuiz.settings.answerExplanations === "Never"
                ? "selected"
                : ""
            }>Never Show</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="quizTiming"><i class="fas fa-clock"></i> Quiz Timing:</label>
          <select name="quizTiming" id="quizTiming" data-native-menu="false">
            <option value="Untimed" ${
              this.currentQuiz.settings.quizTiming === "Untimed"
                ? "selected"
                : ""
            }>Untimed</option>
            <option value="3" ${
              this.currentQuiz.settings.quizTiming === "3" ? "selected" : ""
            }>3 seconds</option>
            <option value="5" ${
              this.currentQuiz.settings.quizTiming === "5" ? "selected" : ""
            }>5 seconds</option>
            <option value="10" ${
              this.currentQuiz.settings.quizTiming === "10" ? "selected" : ""
            }>10 seconds</option>
            <option value="20" ${
              this.currentQuiz.settings.quizTiming === "20" ? "selected" : ""
            }>20 seconds</option>
            <option value="30" ${
              this.currentQuiz.settings.quizTiming === "30" ? "selected" : ""
            }>30 seconds</option>
            <option value="45" ${
              this.currentQuiz.settings.quizTiming === "45" ? "selected" : ""
            }>45 seconds</option>
            <option value="60" ${
              this.currentQuiz.settings.quizTiming === "60" ? "selected" : ""
            }>60 seconds</option>
            <option value="120" ${
              this.currentQuiz.settings.quizTiming === "120" ? "selected" : ""
            }>120 seconds</option>
            <option value="180" ${
              this.currentQuiz.settings.quizTiming === "180" ? "selected" : ""
            }>180 seconds</option>
            <option value="300" ${
              this.currentQuiz.settings.quizTiming === "300" ? "selected" : ""
            }>300 seconds</option>
            <option value="600" ${
              this.currentQuiz.settings.quizTiming === "600" ? "selected" : ""
            }>600 seconds</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="quizReviewMode"><i class="fas fa-sync"></i> Review Mode:</label>
          <select name="quizReviewMode" id="quizReviewMode" data-native-menu="false">
            <option value="Immediate" ${
              this.currentQuiz.settings.reviewMode === "Immediate"
                ? "selected"
                : ""
            }>Immediate Feedback</option>
            <option value="AfterQuiz" ${
              this.currentQuiz.settings.reviewMode === "AfterQuiz"
                ? "selected"
                : ""
            }>After Quiz</option>
            <option value="Never" ${
              this.currentQuiz.settings.reviewMode === "Never" ? "selected" : ""
            }>No Review</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="quizRandomize"><i class="fas fa-random"></i> Randomization:</label>
          <select name="quizRandomize" id="quizRandomize" data-native-menu="false">
            <option value="Both" ${
              this.currentQuiz.settings.randomize === "Both" ? "selected" : ""
            }>Both</option>
            <option value="Questions" ${
              this.currentQuiz.settings.randomize === "Questions"
                ? "selected"
                : ""
            }>Questions Only</option>
            <option value="Answers" ${
              this.currentQuiz.settings.randomize === "Answers"
                ? "selected"
                : ""
            }>Answers Only</option>
            <option value="None" ${
              this.currentQuiz.settings.randomize === "None" ? "selected" : ""
            }>No Randomization</option>
          </select>
        </div>
        <button class="ui-btn ui-corner-all ui-btn-b save-quiz-settings">
          <i class="fas fa-save"></i> Save Quiz Settings
        </button>
      </div>
    `;

    const questionsHtml = quizData.questions
      .map(
        (q) => `
      <div class="question-preview">
        <div class="question-header">
          <h4>Question ${q.id}</h4>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="question-content">
          <p class="question-text" dir="auto">${q.question}</p>
          <ul class="options-list">
            ${q.options
              .map(
                (option) => `
              <li class="${
                option === q.correctAnswer ? "correct-option" : ""
              }" dir="auto" style="text-align: start">${option}</li>
            `
              )
              .join("")}
          </ul>
          <p class="explanation"><strong>Explanation:</strong> ${
            q.explanation
          }</p>
        </div>
      </div>
    `
      )
      .join("");

    questionsPreview.innerHTML = `
      <div class="quiz-header">
        <h3 class="quiz-title">${quizData.title}</h3>
        <button class="toggle-quiz-settings">
          <i class="fas fa-cog"></i>
        </button>
      </div>
      <div class="questions-list">
        ${questionsHtml}
      </div>
      ${settingsHtml}
    `;

    // Show preview section and export button
    document.getElementById("preview-section").style.display = "block";

    // Add click handlers for question headers
    document.querySelectorAll(".question-header").forEach((header) => {
      header.addEventListener("click", function () {
        const questionPreview = this.closest(".question-preview");
        const wasExpanded = questionPreview.classList.contains("expanded");

        // Close all other questions
        document.querySelectorAll(".question-preview").forEach((q) => {
          if (q !== questionPreview) {
            q.classList.remove("expanded");
          }
        });

        // Toggle current question
        questionPreview.classList.toggle("expanded");
      });
    });

    // Add click handler for settings toggle
    const toggleButton = questionsPreview.querySelector(
      ".toggle-quiz-settings"
    );
    const questionsList = questionsPreview.querySelector(".questions-list");
    const quizSettings = questionsPreview.querySelector(".quiz-settings");

    toggleButton.addEventListener("click", () => {
      const isShowingSettings = quizSettings.style.display === "block";
      questionsList.style.display = isShowingSettings ? "block" : "none";
      quizSettings.style.display = isShowingSettings ? "none" : "block";
      toggleButton.querySelector("i").classList.toggle("fa-spin");
    });

    // Add handler for saving quiz settings
    questionsPreview
      .querySelector(".save-quiz-settings")
      .addEventListener("click", () => {
        const newTitle = document.getElementById("quizTitle").value.trim();
        if (!newTitle) {
          showToast("Quiz title cannot be empty", "error");
          return;
        }

        this.currentQuiz.title = newTitle;
        this.currentQuiz.settings = {
          answerExplanations: document.getElementById("quizAnswerExplanations")
            .value,
          quizTiming: document.getElementById("quizTiming").value,
          reviewMode: document.getElementById("quizReviewMode").value,
          randomize: document.getElementById("quizRandomize").value,
        };

        // Update the title in the header
        questionsPreview.querySelector(".quiz-title").textContent = newTitle;

        // Save updated quiz to local storage
        this.saveQuizToLocalStorage();

        showToast("Quiz settings saved successfully!");

        // Switch back to questions view
        questionsList.style.display = "block";
        quizSettings.style.display = "none";
        toggleButton.querySelector("i").classList.remove("fa-spin");
      });

    // Initialize jQuery Mobile selects
    try {
      $(questionsPreview).find("select").selectmenu();
      $(questionsPreview).find("select").selectmenu("refresh", true);
    } catch (error) {
      console.warn("Error initializing select menus:", error);
    }
  }

  async handleQuestionGeneration() {
    const contentArea = document.getElementById("custom-content");
    const previewSection = document.getElementById("preview-section");
    const questionsPreview = document.getElementById("questions-preview");
    const generateButton = document.getElementById("generate-questions");

    try {
      const content = contentArea.value.trim();
      if (!content) {
        throw new Error("Please enter a topic or content first");
      }

      // Show loading state
      generateButton.disabled = true;
      generateButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Generating...';
      questionsPreview.innerHTML =
        '<p class="loading">Generating questions...</p>';
      previewSection.style.display = "block";

      // Generate questions
      const prompt = constructQuestionGenerationPrompt(content);
      const response = await this.aiService.getTopicSuggestion(prompt);

      // Parse JSON response
      const quizData = JSON.parse(response);

      // Display questions
      this.displayQuestions(quizData);
      showToast("Questions generated successfully!");

      // Reset button state
      generateButton.disabled = false;
      generateButton.innerHTML =
        '<i class="fas fa-magic"></i> Generate Questions';
    } catch (error) {
      this.handleError(error);
      previewSection.style.display = "none";
      // Reset button state on error
      generateButton.disabled = false;
      generateButton.innerHTML =
        '<i class="fas fa-magic"></i> Generate Questions';
    }
  }

  handleQuestionImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 50) {
          // Max 50KB
          this.handleError(new Error("File too large. Max size is 50KB"));
          return;
        }
        this.importQuizFile(file);
      }
    };
    input.click();
  }

  importQuizFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const quizData = JSON.parse(e.target.result);

        // Validate quiz data structure
        if (!this.validateQuizData(quizData)) {
          throw new Error("Invalid quiz file format");
        }

        // Display the imported questions
        this.displayQuestions(quizData);
        showToast("Questions imported successfully!");
      } catch (error) {
        this.handleError(error);
      }
    };
    reader.onerror = () => this.handleError(new Error("Error reading file"));
    reader.readAsText(file);
  }

  validateQuizData(data) {
    // Check basic structure
    if (!data.title || !Array.isArray(data.questions)) return false;

    // Check each question
    return data.questions.every(
      (q) =>
        q.id &&
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.correctAnswer &&
        q.options.includes(q.correctAnswer) &&
        q.explanation
    );
  }

  handleQuestionExport() {
    if (!this.currentQuiz) {
      this.handleError(
        new Error("No questions to export. Generate or import questions first.")
      );
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(this.currentQuiz, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-${this.currentQuiz.title
        .toLowerCase()
        .replace(/\s+/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Questions exported successfully!");
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Initialize the quiz setup when the document is ready
$(document).on("pagecreate", "#topic-selection", function () {
  new QuizSetup();
});
