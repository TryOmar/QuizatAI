export class AIModelError extends Error {
  constructor(message, modelName, statusCode) {
    super(message);
    this.name = "AIModelError";
    this.modelName = modelName;
    this.statusCode = statusCode;
  }
}

export class AIModelService {
  constructor(apiKey, modelConfig = {}) {
    this.apiKey = apiKey;
    this.modelConfig = {
      temperature: 0.7,
      maxTokens: 1000,
      ...modelConfig,
    };
  }

  async sendToGemini(prompt) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt.userMessage }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new AIModelError(
          "Failed to get response from Gemini",
          "Gemini",
          response.status
        );
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error instanceof AIModelError) {
        throw error;
      }
      throw new AIModelError("Error communicating with Gemini", "Gemini", 500);
    }
  }

  async sendToChatGPT(prompt) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              { role: "system", content: prompt.systemMessage },
              { role: "user", content: prompt.userMessage },
            ],
            temperature: this.modelConfig.temperature,
            max_tokens: this.modelConfig.maxTokens,
          }),
        }
      );

      if (!response.ok) {
        throw new AIModelError(
          "Failed to get response from ChatGPT",
          "ChatGPT",
          response.status
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof AIModelError) {
        throw error;
      }
      throw new AIModelError(
        "Error communicating with ChatGPT",
        "ChatGPT",
        500
      );
    }
  }

  async getTopicSuggestion(prompt, model = "gemini") {
    try {
      let response;
      switch (model.toLowerCase()) {
        case "gemini":
          response = await this.sendToGemini(prompt);
          break;
        case "chatgpt":
          response = await this.sendToChatGPT(prompt);
          break;
        default:
          throw new AIModelError("Unsupported AI model", model, 400);
      }
      return response;
    } catch (error) {
      console.error("Error getting topic suggestion:", error);
      throw error;
    }
  }
}
