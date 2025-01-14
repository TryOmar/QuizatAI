// Default settings configuration
const defaultSettings = {
  difficulty: "Medium",
  questionTypes: "Both",
  answerExplanations: "OnWrong",
  questionCount: "10",
  quizMode: "Untimed",
  timePerQuestion: "30",
  reviewMode: "AfterQuiz",
  randomize: "Both",
  aiModel: "gemini-pro",
  apiKey: "",
};

// Validate settings object
function validateSettings(settings) {
  const validDifficulties = ["Easy", "Medium", "Hard"];
  const validQuestionTypes = ["MCQ", "Open", "Both"];
  const validAnswerExplanations = ["Always", "OnWrong", "Never"];
  const validQuizModes = ["Timed", "Untimed"];
  const validReviewModes = ["AfterQuiz", "AfterEach", "Never"];
  const validRandomize = ["Questions", "Answers", "Both", "None"];
  const validAiModels = [
    "gemini-pro",
    "gpt-3.5-turbo",
    "gpt-4",
    "claude-3-5-sonnet",
  ];

  if (!validDifficulties.includes(settings.difficulty)) return false;
  if (!validQuestionTypes.includes(settings.questionTypes)) return false;
  if (!validAnswerExplanations.includes(settings.answerExplanations))
    return false;
  if (
    isNaN(settings.questionCount) ||
    settings.questionCount < 1 ||
    settings.questionCount > 50
  )
    return false;
  if (!validQuizModes.includes(settings.quizMode)) return false;
  if (
    isNaN(settings.timePerQuestion) ||
    settings.timePerQuestion < 10 ||
    settings.timePerQuestion > 300
  )
    return false;
  if (!validReviewModes.includes(settings.reviewMode)) return false;
  if (!validRandomize.includes(settings.randomize)) return false;
  if (!validAiModels.includes(settings.aiModel)) return false;

  return true;
}

// Load settings from localStorage
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem("quizatAISettings");
    if (!savedSettings) {
      // Initialize with default settings if none exist
      localStorage.setItem("quizatAISettings", JSON.stringify(defaultSettings));
    }

    const settings = savedSettings
      ? JSON.parse(savedSettings)
      : defaultSettings;
    if (!validateSettings(settings)) {
      console.warn("Invalid settings detected, resetting to defaults");
      localStorage.setItem("quizatAISettings", JSON.stringify(defaultSettings));
      settings = defaultSettings;
    }

    Object.keys(settings).forEach((key) => {
      const element = document.getElementById(
        key.replace(/([A-Z])/g, "-$1").toLowerCase()
      );
      if (element) {
        element.value = settings[key];
      }
    });

    // Handle time settings visibility
    const quizMode = document.getElementById("quiz-mode");
    document.getElementById("time-settings").style.display =
      quizMode.value === "Timed" ? "block" : "none";
  } catch (error) {
    console.error("Error loading settings:", error);
    localStorage.setItem("quizatAISettings", JSON.stringify(defaultSettings));
  }
}

// Save settings to localStorage
function saveSettings(event) {
  event.preventDefault();
  try {
    const settings = {
      difficulty: document.getElementById("difficulty").value,
      questionTypes: document.getElementById("question-types").value,
      answerExplanations: document.getElementById("answer-explanations").value,
      questionCount: document.getElementById("question-count").value,
      quizMode: document.getElementById("quiz-mode").value,
      timePerQuestion: document.getElementById("time-per-question").value,
      reviewMode: document.getElementById("review-mode").value,
      randomize: document.getElementById("randomize").value,
      aiModel: document.getElementById("ai-model").value,
      apiKey: document.getElementById("api-key").value.trim(),
    };

    if (!validateSettings(settings)) {
      alert("Invalid settings detected. Please check your inputs.");
      return;
    }

    localStorage.setItem("quizatAISettings", JSON.stringify(settings));
    alert("Settings saved successfully!");
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("Error saving settings. Please try again.");
  }
}

// Export settings as JSON file
function exportSettings() {
  const settings = localStorage.getItem("quizatAISettings");
  if (!settings) {
    alert("No settings to export!");
    return;
  }

  const blob = new Blob([settings], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quizatAI-settings.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import settings from JSON file
function importSettings() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file.size > 1024 * 50) {
      alert("File too large. Settings file should be under 50KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const settings = JSON.parse(event.target.result);
        if (!validateSettings(settings)) {
          alert("Invalid settings file. Please check the file contents.");
          return;
        }
        localStorage.setItem("quizatAISettings", JSON.stringify(settings));

        // Update all form fields and trigger jQuery Mobile updates
        Object.keys(settings).forEach((key) => {
          const element = document.getElementById(
            key.replace(/([A-Z])/g, "-$1").toLowerCase()
          );
          if (element) {
            element.value = settings[key];
            // Refresh jQuery Mobile elements
            if (element.tagName.toLowerCase() === "select") {
              $(element).selectmenu("refresh", true);
            } else {
              $(element).trigger("change");
            }
          }
        });

        // Update time settings visibility
        const quizMode = document.getElementById("quiz-mode");
        const timeSettings = document.getElementById("time-settings");
        timeSettings.style.display =
          quizMode.value === "Timed" ? "block" : "none";

        alert("Settings imported successfully!");
      } catch (error) {
        console.error("Error importing settings:", error);
        alert(
          "Error importing settings. Please make sure the file is valid JSON."
        );
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// Handle quiz mode change
function handleQuizModeChange() {
  const quizMode = document.getElementById("quiz-mode");
  const timeSettings = document.getElementById("time-settings");
  timeSettings.style.display = quizMode.value === "Timed" ? "block" : "none";
}

// Toggle API key visibility
const toggleApiKey = document.getElementById("toggle-api-key");
const apiKeyInput = document.getElementById("api-key");

toggleApiKey.addEventListener("click", () => {
  const type =
    apiKeyInput.getAttribute("type") === "password" ? "text" : "password";
  apiKeyInput.setAttribute("type", type);
  toggleApiKey.classList.toggle("fa-eye-slash");
});

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Load saved settings
  loadSettings();

  // Form submission
  document
    .getElementById("settings-form")
    .addEventListener("submit", saveSettings);

  // Import/Export buttons
  document
    .getElementById("import-settings")
    .addEventListener("click", importSettings);
  document
    .getElementById("export-settings")
    .addEventListener("click", exportSettings);

  // Quiz mode change
  document
    .getElementById("quiz-mode")
    .addEventListener("change", handleQuizModeChange);
});
