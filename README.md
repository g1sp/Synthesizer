# Synthesizer — Multi-AI Synthesis Engine

A powerful web application that combines responses from three AI models (Gemini, Claude, OpenAI) through an intelligent three-round refinement process to create synthesized, high-quality outputs.

## 🚀 Live Demo

**Frontend**: https://g1sp.github.io/Synthesizer/

## How It Works

1. **Round 1 - Initial Responses**: Your prompt is sent to all three AI models simultaneously
2. **Round 2 - Cross-Sharing Refinement**: Each model refines its response after seeing the other two responses
3. **Final Synthesis**: Claude merges all three perspectives into one coherent, comprehensive output

## Quick Start

### Prerequisites
- API keys for:
  - **Google Gemini**: Get from https://makersuite.google.com/app/apikey
  - **Anthropic Claude**: Get from https://console.anthropic.com/
  - **OpenAI**: Get from https://platform.openai.com/api-keys
- Backend proxy service (deploy `server.js`)

### Setup

1. **Deploy Backend Proxy** (Render.com recommended):
   - Go to https://render.com
   - Create new Web Service
   - Connect GitHub repo (g1sp/Synthesizer)
   - Set Build Command: `npm install`
   - Set Start Command: `npm start`
   - Get the deployment URL

2. **Use the Frontend**:
   - Visit https://g1sp.github.io/Synthesizer/
   - Click ⚙️ **Settings**
   - Enter your three API keys
   - Enter Backend Proxy URL (e.g., `https://your-service.onrender.com`)
   - Click **Save Keys**
   - Enter your prompt and click **Synthesize**

## Features

- ✨ Real-time synthesis across three AI models
- 🔄 Cross-sharing mechanism for iterative refinement
- 🎨 Modern, responsive UI with real-time status updates
- 📱 Works on desktop and mobile
- 🔐 Client-side only - your API keys stay in your browser
- 🚀 No backend required for frontend (GitHub Pages compatible)
- 📊 Displays all three rounds + final merged output

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript (GitHub Pages)
- **Backend**: Node.js/Express proxy (handles CORS)
- **Storage**: Browser localStorage (API keys only)

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for detailed technical documentation.

## Security

- API keys stored only in your browser (localStorage)
- No keys sent to any backend
- All API keys forwarded directly to AI provider APIs
- No data logging or persistence

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main UI and synthesis logic |
| `js/clientAiService.js` | API client for three models |
| `server.js` | Backend CORS proxy |
| `package.json` | Node.js dependencies |
| `IMPLEMENTATION.md` | Detailed technical guide |

## Deployment

### Local Development
```bash
npm install
node server.js  # Backend on port 3000

# In another terminal:
python3 -m http.server 8000  # Frontend on port 8000
```

Visit http://localhost:8000 and use `http://localhost:3000` as backend proxy URL.

### Production
- Frontend: GitHub Pages (automatic via GitHub Actions)
- Backend: Deploy `server.js` to Render.com, Heroku, or similar
- See [IMPLEMENTATION.md](IMPLEMENTATION.md) for details

## Usage Example

**Input Prompt**: "What are the benefits of meditation?"

**Output**:
- Round 1: Three separate responses (one from each model)
- Round 2: Three refined responses (each seeing the others)
- Final: One synthesized response combining the best insights

## Model Information

| Model | Provider | API |
|-------|----------|-----|
| Gemini 2.5 Flash | Google | generativelanguage.googleapis.com |
| Claude Opus 4.1 | Anthropic | api.anthropic.com |
| GPT-4o | OpenAI | api.openai.com |

## Troubleshooting

**"Backend proxy URL not configured"**
- Go to Settings and enter your backend proxy URL
- Format: `https://your-service.onrender.com`

**"API key not configured"**
- Check that you entered all three keys
- Verify keys are saved (try refreshing the page)
- Check browser console for errors (F12)

**"Model not found"**
- Model names change over time
- Update in `js/clientAiService.js`
- Redeploy backend

## Documentation

- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Complete technical documentation
- [Architecture diagram](IMPLEMENTATION.md#architecture)
- [API request formats](IMPLEMENTATION.md#api-requests-format)

## License

Open source - feel free to use and modify.

## Support

For issues or questions, check [IMPLEMENTATION.md](IMPLEMENTATION.md) for comprehensive documentation.
