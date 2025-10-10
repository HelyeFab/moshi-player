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

## 🏢 Self-Hosted Multi-App Architecture (NEW)

**Added**: 2025-10-10 - Scalable architecture for deploying unlimited apps to sheldon's server

### Overview

This architecture allows you to deploy **unlimited applications** to sheldon's server with minimal configuration. It uses:

- **Caddy** as a central reverse proxy (routes all traffic)
- **PM2 Ecosystem** for managing multiple Node.js apps
- **Cloudflare Tunnel** with wildcard routing (one config for all apps)
- **Systemd** for non-Node.js services (Python, Go, etc.)

### Architecture Diagram

```
Internet → Cloudflare → Tunnel → Caddy (port 80) → Apps on unique ports
                                    ↓
                              ┌─────┴─────┐
                              │           │
                        PM2 Apps      Systemd Services
                      (port 3001+)     (port 5000+)
```

### Key Components

#### 1. Caddy Reverse Proxy

**Location**: Running in Docker container `ai-gateway-caddy`
**Config**: `/home/sheldon/ai-gateway/caddy/Caddyfile`
**Bridge IP**: `172.19.0.1` (for container-to-host communication)

Caddy handles ALL incoming traffic and routes it to the appropriate app based on:
- Subdomain (e.g., `yt-player.selfmind.dev`)
- Path (e.g., `/api/auth/*`)

#### 2. PM2 Ecosystem File

**Location**: `/home/sheldon/ecosystem.config.js`
**Purpose**: Central configuration for all Node.js applications

Example structure:
```javascript
module.exports = {
  apps: [
    {
      name: 'yt-player',
      cwd: '/home/sheldon/yt-player',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/sheldon/.pm2/logs/yt-player-error.log',
      out_file: '/home/sheldon/.pm2/logs/yt-player-out.log',
      time: true
    }
    // Add more apps here...
  ]
};
```

#### 3. Cloudflare Tunnel Configuration

**Location**: `/etc/cloudflared/config.yml`
**Wildcard Routing**: Routes ALL subdomains to Caddy

```yaml
tunnel: c325864b-4c4c-4e02-a77e-d90c01873020
credentials-file: /etc/cloudflared/c325864b-4c4c-4e02-a77e-d90c01873020.json

# Scalable configuration: Route ALL traffic through Caddy
# Caddy handles subdomain routing based on hostname
ingress:
  # Route all selfmind.dev subdomains to Caddy
  - hostname: "*.selfmind.dev"
    service: http://localhost:80
  # Route main domain to Caddy
  - hostname: selfmind.dev
    service: http://localhost:80
  # Fallback
  - service: http_status:404
```

**DNS Setup**: Each subdomain needs a CNAME record:
```
yt-player.selfmind.dev    CNAME  c325864b-4c4c-4e02-a77e-d90c01873020.cfargotunnel.com
new-app.selfmind.dev      CNAME  c325864b-4c4c-4e02-a77e-d90c01873020.cfargotunnel.com
```

**IMPORTANT**: Enable Cloudflare proxy (orange cloud) in the DNS dashboard!

### Port Allocation Strategy

To avoid conflicts, use these port ranges:

| Service Type | Port Range | Examples |
|--------------|------------|----------|
| Web Apps (Next.js, React, etc.) | 3001-3099 | yt-player: 3001, dashboard: 3002 |
| API Services (Python, Go, etc.) | 5000-5099 | transcript: 5000, auth-api: 5001 |
| Databases (Postgres, Redis, etc.) | 5432, 6379 | Standard ports |
| Internal Services | 8001-8099 | Background workers, etc. |

### 📖 Deploy a New Node.js App (Step-by-Step)

Let's say you want to deploy a new Next.js app called `my-app` at `my-app.selfmind.dev`:

#### Step 1: Copy App to Server

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  -e "sshpass -p beano ssh" \
  ./my-app/ sheldon@100.111.118.91:~/my-app/
```

#### Step 2: Build App on Server

```bash
# SSH into server
ssh sheldon@100.111.118.91

# Navigate to app
cd ~/my-app

# Install dependencies
npm install

# Build for production
npm run build

# Test that it builds correctly
# npm start (then Ctrl+C to stop)
```

#### Step 3: Add to PM2 Ecosystem

Edit `/home/sheldon/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    // ... existing apps ...
    {
      name: 'my-app',              // App name for PM2
      cwd: '/home/sheldon/my-app', // App directory
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3002,                // Pick next available port!
        NODE_ENV: 'production',
        // Add your env vars here
        API_KEY: 'your-key-here'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/sheldon/.pm2/logs/my-app-error.log',
      out_file: '/home/sheldon/.pm2/logs/my-app-out.log',
      time: true
    }
  ]
};
```

#### Step 4: Add Caddy Routing

Edit `/home/sheldon/ai-gateway/caddy/Caddyfile` and add your subdomain block:

```caddyfile
# Add at the top with other subdomain blocks
# My New App - Next.js App on PM2
my-app.selfmind.dev {
    reverse_proxy 172.19.0.1:3002 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

**Also add to the `:80` block for Cloudflare Tunnel traffic**:

```caddyfile
:80 {
    # ... existing routes ...

    # My App subdomain
    @my_app host my-app.selfmind.dev
    handle @my_app {
        reverse_proxy 172.19.0.1:3002 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # ... rest of routes ...
}
```

#### Step 5: Reload Caddy

```bash
# Reload Caddy configuration
docker exec ai-gateway-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

#### Step 6: Start App with PM2

```bash
# Start all apps from ecosystem file
pm2 start /home/sheldon/ecosystem.config.js

# Or start just your app
pm2 start /home/sheldon/ecosystem.config.js --only my-app

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

#### Step 7: Configure DNS

1. Go to Cloudflare DNS dashboard
2. Add CNAME record:
   - **Name**: `my-app`
   - **Target**: `c325864b-4c4c-4e02-a77e-d90c01873020.cfargotunnel.com`
   - **Proxy**: ✅ Enabled (orange cloud)

#### Step 8: Test!

```bash
# Test from anywhere
curl https://my-app.selfmind.dev
```

That's it! Your app is now live at `https://my-app.selfmind.dev` 🎉

### 📖 Deploy a New Python/API Service

For non-Node.js services (Python Flask, FastAPI, Go, etc.):

#### Step 1: Create Service Directory

```bash
ssh sheldon@100.111.118.91
mkdir -p ~/my-api-service
cd ~/my-api-service
```

#### Step 2: Set Up Service

```bash
# For Python
python3 -m venv venv
source venv/bin/activate
pip install flask gunicorn
# Copy your code here
```

#### Step 3: Create Systemd Service

Create `/etc/systemd/system/my-api-service.service`:

```ini
[Unit]
Description=My API Service
After=network.target

[Service]
Type=simple
User=sheldon
WorkingDirectory=/home/sheldon/my-api-service
Environment="PATH=/home/sheldon/my-api-service/venv/bin"
ExecStart=/home/sheldon/my-api-service/venv/bin/gunicorn --bind 0.0.0.0:5001 --workers 2 server:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Step 4: Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable my-api-service
sudo systemctl start my-api-service
sudo systemctl status my-api-service
```

#### Step 5: Follow Steps 4-8 from Node.js Guide

Add Caddy routing, DNS, etc. (same process, just different port)

### 🔧 Management Commands

#### PM2 Management

```bash
# View all apps
pm2 status

# View logs
pm2 logs my-app --lines 50

# Restart app
pm2 restart my-app

# Stop app
pm2 stop my-app

# Delete app
pm2 delete my-app

# Restart all apps
pm2 restart all

# Save current configuration
pm2 save

# Monitor in real-time
pm2 monit
```

#### Caddy Management

```bash
# Reload configuration (no downtime)
docker exec ai-gateway-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

# Check configuration syntax
docker exec ai-gateway-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# View Caddy logs
docker logs ai-gateway-caddy -f

# Restart Caddy container
cd ~/ai-gateway && docker-compose -f docker-compose.production.yml restart caddy
```

#### Cloudflare Tunnel Management

```bash
# Check status
sudo systemctl status cloudflared

# Restart tunnel
sudo systemctl restart cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Verify tunnel info
cloudflared tunnel info
```

### 🎯 Key Benefits of This Architecture

1. **Zero Cloudflare Config Changes**: Wildcard routing means you never edit the tunnel config again!
2. **Centralized Management**: One ecosystem file manages all Node.js apps
3. **No Port Conflicts**: Each app gets its own port, Caddy routes traffic
4. **Easy Rollbacks**: PM2 restart to previous version
5. **Auto-Restart**: PM2 and systemd ensure apps stay running
6. **Zero Downtime**: Caddy reload happens without dropping connections
7. **Unlimited Apps**: No limit on how many apps you can deploy

### 📋 Quick Reference Checklist

When deploying a new app, you only need to:

- [ ] Copy app to server
- [ ] Build/install dependencies
- [ ] Choose unique port number
- [ ] Add app to `/home/sheldon/ecosystem.config.js` (Node.js) OR create systemd service (other)
- [ ] Add 2 blocks to `/home/sheldon/ai-gateway/caddy/Caddyfile` (subdomain + :80)
- [ ] Reload Caddy: `docker exec ai-gateway-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile`
- [ ] Start app: `pm2 start /home/sheldon/ecosystem.config.js --only app-name` OR `sudo systemctl start service-name`
- [ ] Add DNS CNAME record in Cloudflare (enable proxy!)
- [ ] Test: `curl https://your-app.selfmind.dev`

**That's it!** No tunnel config changes needed! 🚀

### 🐛 Troubleshooting

#### App not accessible via HTTPS

```bash
# 1. Check if app is running
pm2 status
# or
sudo systemctl status my-service

# 2. Check if app responds on localhost
curl http://localhost:PORT

# 3. Check if Caddy can reach it
docker exec ai-gateway-caddy wget -O- -q http://172.19.0.1:PORT

# 4. Check Caddy logs
docker logs ai-gateway-caddy -f

# 5. Check DNS
dig your-app.selfmind.dev

# 6. Verify Cloudflare proxy is enabled (orange cloud)
```

#### Port already in use

```bash
# Find what's using the port
ss -tlnp | grep :PORT

# If it's an old process, kill it
sudo kill -9 PID
```

#### PM2 app keeps restarting

```bash
# Check logs
pm2 logs app-name --lines 100

# Check if port is available
ss -tlnp | grep :PORT

# Check if .env.local exists and has correct values
cat ~/app-name/.env.local
```

### 📚 Architecture Files Summary

| File | Purpose | When to Edit |
|------|---------|--------------|
| `/home/sheldon/ecosystem.config.js` | PM2 apps config | Adding/updating Node.js apps |
| `/home/sheldon/ai-gateway/caddy/Caddyfile` | Reverse proxy routing | Adding new subdomains/routes |
| `/etc/cloudflared/config.yml` | Tunnel config | **Never!** (wildcard handles all) |
| `/etc/systemd/system/*.service` | Systemd services | Adding non-Node.js services |

## 📚 Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Gunicorn Deployment](https://docs.gunicorn.org/en/stable/deploy.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemctl.html)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Caddy Documentation](https://caddyserver.com/docs/)

---

**Last Updated**: 2025-10-10
**Production URL**: https://yt-player-sable.vercel.app
**API Endpoint**: https://transcript.selfmind.dev
**Self-Hosted Multi-App Architecture**: ✅ Active
