export const PROMPTS = {
  TOPIC_SUGGESTION: {
    system: `You are a knowledgeable quiz topic suggester. Your role is to suggest engaging and educational quiz topics.
                Provide topics that are specific enough to generate meaningful questions but broad enough to create variety.`,
    user: `Suggest 3 interesting quiz topics. For each topic:
               - Provide a brief description
               - Include 2-3 sample questions
               - Suggest a difficulty level (Beginner/Intermediate/Advanced)
               Format the response in a clear, structured way.`,
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
