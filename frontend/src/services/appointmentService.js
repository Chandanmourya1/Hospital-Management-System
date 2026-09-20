import api from './api';

/**
 * Fetch real-time available time slots for a doctor on a specific date (YYYY-MM-DD)
 */
export const getAvailableSlots = async (doctorId, date) => {
  const response = await api.get('/appointments/available-slots', {
    params: { doctorId, date },
  });
  return response.data;
};

/**
 * Book a new consultation appointment
 */
export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

/**
 * Get appointments list with optional query params (doctor, patient, status, date, search, page)
 */
export const getAllAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

/**
 * Get logged-in patient's appointment records
 */
export const getMyPatientAppointments = async () => {
  const response = await api.get('/appointments/my-appointments');
  return response.data;
};

/**
 * Get logged-in doctor's clinical consultation queue/schedule
 */
export const getDoctorSchedule = async (params = {}) => {
  const response = await api.get('/appointments/doctor-schedule', { params });
  return response.data;
};

/**
 * Get single appointment details by ID
 */
export const getAppointmentById = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

/**
 * Reschedule an existing appointment to a new date and time slot
 */
export const rescheduleAppointment = async (id, rescheduleData) => {
  const response = await api.put(`/appointments/${id}/reschedule`, rescheduleData);
  return response.data;
};

/**
 * Cancel an appointment with a given reason
 */
export const cancelAppointment = async (id, cancellationReason) => {
  const response = await api.put(`/appointments/${id}/cancel`, { cancellationReason });
  return response.data;
};

/**
 * Update consultation lifecycle status (Confirmed, Completed, No Show) and notes
 */
export const updateAppointmentStatus = async (id, status, consultationNotes = '') => {
  const response = await api.put(`/appointments/${id}/status`, {
    status,
    consultationNotes,
  });
  return response.data;
};

/**
 * Trigger an automated reminder notification/email
 */
export const sendAppointmentReminder = async (id) => {
  const response = await api.post(`/appointments/${id}/reminder`);
  return response.data;
};
