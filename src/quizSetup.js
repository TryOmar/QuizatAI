import { AIModelService } from "./aiModels.js";
import {
  constructTopicSuggestionPrompt,
  constructQuestionGenerationPrompt,
} from "./prompts.js";
import { showToast } from "./utils/ui.js";

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

  displayQuestions(quizData) {
    const questionsPreview = document.getElementById("questions-preview");
    this.currentQuiz = quizData;

    const questionsHtml = quizData.questions
      .map(
        (q) => `
      <div class="question-preview">
        <h4>Question ${q.id}</h4>
        <p class="question-text">${q.question}</p>
        <ul class="options-list">
          ${q.options
            .map(
              (option) => `
            <li class="${
              option === q.correctAnswer ? "correct-option" : ""
            }">${option}</li>
          `
            )
            .join("")}
        </ul>
        <p class="explanation"><strong>Explanation:</strong> ${
          q.explanation
        }</p>
      </div>
    `
      )
      .join("");

    questionsPreview.innerHTML = `
      <h3 class="quiz-title">${quizData.title}</h3>
      ${questionsHtml}
    `;

    // Show preview section and export button
    document.getElementById("preview-section").style.display = "block";
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
