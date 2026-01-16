import { SecretManagerServiceClient } from '@google-cloud/secret-manager';


const client = new SecretManagerServiceClient();
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;

export async function getSecret(secretName: string): Promise<string> {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });

        const payload = version.payload?.data?.toString();
        if (!payload) {
            throw new Error(`Secret ${secretName} is empty`);
        }

        return payload;
    } catch (error) {
        console.error(`Failed to get secret ${secretName}:`, error);
        throw error;
    }
}

export async function createSecret(
    secretName: string,
    value: string
): Promise<void> {
    try {
        // Try to create the secret
        await client.createSecret({
            parent: `projects/${projectId}`,
            secretId: secretName,
            secret: {
                replication: {
                    automatic: {},
                },
            },
        });
    } catch (error: any) {
        // Secret might already exist, which is fine
        if (!error.message?.includes('ALREADY_EXISTS')) {
            throw error;
        }
    }

    // Add a new version with the value
    await client.addSecretVersion({
        parent: `projects/${projectId}/secrets/${secretName}`,
        payload: {
            data: Buffer.from(value, 'utf8'),
        },
    });
}

export async function deleteSecret(secretName: string): Promise<void> {
    try {
        await client.deleteSecret({
            name: `projects/${projectId}/secrets/${secretName}`,
        });
    } catch (error: any) {
        if (!error.message?.includes('NOT_FOUND')) {
            throw error;
        }
    }
}

export async function secretExists(secretName: string): Promise<boolean> {
    try {
        await client.getSecret({
            name: `projects/${projectId}/secrets/${secretName}`,
        });
        return true;
    } catch {
        return false;
    }
}