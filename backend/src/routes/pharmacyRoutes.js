import express from 'express';
import {
  getInventory,
  getMedicineById,
  createMedicine,
  updateMedicine,
  adjustStock,
  recordPurchase,
  getPurchases,
  getPurchaseById,
  getPrescriptionForDispensing,
  dispensePrescription,
  createPharmacyBill,
  getBills,
  getBillById,
  getPharmacyAlerts,
  syncInventory,
} from '../controllers/pharmacyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// 1. Pharmacy KPI Alerts & Inventory Valuation
router.get('/alerts', protect, getPharmacyAlerts);
router.post('/sync', protect, syncInventory);

// 2. Medicine Inventory Catalog
router.get('/medicines', protect, getInventory);
router.get('/medicines/:id', protect, getMedicineById);
router.post('/medicines', protect, authorize('admin', 'pharmacist'), createMedicine);
router.put('/medicines/:id', protect, authorize('admin', 'pharmacist'), updateMedicine);
router.put('/medicines/:id/adjust-stock', protect, authorize('admin', 'pharmacist'), adjustStock);

// 3. Procurement Purchases Ledger
router.get('/purchases', protect, authorize('admin', 'pharmacist', 'receptionist'), getPurchases);
router.get('/purchases/:id', protect, authorize('admin', 'pharmacist', 'receptionist'), getPurchaseById);
router.post('/purchases', protect, authorize('admin', 'pharmacist'), recordPurchase);

// 4. Prescription Processing & FEFO Dispensing
router.get('/prescriptions/:prescriptionNumber', protect, getPrescriptionForDispensing);
router.post('/dispense', protect, authorize('admin', 'pharmacist'), dispensePrescription);

// 5. Pharmacy POS Billing & Invoices
router.get('/bills', protect, getBills);
router.get('/bills/:id', protect, getBillById);
router.post('/bills', protect, authorize('admin', 'pharmacist', 'receptionist'), createPharmacyBill);

export default router;
