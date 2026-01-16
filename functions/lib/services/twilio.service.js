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
exports.sendWhatsAppMessage = sendWhatsAppMessage;
exports.sendAppointmentConfirmation = sendAppointmentConfirmation;
exports.sendAppointmentReminder = sendAppointmentReminder;
exports.parseWhatsAppWebhook = parseWhatsAppWebhook;
const twilio_1 = __importDefault(require("twilio"));
const functions = __importStar(require("firebase-functions"));
const accountSid = functions.config().twilio?.sid || process.env.TWILIO_ACCOUNT_SID;
const authToken = functions.config().twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = functions.config().twilio?.number || process.env.TWILIO_WHATSAPP_NUMBER;
const client = (0, twilio_1.default)(accountSid, authToken);
async function sendWhatsAppMessage(to, body) {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const message = await client.messages.create({
        body,
        from: whatsappNumber,
        to: formattedTo,
    });
    return message.sid;
}
async function sendAppointmentConfirmation(patientPhone, patientName, doctorName, appointmentTime, duration) {
    const formattedDate = appointmentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = appointmentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    const body = `✅ Appointment Confirmed!

Hi ${patientName},

Your appointment with ${doctorName} is scheduled for:
📅 ${formattedDate}
⏰ ${formattedTime}
⏱️ Duration: ${duration} minutes

Reply "CANCEL" to cancel or "RESCHEDULE" to change your appointment.

See you soon!`;
    return sendWhatsAppMessage(patientPhone, body);
}
async function sendAppointmentReminder(patientPhone, patientName, doctorName, appointmentTime) {
    const formattedTime = appointmentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    const body = `⏰ Appointment Reminder

Hi ${patientName},

This is a reminder for your appointment with ${doctorName} today at ${formattedTime}.

Please arrive 10 minutes early. Reply "CONFIRM" to confirm or "CANCEL" if you can't make it.

See you soon!`;
    return sendWhatsAppMessage(patientPhone, body);
}
function parseWhatsAppWebhook(body) {
    return {
        MessageSid: body.MessageSid,
        From: body.From,
        To: body.To,
        Body: body.Body,
        NumMedia: body.NumMedia,
        ProfileName: body.ProfileName,
    };
}
//# sourceMappingURL=twilio.service.js.map