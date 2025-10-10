# 🚀 Production Deployment Guide

This document describes the production deployment architecture for the Japanese YouTube Player application.

## 📋 Architecture Overview

The application uses a **microservices architecture**:

1. **Next.js Frontend** (Vercel) - `https://yt-player-sable.vercel.app`
2. **Python Transcript Service** (Self-hosted) - `https://transcript.selfmind.dev`
3. **Cloudflare Tunnel** - Secure HTTPS connection without port forwarding

## 🏗️ Infrastructure Components

### 1. Next.js Application (Vercel)

**Platform**: Vercel
**URL**: `https://yt-player-sable.vercel.app`
**Framework**: Next.js 15 with App Router

**Environment Variables**:
```bash
YOUTUBE_API_KEY=<your-youtube-api-key>
GOOGLE_CLOUD_FUNCTION_URL=https://transcript.selfmind.dev/get-japanese-transcript
```

**Deployment Command**:
```bash
vercel --prod
```

### 2. Python Transcript Microservice

**Location**: Self-hosted server (100.111.118.91)
**Public URL**: `https://transcript.selfmind.dev`
**Port**: 5000 (localhost only)
**Framework**: Flask + Gunicorn

**Service Location**: `/home/sheldon/transcript-service/`

**Files**:
- `server.py` - Flask application with CORS support
- `requirements.txt` - Python dependencies

**Dependencies**:
```txt
Flask==3.0.0
Flask-CORS==4.0.0
youtube-transcript-api>=0.6.2
gunicorn==21.2.0
```

**Systemd Service** (`/etc/systemd/system/transcript-service.service`):
```ini
[Unit]
Description=Japanese YouTube Transcript Service
After=network.target

[Service]
Type=simple
User=sheldon
WorkingDirectory=/home/sheldon/transcript-service
Environment="PATH=/home/sheldon/transcript-service/venv/bin"
ExecStart=/home/sheldon/transcript-service/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 60 server:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Service Management**:
```bash
# Check status
sudo systemctl status transcript-service

# Restart service
sudo systemctl restart transcript-service

# View logs
sudo journalctl -u transcript-service -f
```

### 3. Cloudflare Tunnel

**Purpose**: Provides secure HTTPS access to the local transcript service without port forwarding

**Configuration** (`/etc/cloudflared/config.yml`):
```yaml
tunnel: c325864b-4c4c-4e02-a77e-d90c01873020
credentials-file: /etc/cloudflared/c325864b-4c4c-4e02-a77e-d90c01873020.json

ingress:
  - hostname: transcript.selfmind.dev
    service: http://localhost:5000
  - hostname: selfmind.dev
    service: http://localhost:80
  - hostname: www.selfmind.dev
    service: http://localhost:80
  - service: http_status:404
```

**DNS Configuration**:
```
transcript.selfmind.dev CNAME c325864b-4c4c-4e02-a77e-d90c01873020.cfargotunnel.com
```

**Service Management**:
```bash
# Check status
sudo systemctl status cloudflared

# Restart tunnel
sudo systemctl restart cloudflared

# View logs
sudo journalctl -u cloudflared -f
```

## 🔧 Deployment Steps

### Initial Setup

#### 1. Deploy Python Transcript Service

```bash
# SSH into server
ssh sheldon@100.111.118.91

# Create service directory
mkdir -p ~/transcript-service
cd ~/transcript-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install Flask==3.0.0 Flask-CORS==4.0.0 youtube-transcript-api gunicorn

# Copy server.py to the directory

# Test locally
python server.py

# Create systemd service
sudo nano /etc/systemd/system/transcript-service.service
# (paste service configuration)

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable transcript-service
sudo systemctl start transcript-service
```

#### 2. Setup Cloudflare Tunnel

```bash
# Install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Login to Cloudflare (already done if cert.pem exists)
cloudflared tunnel login

# Create tunnel (if not exists)
cloudflared tunnel create transcript-service

# Configure tunnel
sudo nano /etc/cloudflared/config.yml
# (paste tunnel configuration)

# Route DNS
cloudflared tunnel route dns <tunnel-id> transcript.selfmind.dev

# Install as system service (if not already)
sudo cloudflared service install

# Start tunnel
sudo systemctl restart cloudflared
```

#### 3. Deploy to Vercel

```bash
# Set environment variables
vercel env add GOOGLE_CLOUD_FUNCTION_URL production
# Enter: https://transcript.selfmind.dev/get-japanese-transcript

vercel env add YOUTUBE_API_KEY production
# Enter: <your-youtube-api-key>

# Deploy
vercel --prod
```

### Updates and Maintenance

#### Update Transcript Service

```bash
# SSH into server
ssh sheldon@100.111.118.91

# Update code
cd ~/transcript-service
# Copy new server.py

# Restart service
sudo systemctl restart transcript-service

# Check status
sudo systemctl status transcript-service
```

#### Update Next.js Application

```bash
# Make changes locally
# Test with: npm run dev

# Deploy to production
vercel --prod
```

#### Update Environment Variables

```bash
# Remove old variable
vercel env rm GOOGLE_CLOUD_FUNCTION_URL production --yes

# Add new variable
echo "new-value" | vercel env add GOOGLE_CLOUD_FUNCTION_URL production

# Redeploy
vercel --prod
```

## 🧪 Testing

### Test Transcript Service Directly

```bash
# Local test (on server)
curl "http://localhost:5000/get-japanese-transcript?videoId=eXgMsg8WouU"

# Public HTTPS test
curl "https://transcript.selfmind.dev/get-japanese-transcript?videoId=eXgMsg8WouU"
```

### Test Next.js API Route

```bash
curl "https://yt-player-sable.vercel.app/api/youtube/transcript-python/eXgMsg8WouU"
```

### Expected Response

```json
{
  "available": true,
  "videoId": "eXgMsg8WouU",
  "language": "Japanese",
  "languageCode": "ja",
  "isJapanese": true,
  "isGenerated": false,
  "segments": [
    {
      "start": 6.96,
      "duration": 4.2,
      "end": 11.16,
      "text": "今日は、部屋のそうじをしました。"
    }
  ],
  "totalSegments": 19,
  "totalDuration": 97.6,
  "source": "custom-server"
}
```

## 🔍 Monitoring and Logs

### Transcript Service Logs

```bash
# Real-time logs
sudo journalctl -u transcript-service -f

# Last 100 lines
sudo journalctl -u transcript-service -n 100

# Logs since specific time
sudo journalctl -u transcript-service --since "1 hour ago"
```

### Cloudflare Tunnel Logs

```bash
# Real-time logs
sudo journalctl -u cloudflared -f

# Check tunnel status
cloudflared tunnel info
```

### Vercel Logs

```bash
# Real-time deployment logs
vercel logs https://yt-player-sable.vercel.app --follow

# Function logs
vercel logs --scope=production
```

## 🛡️ Security Features

- ✅ **HTTPS Everywhere**: All traffic encrypted via Cloudflare
- ✅ **No Exposed Ports**: Cloudflare Tunnel eliminates port forwarding
- ✅ **CORS Protection**: Configured for specific origins
- ✅ **DDoS Protection**: Provided by Cloudflare
- ✅ **Environment Variables**: Secrets stored in Vercel
- ✅ **Auto-restart**: Systemd ensures service availability

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | Free (Hobby) | Adequate for personal projects |
| Cloudflare | Free | Tunnel + DNS included |
| Self-hosted Server | $0 | Using existing infrastructure |
| **Total** | **$0/month** | 🎉 |

## 🚨 Troubleshooting

### Transcript Service Not Working

```bash
# Check service status
sudo systemctl status transcript-service

# Check if Flask is listening
ss -tlnp | grep 5000

# Test local endpoint
curl http://localhost:5000/health

# Check logs
sudo journalctl -u transcript-service -n 50
```

### Cloudflare Tunnel Issues

```bash
# Check tunnel status
sudo systemctl status cloudflared

# Verify DNS
dig transcript.selfmind.dev

# Test connection
cloudflared tunnel info

# Restart tunnel
sudo systemctl restart cloudflared
```

### Vercel Deployment Errors

```bash
# Check deployment logs
vercel logs --scope=production

# Verify environment variables
vercel env ls production

# Redeploy
vercel --prod --force
```

## 🎯 Why This Architecture?

### Benefits:
1. **No YouTube IP Blocking**: Using self-hosted server avoids cloud provider IP blocks
2. **Cost-Effective**: $0/month using existing infrastructure
3. **Secure**: HTTPS + Cloudflare protection without exposing ports
4. **Reliable**: Systemd auto-restart ensures high availability
5. **Scalable**: Can easily add more workers or upgrade Gunicorn config

### Alternatives Considered:
- ❌ **Google Cloud Functions**: YouTube blocks cloud provider IPs
- ❌ **Railway/Fly.io**: Monthly costs + same IP blocking issues
- ❌ **Vercel Serverless**: Can't run Python dependencies
- ✅ **Self-hosted + Cloudflare Tunnel**: Perfect solution!

## 📚 Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Gunicorn Deployment](https://docs.gunicorn.org/en/stable/deploy.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemctl.html)

---

**Last Updated**: 2025-10-10
**Production URL**: https://yt-player-sable.vercel.app
**API Endpoint**: https://transcript.selfmind.dev
