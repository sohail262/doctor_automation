# Testing Setup Guide for Doctor Automation System

This guide walks you through setting up the necessary accounts and credentials to test your automation system. Most services offer free tiers or trial credits.

## 1. Firebase & Google Cloud (Core Infrastructure)
*Used for: Database, Cloud Functions, and Gemini (Vertex AI)*

1.  **Create a Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Upgrade to Blaze Plan**:
    *   Click "Upgrade" in the bottom left.
    *   Select the **Blaze (Pay as you go)** plan.
    *   *Note*: This is required for Cloud Functions and external network requests. However, you get a generous free tier (e.g., 2M invocations/month). set a budget alert (e.g., $1) to avoid surprises.
3.  **Enable Vertex AI (for Gemini)**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/) (select your Firebase project).
    *   Search for **"Vertex AI API"** and click **Enable**.
    *   *Cost*: New accounts often get $300 in free credits for 90 days.
4.  **Enable Pub/Sub**:
    *   Search for **"Cloud Pub/Sub API"** in GCP Console and enable it.

## 2. OpenAI (Text Generation)
*Used for: Writing posts, generating replies, and parsing WhatsApp intent*

1.  **Sign Up**: Go to [platform.openai.com](https://platform.openai.com/).
2.  **API Key**:
    *   Click on **API Keys** in the sidebar.
    *   Click **Create new secret key**.
    *   Copy this key immediately directly into your `.env` file as `OPENAI_API_KEY`.
3.  *Note*: OpenAI usually requires a small pre-payment (e.g., $5) to activate API access if you don't have free trial credits.

## 3. Twilio (WhatsApp Automation)
*Used for: Sending/Receiving WhatsApp messages for bookings*

1.  **Sign Up**: Go to [Twilio.com](https://www.twilio.com/try-twilio) and sign up for a free trial.
2.  **Get Credentials**:
    *   On your Dashboard, find your **Account SID** and **Auth Token**.
3.  **WhatsApp Sandbox (Crucial for Free Testing)**:
    *   Go to **Messaging** > **Try it out** > **Send a WhatsApp message**.
    *   Follow the instructions to join the sandbox by sending a code (e.g., `join something-something`) to the provided Twilio number.
    *   Use this Sandbox Number as `TWILIO_WHATSAPP_NUMBER` in your `.env`.
    *   *Limitation*: In trial/sandbox mode, you can only message verified numbers (numbers that have sent the join code).

## 4. Google My Business (GMB)
*Used for: Posting updates and replying to reviews*

*Note: GMB API access is restricted and requires a review process for public apps. For testing, we use the "Mock" logic implemented in the code, or you can set up personal credentials.*

1.  **Create Credentials**:
    *   In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), go to **APIs & Services** > **Credentials**.
    *   Click **Create Credentials** > **OAuth client ID**.
    *   Application type: **Web application**.
    *   Authorized redirect URIs: `https://developers.google.com/oauthplayground` (useful for getting a test token).
2.  **Get Access Token (For Development)**:
    *   Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
    *   Select **Google My Business API** scopes.
    *   Exchange authorization code for tokens.
    *   Use the `Access Token` temporarily in your code or database for testing.

## 5. Local Environment Configuration

1.  **Rename File**: Rename `.env.example` to `.env` in `thc_automation/doctor_automation/functions/`.
2.  **Fill Details**:
    ```properties
    OPENAI_API_KEY=sk-...               # From Step 2
    TWILIO_ACCOUNT_SID=AC...            # From Step 3
    TWILIO_AUTH_TOKEN=...               # From Step 3
    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # From Step 3 (Sandbox)
    
    GOOGLE_CLIENT_ID=...                # From Step 4
    GOOGLE_CLIENT_SECRET=...            # From Step 4
    
    GCLOUD_PROJECT=your-project-id      # Your Firebase Project ID
    SYSTEM_GMB_TOKEN=...                # Optional: Temporary Access Token from Step 4
    ```

## 6. How to Run Locally

1.  **Install Dependencies**:
    ```bash
    cd functions
    npm install
    ```
2.  **Run Emulators**:
    ```bash
    npm run serve
    ```
    This spins up a local instance of Firestore and your Functions. You can trigger them manually via the Firebase Emulator UI (usually at `localhost:4000`).
