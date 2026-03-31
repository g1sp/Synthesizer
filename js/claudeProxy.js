// Claude API Proxy
// Since Claude doesn't support CORS from browsers, we'll use a workaround
// by calling through a CORS proxy service

/**
 * Call Claude API through CORS proxy
 * @param {string} prompt - The prompt to send
 * @returns {Promise<{tool: string, content: string, timestamp: string}>}
 */
async function callClaudeProxy(prompt) {
  const apiKey = localStorage.getItem('CLAUDE_API_KEY');
  if (!apiKey) {
    throw new Error('Claude API key not configured. Please add it in Settings.');
  }

  try {
    // Use cors-anywhere proxy service
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/https://api.anthropic.com/v1/messages';

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;

      if (response.status === 401) {
        throw new Error(`Claude API: Invalid API key. Check your key at https://console.anthropic.com/`);
      } else if (response.status === 429) {
        throw new Error(`Claude API: Rate limited. Please wait and try again.`);
      } else if (response.status === 403) {
        throw new Error(`Claude API: Access forbidden. Check billing at https://console.anthropic.com/`);
      }

      throw new Error(`Claude API error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || 'No response generated';

    return {
      tool: 'claude',
      content: text,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Claude API: Network/CORS error. The proxy service may be unavailable. Try again in a moment.`);
    }
    throw new Error(`Claude API error: ${error.message}`);
  }
}

// Export proxy function
window.claudeProxy = {
  callClaudeProxy,
};
