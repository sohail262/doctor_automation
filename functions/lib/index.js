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
exports.generatePreview = exports.handleWhatsApp = exports.sendReminders = exports.socialPoster = exports.batchPoster = exports.onAppointmentCreate = exports.onDoctorCreate = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Firestore Triggers
var onDoctorCreate_1 = require("./triggers/onDoctorCreate");
Object.defineProperty(exports, "onDoctorCreate", { enumerable: true, get: function () { return onDoctorCreate_1.onDoctorCreate; } });
var onAppointmentCreate_1 = require("./triggers/onAppointmentCreate");
Object.defineProperty(exports, "onAppointmentCreate", { enumerable: true, get: function () { return onAppointmentCreate_1.onAppointmentCreate; } });
// Scheduled Functions (Pub/Sub)
var batchPoster_1 = require("./scheduled/batchPoster");
Object.defineProperty(exports, "batchPoster", { enumerable: true, get: function () { return batchPoster_1.batchPoster; } });
var socialPoster_1 = require("./scheduled/socialPoster");
Object.defineProperty(exports, "socialPoster", { enumerable: true, get: function () { return socialPoster_1.socialPoster; } });
var sendReminders_1 = require("./scheduled/sendReminders");
Object.defineProperty(exports, "sendReminders", { enumerable: true, get: function () { return sendReminders_1.sendReminders; } });
// HTTP Functions
var handleWhatsApp_1 = require("./http/handleWhatsApp");
Object.defineProperty(exports, "handleWhatsApp", { enumerable: true, get: function () { return handleWhatsApp_1.handleWhatsApp; } });
var generatePreview_1 = require("./http/generatePreview");
Object.defineProperty(exports, "generatePreview", { enumerable: true, get: function () { return generatePreview_1.generatePreview; } });
//# sourceMappingURL=index.js.map