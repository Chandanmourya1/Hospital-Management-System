import api from './api';

export const getPatients = async (params = {}) => {
  const response = await api.get('/patients', { params });
  return response.data;
};

export const getPatientById = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const getMyPatientProfile = async () => {
  const response = await api.get('/patients/me');
  return response.data;
};

export const createPatient = async (patientData) => {
  const response = await api.post('/patients', patientData);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const response = await api.put(`/patients/${id}`, patientData);
  return response.data;
};

export const addMedicalHistory = async (id, historyData) => {
  const response = await api.post(`/patients/${id}/medical-history`, historyData);
  return response.data;
};

export const deleteMedicalHistory = async (id, historyId) => {
  const response = await api.delete(`/patients/${id}/medical-history/${historyId}`);
  return response.data;
};

export const addAllergy = async (id, allergyData) => {
  const response = await api.post(`/patients/${id}/allergies`, allergyData);
  return response.data;
};

export const deleteAllergy = async (id, allergyId) => {
  const response = await api.delete(`/patients/${id}/allergies/${allergyId}`);
  return response.data;
};
