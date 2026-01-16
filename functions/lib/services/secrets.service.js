"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecret = getSecret;
exports.createSecret = createSecret;
exports.deleteSecret = deleteSecret;
exports.secretExists = secretExists;
const secret_manager_1 = require("@google-cloud/secret-manager");
const client = new secret_manager_1.SecretManagerServiceClient();
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
async function getSecret(secretName) {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });
        const payload = version.payload?.data?.toString();
        if (!payload) {
            throw new Error(`Secret ${secretName} is empty`);
        }
        return payload;
    }
    catch (error) {
        console.error(`Failed to get secret ${secretName}:`, error);
        throw error;
    }
}
async function createSecret(secretName, value) {
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
    }
    catch (error) {
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
async function deleteSecret(secretName) {
    try {
        await client.deleteSecret({
            name: `projects/${projectId}/secrets/${secretName}`,
        });
    }
    catch (error) {
        if (!error.message?.includes('NOT_FOUND')) {
            throw error;
        }
    }
}
async function secretExists(secretName) {
    try {
        await client.getSecret({
            name: `projects/${projectId}/secrets/${secretName}`,
        });
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=secrets.service.js.map