import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import { Doctor, Post } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

// Google My Business API setup
const mybusiness = google.mybusinessbusinessinformation('v1');

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
        const accounts = await mybusiness.accounts.list({ auth: oauth2Client });
        const locations: GMBLocation[] = [];

        for (const account of accounts.data.accounts || []) {
            const locationsResponse = await mybusiness.accounts.locations.list({
                auth: oauth2Client,
                parent: account.name!,
            });

            for (const location of locationsResponse.data.locations || []) {
                locations.push({
                    name: location.name || '',
                    locationName: location.title || '',
                    primaryCategory: location.primaryCategory?.displayName || '',
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
        // Using the My Business API for local posts
        const mybusinessApi = google.mybusiness('v4');

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

        const response = await mybusinessApi.accounts.locations.localPosts.create({
            auth: oauth2Client,
            parent: locationName,
            requestBody: postBody,
        });

        return {
            success: true,
            postName: response.data.name || undefined,
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
        const mybusinessApi = google.mybusiness('v4');

        await mybusinessApi.accounts.locations.reviews.updateReply({
            auth: oauth2Client,
            name: `${reviewName}/reply`,
            requestBody: {
                comment: replyText,
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error('Failed to reply to GMB review:', error);
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}

export async function getGMBReviews(
    accessToken: string,
    locationName: string
): Promise<any[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    try {
        const mybusinessApi = google.mybusiness('v4');

        const response = await mybusinessApi.accounts.locations.reviews.list({
            auth: oauth2Client,
            parent: locationName,
            pageSize: 50,
        });

        return response.data.reviews || [];
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