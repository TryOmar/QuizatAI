import { showToast } from "./utils/ui.js";

// Default settings configuration
const defaultSettings = {
  quizLanguage: "English",
  difficulty: "Medium",
  questionTypes: "Multiple Choice",
  questionCount: "5",
  answerExplanations: "Always",
  quizTiming: "Untimed",
  reviewMode: "Immediate",
  randomize: "None",
  aiModel: "gemini-pro",
  apiKey: "AIzaSyCL9qTuUgzaYN7hZXWvrbRsjxDoogPTwrQ",
};

const MASKED_INTERNAL_KEY = "••••••••••••••••";

// Core settings functions
function getSettings() {
  try {
    const savedSettings = localStorage.getItem("quizatAISettings");
    if (!savedSettings) return defaultSettings;

    const parsed = JSON.parse(savedSettings);
    if (
      !parsed.apiKey ||
      parsed.apiKey === defaultSettings.apiKey ||
      parsed.apiKey === MASKED_INTERNAL_KEY
    ) {
      parsed.apiKey = defaultSettings.apiKey;
    }
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.error("Error loading settings:", error);
    return defaultSettings;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem("quizatAISettings", JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

// Form handling functions
function loadCurrentSettings() {
  const currentSettings = getSettings();
  Object.entries(currentSettings).forEach(([key, value]) => {
    const element = document.getElementById(key);
    if (element) {
      if (key === "apiKey" && value === defaultSettings.apiKey) {
        element.value = MASKED_INTERNAL_KEY;
      } else {
        element.value = value;
      }

      if (element.tagName === "SELECT") {
        try {
          $(element).selectmenu("refresh");
        } catch (error) {
          console.warn("Error refreshing select menu:", error);
        }
      }
    }
  });
}

function saveCurrentSettings() {
  const form = document.getElementById("settings-form");
  const newSettings = {};

  form.querySelectorAll("input, select").forEach((element) => {
    if (element.name && element.name !== "submit") {
      if (element.name === "apiKey" && element.value === MASKED_INTERNAL_KEY) {
        newSettings[element.name] = defaultSettings.apiKey;
      } else {
        newSettings[element.name] = element.value;
      }
    }
  });

  if (saveSettings(newSettings)) {
    showToast("Settings saved successfully!");
  } else {
    showToast("Failed to save settings. Please try again.", "error");
  }
}

// Import/Export functions
function exportSettings() {
  try {
    const settings = getSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quizat-settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Settings exported successfully!");
  } catch (error) {
    console.error("Error exporting settings:", error);
    showToast("Failed to export settings", "error");
  }
}

function importSettings(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const settings = JSON.parse(e.target.result);
      if (!Object.keys(defaultSettings).every((key) => key in settings)) {
        throw new Error("Invalid settings file format");
      }

      if (saveSettings(settings)) {
        loadCurrentSettings();
        showToast("Settings imported successfully!");
      } else {
        throw new Error("Failed to save imported settings");
      }
    } catch (error) {
      console.error("Error importing settings:", error);
      showToast("Invalid settings file", "error");
    }
  };

  reader.onerror = () => showToast("Error reading file", "error");
  reader.readAsText(file);
}

// Event handlers
function setupEventHandlers() {
  // Save button
  document.querySelector(".save-button").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveCurrentSettings();
    return false;
  });

  // API key input handler
  document.getElementById("apiKey").addEventListener("input", function (e) {
    if (this.value.startsWith(MASKED_INTERNAL_KEY)) {
      this.value = MASKED_INTERNAL_KEY;
    }
  });

  // API key toggle
  document
    .getElementById("toggle-api-key")
    .addEventListener("click", function () {
      const apiKeyInput = document.getElementById("apiKey");
      const currentKey = apiKeyInput.value;

      if (currentKey === MASKED_INTERNAL_KEY) {
        showToast(
          "This is an internal API key provided by QuizatAI. For custom API key usage, please enter your own key.",
          "info",
          5000
        );
        return;
      }

      const type = apiKeyInput.getAttribute("type");
      apiKeyInput.setAttribute(
        "type",
        type === "password" ? "text" : "password"
      );
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });

  // Import button
  document.getElementById("import-settings").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 50) {
          showToast("File too large. Max size is 50KB", "error");
          return;
        }
        importSettings(file);
      }
    };
    input.click();
  });

  // Export button
  document
    .getElementById("export-settings")
    .addEventListener("click", exportSettings);

  // Form submission
  document.getElementById("settings-form").addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveCurrentSettings();
    return false;
  });
}

// Initialize settings
$(document).on("pagecreate", "#settings", () => {
  loadCurrentSettings();
  setupEventHandlers();
});

// Export functions for other modules
export { getSettings, saveSettings };
