import api from './api';

/**
 * Register a new OPD visit / walk-in check-in with vitals
 */
export const registerOpdVisit = async (visitData) => {
  const response = await api.post('/opd/register', visitData);
  return response.data;
};

/**
 * Get live OPD consultation queue for a doctor or department
 */
export const getOpdQueue = async (params = {}) => {
  const response = await api.get('/opd/queue', { params });
  return response.data;
};

/**
 * Get master list of all OPD visits with filters and search
 */
export const getAllOpdVisits = async (params = {}) => {
  const response = await api.get('/opd/visits', { params });
  return response.data;
};

/**
 * Get single OPD visit record with populated vitals, medical history, and prescription
 */
export const getOpdVisitById = async (id) => {
  const response = await api.get(`/opd/visits/${id}`);
  return response.data;
};

/**
 * Get outpatient visit history for a specific patient
 */
export const getPatientVisitHistory = async (patientId) => {
  const response = await api.get(`/opd/patient/${patientId}/history`);
  return response.data;
};

/**
 * Update vital signs during triage
 */
export const updateVitals = async (id, vitals) => {
  const response = await api.put(`/opd/visits/${id}/vitals`, { vitals });
  return response.data;
};

/**
 * Complete doctor consultation: records diagnosis, examination, issues prescription
 */
export const completeConsultation = async (id, consultationData) => {
  const response = await api.post(`/opd/visits/${id}/consultation`, consultationData);
  return response.data;
};

/**
 * 1-Click schedule of recommended follow-up appointment
 */
export const scheduleFollowUpAppointment = async (id, appointmentData) => {
  const response = await api.post(`/opd/visits/${id}/follow-up-appointment`, appointmentData);
  return response.data;
};
