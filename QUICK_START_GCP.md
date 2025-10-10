# 🚀 Quick Start: Deploy to Google Cloud Functions + Vercel

This guide will get your YouTube player with Japanese transcripts running on Vercel in about 10 minutes.

## ✅ What You Have

- **GCP Project ID**: `moshimoshi-471918`
- **Project Number**: `1071298112141`
- All code files ready to deploy

## 📝 Step-by-Step Deployment

### Step 1: Install Google Cloud SDK (5 minutes)

#### macOS:
```bash
brew install google-cloud-sdk
```

#### Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Windows:
Download from: https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate & Enable APIs (2 minutes)

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project moshimoshi-471918

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 3: Deploy Cloud Function (2 minutes)

```bash
cd /home/helye/DevProject/personal/Next-js/yt-player/cloud_function
./deploy.sh
```

**Expected output:**
```
✅ Deployment complete!
🔗 Your function URL:
https://us-central1-moshimoshi-471918.cloudfunctions.net/get-japanese-transcript
```

**Copy that URL!** You'll need it in the next step.

### Step 4: Configure Environment Variable (1 minute)

```bash
# Go back to project root
cd /home/helye/DevProject/personal/Next-js/yt-player

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local and add your function URL
nano .env.local
```

Add this line (replace with your actual URL from Step 3):
```
GOOGLE_CLOUD_FUNCTION_URL=https://us-central1-moshimoshi-471918.cloudfunctions.net/get-japanese-transcript
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 5: Test Locally (1 minute)

```bash
npm run dev
```

Open http://localhost:3000 and test with a Japanese video!

### Step 6: Deploy to Vercel (2 minutes)

#### First time setup:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login
```

#### Deploy:
```bash
# Deploy to production
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? `yt-player` (or your choice)
- Directory? `.` (press Enter)
- Override settings? **N**

**Important:** After deployment, add your environment variable in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name**: `GOOGLE_CLOUD_FUNCTION_URL`
   - **Value**: Your Cloud Function URL from Step 3
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your project (Deployments → ... → Redeploy)

### Step 7: Verify It Works! 🎉

1. Visit your Vercel URL (shown after deployment)
2. Try loading a Japanese video
3. Check that transcripts appear!

---

## 🧪 Testing Your Cloud Function Directly

Test the Cloud Function independently:

```bash
# Test with a video ID
curl "https://us-central1-moshimoshi-471918.cloudfunctions.net/get-japanese-transcript?videoId=dQw4w9WgXcQ"
```

You should get a JSON response with transcript data.

---

## 🔍 Monitoring & Logs

### View Cloud Function Logs:
```bash
gcloud functions logs read get-japanese-transcript --region=us-central1 --limit=50
```

### View Vercel Logs:
```bash
vercel logs
```

Or check in the Vercel dashboard.

---

## 💰 Cost Estimate

**Google Cloud Functions:**
- First 2 million requests/month: **FREE**
- After: $0.40 per million requests

**Vercel:**
- Hobby plan: **FREE** (100GB bandwidth, 100 builds/day)
- Pro plan: $20/month (if you need more)

**Expected cost for personal use: $0/month** ✅

---

## 🚨 Troubleshooting

### Cloud Function deployment fails:

```bash
# Check if APIs are enabled
gcloud services list --enabled

# Check project permissions
gcloud projects get-iam-policy moshimoshi-471918
```

### Vercel can't find transcripts:

1. Check environment variable is set in Vercel dashboard
2. Redeploy after adding environment variable
3. Check Vercel logs for errors: `vercel logs`

### Cloud Function returns errors:

```bash
# Check function logs
gcloud functions logs read get-japanese-transcript --region=us-central1

# Test function directly
curl "YOUR_FUNCTION_URL?videoId=dQw4w9WgXcQ"
```

---

## 🎯 What's Next?

Your app is now fully deployed! Here are some ideas:

- Add more video sources
- Implement transcript caching
- Add user authentication
- Create playlists of Japanese learning videos
- Export transcripts to Anki flashcards

---

## 📚 Documentation

- Full deployment guide: `cloud_function/DEPLOYMENT_GUIDE.md`
- Project overview: `PROJECT_SUMMARY.md`
- API setup: `YOUTUBE_API_SETUP.md`

---

**Need help?** Check the logs or create an issue on GitHub!

Enjoy your Japanese transcript-enabled YouTube player! 🇯🇵🎥
