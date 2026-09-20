import api from './api';

export const getDoctors = async (params = {}) => {
  const response = await api.get('/doctors', { params });
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};

export const getMyDoctorProfile = async () => {
  const response = await api.get('/doctors/me');
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await api.post('/doctors', doctorData);
  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const response = await api.put(`/doctors/${id}`, doctorData);
  return response.data;
};

export const updateSchedule = async (id, scheduleData) => {
  const response = await api.put(`/doctors/${id}/schedule`, scheduleData);
  return response.data;
};

export const updateAvailability = async (id, availabilityStatus) => {
  const response = await api.put(`/doctors/${id}/availability`, { availabilityStatus });
  return response.data;
};

export const deleteDoctor = async (id) => {
  const response = await api.delete(`/doctors/${id}`);
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('/doctors/departments');
  return response.data;
};
