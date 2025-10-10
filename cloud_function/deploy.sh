#!/bin/bash

# Deploy Japanese Transcript Fetcher to Google Cloud Functions
# Project: moshimoshi-471918

set -e

PROJECT_ID="moshimoshi-471918"
FUNCTION_NAME="get-japanese-transcript"
REGION="us-central1"  # Change to your preferred region
RUNTIME="python311"
ENTRY_POINT="get_japanese_transcript"
MEMORY="256MB"
TIMEOUT="60s"

echo "🚀 Deploying Japanese Transcript Cloud Function..."
echo "Project: $PROJECT_ID"
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📝 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Deploy the function
echo "☁️  Deploying to Google Cloud Functions..."
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=$RUNTIME \
  --region=$REGION \
  --source=. \
  --entry-point=$ENTRY_POINT \
  --trigger-http \
  --allow-unauthenticated \
  --memory=$MEMORY \
  --timeout=$TIMEOUT \
  --max-instances=10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function details:"
gcloud functions describe $FUNCTION_NAME --region=$REGION --gen2 --format="value(serviceConfig.uri)"

echo ""
echo "🔗 Your function URL:"
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --gen2 --format="value(serviceConfig.uri)")
echo "$FUNCTION_URL"

echo ""
echo "📝 Add this to your .env.local file:"
echo "GOOGLE_CLOUD_FUNCTION_URL=$FUNCTION_URL"

echo ""
echo "🧪 Test with:"
echo "curl \"$FUNCTION_URL?videoId=dQw4w9WgXcQ\""
