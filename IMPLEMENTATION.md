# Synthesizer Implementation Guide

## Overview

The Synthesizer is a multi-AI synthesis engine that combines responses from three AI models (Gemini, Claude, OpenAI) through a three-round refinement process. It runs entirely on GitHub Pages with a backend proxy to handle CORS issues.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Frontend)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ index.html (UI + JavaScript Logic)                   │  │
│  │ - Settings modal for API keys                        │  │
│  │ - Prompt input form                                  │  │
│  │ - Results display (3 rounds + merged output)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓ (HTTP calls)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ js/clientAiService.js (API Client)                   │  │
│  │ - Formats requests for Gemini, Claude, OpenAI        │  │
│  │ - Calls backend proxy to avoid CORS issues           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓ (HTTP POST)
┌─────────────────────────────────────────────────────────────┐
│            Backend Proxy (Node.js/Express)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ server.js - CORS Proxy                               │  │
│  │ /api/proxy endpoint - Forwards API calls             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓ (Direct API calls)
      ┌──────────────────┬──────────────┬───────────────┐
      ↓                  ↓              ↓               ↓
  [Gemini API]      [Claude API]   [OpenAI API]   (All 3 in parallel)
```

## Key Files

### 1. **index.html** (Main Application)
- **Size**: ~37KB
- **Purpose**: Complete UI and application logic
- **Key sections**:
  - Lines 1-691: HTML structure (UI components, modals, styling)
  - Lines 692-703: Script loading and `waitForScripts()` function
  - Lines 705-956: JavaScript logic (event handlers, synthesis orchestration)

**Key Features**:
- Settings modal to configure API keys and backend proxy URL
- Three tabs to display results from Round 1, Round 2, and Final Synthesis
- Real-time status updates during synthesis
- localStorage for persisting API keys

### 2. **js/clientAiService.js** (API Client)
- **Size**: ~6KB
- **Purpose**: Handles communication with AI APIs through the backend proxy

**Key Functions**:

#### `getBackendProxy()`
Retrieves the backend proxy URL from localStorage
```javascript
function getBackendProxy() {
  return localStorage.getItem('backend_proxy_url') || '';
}
```

#### `getApiKeys()`
Retrieves all three API keys from localStorage
```javascript
function getApiKeys() {
  return {
    gemini: localStorage.getItem('gemini_api_key') || '',
    claude: localStorage.getItem('claude_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || '',
  };
}
```

#### `callGemini(prompt)`, `callClaude(prompt)`, `callOpenAI(prompt)`
Each function:
1. Gets API keys from localStorage
2. Checks if backend proxy URL is configured
3. Constructs the API request
4. Sends it to the backend proxy at `${backendProxy}/api/proxy`
5. Returns `{ tool, content, timestamp }`

**Example (Claude)**:
```javascript
async function callClaude(prompt) {
  const keys = getApiKeys();
  if (!keys.claude) throw new Error('Claude API key not configured');

  const backendProxy = getBackendProxy();
  if (!backendProxy) throw new Error('Backend proxy URL not configured');

  const response = await fetch(`${backendProxy}/api/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://api.anthropic.com/v1/messages',
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

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  return {
    tool: 'Claude',
    content,
    timestamp: new Date().toISOString(),
  };
}
```

**Exports**:
```javascript
window.AIService = {
  callGemini,
  callClaude,
  callOpenAI,
  verifyApiKeys,
  getApiKeys,
};
```

### 3. **server.js** (Backend Proxy)
- **Size**: ~1.5KB
- **Purpose**: CORS-compliant proxy for AI API calls
- **Port**: 3000 (configurable via PORT env variable)

**Key Endpoint**:

#### `POST /api/proxy`
Receives a request with:
```json
{
  "url": "https://api.anthropic.com/v1/messages",
  "method": "POST",
  "headers": { ... },
  "body": { ... }
}
```

Forwards it to the URL with CORS headers:
```javascript
const response = await fetch(url, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...headers,
  },
  body: body ? JSON.stringify(body) : undefined,
});
```

Returns the API response as JSON.

**Health Check**:
```
GET /health → { "status": "ok" }
```

### 4. **package.json** (Dependencies)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-fetch": "^2.7.0"
  }
}
```

## Synthesis Flow

### Round 1: Initial Responses (Parallel)
1. User enters prompt and clicks "Synthesize"
2. App checks if all 3 API keys and backend proxy URL are configured
3. App calls all three AI models **in parallel**:
   - `callGemini(prompt)`
   - `callClaude(prompt)`
   - `callOpenAI(prompt)`
4. Results are displayed in the "Round 1" tab

**Code** (index.html, lines 848-852):
```javascript
round1Results = await Promise.all([
  callGemini(prompt),
  callClaude(prompt),
  callOpenAI(prompt)
]);
```

### Round 2: Cross-Sharing Refinement (Parallel)
1. App constructs three new prompts, each showing the model the other two responses
2. Calls all three models again **in parallel** with refined prompts
3. Results are displayed in the "Round 2" tab

**Example prompt structure** (index.html, lines 859-870):
```
For Gemini:
"Original prompt: [user prompt]
Claude said: [Claude's Round 1 response]
OpenAI said: [OpenAI's Round 1 response]
Now you respond, taking their inputs into account..."
```

**Code** (index.html, lines 872-877):
```javascript
round2Results = await Promise.all([
  callGemini(round2Prompts[0]),
  callClaude(round2Prompts[1]),
  callOpenAI(round2Prompts[2])
]);
```

### Final Synthesis: Claude Merges All Three
1. App calls **Claude only** with all three Round 2 responses
2. Claude creates a final merged response that:
   - Avoids redundancy
   - Maintains completeness
   - Synthesizes the best parts from each model
3. Results are displayed in the "Final Synthesis" tab

**Code** (index.html, lines 899-911):
```javascript
const mergePrompt = `...
Here are three perspectives on the question: "${prompt}"

Gemini's perspective:
${round2Results[0].content}

Claude's perspective:
${round2Results[1].content}

OpenAI's perspective:
${round2Results[2].content}

Create a final merged response...`;

mergedResponse = await callClaude(mergePrompt);
```

## Data Flow

### Storage (Browser localStorage)
```
gemini_api_key      → Gemini API key from makersuite.google.com
claude_api_key      → Claude API key from console.anthropic.com
openai_api_key      → OpenAI API key from platform.openai.com
backend_proxy_url   → Backend proxy URL (e.g., http://localhost:3000)
```

### API Requests Format

**To Backend Proxy**:
```
POST http://localhost:3000/api/proxy
Content-Type: application/json

{
  "url": "https://api.anthropic.com/v1/messages",
  "method": "POST",
  "headers": {
    "x-api-key": "sk-ant-...",
    "anthropic-version": "2023-06-01"
  },
  "body": {
    "model": "claude-opus-4-1",
    "max_tokens": 2048,
    "messages": [{"role": "user", "content": "..."}]
  }
}
```

**From Backend Proxy to AI APIs**:
```
POST https://api.anthropic.com/v1/messages
Headers: [All headers from request]
Body: [All body data from request]
```

## Model Names (Current)

| AI Model | API | Model Name |
|----------|-----|-----------|
| Gemini | Google | `gemini-2.5-flash` |
| Claude | Anthropic | `claude-opus-4-1` |
| OpenAI | OpenAI | `gpt-4o` |

**Note**: Model names change over time. If you get "model not found" errors:
1. Check the API provider's documentation
2. Update the model name in `js/clientAiService.js`
3. Commit and push to GitHub
4. Redeploy the backend

## Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start backend on port 3000
node server.js

# In another terminal, start frontend on port 8000
python3 -m http.server 8000

# Visit http://localhost:8000
```

### GitHub Pages Deployment
1. Push code to https://github.com/g1sp/Synthesizer
2. GitHub Actions automatically deploys frontend to GitHub Pages
3. Deploy `server.js` to a backend service (Render, Heroku, etc.)
4. Configure backend proxy URL in Settings

### Backend Deployment (Render.com)
1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repo (g1sp/Synthesizer)
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Deploy
6. Use the generated URL in Synthesizer Settings

## Error Handling

### Common Errors

**"Backend proxy URL not configured"**
- Go to Settings and enter backend proxy URL
- For local dev: `http://localhost:3000`
- For production: `https://your-proxy.onrender.com`

**"Model not found"**
- API provider removed or renamed the model
- Update model name in `js/clientAiService.js`
- Verify with API provider's documentation

**"API key not configured"**
- Go to Settings and enter your API key
- Make sure to click Save
- Check browser console (F12) to verify localStorage

**CORS errors**
- This should not occur when using the backend proxy
- If it does, check that backend proxy URL is correct

## Security Considerations

### API Keys
- Stored in browser localStorage (client-side only)
- **Never** sent to any server except the backend proxy
- Backend proxy forwards them directly to AI APIs
- Clear keys in Settings if compromised

### Backend Proxy
- Should only be used for forwarding API requests
- Does not store or log API keys (they're just passed through)
- Uses CORS headers to allow browser requests
- Can be deployed on any service (Render, Heroku, etc.)

### Frontend
- Runs entirely on GitHub Pages (static files)
- No backend required for frontend
- All user inputs stay in browser (localStorage)

## Performance

### Round 1 & 2
- All three API calls happen in parallel (not sequential)
- Typical time: 10-30 seconds (depends on API response time)
- Real-time status updates shown to user

### Final Synthesis
- Claude processes the three Round 2 responses
- Typical time: 5-15 seconds
- Additional 5-10 seconds to display and merge

### Total Time
- Typical: 20-60 seconds for complete synthesis
- Shown in "Processing Time" display

## Extending the Synthesizer

### Adding a Fourth AI Model
1. Add API key input in Settings modal (index.html)
2. Add storage for the API key (localStorage)
3. Create new function in `js/clientAiService.js` (e.g., `callGemini2()`)
4. Update Round 1 and Round 2 calls to include new model
5. Update merge prompt to include four perspectives

### Using Different Models
1. Update model names in `js/clientAiService.js`
2. Adjust max_tokens based on model capabilities
3. Test thoroughly with your API keys
4. Commit and deploy

### Changing Backend Service
1. Update `server.js` to add features (logging, auth, etc.)
2. Deploy to your preferred service
3. Update backend proxy URL in Settings

## Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.html | 960 | Main UI + synthesis logic |
| js/clientAiService.js | 192 | API client for three models |
| js/synthesisClient.js | 113 | Synthesis orchestration (currently unused) |
| server.js | 49 | Backend CORS proxy |
| package.json | 17 | Node.js dependencies |
| .nojekyll | 0 | Disables Jekyll on GitHub Pages |
| _config.yml | 2 | GitHub Pages config |
| .github/workflows/deploy-pages.yml | 37 | Auto-deployment workflow |

