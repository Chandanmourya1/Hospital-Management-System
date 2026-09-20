import Appointment from '../models/Appointment.js';

/**
 * Generate 30/15/45-min discrete intervals between HH:MM and HH:MM
 */
export const generateTimeIntervals = (startTime, endTime, durationMinutes = 30) => {
  const intervals = [];

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const totalEndMinutes = endHour * 60 + endMin;

  const pad = (num) => String(num).padStart(2, '0');

  while (currentMinutes + durationMinutes <= totalEndMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;

    const nextMinutes = currentMinutes + durationMinutes;
    const slotEndHour = Math.floor(nextMinutes / 60);
    const slotEndMin = nextMinutes % 60;

    const startFormatted = `${pad(slotStartHour)}:${pad(slotStartMin)}`;
    const endFormatted = `${pad(slotEndHour)}:${pad(slotEndMin)}`;

    intervals.push({
      timeSlot: `${startFormatted} - ${endFormatted}`,
      startTime: startFormatted,
      endTime: endFormatted,
    });

    currentMinutes = nextMinutes;
  }

  return intervals;
};

/**
 * Computes available and booked slots for a doctor on a specific date
 * @param {Object} doctorProfile - Mongoose DoctorProfile document
 * @param {Date|string} targetDate - The appointment date
 * @returns {Promise<Object>}
 */
export const calculateDoctorSlots = async (doctorProfile, targetDate) => {
  const dateObj = new Date(targetDate);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[dateObj.getUTCDay()];

  // Check if doctor's overall status is On Leave or Offline
  if (doctorProfile.availabilityStatus === 'On Leave') {
    return {
      available: false,
      reason: 'Doctor is currently on clinical leave.',
      slots: [],
    };
  }

  if (doctorProfile.availabilityStatus === 'Offline') {
    return {
      available: false,
      reason: 'Doctor is offline and not accepting consultations at this time.',
      slots: [],
    };
  }

  // Look for day in doctor's weeklySchedule
  const scheduleSlot = doctorProfile.weeklySchedule?.find((s) => s.day === dayName);

  if (!scheduleSlot || !scheduleSlot.isAvailable) {
    return {
      available: false,
      reason: `Dr. is not on consulting duty on ${dayName}s.`,
      slots: [],
    };
  }

  const startTime = scheduleSlot.startTime || doctorProfile.workingHours?.start || '09:00';
  const endTime = scheduleSlot.endTime || doctorProfile.workingHours?.end || '17:00';
  const duration = doctorProfile.slotDurationMinutes || 30;

  const intervals = generateTimeIntervals(startTime, endTime, duration);

  // Query booked appointments on this date
  const startOfDay = new Date(dateObj);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorProfile.user,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'Cancelled' },
  }).select('timeSlot appointmentId status');

  const bookedSlotStrings = new Set(bookedAppointments.map((a) => a.timeSlot));

  const enrichedSlots = intervals.map((interval) => {
    const isBooked = bookedSlotStrings.has(interval.timeSlot);
    return {
      ...interval,
      isAvailable: !isBooked,
      isBooked,
    };
  });

  return {
    available: true,
    dayName,
    shiftHours: `${startTime} - ${endTime}`,
    slotDurationMinutes: duration,
    maxPatients: scheduleSlot.maxPatients || 20,
    totalSlots: enrichedSlots.length,
    availableSlotsCount: enrichedSlots.filter((s) => s.isAvailable).length,
    slots: enrichedSlots,
  };
};
