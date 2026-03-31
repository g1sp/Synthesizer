// Client-side AI Service - Calls backend proxy to avoid CORS issues
// Works on GitHub Pages by routing through backend proxy

/**
 * Get backend proxy URL from localStorage
 * @returns {string} Backend proxy URL or empty string
 */
function getBackendProxy() {
  return localStorage.getItem('backend_proxy_url') || '';
}

/**
 * Get API keys from browser localStorage
 * @returns {Object} API keys object
 */
function getApiKeys() {
  return {
    gemini: localStorage.getItem('gemini_api_key') || '',
    claude: localStorage.getItem('claude_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || '',
  };
}

/**
 * Call Gemini API through backend proxy
 * @param {string} prompt - The prompt to send
 * @returns {Promise<{tool: string, content: string, timestamp: string}>}
 */
async function callGemini(prompt) {
  const keys = getApiKeys();
  if (!keys.gemini) throw new Error('Gemini API key not configured');

  const backendProxy = getBackendProxy();
  if (!backendProxy) throw new Error('Backend proxy URL not configured. Go to Settings and enter your proxy URL.');

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${keys.gemini}`;

    const response = await fetch(`${backendProxy}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048 },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      tool: 'Gemini',
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Gemini error: ${error.message}`);
  }
}

/**
 * Call Claude API through backend proxy
 * @param {string} prompt - The prompt to send
 * @returns {Promise<{tool: string, content: string, timestamp: string}>}
 */
async function callClaude(prompt) {
  const keys = getApiKeys();
  if (!keys.claude) throw new Error('Claude API key not configured');

  const backendProxy = getBackendProxy();
  if (!backendProxy) throw new Error('Backend proxy URL not configured. Go to Settings and enter your proxy URL.');

  try {
    const url = 'https://api.anthropic.com/v1/messages';

    const response = await fetch(`${backendProxy}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keys.claude,
          'anthropic-version': '2023-06-01',
        },
        body: {
          model: 'claude-opus-4-1',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    return {
      tool: 'Claude',
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Claude error: ${error.message}`);
  }
}

/**
 * Call OpenAI API through backend proxy
 * @param {string} prompt - The prompt to send
 * @returns {Promise<{tool: string, content: string, timestamp: string}>}
 */
async function callOpenAI(prompt) {
  const keys = getApiKeys();
  if (!keys.openai) throw new Error('OpenAI API key not configured');

  const backendProxy = getBackendProxy();
  if (!backendProxy) throw new Error('Backend proxy URL not configured. Go to Settings and enter your proxy URL.');

  try {
    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(`${backendProxy}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keys.openai}`,
        },
        body: {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      tool: 'OpenAI',
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`OpenAI error: ${error.message}`);
  }
}

/**
 * Verify that API keys and proxy are configured
 * @returns {Object} Status of each API key and proxy
 */
async function verifyApiKeys() {
  const keys = getApiKeys();
  const proxy = getBackendProxy();
  return {
    gemini: !!keys.gemini,
    claude: !!keys.claude,
    openai: !!keys.openai,
    proxy: !!proxy,
  };
}

// Export functions for use in HTML
window.AIService = {
  callGemini,
  callClaude,
  callOpenAI,
  verifyApiKeys,
  getApiKeys,
};
