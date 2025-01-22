import { AIModelService } from "./services/aiService.js";
import { generateQuizId } from "./utils/idGenerators.js";

import {
  constructTopicSuggestionPrompt,
  constructQuestionGenerationPrompt,
} from "./utils/prompts.js";

import { showToast } from "./utils/ui.js";

import { getSettings } from "./settings.js";
import { QuizCloudApi } from "./services/quizCloudApi.js";

class QuizSetup {
  constructor() {
    this.aiService = new AIModelService();
    this.cloudApi = new QuizCloudApi();
    this.initializeEventListeners();
    this.topicDescriptions = new Map(); // Store topic descriptions
    this.currentQuiz = null; // Store current quiz data
    this.checkLastQuiz(); // Check for last quiz in storage
    this.isSynced = false; // Track sync status
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

    document
      .getElementById("load-last-quiz")
      .addEventListener("click", () => this.handleLoadLastQuiz());

    document.getElementById("start-quiz").addEventListener("click", (e) => {
      if (!this.currentQuiz) {
        e.preventDefault();

        showToast("Please generate or import questions first", "error");
      }
    });
  }

  checkLastQuiz() {
    const lastQuiz = localStorage.getItem("currentQuiz");

    const loadLastQuizBtn = document.getElementById("load-last-quiz");

    if (lastQuiz) {
      loadLastQuizBtn.style.display = "block";
    } else {
      loadLastQuizBtn.style.display = "none";
    }
  }

  handleLoadLastQuiz() {
    try {
      const lastQuiz = localStorage.getItem("currentQuiz");

      if (!lastQuiz) {
        throw new Error("No saved quiz found");
      }

      const quizData = JSON.parse(lastQuiz);

      // Validate quiz data structure
      const validationError = this.getQuizDataValidationError(quizData);

      if (validationError) {
        throw new Error(validationError);
      }

      // Update currentQuiz with loaded quiz data
      this.currentQuiz = quizData;

      // Display the loaded questions
      this.displayQuestions(quizData);

      showToast("Last quiz loaded successfully", "success");

      // Show preview section
      document.getElementById("preview-section").style.display = "block";
    } catch (error) {
      showToast("Error loading last quiz: " + error.message, "error");

      // Hide preview section on error
      document.getElementById("preview-section").style.display = "none";
    }
  }

  getQuizDataValidationError(data) {
    if (!data.title) return "Quiz title is missing.";

    if (!Array.isArray(data.questions)) return "Questions should be an array.";

    for (const [index, q] of data.questions.entries()) {
      if (!q.id) return `Question ${index + 1} is missing an ID.`;

      if (!q.question)
        return `Question ${index + 1} is missing the question text.`;

      if (!Array.isArray(q.options))
        return `Question ${index + 1} options should be an array.`;

      if (!q.correctAnswer)
        return `Question ${index + 1} is missing the correct answer.`;

      // if (!q.options.includes(q.correctAnswer))
      //   return `Question ${index + 1} correct answer is not in options.`;

      if (!q.explanation)
        return `Question ${index + 1} is missing an explanation.`;
    }

    return null; // No validation errors
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

      // Get user interests from #custom-content
      const userInterests = document
        .getElementById("custom-content")
        .value.trim();

      // Construct the prompt with user interests if available
      const prompt = constructTopicSuggestionPrompt({
        interests: userInterests,
      });

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

    this.isSynced = false; // Reset sync status when displaying new questions

    // Ensure currentQuiz.settings is initialized
    this.currentQuiz.settings = this.currentQuiz.settings || {};

    // Get current settings for the quiz
    const currentSettings = getSettings();

    this.currentQuiz.settings = {
      quizTiming:
        this.currentQuiz.settings.quizTiming || currentSettings.quizTiming,

      reviewMode:
        this.currentQuiz.settings.reviewMode || currentSettings.reviewMode,

      randomize:
        this.currentQuiz.settings.randomize || currentSettings.randomize,

      quizSharing:
        this.currentQuiz.settings.quizSharing || currentSettings.quizSharing,
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
        <div class="setting-item">
          <label for="quizSharing"><i class="fas fa-share-alt"></i> Quiz Sharing:</label>
          <select name="quizSharing" id="quizSharing" data-native-menu="false">
            <option value="public" ${
              this.currentQuiz.settings.quizSharing === "public"
                ? "selected"
                : ""
            }>Public</option>
            <option value="private" ${
              this.currentQuiz.settings.quizSharing === "private"
                ? "selected"
                : ""
            }>Private</option>
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
      <div class="question-preview" data-question-id="${q.id}">
        <div class="question-header">
          <h4>Question ${q.id}</h4>
          <div class="question-actions" style="display: none;">
            <button class="delete-question" title="Delete Question">
              <i class="fas fa-trash"></i>
            </button>
            <button class="edit-question" title="Edit Question">
              <i class="fas fa-edit"></i>
            </button>
          </div>
          <i class="fas fa-chevron-down toggle-icon"></i>
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
        <div class="quiz-actions">
          <button class="sync-quiz" title="${
            this.isSynced ? "Quiz is saved to cloud" : "Save quiz to cloud"
          }">
            <i class="fas ${
              this.isSynced ? "fa-cloud text-success" : "fa-cloud-upload"
            }" id="sync-icon"></i>
          </button>
          <button class="toggle-quiz-settings">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </div>
      <div class="questions-list">
        ${questionsHtml}
      </div>
      ${settingsHtml}
    `;

    // Add click handlers for question headers
    document.querySelectorAll(".question-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        // Don't toggle if clicking edit or delete buttons
        if (e.target.closest(".question-actions")) {
          return;
        }

        const questionPreview = header.closest(".question-preview");

        const wasExpanded = questionPreview.classList.contains("expanded");

        const actionsDiv = header.querySelector(".question-actions");

        // Close all other questions and hide their action buttons
        document.querySelectorAll(".question-preview").forEach((q) => {
          if (q !== questionPreview) {
            q.classList.remove("expanded");

            q.querySelector(".question-actions").style.display = "none";
          }
        });

        // Toggle current question
        questionPreview.classList.toggle("expanded");

        actionsDiv.style.display = questionPreview.classList.contains(
          "expanded"
        )
          ? "flex"
          : "none";
      });
    });

    // Add handlers for edit and delete buttons
    document.querySelectorAll(".edit-question").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const questionPreview = btn.closest(".question-preview");

        const questionId = parseInt(questionPreview.dataset.questionId);

        this.handleQuestionEdit(questionId);
      });
    });

    document.querySelectorAll(".delete-question").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const questionPreview = btn.closest(".question-preview");

        const questionId = parseInt(questionPreview.dataset.questionId);

        this.handleQuestionDelete(questionId);
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
          quizTiming: document.getElementById("quizTiming").value,
          reviewMode: document.getElementById("quizReviewMode").value,
          randomize: document.getElementById("quizRandomize").value,
          quizSharing: document.getElementById("quizSharing").value,
        };

        // Mark as unsynced since settings changed
        this.isSynced = false;
        const syncIcon = document.getElementById("sync-icon");
        const syncButton = document.querySelector(".sync-quiz");
        syncIcon.className = "fas fa-cloud-upload not-synced";
        syncButton.title = "Save to cloud";

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

    // Add click handler for sync button
    const syncButton = questionsPreview.querySelector(".sync-quiz");
    syncButton.addEventListener("click", () => this.handleQuizSync());
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
      let response = await this.aiService.getTopicSuggestion(prompt);

      let quizData;
      let attempts = 0;
      while (attempts < 3) {
        try {
          // Attempt to parse JSON response
          quizData = JSON.parse(response);
          // Add quiz ID and metadata
          quizData.quizId = generateQuizId();
          quizData.userId = getSettings().userId;
          break;
        } catch (jsonError) {
          console.warn(
            `JSON parsing error on attempt ${attempts + 1}:`,
            jsonError
          );
          attempts++;
          if (attempts === 3) {
            response = await this.aiService.getTopicSuggestion(prompt);
            quizData = JSON.parse(response);
            quizData.quizId = generateQuizId();
            quizData.userId = getSettings().userId;
          }
        }
      }

      // Display questions
      this.displayQuestions(quizData);

      // Automatically sync with database
      try {
        await this.handleQuizSync();
      } catch (syncError) {
        console.warn("Failed to auto-sync quiz:", syncError);
        // Don't throw error here, just show warning toast
        showToast(
          "Quiz generated but not synced to database. Click the sync button to retry.",
          "warning"
        );
      }

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

  importQuizFile(file) {
    const reader = new FileReader();
    const previewSection = document.getElementById("preview-section");
    const questionsPreview = document.getElementById("questions-preview");

    reader.onload = async (e) => {
      try {
        const quizData = JSON.parse(e.target.result);

        // Validate quiz data structure
        if (!this.validateQuizData(quizData)) {
          throw new Error("Invalid quiz file format");
        }

        // Add or update quiz metadata
        quizData.quizId = generateQuizId();
        quizData.userId = getSettings().userId; // Set current user as creator

        // Show preview section and loading state
        previewSection.style.display = "block";
        questionsPreview.innerHTML =
          '<p class="loading">Loading questions...</p>';

        // Display the imported questions
        this.displayQuestions(quizData);

        // Automatically sync with database
        try {
          await this.handleQuizSync();
        } catch (syncError) {
          console.warn("Failed to auto-sync quiz:", syncError);
          // Don't throw error here, just show warning toast
          showToast(
            "Quiz imported but not synced to database. Click the sync button to retry.",
            "warning"
          );
        }

        showToast("Questions imported successfully!", "success");
      } catch (error) {
        this.handleError(error);
        previewSection.style.display = "none";
      }
    };
    reader.onerror = () => {
      this.handleError(new Error("Error reading file"));
      previewSection.style.display = "none";
    };
    reader.readAsText(file);
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

  validateQuizData(data) {
    // Check basic structure

    if (!data.title || !Array.isArray(data.questions)) return false;

    // Check each question

    return data.questions.every(
      (q) =>
        q.id &&
        q.question &&
        Array.isArray(q.options) &&
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
      // Create a copy without sensitive data

      const exportData = { ...this.currentQuiz };

      delete exportData.creatorId; // Remove creator ID before export

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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

  handleQuestionEdit(questionId) {
    const question = this.currentQuiz.questions.find(
      (q) => q.id === questionId
    );

    if (!question) return;

    // Create edit form HTML

    const editFormHtml = `
      <div class="edit-form">
        <h4>Edit Question ${questionId}</h4>
        <div class="form-group">
          <label>Question:</label>
          <textarea class="edit-question-text">${question.question}</textarea>
        </div>
        <div class="form-group">
          <label>Options:</label>
          ${question.options
            .map(
              (option, index) => `
            <div class="option-input">
              <input type="text" class="edit-option" value="${option}">
              <input type="radio" name="correct-answer" ${
                option === question.correctAnswer ? "checked" : ""
              }>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="form-group">
          <label>Explanation:</label>
          <textarea class="edit-explanation">${question.explanation}</textarea>
        </div>
        <div class="edit-actions">
          <button class="cancel-edit">Cancel</button>
          <button class="save-edit">Save Changes</button>
        </div>
      </div>
    `;

    const questionPreview = document.querySelector(
      `[data-question-id="${questionId}"]`
    );

    const questionContent = questionPreview.querySelector(".question-content");

    questionContent.innerHTML = editFormHtml;

    // Add event listeners for save and cancel

    questionContent
      .querySelector(".save-edit")
      .addEventListener("click", () => {
        const newQuestion = questionContent.querySelector(
          ".edit-question-text"
        ).value;

        const newOptions = Array.from(
          questionContent.querySelectorAll(".edit-option")
        ).map((input) => input.value);

        const newCorrectAnswer =
          newOptions[
            Array.from(
              questionContent.querySelectorAll('input[type="radio"]')
            ).findIndex((radio) => radio.checked)
          ];

        const newExplanation =
          questionContent.querySelector(".edit-explanation").value;

        // Validate inputs

        if (
          !newQuestion.trim() ||
          newOptions.some((opt) => !opt.trim()) ||
          !newExplanation.trim()
        ) {
          showToast("All fields are required", "error");

          return;
        }

        // Update question

        question.question = newQuestion;

        question.options = newOptions;

        question.correctAnswer = newCorrectAnswer;

        question.explanation = newExplanation;

        this.currentQuiz.lastUpdatedAt = new Date().toISOString(); // Update timestamp

        // Save to localStorage and refresh display

        this.saveQuizToLocalStorage();

        this.displayQuestions(this.currentQuiz);

        showToast("Question updated successfully", "success");
      });

    questionContent
      .querySelector(".cancel-edit")
      .addEventListener("click", () => {
        this.displayQuestions(this.currentQuiz);
      });
  }

  handleQuestionDelete(questionId) {
    const toastMessage = "Click again to confirm deletion";

    const toastDuration = 3000;

    if (this.pendingDeleteId === questionId) {
      this.currentQuiz.questions = this.currentQuiz.questions.filter(
        (q) => q.id !== questionId
      );

      // Reorder remaining questions

      this.currentQuiz.questions.forEach((q, index) => {
        q.id = index + 1;
      });

      this.currentQuiz.lastUpdatedAt = new Date().toISOString(); // Update timestamp

      this.saveQuizToLocalStorage();

      this.displayQuestions(this.currentQuiz);

      showToast("Question deleted successfully", "success");

      this.pendingDeleteId = null;
    } else {
      this.pendingDeleteId = questionId;

      showToast(toastMessage, "warning", toastDuration);
    }
  }

  async handleQuizSync() {
    try {
      const syncButton = document.querySelector(".sync-quiz");
      const syncIcon = document.getElementById("sync-icon");

      // Show syncing state
      syncButton.disabled = true;
      syncIcon.className = "fas fa-spinner fa-spin";
      syncButton.title = "Saving to cloud...";

      // Save quiz to cloud
      const response = await this.cloudApi.saveQuiz(this.currentQuiz);

      // Update sync status
      this.isSynced = true;
      syncIcon.className = "fas fa-cloud text-success";
      syncButton.title = "Saved to cloud";
      showToast("Saved to cloud", "success");
    } catch (error) {
      // Handle network errors specifically
      if (error.name === "TypeError" && !navigator.onLine) {
        showToast(
          "Unable to save: Please check your internet connection",
          "error"
        );
      } else {
        showToast("Unable to save quiz to cloud. Please try again", "error");
      }

      const syncIcon = document.getElementById("sync-icon");
      const syncButton = document.querySelector(".sync-quiz");
      syncIcon.className = "fas fa-cloud-upload not-synced";
      syncButton.title = "Save to cloud";
      console.error("Cloud sync error:", error);
    } finally {
      const syncButton = document.querySelector(".sync-quiz");
      syncButton.disabled = false;
    }
  }
}

// Initialize the quiz setup when the document is ready

$(document).on("pagecreate", "#topic-selection", function () {
  new QuizSetup();
});
