"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
exports.generateImageFromTopic = generateImageFromTopic;
const functions = __importStar(require("firebase-functions"));
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importDefault(require("axios"));
// Ensure you enable the Vertex AI API in your Google Cloud Project
const PROJECT_ID = process.env.GCLOUD_PROJECT || functions.config().google?.project_id;
const LOCATION = 'us-central1'; // Imagen is available here
const API_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagegeneration@005:predict`;
async function generateImage(prompt) {
    try {
        if (!PROJECT_ID) {
            console.error('Project ID not set');
            return null;
        }
        const auth = new google_auth_library_1.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        const enhancedPrompt = `Professional medical/healthcare themed image: ${prompt}. 
Clean, modern, trustworthy aesthetic. No text overlays. High quality. Photorealistic.`;
        const requestBody = {
            instances: [
                {
                    prompt: enhancedPrompt
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1"
            }
        };
        const response = await axios_1.default.post(API_ENDPOINT, requestBody, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            }
        });
        const predictions = response.data.predictions;
        if (predictions && predictions.length > 0) {
            // Vertex AI returns Base64 encoded image
            const base64Image = predictions[0].bytesBase64Encoded;
            // In a real app, you would upload this buffer to Firebase Storage and return the URL.
            // For now, we'll return a data URI or we can mock the storage upload.
            return `data:image/png;base64,${base64Image}`;
        }
        return null;
    }
    catch (error) {
        console.error('Gemini/Imagen Image Generation failed:', error.response?.data || error.message);
        return null;
    }
}
async function generateImageFromTopic(topic, specialty) {
    const prompt = `${specialty} healthcare professional concept about ${topic}. 
    Modern clinic setting, warm lighting, professional atmosphere.`;
    return generateImage(prompt);
}
//# sourceMappingURL=gemini.service.js.map