# VoiceAgent Manager v1.0

A production-ready AI voice agent system built with LiveKit, featuring telephony integration and a modern management UI.

## 🎯 System Overview

VoiceAgent Manager v1.0 provides:
- **AI Voice Agent**: Answers inbound calls with natural conversation
- **Telephony Integration**: SIP trunk connection via Twilio
- **Management UI**: Web dashboard for configuration and monitoring
- **Real-time Processing**: Live speech recognition and synthesis

## 📞 Current Status: OPERATIONAL

- **Phone Number**: `+12695750613` (Active)
- **Agent Status**: Running and answering calls
- **UI Dashboard**: Available at `http://localhost:3000`

## 🏗️ Architecture

### Voice Pipeline (Current Implementation)
```
Inbound Call → SIP Trunk → LiveKit → Agent Pipeline
                                   ↓
Speech-to-Text (Deepgram) → LLM (OpenAI) → Text-to-Speech (OpenAI)
```

### Components
1. **Telephony Voice Agent** (`src/agent.ts`)
   - Pipeline-based processing (STT → LLM → TTS)
   - OpenAI TTS with Alloy voice
   - Function calling capability (weather example)

2. **VoiceAgent Manager UI** (`voiceagent-ui/`)
   - React/Next.js dashboard
   - Agent configuration panel
   - SIP trunk management
   - Call testing interface
   - Real-time monitoring

3. **LiveKit Infrastructure**
   - Cloud-hosted LiveKit server
   - SIP trunk integration
   - Agent dispatch rules

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- LiveKit Cloud account
- OpenAI API access
- Deepgram API access
- Twilio SIP trunk (for telephony)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd voiceagent-lk1
   npm install
   cd voiceagent-ui && npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.template .env
   # Edit .env with your API keys
   ```

3. **Build and Start Agent**
   ```bash
   npm run build
   node dist/agent.js dev
   ```

4. **Start Management UI**
   ```bash
   cd voiceagent-ui
   npm run dev
   ```

### API Keys Required
- **LIVEKIT_URL**: Your LiveKit cloud instance
- **LIVEKIT_API_KEY** & **LIVEKIT_API_SECRET**: LiveKit credentials
- **OPENAI_API_KEY**: OpenAI API access (GPT-4o-mini + TTS)
- **DEEPGRAM_API_KEY**: Speech recognition service

## 📁 Project Structure

```
voiceagent-lk1/
├── src/
│   └── agent.ts                 # Core voice agent logic
├── voiceagent-ui/               # Management dashboard
│   ├── src/app/                 # Next.js app router
│   ├── src/components/          # React components
│   └── src/lib/                 # Utilities
├── dispatch-rule.json           # SIP routing configuration
├── outbound-call.json          # Outbound call template
├── package.json                # Agent dependencies
├── .env.template               # Environment template
└── README.md                   # This file
```

## ⚙️ Configuration

### Agent Settings
- **Agent Name**: `telephony-voice-agent`
- **Voice**: OpenAI TTS Alloy
- **Language Model**: GPT-4o-mini
- **Speech Recognition**: Deepgram Nova-3

### SIP Configuration
- **Inbound Number**: `+12695750613`
- **SIP Trunk**: Twilio integration
- **Dispatch Rule**: Routes to `telephony-voice-agent`

## 🎛️ Management UI Features

### Agent Configuration Panel
- System prompt customization
- Voice provider selection
- Response timeout settings
- Guardrails management

### SIP Trunk Panel
- Trunk status monitoring
- Phone number management
- Routing configuration

### Call Testing Panel
- Inbound call testing
- Outbound call initiation
- Call history tracking

### Monitoring Panel
- Real-time agent logs
- Performance metrics
- Call statistics

## 📊 Performance Notes

### Current Performance (v1.0)
- **Response Latency**: ~300-400ms (OpenAI TTS)
- **Call Connection**: ✅ Reliable
- **Audio Quality**: ✅ Clear
- **Conversation Flow**: ✅ Working

### Known Limitations
- Occasional "inference slower than realtime" warnings
- Response delays during high load
- Limited to OpenAI TTS (single provider)

## 🔧 Troubleshooting

### Common Issues

1. **Agent Not Answering Calls**
   - Check agent process is running: `ps aux | grep agent.js`
   - Verify SIP dispatch rule exists
   - Confirm API keys are valid

2. **Audio Issues**
   - Ensure OpenAI API key has TTS access
   - Check agent logs for TTS errors
   - Verify network connectivity

3. **Build Errors**
   - Run `npm run build` to check TypeScript errors
   - Ensure all dependencies are installed
   - Check Node.js version compatibility

### Logs and Monitoring
- **Agent Logs**: `tail -f agent.log`
- **UI Logs**: `tail -f voiceagent-ui/ui.log`
- **LiveKit Dashboard**: Check your LiveKit cloud console

## 🎯 Tested Features

- ✅ Inbound call answering
- ✅ Natural conversation
- ✅ Function calling (weather example)
- ✅ Audio pipeline (speech-to-text-to-speech)
- ✅ UI dashboard access
- ✅ SIP trunk integration
- ✅ Real-time monitoring

## 🚦 Version History

### v1.0 (Current) - Stable Baseline
- **Release Date**: August 2024
- **Status**: Production Ready
- **Key Achievement**: First working voice agent with telephony
- **Architecture**: Pipeline model (STT→LLM→TTS)
- **Performance**: Functional with ~300-400ms latency

## 🔮 Future Roadmap

### v2.0 Planned Features
- OpenAI Realtime API integration
- Sub-200ms response times
- Multi-provider TTS support
- Advanced function calling
- Call recording and analytics

---

**VoiceAgent Manager v1.0** - Your AI voice agent is ready for production use! 🎉📞