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
exports.logger = void 0;
exports.log = log;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
async function log(doctorId, type, action, message, metadata) {
    try {
        const logEntry = {
            doctorId,
            type,
            action,
            message,
            metadata,
            createdAt: firestore_1.Timestamp.now(),
        };
        await db.collection('logs').doc(doctorId).collection('entries').add(logEntry);
        console.log(`[${type.toUpperCase()}] ${action}: ${message}`);
    }
    catch (error) {
        console.error('Failed to write log:', error);
    }
}
exports.logger = {
    info: (doctorId, action, message, metadata) => log(doctorId, 'info', action, message, metadata),
    success: (doctorId, action, message, metadata) => log(doctorId, 'success', action, message, metadata),
    warning: (doctorId, action, message, metadata) => log(doctorId, 'warning', action, message, metadata),
    error: (doctorId, action, message, metadata) => log(doctorId, 'error', action, message, metadata),
};
//# sourceMappingURL=logger.js.map