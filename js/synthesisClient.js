// Client-side Synthesis Logic
// Mirrors the backend synthesisService.ts but runs entirely in the browser

/**
 * Get API functions from window.AIService (set by clientAiService.js)
 */
function getApiFunctions() {
  if (!window.AIService) {
    throw new Error('AIService not loaded');
  }
  return window.AIService;
}

/**
 * Round 1: Get initial responses from all three AI models
 * @param {string} userInput - The user's prompt
 * @returns {Promise<{round: number, responses: Array}>}
 */
async function round1InitialResponses(userInput) {
  const { callGemini, callClaude, callOpenAI } = getApiFunctions();
  const responses = await Promise.all([
    callGemini(userInput),
    callClaude(userInput),
    callOpenAI(userInput),
  ]);
  return {
    round: 1,
    responses,
  };
}

/**
 * Round 2: Each model sees the other two responses and refines its output
 * @param {Array} round1Responses - Responses from Round 1
 * @returns {Promise<{round: number, responses: Array}>}
 */
async function round2CrossSharing(round1Responses) {
  const { callGemini, callClaude, callOpenAI } = getApiFunctions();
  const [geminiResponse, claudeResponse, openaiResponse] = round1Responses;

  const round2Prompts = [
    `Original prompt response from Claude and ChatGPT:\n\nClaude: ${claudeResponse.content}\n\nChatGPT: ${openaiResponse.content}\n\nPlease refine your previous response considering these perspectives.`,
    `Original prompt response from Gemini and ChatGPT:\n\nGemini: ${geminiResponse.content}\n\nChatGPT: ${openaiResponse.content}\n\nPlease refine your previous response considering these perspectives.`,
    `Original prompt response from Gemini and Claude:\n\nGemini: ${geminiResponse.content}\n\nClaude: ${claudeResponse.content}\n\nPlease refine your previous response considering these perspectives.`,
  ];

  const [refinedGemini, refinedClaude, refinedOpenAI] = await Promise.all([
    callGemini(round2Prompts[0]),
    callClaude(round2Prompts[1]),
    callOpenAI(round2Prompts[2]),
  ]);

  return {
    round: 2,
    responses: [refinedGemini, refinedClaude, refinedOpenAI],
  };
}

/**
 * Merge all three refined responses into a single coherent output
 * @param {Array} responses - Refined responses from Round 2
 * @returns {Promise<string>} Merged output
 */
async function mergeResponses(responses) {
  const { callClaude } = getApiFunctions();
  const mergePrompt = `You are a synthesis expert. Merge the following three AI responses into a single coherent, high-quality output that combines the best insights from all three:

Gemini Response:
${responses[0].content}

Claude Response:
${responses[1].content}

ChatGPT Response:
${responses[2].content}

Create a final merged response that synthesizes the best parts of all three, avoiding redundancy while maintaining completeness and accuracy.`;

  const mergedResponse = await callClaude(mergePrompt);
  return mergedResponse.content;
}

/**
 * Main synthesis function - orchestrates all three rounds
 * @param {string} userInput - The user's prompt
 * @returns {Promise<{userInput, rounds, finalMergedOutput, totalTime}>}
 */
async function synthesize(userInput) {
  const startTime = Date.now();

  try {
    // Round 1: Get initial responses from all three
    const round1 = await round1InitialResponses(userInput);

    // Round 2: Share outputs with each other
    const round2 = await round2CrossSharing(round1.responses);

    // Merge final responses
    const finalMergedOutput = await mergeResponses(round2.responses);

    const totalTime = Date.now() - startTime;

    return {
      userInput,
      rounds: [round1, round2],
      finalMergedOutput,
      totalTime,
    };
  } catch (error) {
    console.error('Synthesis error:', error);
    throw error;
  }
}

// Export functions for use in HTML
window.synthesisClient = {
  synthesize,
};
