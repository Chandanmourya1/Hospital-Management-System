import api from './api';

export const adminService = {
  /**
   * Get all active hospital staff (Doctors, Receptionists, Pharmacists, Lab Techs, Admins)
   */
  getStaffList: async () => {
    const response = await api.get('/auth/staff');
    return response.data;
  },

  /**
   * Onboard and auto-verify a new hospital staff member
   */
  registerStaff: async (staffData) => {
    const response = await api.post('/auth/staff', staffData);
    return response.data;
  },

  /**
   * Remove a staff member from the system
   */
  removeStaff: async (id) => {
    const response = await api.delete(`/auth/staff/${id}`);
    return response.data;
  },

  /**
   * Toggle a staff member's active status (Active <-> Deactivated)
   */
  toggleStaffStatus: async (id) => {
    const response = await api.patch(`/auth/staff/${id}/status`);
    return response.data;
  },
};

export default adminService;
