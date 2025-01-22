/**
 * Service class for handling all quiz cloud operations
 */
export class QuizCloudApi {
  constructor() {
    this.baseUrl = "http://localhost:5000/api";
  }

  /**
   * Save quiz to cloud (creates new or updates existing)
   * @param {Object} quizData - The quiz data to save
   * @returns {Promise<Object>} The saved quiz data
   */
  async saveQuiz(quizData) {
    try {
      const response = await fetch(`${this.baseUrl}/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save quiz: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving quiz:", error);
      throw error;
    }
  }

  /**
   * Get quiz by ID from cloud
   * @param {string} quizId - The ID of the quiz to fetch
   * @returns {Promise<Object>} The quiz data
   */
  async getQuiz(quizId) {
    try {
      const response = await fetch(`${this.baseUrl}/quizzes/${quizId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching quiz:", error);
      throw error;
    }
  }

  /**
   * Delete quiz from cloud
   * @param {string} quizId - The ID of the quiz to delete
   * @param {string} userId - The ID of the user who owns the quiz
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deleteQuiz(quizId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/quizzes/${quizId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete quiz: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting quiz:", error);
      throw error;
    }
  }
}
