// Default settings configuration
const defaultSettings = {
  quizLanguage: "English",
  difficulty: "Medium",
  questionTypes: "Multiple Choice",
  questionCount: "10",
  answerExplanations: "OnWrong",
  quizTiming: "Untimed",
  reviewMode: "AfterQuiz",
  randomize: "Both",
  aiModel: "gemini-pro",
  apiKey: "",
};

// Map form field names to settings keys
const formToSettingsMap = {
  quizlanguage: "quizLanguage",
  difficulty: "difficulty",
  questiontypes: "questionTypes",
  questioncount: "questionCount",
  answerexplanations: "answerExplanations",
  quiztiming: "quizTiming",
  reviewmode: "reviewMode",
  randomize: "randomize",
  aimodel: "aiModel",
  apikey: "apiKey",
};

function getSettings() {
  try {
    console.log("Getting settings from localStorage");
    const savedSettings = localStorage.getItem("quizatAISettings");
    console.log("Raw saved settings:", savedSettings);

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      console.log("Parsed settings:", parsed);

      // Convert form field names to settings keys
      const convertedSettings = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const settingKey = formToSettingsMap[key.toLowerCase()] || key;
        convertedSettings[settingKey] = value;
      });

      return { ...defaultSettings, ...convertedSettings };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  console.log("Using default settings");
  return defaultSettings;
}

function saveSettings(newSettings) {
  try {
    console.log("Saving settings:", newSettings);
    localStorage.setItem("quizatAISettings", JSON.stringify(newSettings));
    console.log("Settings saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

function showToast(message, type = "success") {
  // Remove existing toast if any
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${
      type === "success" ? "check-circle" : "exclamation-circle"
    }"></i>
    ${message}
  `;

  // Add to document
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function loadCurrentSettings() {
  const currentSettings = getSettings();
  console.log("Loading current settings into form:", currentSettings);

  // Convert settings keys to form field names
  Object.entries(currentSettings).forEach(([key, value]) => {
    const formKey =
      Object.entries(formToSettingsMap).find(([_, v]) => v === key)?.[0] ||
      key.toLowerCase();
    const element = document.getElementById(formKey);
    if (element) {
      element.value = value;
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
  const newSettings = {};
  const form = document.getElementById("settings-form");

  // Get all form inputs and selects
  const formElements = form.querySelectorAll("input, select");
  formElements.forEach((element) => {
    if (element.name && element.name !== "submit") {
      // Convert form field names to settings keys
      const settingKey =
        formToSettingsMap[element.name.toLowerCase()] || element.name;
      newSettings[settingKey] = element.value;
    }
  });

  console.log("Attempting to save settings:", newSettings);

  try {
    // Save to localStorage
    localStorage.setItem("quizatAISettings", JSON.stringify(newSettings));
    console.log("Settings saved successfully:", newSettings);
    showToast("Settings saved successfully!");

    // Verify the save
    const savedSettings = localStorage.getItem("quizatAISettings");
    console.log("Verified saved settings:", JSON.parse(savedSettings));
  } catch (error) {
    console.error("Failed to save settings:", error);
    showToast("Failed to save settings. Please try again.", "error");
  }
}

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
      // Validate settings
      const requiredKeys = Object.keys(defaultSettings);
      const hasAllKeys = requiredKeys.every((key) => key in settings);

      if (!hasAllKeys) {
        throw new Error("Invalid settings file format");
      }

      // Save settings
      if (saveSettings(settings)) {
        loadCurrentSettings(); // Refresh the form
        showToast("Settings imported successfully!");
      } else {
        throw new Error("Failed to save imported settings");
      }
    } catch (error) {
      console.error("Error importing settings:", error);
      showToast("Invalid settings file", "error");
    }
  };
  reader.onerror = function () {
    showToast("Error reading file", "error");
  };
  reader.readAsText(file);
}

function setupEventHandlers() {
  // Handle save button click
  document
    .querySelector(".save-button")
    .addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      saveCurrentSettings();
      return false;
    });

  // Handle API key toggle visibility
  document
    .getElementById("toggle-api-key")
    .addEventListener("click", function () {
      const apiKeyInput = document.getElementById("apikey");
      const type = apiKeyInput.getAttribute("type");
      apiKeyInput.setAttribute(
        "type",
        type === "password" ? "text" : "password"
      );
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });

  // Handle import button
  document
    .getElementById("import-settings")
    .addEventListener("click", function () {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1024 * 50) {
            // Max 50KB
            showToast("File too large. Max size is 50KB", "error");
            return;
          }
          importSettings(file);
        }
      };
      input.click();
    });

  // Handle export button
  document
    .getElementById("export-settings")
    .addEventListener("click", exportSettings);

  // Prevent form submission
  document
    .getElementById("settings-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      saveCurrentSettings();
      return false;
    });
}

// Initialize when the page is ready (using jQuery Mobile's event)
$(document).on("pagecreate", "#settings", function () {
  console.log("Settings page initialized");
  loadCurrentSettings();
  setupEventHandlers();
});

// Export functions that need to be used by other modules
export { getSettings, saveSettings };
