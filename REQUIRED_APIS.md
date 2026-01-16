# Required Google Cloud APIs

To ensure your doctor automation system runs correctly, you must enable the following APIs in your Google Cloud Project (the one linked to Firebase).

## 1. Core Firebase & Infrastructure
These are usually enabled automatically when you use Firebase, but good to verify.
*   **Cloud Functions API** (`cloudfunctions.googleapis.com`): Required to deploy and run the backend functions.
*   **Cloud Firestore API** (`firestore.googleapis.com`): The database for doctors, appointments, and logs.
*   **Cloud Pub/Sub API** (`pubsub.googleapis.com`): Critical for the background triggers (`batchPoster`, `socialPoster`, `reviewQueue`, `reminder-trigger`).
*   **Cloud Build API** (`cloudbuild.googleapis.com`): Required to deploy the functions.
*   **Cloud Logging API** (`logging.googleapis.com`): For the logger utilities to work.

## 2. AI & Machine Learning
*   **Vertex AI API** (`aiplatform.googleapis.com`): **CRITICAL**. This is used by `gemini.service.ts` to generate images (`imagegeneration@005`).

## 3. Google Business Profile (formerly GMB)
*   **Google My Business API**: You need to enable the specific GMB APIs. Note: These are often "Private" and might require manual enabling or access requests.
    *   *Google My Business Account Management API*
    *   *Google My Business Lodging API* (if applicable)
    *   *Google My Business Place Actions API*
    *   *Google My Business Verifications API*
    *   *Google My Business Business Information API*
    *   *Google My Business Q&A API*
    
    *Note: For testing mock implementations, you don't strictly need these enabled, but for the real `googleapis` calls to succeed, they are required.*

## 4. How to Enable
1.  Go to the [Google Cloud Console API Library](https://console.cloud.google.com/apis/library).
2.  Select your project from the top dropdown.
3.  Search for each API name listed above.
4.  Click **Enable**.

## Quick Check Command
If you have the `gcloud` CLI installed, you can list enabled services:
```bash
gcloud services list --enabled
```
