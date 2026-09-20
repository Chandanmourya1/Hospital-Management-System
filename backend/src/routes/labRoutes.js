import express from 'express';
import {
  getTestCatalog,
  getTestById,
  createTest,
  updateTest,
  bookLabTest,
  getLabOrders,
  getLabOrderById,
  updateSampleCollection,
  updateOrderStatus,
  enterTestResults,
  verifyAndApproveReport,
  getReportById,
  getReports,
  getLabAlerts,
  acknowledgeCriticalAlert,
} from '../controllers/labController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// 1. Master Test Catalog Routes
router
  .route('/catalog')
  .get(getTestCatalog)
  .post(authorize('admin', 'lab_technician'), createTest);

router
  .route('/catalog/:id')
  .get(getTestById)
  .put(authorize('admin', 'lab_technician'), updateTest);

// 2. Lab Test Booking & Orders
router
  .route('/orders')
  .get(getLabOrders)
  .post(authorize('admin', 'lab_technician', 'doctor', 'receptionist'), bookLabTest);

router.route('/orders/:id').get(getLabOrderById);

router
  .route('/orders/:id/sample-collection')
  .put(authorize('admin', 'lab_technician', 'doctor'), updateSampleCollection);

router
  .route('/orders/:id/status')
  .put(authorize('admin', 'lab_technician'), updateOrderStatus);

// 3. Results & Reports
router
  .route('/orders/:orderId/tests/:testId/results')
  .post(authorize('admin', 'lab_technician', 'doctor'), enterTestResults);

router
  .route('/reports/:id/verify')
  .put(authorize('admin', 'lab_technician', 'doctor'), verifyAndApproveReport);

router.route('/reports').get(getReports);

router.route('/reports/:id').get(getReportById);

router
  .route('/reports/:id/acknowledge')
  .put(authorize('admin', 'lab_technician', 'doctor'), acknowledgeCriticalAlert);

// 4. Lab Alerts & KPIs
router.route('/alerts').get(getLabAlerts);

export default router;
