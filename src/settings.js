// Default settings configuration
const defaultSettings = {
  quizLanguage: "English",
  difficulty: "Medium",
  questionTypes: "Multiple Choice",
  answerExplanations: "OnWrong",
  questionCount: "10",
  quizTiming: "Untimed",
  reviewMode: "AfterQuiz",
  randomize: "Both",
  aiModel: "gemini-pro",
  apiKey: "",
};

// Validate settings object
function validateSettings(settings) {
  const validLanguages = ["English", "Arabic"];
  const validDifficulties = ["Easy", "Medium", "Hard"];
  const validQuestionTypes = ["True/False", "Multiple Choice", "Both"];
  const validAnswerExplanations = ["Always", "OnWrong", "Never"];
  const validQuizTiming = [
    "Untimed",
    "3",
    "5",
    "10",
    "20",
    "30",
    "45",
    "60",
    "120",
    "180",
    "300",
    "600",
  ];
  const validReviewModes = ["Immediate", "AfterQuiz", "Never"];
  const validRandomize = ["Both", "Questions", "Answers", "None"];
  const validAiModels = ["gemini-pro", "gpt-3.5", "gpt-4", "claude-3-5-sonnet"];

  if (!validLanguages.includes(settings.quizLanguage)) return false;
  if (!validDifficulties.includes(settings.difficulty)) return false;
  if (!validQuestionTypes.includes(settings.questionTypes)) return false;
  if (!validAnswerExplanations.includes(settings.answerExplanations))
    return false;
  if (!validQuestionCount(settings.questionCount)) return false;
  if (!validQuizTiming.includes(settings.quizTiming)) return false;
  if (!validReviewModes.includes(settings.reviewMode)) return false;
  if (!validRandomize.includes(settings.randomize)) return false;
  if (!validAiModels.includes(settings.aiModel)) return false;

  return true;
}

function validQuestionCount(count) {
  const num = parseInt(count);
  return !isNaN(num) && num >= 5 && num <= 30;
}

// Load settings from localStorage
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem("quizatAISettings");
    let settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;

    if (!validateSettings(settings)) {
      console.warn("Invalid settings detected, resetting to defaults");
      settings = defaultSettings;
      localStorage.setItem("quizatAISettings", JSON.stringify(defaultSettings));
    }

    // Update form fields
    Object.keys(settings).forEach((key) => {
      const element = document.getElementById(key.toLowerCase());
      if (element) {
        element.value = settings[key];
        // Refresh jQuery Mobile select menus
        if (element.tagName.toLowerCase() === "select") {
          $(element).selectmenu("refresh", true);
        }
      }
    });

    // Handle quiz timing visibility
    updateTimingVisibility();
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
      quizLanguage: document.getElementById("quizlanguage").value,
      difficulty: document.getElementById("difficulty").value,
      questionTypes: document.getElementById("questiontypes").value,
      answerExplanations: document.getElementById("answerexplanations").value,
      questionCount: document.getElementById("questioncount").value,
      quizTiming: document.getElementById("quiztiming").value,
      reviewMode: document.getElementById("reviewmode").value,
      randomize: document.getElementById("randomize").value,
      aiModel: document.getElementById("aimodel").value,
      apiKey: document.getElementById("apikey").value.trim(),
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

// Update timing visibility based on quiz timing selection
function updateTimingVisibility() {
  const quizTiming = document.getElementById("quiztiming");
  const timeSettings = document.getElementById("time-settings");
  if (timeSettings) {
    timeSettings.style.display =
      quizTiming.value === "Untimed" ? "none" : "block";
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
        loadSettings(); // Reload all settings
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

// Toggle API key visibility
function setupApiKeyToggle() {
  const toggleApiKey = document.getElementById("toggle-api-key");
  const apiKeyInput = document.getElementById("apikey");

  if (toggleApiKey && apiKeyInput) {
    toggleApiKey.addEventListener("click", () => {
      const type =
        apiKeyInput.getAttribute("type") === "password" ? "text" : "password";
      apiKeyInput.setAttribute("type", type);
      toggleApiKey.classList.toggle("fa-eye-slash");
    });
  }
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupApiKeyToggle();

  // Form submission
  const form = document.getElementById("settings-form");
  if (form) {
    form.addEventListener("submit", saveSettings);
  }

  // Import/Export buttons
  const importBtn = document.getElementById("import-settings");
  const exportBtn = document.getElementById("export-settings");
  if (importBtn) importBtn.addEventListener("click", importSettings);
  if (exportBtn) exportBtn.addEventListener("click", exportSettings);

  // Quiz timing change
  const quizTiming = document.getElementById("quiztiming");
  if (quizTiming) {
    quizTiming.addEventListener("change", updateTimingVisibility);
  }
});
