# Google Cloud Function Deployment Guide

Deploy your Japanese Transcript Fetcher as a serverless Google Cloud Function for use with Vercel.

## 📋 Prerequisites

- ✅ Google Cloud Project: `moshimoshi-471918` (project number: 1071298112141)
- ✅ Billing enabled on your GCP project
- 🔧 Google Cloud SDK installed (or use Cloud Shell)

## 🚀 Quick Deploy (Option 1: Automated Script)

### Step 1: Install Google Cloud SDK (if not already installed)

```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

### Step 2: Authenticate

```bash
gcloud auth login
gcloud config set project moshimoshi-471918
```

### Step 3: Enable Required APIs

```bash
# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Run API (required for Gen 2 functions)
gcloud services enable run.googleapis.com

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com
```

### Step 4: Deploy

```bash
cd /home/helye/DevProject/personal/Next-js/yt-player/cloud_function
./deploy.sh
```

That's it! The script will output your function URL.

---

## 🖱️ Manual Deploy (Option 2: Using Cloud Console)

### Step 1: Navigate to Cloud Functions

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `moshimoshi-471918`
3. Navigate to **Cloud Functions** (search in top bar)
4. Click **Create Function**

### Step 2: Configure Function

**Basics:**
- Environment: **2nd gen**
- Function name: `get-japanese-transcript`
- Region: `us-central1` (or your preferred region)

**Trigger:**
- Trigger type: **HTTPS**
- Authentication: **Allow unauthenticated invocations** ✅

**Runtime, build, connections and security settings:**
- Memory: `256 MB`
- Timeout: `60 seconds`
- Max instances: `10`

Click **Next**

### Step 3: Upload Code

**Runtime:** Python 3.11

**Entry point:** `get_japanese_transcript`

**Source code:** Inline editor

Copy the contents of:
- `main.py` → into `main.py` tab
- `requirements.txt` → into `requirements.txt` tab

Click **Deploy**

### Step 4: Get Function URL

After deployment completes:
1. Click on the function name
2. Go to **Trigger** tab
3. Copy the **Trigger URL**

---

## 📝 Configure Your Next.js App

### Step 1: Add URL to Environment Variables

Create or update `.env.local`:

```bash
GOOGLE_CLOUD_FUNCTION_URL=https://us-central1-moshimoshi-471918.cloudfunctions.net/get-japanese-transcript
```

Replace with your actual function URL from deployment.

### Step 2: Update API Route

The API route has been updated to use the Cloud Function when the environment variable is set.

---

## 🧪 Test Your Deployment

### Test via cURL

```bash
# Test with a video that has Japanese transcripts
curl "https://YOUR_FUNCTION_URL?videoId=dQw4w9WgXcQ"
```

### Test via Browser

Open in browser:
```
https://YOUR_FUNCTION_URL?videoId=dQw4w9WgXcQ
```

You should see a JSON response with transcript data.

---

## 💰 Pricing

**Google Cloud Functions (Gen 2) Pricing:**

### Free Tier (per month):
- 2 million invocations
- 400,000 GB-seconds of compute time
- 200,000 GHz-seconds of compute time
- 5 GB network egress

### After Free Tier:
- Invocations: $0.40 per million
- Compute time: $0.0000025 per GB-second
- Memory (256 MB): ~$0.000000375 per 100ms

**Estimated monthly cost for this function:**
- **Low usage** (1,000 requests/month): **FREE**
- **Medium usage** (10,000 requests/month): **FREE**
- **High usage** (100,000 requests/month): **FREE** (under free tier)
- **Very high usage** (1 million requests/month): **FREE** (under free tier)
- **Above 2 million/month**: ~$0.40 per additional million

**Most users will stay within the free tier.**

---

## 🔧 Monitoring & Logs

### View Logs

```bash
gcloud functions logs read get-japanese-transcript --region=us-central1 --limit=50
```

### View Metrics

1. Go to Cloud Console → Cloud Functions
2. Click on `get-japanese-transcript`
3. View **Metrics** tab for:
   - Invocations
   - Execution time
   - Memory usage
   - Error rate

---

## 🚨 Troubleshooting

### Error: "API not enabled"

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### Error: "Permission denied"

Ensure you have the Cloud Functions Admin role:
```bash
gcloud projects add-iam-policy-binding moshimoshi-471918 \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/cloudfunctions.admin"
```

### Error: "Deployment timeout"

Increase timeout in `deploy.sh`:
```bash
TIMEOUT="120s"
```

### Function returns 500 error

Check logs:
```bash
gcloud functions logs read get-japanese-transcript --region=us-central1
```

---

## 🔄 Update Function

To update after making changes:

```bash
cd /home/helye/DevProject/personal/Next-js/yt-player/cloud_function
./deploy.sh
```

Or manually redeploy via Cloud Console.

---

## 🗑️ Delete Function (if needed)

```bash
gcloud functions delete get-japanese-transcript --region=us-central1 --gen2
```

---

## ✅ Next Steps

1. Deploy the function using one of the methods above
2. Copy the function URL
3. Add URL to `.env.local`
4. Test locally: `npm run dev`
5. Deploy to Vercel: `vercel --prod`

Your YouTube player will now work seamlessly with Vercel! 🎉
