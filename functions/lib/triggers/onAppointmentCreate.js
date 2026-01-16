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
exports.onAppointmentCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../utils/logger");
const twilio_service_1 = require("../services/twilio.service");
const db = admin.firestore();
exports.onAppointmentCreate = functions.firestore
    .document('doctors/{doctorId}/appointments/{appointmentId}')
    .onCreate(async (snap, context) => {
    const { doctorId, appointmentId } = context.params;
    const appointment = snap.data();
    console.log(`New appointment created: ${appointmentId} for doctor ${doctorId}`);
    try {
        // Get doctor info
        const doctorDoc = await db.collection('doctors').doc(doctorId).get();
        const doctor = doctorDoc.data();
        if (!doctor) {
            throw new Error('Doctor not found');
        }
        // Send confirmation via WhatsApp if enabled
        if (doctor.whatsappConfig?.enabled && appointment.patientPhone) {
            try {
                await (0, twilio_service_1.sendAppointmentConfirmation)(appointment.patientPhone, appointment.patientName, doctor.name, appointment.appointmentTime.toDate(), appointment.duration);
                await logger_1.logger.success(doctorId, 'APPOINTMENT_CONFIRMATION', `Confirmation sent to ${appointment.patientName} for ${appointment.appointmentTime.toDate().toLocaleString()}`);
            }
            catch (whatsappError) {
                await logger_1.logger.warning(doctorId, 'APPOINTMENT_CONFIRMATION_FAILED', `Failed to send WhatsApp confirmation: ${whatsappError.message}`);
            }
        }
        // Log the appointment creation
        await logger_1.logger.info(doctorId, 'APPOINTMENT_CREATED', `New appointment: ${appointment.patientName} on ${appointment.appointmentTime.toDate().toLocaleString()}`, {
            appointmentId,
            patientName: appointment.patientName,
            source: appointment.source,
        });
        return { success: true };
    }
    catch (error) {
        console.error(`Failed to process appointment ${appointmentId}:`, error);
        await logger_1.logger.error(doctorId, 'APPOINTMENT_ERROR', `Failed to process appointment: ${error.message}`);
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=onAppointmentCreate.js.map