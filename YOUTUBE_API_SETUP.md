# 🔑 YouTube Data API v3 Setup Guide

The current API key in your `.env.local` file is not working. Here's how to get a valid one:

## Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

## Step 2: Create or Select a Project
1. Click on the project dropdown at the top
2. Either select an existing project or click "New Project"
3. If creating new: Enter project name and click "Create"

## Step 3: Enable YouTube Data API v3
1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on "YouTube Data API v3"
4. Click the **"Enable"** button

## Step 4: Create API Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **"+ Create Credentials"** > **"API Key"**
3. Copy the generated API key
4. (Optional) Click "Restrict Key" to limit usage for security

## Step 5: Update Your .env.local File
Replace the current API key in `/home/helye/DevProject/personal/next-js/.env.local`:

```bash
# Replace this line:
YOUTUBE_API_KEY=AIzaSyDfETlyCtkm_-iM8p7G3fCaVqK4bu1wjsg

# With your new API key:
YOUTUBE_API_KEY=your_new_api_key_here
```

## Step 6: Restart Development Server
After updating the API key:
```bash
npm run dev
```

## 🔒 Security Best Practices
1. **Restrict your API key** in Google Cloud Console:
   - HTTP referrers (for web)
   - IP addresses (for server)
   - APIs (only YouTube Data API v3)

2. **Monitor usage** in the Google Cloud Console to avoid unexpected charges

## 📊 API Quotas
- **Free tier**: 10,000 units per day
- **Cost per unit**: Varies by operation type
- **Typical video details request**: ~1-5 units

## ❓ Troubleshooting
If you still get API errors:
1. Make sure the API key is exactly copied (no extra spaces)
2. Ensure YouTube Data API v3 is enabled
3. Check quotas in Google Cloud Console
4. Wait a few minutes for changes to propagate

## 🎯 Alternative: Disable API Features
If you don't want to set up the API, the YouTube player will still work without the rich metadata features. Just remove or comment out the VideoMetadata component from the main page.