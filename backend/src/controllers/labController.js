import mongoose from 'mongoose';
import LabTestCatalog from '../models/LabTestCatalog.js';
import LabOrder from '../models/LabOrder.js';
import LabReport from '../models/LabReport.js';
import MedicalDocument from '../models/MedicalDocument.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';

/**
 * Helper: Generate next sequential Lab Order Number (e.g. LAB-1001)
 */
const generateOrderNumber = async () => {
  const latest = await LabOrder.findOne().sort({ createdAt: -1 }).select('orderNumber');
  if (!latest || !latest.orderNumber) return 'LAB-1001';
  const match = latest.orderNumber.match(/LAB-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `LAB-${nextNum}`;
  }
  return `LAB-${Date.now().toString().slice(-4)}`;
};

/**
 * Helper: Generate sequential Barcode (e.g. SMP-1001)
 */
const generateBarcode = async () => {
  const latest = await LabOrder.findOne({ 'sampleDetails.barcode': { $exists: true } })
    .sort({ createdAt: -1 })
    .select('sampleDetails.barcode');
  if (!latest || !latest.sampleDetails?.barcode) return 'SMP-1001';
  const match = latest.sampleDetails.barcode.match(/SMP-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `SMP-${nextNum}`;
  }
  return `SMP-${Date.now().toString().slice(-4)}`;
};

/**
 * Helper: Generate next sequential Report Number (e.g. RPT-LAB-1001)
 */
const generateReportNumber = async () => {
  const latest = await LabReport.findOne().sort({ createdAt: -1 }).select('reportNumber');
  if (!latest || !latest.reportNumber) return 'RPT-LAB-1001';
  const match = latest.reportNumber.match(/RPT-LAB-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `RPT-LAB-${nextNum}`;
  }
  return `RPT-LAB-${Date.now().toString().slice(-4)}`;
};

/**
 * Helper: Evaluate result parameter flag against catalog thresholds
 */
const evaluateFlag = (paramDef, value) => {
  if (!paramDef || value === undefined || value === null || value === '') return 'Normal';
  const num = parseFloat(value);
  if (isNaN(num)) return 'Normal';

  // Check critical panic thresholds first
  if (paramDef.criticalLow !== null && paramDef.criticalLow !== undefined && num <= paramDef.criticalLow) {
    return 'Critical';
  }
  if (paramDef.criticalHigh !== null && paramDef.criticalHigh !== undefined && num >= paramDef.criticalHigh) {
    return 'Critical';
  }

  // Check normal physiological limits
  if (paramDef.minNormal !== null && paramDef.minNormal !== undefined && num < paramDef.minNormal) {
    return 'Low';
  }
  if (paramDef.maxNormal !== null && paramDef.maxNormal !== undefined && num > paramDef.maxNormal) {
    return 'High';
  }

  return 'Normal';
};

// ============================================================================
// 1. MASTER TEST CATALOG
// ============================================================================

/**
 * @desc    Get master lab test catalog with search and category filters
 * @route   GET /api/v1/lab/catalog
 * @access  Private
 */
export const getTestCatalog = async (req, res, next) => {
  try {
    const { search, category, isActive = 'true' } = req.query;
    const query = {};

    if (isActive === 'true') {
      query.isActive = true;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ testName: regex }, { testCode: regex }, { sampleType: regex }, { description: regex }];
    }

    const tests = await LabTestCatalog.find(query).sort({ category: 1, testName: 1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      tests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lab test details by ID
 * @route   GET /api/v1/lab/catalog/:id
 * @access  Private
 */
export const getTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await LabTestCatalog.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found in catalog.',
      });
    }

    res.status(200).json({
      success: true,
      test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new test formulation to master catalog
 * @route   POST /api/v1/lab/catalog
 * @access  Private (Lab Tech, Admin)
 */
export const createTest = async (req, res, next) => {
  try {
    const {
      testCode,
      testName,
      category = 'Biochemistry',
      department = 'Central Diagnostic Laboratory',
      sampleType,
      sampleVolume = '3 - 5 ml',
      fastingRequired = false,
      turnaroundHours = 12,
      price,
      parameters = [],
      description = '',
    } = req.body;

    if (!testCode || !testName || !sampleType || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Test code, test name, sample type, and price are required.',
      });
    }

    const existing = await LabTestCatalog.findOne({ testCode: testCode.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Test code ${testCode.toUpperCase()} already exists in catalog.`,
      });
    }

    const test = await LabTestCatalog.create({
      testCode: testCode.trim().toUpperCase(),
      testName: testName.trim(),
      category,
      department,
      sampleType: sampleType.trim(),
      sampleVolume,
      fastingRequired: Boolean(fastingRequired),
      turnaroundHours: Number(turnaroundHours),
      price: Number(price),
      parameters,
      description: description ? description.trim() : '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Lab test successfully created in catalog.',
      test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lab test catalog item
 * @route   PUT /api/v1/lab/catalog/:id
 * @access  Private (Lab Tech, Admin)
 */
export const updateTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await LabTestCatalog.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found.',
      });
    }

    const allowed = [
      'testName',
      'category',
      'department',
      'sampleType',
      'sampleVolume',
      'fastingRequired',
      'turnaroundHours',
      'price',
      'parameters',
      'description',
      'isActive',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        test[field] = req.body[field];
      }
    });

    await test.save();

    res.status(200).json({
      success: true,
      message: 'Lab test updated successfully.',
      test,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. LAB TEST BOOKING & ORDERS
// ============================================================================

/**
 * @desc    Book a new lab test order for outpatient or inpatient
 * @route   POST /api/v1/lab/orders
 * @access  Private
 */
export const bookLabTest = async (req, res, next) => {
  try {
    const {
      patientId,
      patientName,
      patientPhone = '',
      patientGender = '',
      patientAge = null,
      referringDoctor = 'Consulting Physician',
      referringDoctorUser = null,
      prescriptionNumber = '',
      testIds = [],
      priority = 'Routine',
      orderType = 'Outpatient (OPD)',
      paymentMethod = 'Cash',
      discount = 0,
      clinicalNotes = '',
    } = req.body;

    if (!patientId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and at least one lab test are required for booking.',
      });
    }

    let patient = await User.findById(patientId);
    if (!patient) {
      const profile = await PatientProfile.findById(patientId).populate('user');
      if (profile && profile.user) {
        patient = profile.user;
      }
    }
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found in registry.',
      });
    }

    const catalogTests = await LabTestCatalog.find({ _id: { $in: testIds }, isActive: true });
    if (catalogTests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'None of the requested tests were found in active catalog.',
      });
    }

    const orderNumber = await generateOrderNumber();
    const barcode = await generateBarcode();

    let totalAmount = 0;
    const testItems = catalogTests.map((t) => {
      totalAmount += t.price;
      return {
        test: t._id,
        testCode: t.testCode,
        testName: t.testName,
        category: t.category,
        sampleType: t.sampleType,
        price: t.price,
        status: 'Ordered',
      };
    });

    const finalDiscount = Number(discount) || 0;
    const netAmount = Math.max(0, totalAmount - finalDiscount);

    const order = await LabOrder.create({
      orderNumber,
      orderType,
      patient: patient._id,
      patientName: patientName ? patientName.trim() : patient.name,
      patientPhone: patientPhone || patient.phone || '',
      patientGender: patientGender || patient.gender || '',
      patientAge: patientAge,
      referringDoctor: referringDoctor ? referringDoctor.trim() : 'Consulting Physician',
      referringDoctorUser: mongoose.Types.ObjectId.isValid(referringDoctorUser) ? referringDoctorUser : null,
      prescriptionNumber: prescriptionNumber.trim(),
      tests: testItems,
      priority,
      sampleDetails: {
        barcode,
        sampleCondition: 'Pending',
        sampleNotes: '',
      },
      totalAmount,
      discount: finalDiscount,
      netAmount,
      billingStatus: 'Paid',
      paymentMethod,
      orderStatus: 'Ordered',
      clinicalNotes: clinicalNotes ? clinicalNotes.trim() : '',
      bookedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Lab Test Order #${orderNumber} booked with barcode ${barcode}.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lab test orders ledger with filtering and search
 * @route   GET /api/v1/lab/orders
 * @access  Private
 */
export const getLabOrders = async (req, res, next) => {
  try {
    const {
      search,
      orderStatus,
      priority,
      orderType,
      date,
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};

    // Patient access isolation: patients only see their own orders
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }

    if (orderStatus && orderStatus !== 'All') {
      query.orderStatus = orderStatus;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (orderType && orderType !== 'All') {
      query.orderType = orderType;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { patientName: regex },
        { patientPhone: regex },
        { 'sampleDetails.barcode': regex },
        { prescriptionNumber: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, orders] = await Promise.all([
      LabOrder.countDocuments(query),
      LabOrder.find(query)
        .populate('patient', 'name email phone gender dateOfBirth')
        .populate('bookedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lab order details with linked reports
 * @route   GET /api/v1/lab/orders/:id
 * @access  Private
 */
export const getLabOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await LabOrder.findById(id)
      .populate('patient', 'name email phone gender dateOfBirth address')
      .populate('bookedBy', 'name email')
      .populate('tests.test');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found.',
      });
    }

    // Patient access check
    if (req.user.role === 'patient' && order.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this laboratory order.',
      });
    }

    // Also fetch any generated reports for this order
    const reports = await LabReport.find({ labOrder: order._id }).sort({ reportDate: -1 });

    res.status(200).json({
      success: true,
      order,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record sample collection intake at phlebotomy desk
 * @route   PUT /api/v1/lab/orders/:id/sample-collection
 * @access  Private (Lab Tech, Doctor, Admin)
 */
export const updateSampleCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sampleCondition = 'Good / Normal',
      sampleNotes = '',
      barcode,
    } = req.body;

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found.',
      });
    }

    order.sampleDetails.sampleCollectedAt = new Date();
    order.sampleDetails.collectedBy = req.user._id;
    order.sampleDetails.collectorName = req.user.name;
    order.sampleDetails.sampleCondition = sampleCondition;
    if (sampleNotes) order.sampleDetails.sampleNotes = sampleNotes.trim();
    if (barcode) order.sampleDetails.barcode = barcode.trim().toUpperCase();

    order.orderStatus = 'Sample Collected';

    // Update statuses of individual tests
    order.tests.forEach((t) => {
      if (t.status === 'Ordered') {
        t.status = 'Sample Collected';
      }
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Specimen collected successfully for Order #${order.orderNumber}.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (e.g. In Lab / Processing, Cancelled)
 * @route   PUT /api/v1/lab/orders/:id/status
 * @access  Private (Lab Tech, Admin)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found.',
      });
    }

    order.orderStatus = status;
    order.tests.forEach((t) => {
      if (status === 'In Lab / Processing' && t.status === 'Sample Collected') {
        t.status = 'In Lab / Processing';
      }
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. RESULT ENTRY & PATHOLOGIST REPORT VERIFICATION
// ============================================================================

/**
 * @desc    Enter or update test parameter results with automated flag evaluation
 * @route   POST /api/v1/lab/orders/:orderId/tests/:testId/results
 * @access  Private (Lab Tech, Pathologist, Admin)
 */
export const enterTestResults = async (req, res, next) => {
  try {
    const { orderId, testId } = req.params;
    const { results = [], interpretation = '', notes = '' } = req.body;

    const order = await LabOrder.findById(orderId).populate('patient');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found.',
      });
    }

    const testItem = order.tests.id(testId) || order.tests.find((t) => t.test.toString() === testId);
    if (!testItem) {
      return res.status(404).json({
        success: false,
        message: 'Test item not found in this lab order.',
      });
    }

    const catalogTest = await LabTestCatalog.findById(testItem.test);

    // Process parameters and evaluate flags
    let hasCritical = false;
    let hasAbnormal = false;

    const evaluatedResults = results.map((r) => {
      const paramDef = (catalogTest?.parameters || []).find(
        (p) => p.name.toLowerCase() === r.parameterName.trim().toLowerCase()
      );

      const flag = r.flag && r.flag !== 'Normal' ? r.flag : evaluateFlag(paramDef, r.value);

      if (flag === 'Critical') {
        hasCritical = true;
        hasAbnormal = true;
      } else if (flag === 'Low' || flag === 'High') {
        hasAbnormal = true;
      }

      return {
        parameterName: r.parameterName.trim(),
        value: String(r.value).trim(),
        unit: r.unit || paramDef?.unit || '',
        referenceRange: r.referenceRange || paramDef?.referenceRange || '',
        flag,
        method: r.method || 'Automated Analyzer / Spectrophotometry',
      };
    });

    const overallStatus = hasCritical
      ? 'Critical Panic Alert'
      : hasAbnormal
      ? 'Abnormal'
      : 'Normal';

    // Check if report already exists for this test on this order
    let report = await LabReport.findOne({
      labOrder: order._id,
      test: testItem.test,
    });

    if (report) {
      report.results = evaluatedResults;
      report.overallStatus = overallStatus;
      if (interpretation) report.interpretation = interpretation.trim();
      if (notes) report.notes = notes.trim();
      report.status = 'Result Entered';
      await report.save();
    } else {
      const reportNumber = await generateReportNumber();

      report = await LabReport.create({
        reportNumber,
        labOrder: order._id,
        orderNumber: order.orderNumber,
        patient: order.patient._id,
        patientName: order.patientName,
        patientGender: order.patientGender,
        patientAge: order.patientAge,
        patientPhone: order.patientPhone,
        referringDoctor: order.referringDoctor,
        test: testItem.test,
        testCode: testItem.testCode,
        testName: testItem.testName,
        category: testItem.category,
        sampleType: testItem.sampleType,
        barcode: order.sampleDetails?.barcode || '',
        sampleCollectedAt: order.sampleDetails?.sampleCollectedAt || new Date(),
        sampleReceivedAt: new Date(),
        reportDate: new Date(),
        results: evaluatedResults,
        overallStatus,
        interpretation: interpretation ? interpretation.trim() : '',
        notes: notes ? notes.trim() : '',
        status: 'Result Entered',
        enteredBy: req.user._id,
      });
    }

    testItem.status = 'Result Entered';
    await order.save();

    res.status(200).json({
      success: true,
      message: `Results recorded for ${testItem.testName}. Status: ${overallStatus}.`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify and approve diagnostic report by certified Pathologist / Lab Director
 * @route   PUT /api/v1/lab/reports/:id/verify
 * @access  Private (Pathologist, Doctor, Admin)
 */
export const verifyAndApproveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { interpretation, notes } = req.body;

    const report = await LabReport.findById(id).populate('patient');
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found.',
      });
    }

    if (interpretation) report.interpretation = interpretation.trim();
    if (notes) report.notes = notes.trim();

    report.status = 'Verified / Approved';
    report.verifiedBy = req.user._id;
    report.verifierName = `${req.user.name}, Certified Pathologist`;
    report.verifiedAt = new Date();

    // 1. Update associated LabOrder test status
    const order = await LabOrder.findById(report.labOrder);
    if (order) {
      const orderTest = order.tests.find((t) => t.test.toString() === report.test.toString());
      if (orderTest) {
        orderTest.status = 'Verified / Approved';
      }

      // If all tests are verified/completed, mark order as Completed
      const allDone = order.tests.every(
        (t) => t.status === 'Verified / Approved' || t.status === 'Delivered' || t.status === 'Cancelled'
      );
      if (allDone) {
        order.orderStatus = 'Completed';
      }
      await order.save();
    }

    // 2. Auto-sync to Patient EMR (MedicalDocument)
    if (!report.isSyncedToEmr) {
      const emrDoc = await MedicalDocument.create({
        patient: report.patient._id,
        title: `${report.testName} (${report.reportNumber})`,
        documentType: 'Pathology / Lab',
        category: 'Pathology',
        documentDate: report.reportDate || new Date(),
        facility: 'MedCare Central Diagnostic Laboratories (NABL Accredited)',
        doctor: req.user._id,
        fileUrl: `/lab/reports/${report._id}`,
        fileName: `${report.reportNumber}.pdf`,
        fileType: 'application/pdf',
        findings: report.interpretation || `Certified laboratory diagnostic evaluation: ${report.overallStatus}`,
        isAbnormal: report.overallStatus !== 'Normal',
        abnormalDetails:
          report.overallStatus === 'Critical Panic Alert'
            ? 'CRITICAL PANIC VALUE: Parameter exceeds critical safety threshold. Immediate clinical correlation required.'
            : report.overallStatus === 'Abnormal'
            ? 'Abnormal lab values detected outside biological reference intervals.'
            : '',
        tags: [report.testCode, report.category, report.overallStatus],
        notes: `Sample Barcode: ${report.barcode} • Verified by ${report.verifierName}`,
        uploadedBy: req.user._id,
      });

      report.isSyncedToEmr = true;
      report.emrDocument = emrDoc._id;
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: `Report #${report.reportNumber} certified by pathologist and synchronized with patient EMR.`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lab report details for printing / viewing
 * @route   GET /api/v1/lab/reports/:id
 * @access  Private
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await LabReport.findById(id)
      .populate('patient', 'name email phone gender dateOfBirth address')
      .populate('verifiedBy', 'name email')
      .populate('enteredBy', 'name email')
      .populate('test');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory report record not found.',
      });
    }

    // Patient access check
    if (req.user.role === 'patient' && report.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this diagnostic report.',
      });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reports list with search and filters
 * @route   GET /api/v1/lab/reports
 * @access  Private
 */
export const getReports = async (req, res, next) => {
  try {
    const {
      search,
      overallStatus,
      status,
      category,
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }

    if (overallStatus && overallStatus !== 'All') {
      query.overallStatus = overallStatus;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { reportNumber: regex },
        { orderNumber: regex },
        { patientName: regex },
        { testName: regex },
        { testCode: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, reports] = await Promise.all([
      LabReport.countDocuments(query),
      LabReport.find(query)
        .populate('patient', 'name email phone gender')
        .populate('verifiedBy', 'name email')
        .sort({ reportDate: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lab dashboard KPI alerts (panic values, pending phlebotomy, today revenue)
 * @route   GET /api/v1/lab/alerts
 * @access  Private
 */
export const getLabAlerts = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      pendingCollection,
      inProcessing,
      completedToday,
      criticalPanicReports,
      activeCriticalCount,
      acknowledgedCriticalCount,
      totalCatalogTests,
    ] = await Promise.all([
      LabOrder.countDocuments({ createdAt: { $gte: startOfToday } }),
      LabOrder.countDocuments({ orderStatus: 'Ordered' }),
      LabOrder.countDocuments({ orderStatus: { $in: ['Sample Collected', 'In Lab / Processing'] } }),
      LabOrder.countDocuments({ orderStatus: 'Completed', updatedAt: { $gte: startOfToday } }),
      LabReport.find({ overallStatus: 'Critical Panic Alert' })
        .populate('patient', 'name phone')
        .sort({ reportDate: -1 })
        .limit(20),
      LabReport.countDocuments({
        overallStatus: 'Critical Panic Alert',
        criticalAlertAcknowledged: { $ne: true },
      }),
      LabReport.countDocuments({
        overallStatus: 'Critical Panic Alert',
        criticalAlertAcknowledged: true,
      }),
      LabTestCatalog.countDocuments({ isActive: true }),
    ]);

    // Compute today's revenue from billed orders
    const todayOrders = await LabOrder.find({
      createdAt: { $gte: startOfToday },
      billingStatus: 'Paid',
    }).select('netAmount');

    const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.netAmount || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        ordersToday,
        pendingCollection,
        inProcessing,
        completedToday,
        criticalPanicCount: activeCriticalCount,
        acknowledgedPanicCount: acknowledgedCriticalCount,
        totalPanicCount: criticalPanicReports.length,
        todayRevenue: Math.round(todayRevenue),
        totalCatalogTests,
      },
      criticalAlerts: criticalPanicReports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Acknowledge critical panic alert for a lab report
 * @route   PUT /api/v1/lab/reports/:id/acknowledge
 * @access  Private (Admin, Lab Technician, Doctor)
 */
export const acknowledgeCriticalAlert = async (req, res, next) => {
  try {
    const report = await LabReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Lab report not found with id ${req.params.id}`,
      });
    }

    const { acknowledged = true, notes = '' } = req.body;

    report.criticalAlertAcknowledged = Boolean(acknowledged);
    if (report.criticalAlertAcknowledged) {
      report.acknowledgedBy = req.user._id;
      report.acknowledgedByName = req.user.name || 'Staff';
      report.acknowledgedAt = new Date();
      if (notes) report.acknowledgementNotes = notes;
    } else {
      report.acknowledgedBy = null;
      report.acknowledgedByName = '';
      report.acknowledgedAt = null;
      report.acknowledgementNotes = '';
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: report.criticalAlertAcknowledged
        ? 'Critical panic alert acknowledged successfully and doctor notification logged.'
        : 'Critical alert reset to unacknowledged status.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

