import { AIModelService } from "./aiModels.js";
import { constructTopicSuggestionPrompt } from "./prompts.js";

class QuizSetup {
  constructor() {
    this.aiService = new AIModelService(this.getApiKey());
    this.initializeEventListeners();
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
      .getElementById("generate-questions")
      .addEventListener("click", () => this.handleQuestionGeneration());
    document
      .getElementById("import-questions")
      .addEventListener("click", () => this.handleQuestionImport());
    document
      .getElementById("export-questions")
      .addEventListener("click", () => this.handleQuestionExport());
  }

  async handleTopicSuggestion() {
    try {
      const suggestButton = document.getElementById("suggest-topic");
      const contentArea = document.getElementById("custom-content");

      // Disable button and show loading state
      suggestButton.disabled = true;
      suggestButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Suggesting...';

      // Get any existing content as context
      const currentContent = contentArea.value.trim();
      const preferences = {
        // Add preferences based on current content if any
        category: currentContent ? undefined : "general knowledge",
      };

      const prompt = constructTopicSuggestionPrompt(preferences);
      const suggestions = await this.aiService.getTopicSuggestion(prompt);

      // Update the content area with suggestions
      contentArea.value = suggestions;

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
