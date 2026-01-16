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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGMBLocations = getGMBLocations;
exports.createGMBPost = createGMBPost;
exports.replyToGMBReview = replyToGMBReview;
exports.createGMBLocation = createGMBLocation;
exports.generateWebsiteForLocation = generateWebsiteForLocation;
exports.updateLocationWebsite = updateLocationWebsite;
exports.getGMBReviews = getGMBReviews;
exports.savePostToFirestore = savePostToFirestore;
exports.updatePostStatus = updatePostStatus;
const googleapis_1 = require("googleapis");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
// Initialize API clients
const accountManagement = googleapis_1.google.mybusinessaccountmanagement('v1');
const businessInformation = googleapis_1.google.mybusinessbusinessinformation('v1');
async function getGMBLocations(accessToken) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    try {
        // 1. List Accounts using Account Management API
        const accountsResponse = await accountManagement.accounts.list({
            auth: oauth2Client
        });
        const locations = [];
        for (const account of accountsResponse.data.accounts || []) {
            // 2. List Locations using Business Information API
            const locationsResponse = await businessInformation.accounts.locations.list({
                auth: oauth2Client,
                parent: account.name,
                readMask: 'name,title,storefrontAddress,categories', // request specific fields
            });
            for (const location of locationsResponse.data.locations || []) {
                locations.push({
                    name: location.name || '',
                    locationName: location.title || '',
                    primaryCategory: location.categories?.primaryCategory?.displayName || '',
                    address: formatAddress(location.storefrontAddress),
                });
            }
        }
        return locations;
    }
    catch (error) {
        console.error('Failed to get GMB locations:', error);
        throw error;
    }
}
function formatAddress(address) {
    if (!address)
        return '';
    const parts = [
        address.addressLines?.join(', '),
        address.locality,
        address.administrativeArea,
        address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
}
async function createGMBPost(accessToken, locationName, content, imageUrl) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    try {
        const postBody = {
            languageCode: 'en',
            summary: content.substring(0, 1500), // GMB limit
            topicType: 'STANDARD',
        };
        if (imageUrl) {
            postBody.media = [
                {
                    mediaFormat: 'PHOTO',
                    sourceUrl: imageUrl,
                },
            ];
        }
        // Add call to action
        postBody.callToAction = {
            actionType: 'LEARN_MORE',
            url: 'https://example.com', // Should be doctor's website
        };
        // Use direct HTTP request since google.mybusiness('v4') is not available in newer library versions
        // Note: As of latest versions, Local Posts still often rely on the v4 endpoint structure or its replacement
        const response = await oauth2Client.request({
            url: `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
            method: 'POST',
            data: postBody,
        });
        const data = response.data;
        return {
            success: true,
            postName: data.name || undefined,
        };
    }
    catch (error) {
        console.error('Failed to create GMB post:', error);
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}
async function replyToGMBReview(accessToken, reviewName, replyText) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    try {
        // Use the new Google My Business Reviews API
        // reviewName format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
        await oauth2Client.request({
            url: `https://mybusinessreviews.googleapis.com/v1/${reviewName}/reply:update`,
            method: 'POST', // or PUT, but :update action usually uses POST
            data: {
                comment: replyText,
            },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Failed to reply to GMB review:', error);
        // Fallback or retry logic if needed
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}
// Logic for GMB Onboarding Automation
async function createGMBLocation(accessToken, doctorName, address, category) {
    // NOTE: Creating a location via API is complex and often requires verification. 
    // This is a simplified interface assuming the API allows creation or we are asserting a location.
    // In a real-world scenario, this might trigger a 'verification request' flow.
    // For this prototype, we will log and mock or attempt a creation call if configured.
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    // const mybusinessApi = google.mybusinessbusinessinformation('v1');
    try {
        // Mocking the creation request structure
        // const response = await mybusinessApi.accounts.locations.create({...});
        console.log(`[MOCK] Creating GMB Location for ${doctorName} at ${address}`);
        // Return a mock ID or handle real API call
        // If we strictly want to fail if not implemented:
        // throw new Error("GMB Location Creation API requires business verification flow.");
        return {
            success: true,
            locationName: `accounts/mock-account/locations/mock-location-${Date.now()}`
        };
    }
    catch (error) {
        console.error('Failed to create GMB location:', error);
        return { success: false, error: error.message };
    }
}
async function generateWebsiteForLocation(locationName, doctorName, specialty) {
    try {
        // Requirement: "website generator with a template given to the doctor... and put it on their page"
        // Implementation:
        // 1. Generate a Firebase Hosting URL based on Doctor ID or Location
        // 2. Or use GMB API to "publish" the GMB website if available.
        // We will assume we generate a hosted landing page on our platform
        const websiteUrl = `https://thc-ai.web.app/sites/${locationName.split('/').pop()}`; // Mock URL
        console.log(`[MOCK] Generated website for ${doctorName}: ${websiteUrl}`);
        return { success: true, websiteUrl };
    }
    catch (error) {
        console.error('Failed to generate website:', error);
        return { success: false, error: error.message };
    }
}
async function updateLocationWebsite(accessToken, locationName, websiteUrl) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    // const mybusinessApi = google.mybusinessbusinessinformation('v1');
    try {
        // Update the location's website URL
        // await mybusinessApi.locations.patch(...)
        console.log(`[MOCK] Updating GMB Location ${locationName} with website ${websiteUrl}`);
        return true;
    }
    catch (error) {
        console.error('Failed to update location website:', error);
        return false;
    }
}
async function getGMBReviews(accessToken, locationName) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    try {
        // Use the new Google My Business Reviews API
        const response = await oauth2Client.request({
            url: `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews?pageSize=50`,
            method: 'GET',
        });
        const data = response.data;
        return data.reviews || [];
    }
    catch (error) {
        console.error('Failed to get GMB reviews:', error);
        return [];
    }
}
async function savePostToFirestore(doctorId, post) {
    const postRef = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('posts')
        .add(post);
    return postRef.id;
}
async function updatePostStatus(doctorId, postId, status, error) {
    await db
        .collection('doctors')
        .doc(doctorId)
        .collection('posts')
        .doc(postId)
        .update({
        status,
        error: error || null,
        postedAt: status === 'posted' ? firestore_1.Timestamp.now() : null,
    });
}
//# sourceMappingURL=gmb.service.js.map