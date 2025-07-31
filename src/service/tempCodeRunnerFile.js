async searchExerciseWithAI(exerciseName) {
  try {
    const response = await fetch('/api/exercises/ai-search', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ exerciseName }),
    });

    return this.handleResponse(response);
  } catch (error) {
    console.error('Error searching exercise with AI:', error);
    throw error;
  }
}