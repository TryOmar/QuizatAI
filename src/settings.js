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

export function getSettings() {
  try {
    const savedSettings = localStorage.getItem("quizatAISettings");
    if (savedSettings) {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return defaultSettings;
}

export function saveSettings(newSettings) {
  try {
    localStorage.setItem("quizatAISettings", JSON.stringify(newSettings));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}
