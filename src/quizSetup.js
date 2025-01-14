import { AIModelService } from "./aiModels.js";
import { constructTopicSuggestionPrompt } from "./prompts.js";

class QuizSetup {
  constructor() {
    this.aiService = new AIModelService(this.getApiKey());
    this.initializeEventListeners();
    this.topicDescriptions = new Map(); // Store topic descriptions
  }

  getApiKey() {
    try {
      const settings = localStorage.getItem("quizatAISettings");
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.apiKey || "";
      }
    } catch (error) {
      console.error("Error getting API key:", error);
    }
    return "";
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
    // Show error message to user
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    alert(errorMessage);
  }

  async handleQuestionGeneration() {
    const contentArea = document.getElementById("custom-content");
    const previewSection = document.getElementById("preview-section");
    const questionsPreview = document.getElementById("questions-preview");

    try {
      const content = contentArea.value.trim();
      if (!content) {
        throw new Error("Please enter a topic or content first");
      }

      // Implementation for question generation
      // This will be implemented in a future update

      // Show preview section
      previewSection.style.display = "block";

      // Populate preview (placeholder for now)
      questionsPreview.innerHTML =
        "<p>Generated questions will appear here...</p>";
    } catch (error) {
      this.handleError(error);
    }
  }

  handleQuestionImport() {
    // Implementation for importing questions
    console.log("Import questions functionality to be implemented");
  }

  handleQuestionExport() {
    // Implementation for exporting questions
    console.log("Export questions functionality to be implemented");
  }
}

// Initialize the quiz setup when the document is ready
$(document).on("pagecreate", "#topic-selection", function () {
  new QuizSetup();
});
