const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send an SMS via Twilio
 * @param {string} to - Recipient phone number (E.164 format, e.g. +919876543210)
 * @param {string} message - SMS body text
 */
const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`SMS sent to ${to}: ${result.sid}`);
    return result;
  } catch (error) {
    
    console.error(`SMS failed to ${to}:`, error.message);
    console.error("FULL ERROR:", error);
    // Don't throw — SMS failure should not crash the app
    return null;
  }
};

module.exports = { sendSMS };