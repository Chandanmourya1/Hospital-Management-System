import api from './api';

const labService = {
  // KPIs and Critical Panic Alerts
  getLabAlerts: async () => {
    const response = await api.get('/lab/alerts');
    return response.data;
  },

  // Test Catalog
  getTestCatalog: async (params = {}) => {
    const response = await api.get('/lab/catalog', { params });
    return response.data;
  },

  getTestById: async (id) => {
    const response = await api.get(`/lab/catalog/${id}`);
    return response.data;
  },

  createTest: async (data) => {
    const response = await api.post('/lab/catalog', data);
    return response.data;
  },

  updateTest: async (id, data) => {
    const response = await api.put(`/lab/catalog/${id}`, data);
    return response.data;
  },

  // Lab Orders
  getLabOrders: async (params = {}) => {
    const response = await api.get('/lab/orders', { params });
    return response.data;
  },

  getLabOrderById: async (id) => {
    const response = await api.get(`/lab/orders/${id}`);
    return response.data;
  },

  bookLabTest: async (data) => {
    const response = await api.post('/lab/orders', data);
    return response.data;
  },

  updateSampleCollection: async (orderId, data) => {
    const response = await api.put(`/lab/orders/${orderId}/sample-collection`, data);
    return response.data;
  },

  updateOrderStatus: async (orderId, orderStatus) => {
    const response = await api.put(`/lab/orders/${orderId}/status`, { orderStatus });
    return response.data;
  },

  // Test Results & Verification
  enterTestResults: async (orderId, testId, data) => {
    const response = await api.post(`/lab/orders/${orderId}/tests/${testId}/results`, data);
    return response.data;
  },

  verifyAndApproveReport: async (reportId, data = {}) => {
    const response = await api.put(`/lab/reports/${reportId}/verify`, data);
    return response.data;
  },

  // Diagnostic Reports
  getReports: async (params = {}) => {
    const response = await api.get('/lab/reports', { params });
    return response.data;
  },

  getReportById: async (id) => {
    const response = await api.get(`/lab/reports/${id}`);
    return response.data;
  },

  acknowledgeCriticalAlert: async (reportId, data = { acknowledged: true }) => {
    const response = await api.put(`/lab/reports/${reportId}/acknowledge`, data);
    return response.data;
  },
};

export default labService;
