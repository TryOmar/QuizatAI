export const PROMPTS = {
  TOPIC_SUGGESTION: {
    system: `You are a knowledgeable quiz topic suggester. Your role is to suggest engaging and educational quiz topics.
             Return the response in a structured format with topic title, icon, and description in plain text without any decoration.`,
    user: `Suggest 3 interesting quiz topics. For each topic, provide:
           TOPIC_TITLE | ICON_NAME | DESCRIPTION
           
           Where:
           - TOPIC_TITLE: A short, clear title (2-3 words)
           - ICON_NAME: A relevant common Font Awesome icon name (without fa- prefix)
           - DESCRIPTION: A brief description including 2-3 sample questions
           
           Format each topic on a new line with | as separator.
           Example:
           Ancient Egypt | pyramid | Explore the fascinating world of pharaohs and pyramids...
           Space Exploration | rocket | Discover the mysteries of our solar system...`,
  },
  QUESTION_GENERATION: {
    system: `You are an expert quiz question generator. Create engaging, accurate, and educational questions.`,
    user: (topic) => `Generate 5 multiple-choice questions about "${topic}". 
                         Each question should have:
                         - Clear and concise wording
                         - 4 possible answers (1 correct, 3 plausible incorrect)
                         - The correct answer marked
                         - Varying difficulty levels`,
  },
};

export const constructTopicSuggestionPrompt = (preferences = {}) => {
  const { difficulty, category, count = 3 } = preferences;

  let prompt = PROMPTS.TOPIC_SUGGESTION.user;

  if (difficulty) {
    prompt += `\nFocus on ${difficulty} level topics.`;
  }

  if (category) {
    prompt += `\nSuggest topics related to ${category}.`;
  }

  return {
    systemMessage: PROMPTS.TOPIC_SUGGESTION.system,
    userMessage: prompt,
  };
};

export const constructQuestionGenerationPrompt = (topic) => {
  return {
    systemMessage: PROMPTS.QUESTION_GENERATION.system,
    userMessage: PROMPTS.QUESTION_GENERATION.user(topic),
  };
};
