import api from './api';

const pharmacyService = {
  // Inventory
  getInventory: async (params = {}) => {
    const response = await api.get('/pharmacy/medicines', { params });
    return response.data;
  },

  getMedicineById: async (id) => {
    const response = await api.get(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  createMedicine: async (data) => {
    const response = await api.post('/pharmacy/medicines', data);
    return response.data;
  },

  updateMedicine: async (id, data) => {
    const response = await api.put(`/pharmacy/medicines/${id}`, data);
    return response.data;
  },

  adjustStock: async (id, data) => {
    const response = await api.put(`/pharmacy/medicines/${id}/adjust-stock`, data);
    return response.data;
  },

  // Purchases / Procurement
  getPurchases: async (params = {}) => {
    const response = await api.get('/pharmacy/purchases', { params });
    return response.data;
  },

  getPurchaseById: async (id) => {
    const response = await api.get(`/pharmacy/purchases/${id}`);
    return response.data;
  },

  recordPurchase: async (data) => {
    const response = await api.post('/pharmacy/purchases', data);
    return response.data;
  },

  // Prescription Dispensing (FEFO)
  getPrescriptionForDispensing: async (prescriptionNumber) => {
    const response = await api.get(`/pharmacy/prescriptions/${prescriptionNumber}`);
    return response.data;
  },

  dispensePrescription: async (data) => {
    const response = await api.post('/pharmacy/dispense', data);
    return response.data;
  },

  // POS / Retail Billing
  createPharmacyBill: async (data) => {
    const response = await api.post('/pharmacy/bills', data);
    return response.data;
  },

  getBills: async (params = {}) => {
    const response = await api.get('/pharmacy/bills', { params });
    return response.data;
  },

  getBillById: async (id) => {
    const response = await api.get(`/pharmacy/bills/${id}`);
    return response.data;
  },

  // Alerts & KPIs
  getAlerts: async () => {
    const response = await api.get('/pharmacy/alerts');
    return response.data;
  },

  // Inventory Synchronization & Recompute
  syncInventory: async () => {
    const response = await api.post('/pharmacy/sync');
    return response.data;
  },
};

export default pharmacyService;
