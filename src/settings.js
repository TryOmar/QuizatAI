import { showToast } from "./utils/ui.js";

let saveButtonClickCount = 0;
let lastClickTime = 0;
const CLICK_TIMEOUT = 2000; // Reset counter if more than 2 seconds between clicks

// UUID generation function
function generateUUID() {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);

  // Convert to hex string with proper padding
  const hex = Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Format: 8-4-4-4-12
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Validate UUID format
function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Default settings configuration
const defaultSettings = {
  userId: "", // Add userId to default settings
  quizLanguage: "English",
  difficulty: "Medium",
  questionTypes: "Multiple Choice",
  questionCount: "5",
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
    let settings = defaultSettings;

    if (savedSettings) {
      settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
      if (settings.reviewMode === "Never") {
        settings.reviewMode = "AfterQuiz";
      }
      if (
        !settings.apiKey ||
        settings.apiKey === defaultSettings.apiKey ||
        settings.apiKey === MASKED_INTERNAL_KEY
      ) {
        settings.apiKey = defaultSettings.apiKey;
      }
    }

    // Ensure user ID exists
    if (!settings.userId) {
      settings.userId = generateUUID();
      saveSettings(settings);
    }

    return settings;
  } catch (error) {
    console.error("Error loading settings:", error);
    const settings = { ...defaultSettings, userId: generateUUID() };
    saveSettings(settings);
    return settings;
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

  // Hide user ID field by default
  const userIdContainer = document.querySelector(".setting-item:has(#userId)");
  if (userIdContainer) {
    userIdContainer.style.display = "none";
  }

  // Set user ID first
  const userIdElement = document.getElementById("userId");
  if (userIdElement) {
    userIdElement.value = currentSettings.userId;
  }

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

  // Check if user ID is empty and assign a new one
  if (!newSettings.userId || newSettings.userId.trim() === "") {
    newSettings.userId = generateUUID();
    const userIdInput = document.getElementById("userId");
    if (userIdInput) {
      userIdInput.value = newSettings.userId;
      userIdInput.setAttribute("type", "password");
      // Reset eye icon to closed state
      const eyeIcon = document.getElementById("toggle-user-id");
      if (eyeIcon) {
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
      }
    }
    showToast("New User ID generated", "info", 3000);
  }

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
    // Remove user ID and mask API key for export
    const exportSettings = { ...settings };
    delete exportSettings.userId; // Exclude user ID
    if (exportSettings.apiKey === defaultSettings.apiKey) {
      exportSettings.apiKey = "";
    }

    const blob = new Blob([JSON.stringify(exportSettings, null, 2)], {
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
      const importedSettings = JSON.parse(e.target.result);
      // Keep current user ID when importing
      const currentSettings = getSettings();
      const newSettings = {
        ...defaultSettings,
        ...importedSettings,
        userId: currentSettings.userId, // Preserve current user ID
      };

      if (!Object.keys(defaultSettings).every((key) => key in newSettings)) {
        throw new Error("Invalid settings file format");
      }

      if (saveSettings(newSettings)) {
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

function resetSettings() {
  try {
    // Load default settings into form without saving
    Object.entries(defaultSettings).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (key === "apiKey") {
          element.value = MASKED_INTERNAL_KEY;
        } else if (key === "userId") {
          // Keep current user ID
          const currentSettings = getSettings();
          element.value = currentSettings.userId;
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

    showToast(
      "Click Save to confirm resetting to default settings",
      "info",
      5000
    );
  } catch (error) {
    console.error("Error resetting settings:", error);
    showToast("Failed to reset settings", "error");
  }
}

// Event handlers
function setupEventHandlers() {
  // Save button
  document.querySelector(".save-button").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentTime = Date.now();
    if (currentTime - lastClickTime > CLICK_TIMEOUT) {
      saveButtonClickCount = 0;
    }
    lastClickTime = currentTime;

    saveButtonClickCount++;

    if (saveButtonClickCount === 3) {
      const userIdContainer = document.querySelector(
        ".setting-item:has(#userId)"
      );
      if (userIdContainer) {
        userIdContainer.style.display = "flex";
        showToast("User ID field unlocked!", "success", 2000);
      }
      saveButtonClickCount = 0;
    }

    saveCurrentSettings();
    return false;
  });

  // User ID input handler
  document.getElementById("userId").addEventListener("input", function (e) {
    const oldValue = getSettings().userId;

    // Handle empty/cleared field
    if (this.value.length === 0) {
      showToast(
        "Clearing user ID will generate a new one on save and remove access to current quizzes.",
        "warning",
        5000
      );
      return;
    }

    // Handle changed value
    if (this.value !== oldValue && this.value.length > 0) {
      showToast(
        "Warning: Changing your User ID will cause you to lose access to all quizzes linked to your current ID. Make sure to save your changes if you want to proceed.",
        "warning",
        8000
      );
    }

    // Ensure the format is correct
    if (this.value.length > 0 && !isValidUUID(this.value)) {
      showToast(
        "Please paste a complete User ID in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. You cannot edit individual characters.",
        "error",
        5000
      );
      this.value = oldValue;
    }
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

  // User ID toggle
  document
    .getElementById("toggle-user-id")
    .addEventListener("click", function () {
      const userIdInput = document.getElementById("userId");
      const type = userIdInput.getAttribute("type");
      userIdInput.setAttribute(
        "type",
        type === "password" ? "text" : "password"
      );
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });

  // User ID copy
  document
    .getElementById("copy-user-id")
    .addEventListener("click", async function () {
      const userIdInput = document.getElementById("userId");
      const currentType = userIdInput.getAttribute("type");

      // Temporarily make visible to copy if hidden
      if (currentType === "password") {
        userIdInput.setAttribute("type", "text");
      }

      try {
        await navigator.clipboard.writeText(userIdInput.value);
        showToast("User ID copied to clipboard!", "success", 2000);
      } catch (err) {
        showToast("Failed to copy User ID", "error");
      }

      // Restore to password type if it was hidden
      if (currentType === "password") {
        userIdInput.setAttribute("type", "password");
      }
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

  document
    .getElementById("reset-settings")
    .addEventListener("click", resetSettings);
}

// Initialize settings
$(document).on("pagecreate", "#settings", () => {
  loadCurrentSettings();
  setupEventHandlers();
});

// Export functions for other modules
export { getSettings, saveSettings };
