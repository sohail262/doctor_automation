#!/bin/bash
set -e

echo "🚀 Deploying Doctor Automation SaaS"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set Firebase config
echo -e "${YELLOW}Setting Firebase config...${NC}"
firebase functions:config:set \
    openai.key="$OPENAI_API_KEY" \
    twilio.sid="$TWILIO_ACCOUNT_SID" \
    twilio.token="$TWILIO_AUTH_TOKEN" \
    twilio.number="$TWILIO_WHATSAPP_NUMBER" \
    replicate.token="$REPLICATE_API_TOKEN" \
    google.client_id="$GOOGLE_CLIENT_ID" \
    google.client_secret="$GOOGLE_CLIENT_SECRET"

# Build dashboard
echo -e "${YELLOW}Building dashboard...${NC}"
cd dashboard
npm run build
cd ..

# Build functions
echo -e "${YELLOW}Building functions...${NC}"
cd functions
npm run build
cd ..

# Deploy everything
echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "URLs:"
echo "- Dashboard: https://$GCP_PROJECT_ID.web.app"
echo "- Functions: https://us-central1-$GCP_PROJECT_ID.cloudfunctions.net"
echo ""