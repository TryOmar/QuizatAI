import { getSettings } from "../settings.js";

export class AIModelError extends Error {
  constructor(message, modelName, statusCode) {
    super(message);
    this.name = "AIModelError";
    this.modelName = modelName;
    this.statusCode = statusCode;
  }
}

export class AIModelService {
  constructor(modelConfig = {}) {
    this.modelConfig = {
      temperature: 0.7,
      maxTokens: 1000,
      ...modelConfig,
    };
  }

  async getApiKey() {
    const settings = getSettings();

    // Check if settings exist
    if (!settings) {
      throw new AIModelError("Settings not found", "settings", 401);
    }

    // Check if API key exists and is not empty
    if (!settings.apiKey || settings.apiKey.trim() === "") {
      throw new AIModelError(
        "Please enter your API key in the settings page",
        "settings",
        401
      );
    }

    return settings.apiKey;
  }

  async sendToGemini(prompt) {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
          "gemini-pro",
          response.status
        );
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error instanceof AIModelError) {
        throw error;
      }
      throw new AIModelError(
        "Error communicating with Gemini",
        "gemini-pro",
        500
      );
    }
  }

  async sendToChatGPT(prompt, version = "3.5") {
    try {
      const apiKey = await this.getApiKey();
      const model = version === "4" ? "gpt-4" : "gpt-3.5-turbo";
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
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
          `Failed to get response from GPT-${version}`,
          `gpt-${version}`,
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
        `Error communicating with GPT-${version}`,
        `gpt-${version}`,
        500
      );
    }
  }

  async sendToClaude(prompt) {
    try {
      const apiKey = await this.getApiKey();
      // Implementation for Claude will be added here
      throw new AIModelError(
        "Claude API not implemented yet",
        "claude-3-5-sonnet",
        501
      );
    } catch (error) {
      if (error instanceof AIModelError) {
        throw error;
      }
      throw new AIModelError(
        "Error communicating with Claude",
        "claude-3-5-sonnet",
        500
      );
    }
  }

  async getTopicSuggestion(prompt) {
    try {
      const settings = getSettings();
      let response;

      switch (settings.aiModel) {
        case "gemini-pro":
          response = await this.sendToGemini(prompt);
          break;
        case "gpt-3.5":
          response = await this.sendToChatGPT(prompt, "3.5");
          break;
        case "gpt-4":
          response = await this.sendToChatGPT(prompt, "4");
          break;
        case "claude-3-5-sonnet":
          response = await this.sendToClaude(prompt);
          break;
        default:
          throw new AIModelError("Unsupported AI model", settings.aiModel, 400);
      }
      return response;
    } catch (error) {
      console.error("Error getting topic suggestion:", error);
      throw error;
    }
  }
}
