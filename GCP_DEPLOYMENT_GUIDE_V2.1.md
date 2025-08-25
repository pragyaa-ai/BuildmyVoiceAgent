# 🚀 VoiceAgent 2.1 GCP Deployment Guide
## Standalone Realtime Agent → SIP Telephony Integration

This guide provides command-level instructions to deploy VoiceAgent 2.1 framework on GCP VMs where standalone realtime voiceagents are running.

## 📋 **Prerequisites**

### GCP VM Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 2+ vCPUs recommended
- **Memory**: 4GB+ RAM
- **Network**: Public IP with ports 80, 443, 3000 open
- **Node.js**: 18+ installed

### Required Credentials
- LiveKit Cloud account (API key/secret)
- OpenAI API key (with Realtime API access)
- SIP trunk credentials (Twilio/other provider)

## 🔧 **Step 1: Environment Setup**

### 1.1 Update System
```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### 1.2 Install Node.js 18+
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18+
npm --version
```

### 1.3 Install Process Manager
```bash
# Install PM2 for production process management
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## 📦 **Step 2: Deploy VoiceAgent 2.1 Framework**

### 2.1 Clone/Transfer VoiceAgent 2.1
```bash
# Create application directory
sudo mkdir -p /opt/voiceagent
sudo chown $USER:$USER /opt/voiceagent
cd /opt/voiceagent

# Option A: If using Git
git clone <your-voiceagent-repo> .

# Option B: Transfer from local (from your local machine)
# scp -r /Users/gulshan/voiceagent-lk1/* user@gcp-vm-ip:/opt/voiceagent/
```

### 2.2 Install Dependencies
```bash
cd /opt/voiceagent

# Install main dependencies
npm install

# Install UI dependencies
cd voiceagent-ui
npm install
cd ..

# Build TypeScript agents
npm run build
```

### 2.3 Verify Build
```bash
# Check compiled files exist
ls -la dist/
# Should see: agent.js, realtime-agent.js

# Check UI build
cd voiceagent-ui
npm run build
cd ..
```

## 🔐 **Step 3: Configuration Setup**

### 3.1 Create Environment File
```bash
cd /opt/voiceagent

# Create environment configuration
cat > .env << 'EOF'
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Additional TTS/STT providers
ELEVEN_API_KEY=your_elevenlabs_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key

# Logging
LOG_LEVEL=info
EOF

# Secure the environment file
chmod 600 .env
```

### 3.2 Update SIP Dispatch Rules
```bash
# Configure inbound dispatch rule with your SIP trunk
cat > inbound-dispatch-rule.json << 'EOF'
{
  "dispatch_rule": {
    "rule": {
      "dispatchRuleIndividual": {
        "roomPrefix": "call-"
      }
    },
    "trunks": ["YOUR_SIP_TRUNK_ID"],
    "roomConfig": {
      "agents": [{
        "agentName": "telephony-voice-agent"
      }]
    }
  }
}
EOF
```

### 3.3 Configure Agent Settings
```bash
# Update agent configuration if needed
cat > agents-config.json << 'EOF'
{
  "agents": [
    {
      "name": "telephony-voice-agent",
      "metadata": {
        "deployment": "gcp-production",
        "version": "2.1"
      }
    }
  ]
}
EOF
```

## 🔄 **Step 4: Integration with Existing Realtime Agent**

### 4.1 Backup Existing Agent
```bash
# Backup your current realtime agent
sudo cp -r /path/to/your/current/agent /opt/voiceagent/backup/
```

### 4.2 Integrate V2.1 Framework
```bash
cd /opt/voiceagent

# If your existing agent has custom logic, merge it into src/realtime-agent.ts
# Copy custom functions/logic from your standalone agent

# Example integration points:
# - Custom system prompts
# - Specific function calling
# - Business logic handlers
# - Authentication mechanisms

# Rebuild after customization
npm run build
```

### 4.3 Test Configuration
```bash
# Test environment configuration
node -e "
require('dotenv').config();
console.log('LiveKit URL:', process.env.LIVEKIT_URL);
console.log('OpenAI configured:', !!process.env.OPENAI_API_KEY);
"
```

## 🚀 **Step 5: Production Deployment**

### 5.1 Create PM2 Configuration
```bash
cd /opt/voiceagent

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'voiceagent-realtime',
      script: 'dist/realtime-agent.js',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      error_file: '/var/log/voiceagent/error.log',
      out_file: '/var/log/voiceagent/output.log',
      log_file: '/var/log/voiceagent/combined.log',
      time: true
    },
    {
      name: 'voiceagent-ui',
      script: 'npm',
      args: 'start',
      cwd: './voiceagent-ui',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF
```

### 5.2 Setup Logging Directory
```bash
# Create log directory
sudo mkdir -p /var/log/voiceagent
sudo chown $USER:$USER /var/log/voiceagent

# Setup log rotation
sudo tee /etc/logrotate.d/voiceagent << 'EOF'
/var/log/voiceagent/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF
```

### 5.3 Start Services
```bash
cd /opt/voiceagent

# Start both services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions to enable auto-start on boot
```

## 🔍 **Step 6: Verification & Testing**

### 6.1 Check Service Status
```bash
# Check PM2 processes
pm2 status

# Check logs
pm2 logs voiceagent-realtime
pm2 logs voiceagent-ui

# Check specific log files
tail -f /var/log/voiceagent/combined.log
```

### 6.2 Verify Network Connectivity
```bash
# Test LiveKit connection
curl -k "https://your-livekit-instance.livekit.cloud"

# Check UI accessibility
curl http://localhost:3000

# If using external access, check public IP
curl http://your-gcp-vm-external-ip:3000
```

### 6.3 Test Agent Registration
```bash
# Check if agent registered with LiveKit
grep "registered worker" /var/log/voiceagent/combined.log

# Should see something like:
# [INFO] registered worker {"id": "AW_xxxxx", "version": "0.1.0"}
```

## 📞 **Step 7: SIP Integration Setup**

### 7.1 Configure SIP Trunk (Twilio Example)
```bash
# Using LiveKit CLI to create SIP trunk (install lk CLI first)
# wget https://github.com/livekit/livekit-cli/releases/latest/download/lk-linux-amd64.tar.gz
# tar -xvf lk-linux-amd64.tar.gz
# sudo mv lk /usr/local/bin/

# Configure LiveKit CLI
lk auth create-token --api-key YOUR_LIVEKIT_API_KEY --api-secret YOUR_LIVEKIT_API_SECRET

# Create inbound SIP trunk
lk sip create-trunk \
  --name "gcp-production-trunk" \
  --numbers "+YOUR_PHONE_NUMBER" \
  --uri "sip:YOUR_TWILIO_SIP_URI"
```

### 7.2 Create Dispatch Rule
```bash
# Create dispatch rule using the trunk ID from previous step
lk sip create-dispatch-rule \
  --trunk-id "ST_xxxxx" \
  --rule-file inbound-dispatch-rule.json
```

### 7.3 Test Inbound Calls
```bash
# Monitor logs during test call
tail -f /var/log/voiceagent/combined.log

# Call your configured phone number
# You should see logs showing:
# - Job request received
# - Agent starting
# - Audio processing
# - Job completion
```

## 🎛️ **Step 8: Firewall & Security**

### 8.1 Configure GCP Firewall
```bash
# Create firewall rules for VoiceAgent (run from local gcloud CLI)
gcloud compute firewall-rules create voiceagent-ui \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "VoiceAgent UI Dashboard"

gcloud compute firewall-rules create voiceagent-http \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "HTTP/HTTPS for VoiceAgent"
```

### 8.2 Setup SSL (Optional)
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com

# Configure reverse proxy with nginx (optional)
sudo apt install nginx
```

## 📊 **Step 9: Monitoring Setup**

### 9.1 Health Check Endpoint
```bash
# Create simple health check script
cat > health-check.js << 'EOF'
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Check if PM2 processes are running
    const { exec } = require('child_process');
    exec('pm2 jlist', (error, stdout) => {
      if (error) {
        res.writeHead(500);
        res.end('PM2 Error');
        return;
      }
      const processes = JSON.parse(stdout);
      const healthy = processes.every(p => p.pm2_env.status === 'online');
      res.writeHead(healthy ? 200 : 500);
      res.end(healthy ? 'OK' : 'Unhealthy');
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8080, () => {
  console.log('Health check server running on port 8080');
});
EOF

# Add health check to PM2
pm2 start health-check.js --name health-check
pm2 save
```

### 9.2 Basic Monitoring Commands
```bash
# System monitoring
htop              # CPU/Memory usage
df -h             # Disk usage
netstat -tlnp     # Network connections

# Application monitoring
pm2 monit         # PM2 dashboard
pm2 logs --lines 100  # Recent logs

# LiveKit connection status
grep "registered worker" /var/log/voiceagent/combined.log | tail -5
```

## 🔄 **Step 10: Maintenance & Updates**

### 10.1 Update Procedures
```bash
# Backup current deployment
sudo tar -czf /opt/voiceagent-backup-$(date +%Y%m%d).tar.gz /opt/voiceagent

# Pull updates (if using Git)
cd /opt/voiceagent
git pull origin main

# Rebuild
npm run build

# Restart services
pm2 restart all
```

### 10.2 Log Management
```bash
# View logs
pm2 logs voiceagent-realtime --lines 50

# Clear logs
pm2 flush

# Rotate logs manually
sudo logrotate -f /etc/logrotate.d/voiceagent
```

## 🚨 **Troubleshooting Commands**

### Common Issues
```bash
# Agent not connecting to LiveKit
# Check environment variables
cat .env | grep LIVEKIT

# Check network connectivity
telnet your-livekit-instance.livekit.cloud 443

# Agent crashes
# Check PM2 logs
pm2 logs voiceagent-realtime --err

# Check system resources
free -h
df -h

# SIP calls not working
# Check dispatch rules
grep "dispatch" /var/log/voiceagent/combined.log

# Check trunk configuration
lk sip list
```

## 📝 **Final Checklist**

- [ ] Node.js 18+ installed
- [ ] VoiceAgent 2.1 code deployed to `/opt/voiceagent`
- [ ] Environment variables configured in `.env`
- [ ] SIP trunk and dispatch rules configured
- [ ] PM2 services running (`pm2 status`)
- [ ] UI accessible on port 3000
- [ ] Firewall rules configured
- [ ] Health checks working
- [ ] Test call successful

## 🎯 **Expected Result**

After following this guide, you should have:

1. **Realtime Agent**: Running in production with PM2
2. **SIP Integration**: Configured trunk receiving inbound calls
3. **Management UI**: Accessible for monitoring and configuration
4. **Logging**: Centralized logs with rotation
5. **Monitoring**: Health checks and process monitoring
6. **Auto-restart**: Services automatically restart on failure

Your standalone realtime voiceagent is now integrated with VoiceAgent 2.1 framework and connected to SIP telephony infrastructure.

---
**Deployment Guide Version**: VoiceAgent 2.1  
**Target Environment**: GCP VM (Ubuntu/CentOS)  
**Prerequisites**: Existing standalone realtime agent  
**Outcome**: Production SIP telephony integration
