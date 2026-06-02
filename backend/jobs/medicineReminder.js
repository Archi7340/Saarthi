const cron = require("node-cron");
const MedicineSchedule = require("../models/MedicineSchedule");
const User = require("../models/User");
const { sendSMS } = require("../utils/twilio");

/**
 * Gets today's date string "YYYY-MM-DD"
 */
const getTodayStr = () => new Date().toISOString().split("T")[0];

/**
 * Gets current time string "HH:MM"
 */
const getCurrentTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

/**
 * CRON 1: Runs every minute — checks if any medicine is due right now
 * Emits socket reminder to elderly user
 */
const startMedicineReminderJob = (io) => {
  cron.schedule("* * * * *", async () => {
    const currentTime = getCurrentTimeStr();
    const todayStr = getTodayStr();

    try {
      // Find all active schedules that have a time matching current time
      const schedules = await MedicineSchedule.find({
        isActive: true,
        times: currentTime,
      }).populate("elderlyId", "name phone");

      for (const schedule of schedules) {
        // Check if already acknowledged for this time today
        const alreadyAcked = schedule.acknowledgements.some(
          (a) =>
            a.scheduledTime === currentTime &&
            a.scheduledDate === todayStr &&
            a.takenAt !== null
        );

        if (alreadyAcked) continue;

        // Check if reminder already exists (don't double-fire)
        const reminderExists = schedule.acknowledgements.some(
          (a) => a.scheduledTime === currentTime && a.scheduledDate === todayStr
        );

        if (!reminderExists) {
          // Add pending acknowledgement record
          schedule.acknowledgements.push({
            scheduledTime: currentTime,
            scheduledDate: todayStr,
            takenAt: null,
            missed: false,
          });
          await schedule.save();
        }

        // Emit in-app reminder to elderly user
        io.to(`elderly-${schedule.elderlyId._id}`).emit("med:reminder", {
          scheduleId: schedule._id,
          medicineName: schedule.medicineName,
          dosage: schedule.dosage,
          scheduledTime: currentTime,
          scheduledDate: todayStr,
        });

        console.log(
          `Medicine reminder sent to ${schedule.elderlyId.name} for ${schedule.medicineName} at ${currentTime}`
        );
      }
    } catch (err) {
      console.error("Medicine reminder job error:", err.message);
    }
  });

  /**
   * CRON 2: Runs every minute — checks for missed medicines (15+ min after scheduled time)
   * Escalation chain: SMS to elderly → notify family via socket + SMS
   */
  cron.schedule("* * * * *", async () => {
    const todayStr = getTodayStr();
    const now = new Date();

    try {
      const schedules = await MedicineSchedule.find({
        isActive: true,
      }).populate("elderlyId", "name phone");

      for (const schedule of schedules) {
        for (const ack of schedule.acknowledgements) {
          if (
            ack.scheduledDate !== todayStr ||
            ack.takenAt !== null ||
            ack.missed === true
          ) {
            continue;
          }

          // Parse scheduled datetime
          const [hours, minutes] = ack.scheduledTime.split(":").map(Number);
          const scheduledDateTime = new Date();
          scheduledDateTime.setHours(hours, minutes, 0, 0);

          const minsElapsed = (now - scheduledDateTime) / 1000 / 60;

          // First escalation at 15 minutes — SMS to elderly
          if (minsElapsed >= 5 && !ack.smsSentToElderly) {
            ack.smsSentToElderly = true;

            await sendSMS(
              schedule.elderlyId.phone,
              `💊 Saarthi Reminder: Please take your ${schedule.medicineName} (${schedule.dosage}). It was due at ${ack.scheduledTime}.`
            );

            console.log(
              `SMS reminder sent to elderly ${schedule.elderlyId.name} for missed ${schedule.medicineName}`
            );
          }

          // Second escalation at 30 minutes — notify family
          if (minsElapsed >= 10 && !ack.familyNotified) {
            ack.missed = true;
            ack.familyNotified = true;

            // Get family members
            const familyMembers = await User.find({
              role: "family",
              linkedElderlyId: schedule.elderlyId._id,
            });

            for (const member of familyMembers) {
              // Socket notification
              io.to(`family-${member._id}`).emit("med:missed", {
                scheduleId: schedule._id,
                medicineName: schedule.medicineName,
                dosage: schedule.dosage,
                scheduledTime: ack.scheduledTime,
                elderlyName: schedule.elderlyId.name,
                elderlyId: schedule.elderlyId._id,
              });

              // SMS to family
              await sendSMS(
                member.phone,
                `⚠️ Saarthi Alert: ${schedule.elderlyId.name} has missed their ${schedule.medicineName} (${schedule.dosage}) scheduled at ${ack.scheduledTime}. Please check on them.`
              );
            }

            console.log(
              `Family notified about missed medicine: ${schedule.medicineName} for ${schedule.elderlyId.name}`
            );
          }
        }

        await schedule.save();
      }
    } catch (err) {
      console.error("Medicine escalation job error:", err.message);
    }
  });

  console.log("Medicine reminder cron jobs started");
};

module.exports = { startMedicineReminderJob };