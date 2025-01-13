// Settings state management
const settingsState = {
  settings: {},
};

// Initialize settings page
$(document).on("pagecreate", "#settings", function () {
  console.log("Settings page initialized");

  // Load settings from localStorage
  loadSettings();

  // Settings form submission
  $("#settings-form").on("submit", function (e) {
    e.preventDefault();
    saveSettings();
    alert("Settings saved successfully");
  });

  // Quiz mode changes
  $("#quiz-mode").on("change", function () {
    if ($(this).val() === "Timed") {
      $("#time-settings").show();
    } else {
      $("#time-settings").hide();
    }
  });
});

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem("quizSettings");
  if (savedSettings) {
    settingsState.settings = JSON.parse(savedSettings);
    updateSettingsUI();
  }
}

// Save settings to localStorage
function saveSettings() {
  const settings = {
    difficulty: $("#difficulty").val(),
    questionTypes: $("#question-types").val(),
    answerExplanations: $("#answer-explanations").val(),
    questionCount: $("#question-count").val(),
    quizMode: $("#quiz-mode").val(),
    timePerQuestion: $("#time-per-question").val(),
    reviewMode: $("#review-mode").val(),
    randomize: $("#randomize").val(),
    aiModel: $("#ai-model").val(),
    apiKey: $("#api-key").val(),
  };

  settingsState.settings = settings;
  localStorage.setItem("quizSettings", JSON.stringify(settings));
}

// Update UI based on settings
function updateSettingsUI() {
  const settings = settingsState.settings;
  $("#difficulty").val(settings.difficulty);
  $("#question-types").val(settings.questionTypes);
  $("#answer-explanations").val(settings.answerExplanations);
  $("#question-count").val(settings.questionCount);
  $("#quiz-mode").val(settings.quizMode);
  $("#time-per-question").val(settings.timePerQuestion);
  $("#review-mode").val(settings.reviewMode);
  $("#randomize").val(settings.randomize);
  $("#ai-model").val(settings.aiModel);
  $("#api-key").val(settings.apiKey);

  if (settings.quizMode === "Timed") {
    $("#time-settings").show();
  }
}
