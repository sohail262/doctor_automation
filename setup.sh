#!/bin/bash
set -e

echo "🚀 Doctor Automation SaaS Setup"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found.${NC}"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Installing Firebase CLI...${NC}"
    npm install -g firebase-tools
fi

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}gcloud CLI not found. Install from https://cloud.google.com/sdk${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# Login to Firebase
echo -e "${YELLOW}Logging into Firebase...${NC}"
firebase login

# Login to GCP
echo -e "${YELLOW}Logging into GCP...${NC}"
gcloud auth login

# Get project ID
echo -e "${YELLOW}Enter your GCP/Firebase Project ID:${NC}"
read PROJECT_ID

# Set project
gcloud config set project $PROJECT_ID
firebase use $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling GCP APIs...${NC}"
gcloud services enable \
    cloudfunctions.googleapis.com \
    cloudscheduler.googleapis.com \
    pubsub.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    cloudbuild.googleapis.com \
    mybusinessbusinessinformation.googleapis.com \
    calendar-json.googleapis.com \
    drive.googleapis.com

echo -e "${GREEN}✓ APIs enabled${NC}"

# Create Pub/Sub topics
echo -e "${YELLOW}Creating Pub/Sub topics...${NC}"
gcloud pubsub topics create post-trigger --project=$PROJECT_ID 2>/dev/null || echo "Topic exists"
gcloud pubsub topics create social-trigger --project=$PROJECT_ID 2>/dev/null || echo "Topic exists"
gcloud pubsub topics create reminder-trigger --project=$PROJECT_ID 2>/dev/null || echo "Topic exists"
gcloud pubsub topics create review-trigger --project=$PROJECT_ID 2>/dev/null || echo "Topic exists"

echo -e "${GREEN}✓ Pub/Sub topics created${NC}"

# Create Cloud Scheduler jobs
echo -e "${YELLOW}Creating Cloud Scheduler jobs...${NC}"

# Daily GMB posts at 9 AM
gcloud scheduler jobs create pubsub daily-gmb-posts \
    --schedule="0 9 * * *" \
    --topic=post-trigger \
    --message-body='{"type":"gmb"}' \
    --location=us-central1 \
    --project=$PROJECT_ID 2>/dev/null || echo "Job exists"

# Daily social posts at 10 AM
gcloud scheduler jobs create pubsub daily-social-posts \
    --schedule="0 10 * * *" \
    --topic=social-trigger \
    --message-body='{"type":"social"}' \
    --location=us-central1 \
    --project=$PROJECT_ID 2>/dev/null || echo "Job exists"

# Hourly reminders
gcloud scheduler jobs create pubsub hourly-reminders \
    --schedule="0 * * * *" \
    --topic=reminder-trigger \
    --message-body='{"type":"reminder"}' \
    --location=us-central1 \
    --project=$PROJECT_ID 2>/dev/null || echo "Job exists"

echo -e "${GREEN}✓ Scheduler jobs created${NC}"

# Install dashboard dependencies
echo -e "${YELLOW}Installing dashboard dependencies...${NC}"
cd dashboard
npm install
cd ..

# Install functions dependencies
echo -e "${YELLOW}Installing functions dependencies...${NC}"
cd functions
npm install
cd ..

# Setup environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Created .env file. Please edit with your API keys.${NC}"
fi

# Update .firebaserc
echo "{\"projects\":{\"default\":\"$PROJECT_ID\"}}" > .firebaserc

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env with your API keys"
echo "2. Edit dashboard/src/config/firebase.config.ts with Firebase config"
echo "3. Run: ./deploy.sh"
echo ""