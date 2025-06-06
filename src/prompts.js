import { getSettings } from "./settings.js";

export const PROMPTS = {
  TOPIC_SUGGESTION: {
    system: `You are a knowledgeable quiz topic suggester. Your role is to suggest engaging and educational quiz topics.
             Return the response in a structured format with topic title, icon, and description in plain text without any decoration.`,
    user: (
      settings
    ) => `Suggest 3 interesting quiz topics in ${settings.quizLanguage}. For each topic, provide:
           TOPIC_TITLE | ICON_NAME | DESCRIPTION
           
           Where:
           - TOPIC_TITLE: A short, clear title (2-3 words)
           - ICON_NAME: A relevant common Font Awesome icon name (without fa- prefix) ensure it is a common valid icon name can be used like this: <i class="fas fa-icon-name"></i>
           - DESCRIPTION: A brief description including 2-3 sample questions
           
           Format each topic on a new line with | as separator.
           Example:
           Ancient Egypt | pyramid | Explore the fascinating world of pharaohs and pyramids...
           Space Exploration | rocket | Discover the mysteries of our solar system...`,
  },
  QUESTION_GENERATION: {
    system: `You are an expert quiz question generator. Create engaging, accurate, and educational questions.
             Return ONLY a valid JSON object with no additional text or formatting.`,
    user: (topic, settings) => {
      // Determine question type based on settings
      const questionType =
        settings.questionTypes === "Both"
          ? "Mix of True/False and Multiple Choice questions"
          : settings.questionTypes;

      return `Generate a quiz about "${topic}" with these specifications:
           Return a JSON object in this exact format:
           {"title":"Quiz title here","questions":[{"id":1,"question":"Question text here","options":["option1","option2","option3","option4"],"correctAnswer":"Correct option here","explanation":"Brief explanation"}]}

            Prompt Requirements:
            - Generate exactly ${settings.questionCount} questions.
            - Set the difficulty level to ${settings.difficulty}.
            - Use the question type: ${questionType}.
            - Formulate questions and options in ${settings.quizLanguage}.
            - Ensure one option is correct for each question.
            - Include a brief explanation for each correct answer.
            - Make the questions engaging and educational.
            - Output the JSON with no line breaks or extra spaces between properties.
            - Avoid using characters that could break JSON syntax.
            - Ensure the JSON is free of syntax errors.`;
    },
  },
};

export const constructTopicSuggestionPrompt = (preferences = {}) => {
  const settings = getSettings();
  const { difficulty, category, interests } = preferences;

  let prompt = PROMPTS.TOPIC_SUGGESTION.user(settings);

  if (difficulty) {
    prompt += `\nFocus on ${difficulty} level topics.`;
  }

  if (category) {
    prompt += `\nSuggest topics related to ${category}.`;
  }

  if (interests) {
    prompt += `\nConsider the user's interests: ${interests}.`;
  }

  return {
    systemMessage: PROMPTS.TOPIC_SUGGESTION.system,
    userMessage: prompt,
  };
};

export const constructQuestionGenerationPrompt = (topic) => {
  const settings = getSettings();

  return {
    systemMessage: PROMPTS.QUESTION_GENERATION.system,
    userMessage: PROMPTS.QUESTION_GENERATION.user(topic, settings),
  };
};
