import api from './api';

/**
 * Get real-time hospital bed occupancy matrix & department KPI metrics
 */
export const getWardBedMatrix = async (params = {}) => {
  const response = await api.get('/ipd/beds/matrix', { params });
  return response.data;
};

/**
 * Get list of all operational ward rooms
 */
export const getAllWardRooms = async (params = {}) => {
  const response = await api.get('/ipd/beds/rooms', { params });
  return response.data;
};

/**
 * Staff updates bed status (Available, Maintenance, Cleaning)
 */
export const updateBedStatus = async (roomId, bedNumber, status) => {
  const response = await api.put(`/ipd/beds/${roomId}/${bedNumber}/status`, { status });
  return response.data;
};

/**
 * Admit patient to IPD with bed allocation and triage vitals
 */
export const admitPatient = async (admissionData) => {
  const response = await api.post('/ipd/admit', admissionData);
  return response.data;
};

/**
 * Get all active inpatients currently admitted
 */
export const getActiveInpatients = async (params = {}) => {
  const response = await api.get('/ipd/admissions/active', { params });
  return response.data;
};

/**
 * Get paginated list of all admissions (active and discharged)
 */
export const getAllAdmissions = async (params = {}) => {
  const response = await api.get('/ipd/admissions', { params });
  return response.data;
};

/**
 * Get single inpatient admission clinical chart by ID
 */
export const getAdmissionById = async (id) => {
  const response = await api.get(`/ipd/admissions/${id}`);
  return response.data;
};

/**
 * Transfer patient to another available room/bed
 */
export const transferBed = async (id, transferData) => {
  const response = await api.post(`/ipd/admissions/${id}/transfer-bed`, transferData);
  return response.data;
};

/**
 * Doctor records daily progress round, patient condition, and medication orders
 */
export const addDoctorRound = async (id, roundData) => {
  const response = await api.post(`/ipd/admissions/${id}/rounds`, roundData);
  return response.data;
};

/**
 * Nurse records shift observations, periodic vitals, and fluid intake/output chart
 */
export const addNursingRecord = async (id, nursingData) => {
  const response = await api.post(`/ipd/admissions/${id}/nursing`, nursingData);
  return response.data;
};

/**
 * Discharges patient, calculates stay charges, releases bed, and generates discharge summary
 */
export const dischargePatient = async (id, dischargeData) => {
  const response = await api.post(`/ipd/admissions/${id}/discharge`, dischargeData);
  return response.data;
};
