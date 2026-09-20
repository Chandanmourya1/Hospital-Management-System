import api from './api';

/**
 * Get comprehensive EMR Overview for a patient
 * (Profile, Diagnoses, Treatments, Allergies, Recent Prescriptions, Recent Reports, Timeline snippet)
 */
export const getPatientEmrOverview = async (patientId) => {
  const response = await api.get(`/emr/patients/${patientId}/overview`);
  return response.data;
};

/**
 * Get unified longitudinal health timeline for a patient (OPD encounters, IPD stays, Test Reports, Diagnoses, Treatments)
 */
export const getPatientTimeline = async (patientId, params = {}) => {
  const response = await api.get(`/emr/patients/${patientId}/timeline`, { params });
  return response.data;
};

/**
 * Get diagnostic test reports and medical documents with category/abnormal filters
 */
export const getPatientDocuments = async (patientId, params = {}) => {
  const response = await api.get(`/emr/patients/${patientId}/documents`, { params });
  return response.data;
};

/**
 * Upload a new medical document / diagnostic test report (multipart/form-data)
 */
export const uploadMedicalDocument = async (patientId, formData) => {
  const response = await api.post(`/emr/patients/${patientId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get single document details
 */
export const getDocumentById = async (documentId) => {
  const response = await api.get(`/emr/documents/${documentId}`);
  return response.data;
};

/**
 * Delete a medical document
 */
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/emr/documents/${documentId}`);
  return response.data;
};

/**
 * Add a clinical diagnosis to a patient's record
 */
export const addDiagnosis = async (patientId, diagnosisData) => {
  const response = await api.post(`/emr/patients/${patientId}/diagnoses`, diagnosisData);
  return response.data;
};

/**
 * Update a diagnosis (status: Active/Resolved/Chronic, notes, etc.)
 */
export const updateDiagnosis = async (patientId, diagnosisId, diagnosisData) => {
  const response = await api.put(`/emr/patients/${patientId}/diagnoses/${diagnosisId}`, diagnosisData);
  return response.data;
};

/**
 * Delete a diagnosis from patient's record
 */
export const deleteDiagnosis = async (patientId, diagnosisId) => {
  const response = await api.delete(`/emr/patients/${patientId}/diagnoses/${diagnosisId}`);
  return response.data;
};

/**
 * Add a therapeutic intervention / treatment / surgical procedure
 */
export const addTreatment = async (patientId, treatmentData) => {
  const response = await api.post(`/emr/patients/${patientId}/treatments`, treatmentData);
  return response.data;
};

/**
 * Update a treatment record (outcome, endDate, notes)
 */
export const updateTreatment = async (patientId, treatmentId, treatmentData) => {
  const response = await api.put(`/emr/patients/${patientId}/treatments/${treatmentId}`, treatmentData);
  return response.data;
};

/**
 * Delete a treatment record
 */
export const deleteTreatment = async (patientId, treatmentId) => {
  const response = await api.delete(`/emr/patients/${patientId}/treatments/${treatmentId}`);
  return response.data;
};

/**
 * Get unified digital prescriptions repository (both OPD prescriptions and IPD discharge regimens)
 */
export const getPatientPrescriptions = async (patientId) => {
  const response = await api.get(`/emr/patients/${patientId}/prescriptions`);
  return response.data;
};
