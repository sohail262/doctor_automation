import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import { Post } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

// Initialize API clients
const accountManagement = google.mybusinessaccountmanagement('v1');
const businessInformation = google.mybusinessbusinessinformation('v1');

export interface GMBLocation {
    name: string;
    locationName: string;
    primaryCategory: string;
    address: string;
}

export async function getGMBLocations(accessToken: string): Promise<GMBLocation[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    try {
        // 1. List Accounts using Account Management API
        const accountsResponse = await accountManagement.accounts.list({
            auth: oauth2Client
        });

        const locations: GMBLocation[] = [];

        for (const account of accountsResponse.data.accounts || []) {
            // 2. List Locations using Business Information API
            const locationsResponse = await businessInformation.accounts.locations.list({
                auth: oauth2Client,
                parent: account.name!,
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
    } catch (error) {
        console.error('Failed to get GMB locations:', error);
        throw error;
    }
}

function formatAddress(address: any): string {
    if (!address) return '';
    const parts = [
        address.addressLines?.join(', '),
        address.locality,
        address.administrativeArea,
        address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
}

export async function createGMBPost(
    accessToken: string,
    locationName: string,
    content: string,
    imageUrl?: string | null
): Promise<{ success: boolean; postName?: string; error?: string }> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    try {
        const postBody: any = {
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

        const data: any = response.data;

        return {
            success: true,
            postName: data.name || undefined,
        };
    } catch (error: any) {
        console.error('Failed to create GMB post:', error);
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}

export async function replyToGMBReview(
    accessToken: string,
    reviewName: string,
    replyText: string
): Promise<{ success: boolean; error?: string }> {
    const oauth2Client = new google.auth.OAuth2();
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
    } catch (error: any) {
        console.error('Failed to reply to GMB review:', error);
        // Fallback or retry logic if needed
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}

// Logic for GMB Onboarding Automation
export async function createGMBLocation(
    accessToken: string,
    doctorName: string,
    address: string,
    category: string
): Promise<{ success: boolean; locationName?: string; error?: string }> {
    // NOTE: Creating a location via API is complex and often requires verification. 
    // This is a simplified interface assuming the API allows creation or we are asserting a location.

    // In a real-world scenario, this might trigger a 'verification request' flow.
    // For this prototype, we will log and mock or attempt a creation call if configured.

    const oauth2Client = new google.auth.OAuth2();
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

    } catch (error: any) {
        console.error('Failed to create GMB location:', error);
        return { success: false, error: error.message };
    }
}

export async function generateWebsiteForLocation(
    locationName: string,
    doctorName: string,
    specialty: string
): Promise<{ success: boolean; websiteUrl?: string; error?: string }> {
    try {
        // Requirement: "website generator with a template given to the doctor... and put it on their page"
        // Implementation:
        // 1. Generate a Firebase Hosting URL based on Doctor ID or Location
        // 2. Or use GMB API to "publish" the GMB website if available.

        // We will assume we generate a hosted landing page on our platform
        const websiteUrl = `https://thc-ai.web.app/sites/${locationName.split('/').pop()}`; // Mock URL

        console.log(`[MOCK] Generated website for ${doctorName}: ${websiteUrl}`);

        return { success: true, websiteUrl };

    } catch (error: any) {
        console.error('Failed to generate website:', error);
        return { success: false, error: error.message };
    }
}

export async function updateLocationWebsite(
    accessToken: string,
    locationName: string,
    websiteUrl: string
): Promise<boolean> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    // const mybusinessApi = google.mybusinessbusinessinformation('v1');

    try {
        // Update the location's website URL
        // await mybusinessApi.locations.patch(...)
        console.log(`[MOCK] Updating GMB Location ${locationName} with website ${websiteUrl}`);
        return true;
    } catch (error) {
        console.error('Failed to update location website:', error);

        return false;
    }
}

export async function getGMBReviews(
    accessToken: string,
    locationName: string
): Promise<any[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    try {
        // Use the new Google My Business Reviews API
        const response = await oauth2Client.request({
            url: `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews?pageSize=50`,
            method: 'GET',
        });

        const data: any = response.data;
        return data.reviews || [];
    } catch (error) {
        console.error('Failed to get GMB reviews:', error);
        return [];
    }
}

export async function savePostToFirestore(
    doctorId: string,
    post: Omit<Post, 'id'>
): Promise<string> {
    const postRef = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('posts')
        .add(post);

    return postRef.id;
}

export async function updatePostStatus(
    doctorId: string,
    postId: string,
    status: Post['status'],
    error?: string
): Promise<void> {
    await db
        .collection('doctors')
        .doc(doctorId)
        .collection('posts')
        .doc(postId)
        .update({
            status,
            error: error || null,
            postedAt: status === 'posted' ? Timestamp.now() : null,
        });
}
