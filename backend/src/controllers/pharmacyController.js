import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';
import MedicinePurchase from '../models/MedicinePurchase.js';
import PharmacyBill from '../models/PharmacyBill.js';
import OpdVisit from '../models/OpdVisit.js';
import IpdAdmission from '../models/IpdAdmission.js';
import User from '../models/User.js';

/**
 * Helper: Generate next sequential Item Code for Medicine (e.g. MED-1001)
 */
const generateItemCode = async () => {
  const latest = await Medicine.findOne().sort({ createdAt: -1 }).select('itemCode');
  if (!latest || !latest.itemCode) return 'MED-1001';
  const match = latest.itemCode.match(/MED-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `MED-${nextNum}`;
  }
  return `MED-${Date.now().toString().slice(-4)}`;
};

/**
 * Helper: Generate next sequential Purchase Number (e.g. PUR-1001)
 */
const generatePurchaseNumber = async () => {
  const latest = await MedicinePurchase.findOne().sort({ createdAt: -1 }).select('purchaseNumber');
  if (!latest || !latest.purchaseNumber) return 'PUR-1001';
  const match = latest.purchaseNumber.match(/PUR-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `PUR-${nextNum}`;
  }
  return `PUR-${Date.now().toString().slice(-4)}`;
};

/**
 * Helper: Generate next sequential Pharmacy Bill Number (e.g. PHARM-1001)
 */
const generateBillNumber = async () => {
  const latest = await PharmacyBill.findOne().sort({ createdAt: -1 }).select('billNumber');
  if (!latest || !latest.billNumber) return 'PHARM-1001';
  const match = latest.billNumber.match(/PHARM-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `PHARM-${nextNum}`;
  }
  return `PHARM-${Date.now().toString().slice(-4)}`;
};

// ============================================================================
// 1. INVENTORY MANAGEMENT
// ============================================================================

/**
 * @desc    Get inventory catalog with search, category, and stock status filters
 * @route   GET /api/v1/pharmacy/medicines
 * @access  Private
 */
export const getInventory = async (req, res, next) => {
  try {
    const {
      search,
      category,
      dosageForm,
      stockStatus = 'all',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (dosageForm && dosageForm !== 'All') {
      query.dosageForm = dosageForm;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { genericName: regex },
        { itemCode: regex },
        { manufacturer: regex },
        { rackLocation: regex },
      ];
    }

    const now = new Date();

    if (stockStatus === 'out_of_stock') {
      query.currentStock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      query.$expr = {
        $and: [
          { $gt: ['$currentStock', 0] },
          { $lte: ['$currentStock', '$reorderLevel'] },
        ],
      };
    } else if (stockStatus === 'in_stock') {
      query.$expr = { $gt: ['$currentStock', '$reorderLevel'] };
    } else if (stockStatus === 'expired') {
      query['batches.expiryDate'] = { $lt: now };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, medicines] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Enhance medicines with dynamic status & batch summary
    const enhancedMedicines = medicines.map((m) => {
      const obj = m.toObject();
      const validBatches = (obj.batches || []).filter(
        (b) => new Date(b.expiryDate) > now && b.quantity > 0
      );
      const expiredBatches = (obj.batches || []).filter(
        (b) => new Date(b.expiryDate) <= now && b.quantity > 0
      );

      const validStock = validBatches.reduce((acc, b) => acc + b.quantity, 0);

      let status = 'In Stock';
      if (validStock === 0) {
        status = expiredBatches.length > 0 ? 'Expired' : 'Out of Stock';
      } else if (validStock <= obj.reorderLevel) {
        status = 'Low Stock';
      }

      return {
        ...obj,
        validStock,
        computedStatus: status,
        activeBatchesCount: validBatches.length,
        hasExpiredBatches: expiredBatches.length > 0,
      };
    });

    res.status(200).json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      medicines: enhancedMedicines,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single medicine details by ID with FEFO sorted batches
 * @route   GET /api/v1/pharmacy/medicines/:id
 * @access  Private
 */
export const getMedicineById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in inventory.',
      });
    }

    const obj = medicine.toObject();
    // Sort batches by expiryDate ascending (FEFO)
    obj.batches = (obj.batches || []).sort(
      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
    );

    res.status(200).json({
      success: true,
      medicine: obj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new medicine to inventory catalog
 * @route   POST /api/v1/pharmacy/medicines
 * @access  Private (Pharmacist, Admin)
 */
export const createMedicine = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      category,
      dosageForm,
      strength,
      manufacturer,
      rackLocation,
      unitPrice,
      mrp,
      taxPercent = 12,
      reorderLevel = 50,
      description = '',
      initialBatch,
    } = req.body;

    if (!name || !genericName || !manufacturer) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name, generic composition, and manufacturer are required.',
      });
    }

    const itemCode = await generateItemCode();

    const batches = [];
    if (initialBatch && initialBatch.batchNumber && initialBatch.quantity > 0) {
      batches.push({
        batchNumber: initialBatch.batchNumber.trim(),
        quantity: Number(initialBatch.quantity),
        purchasePrice: Number(initialBatch.purchasePrice || unitPrice),
        mrp: Number(initialBatch.mrp || mrp),
        manufacturingDate: initialBatch.manufacturingDate ? new Date(initialBatch.manufacturingDate) : null,
        expiryDate: new Date(initialBatch.expiryDate || Date.now() + 365 * 24 * 60 * 60 * 1000),
        supplier: initialBatch.supplier || 'Initial Stock Setup',
      });
    }

    const medicine = await Medicine.create({
      itemCode,
      name: name.trim(),
      genericName: genericName.trim(),
      category: category || 'Other',
      dosageForm: dosageForm || 'Tablet',
      strength: strength ? strength.trim() : '',
      manufacturer: manufacturer.trim(),
      rackLocation: rackLocation ? rackLocation.trim() : 'General Shelf A-1',
      unitPrice: Number(unitPrice),
      mrp: Number(mrp),
      taxPercent: Number(taxPercent),
      reorderLevel: Number(reorderLevel),
      description: description ? description.trim() : '',
      batches,
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added to inventory catalog.',
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update medicine catalog information
 * @route   PUT /api/v1/pharmacy/medicines/:id
 * @access  Private (Pharmacist, Admin)
 */
export const updateMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      genericName,
      category,
      dosageForm,
      strength,
      manufacturer,
      rackLocation,
      unitPrice,
      mrp,
      taxPercent,
      reorderLevel,
      description,
      isActive,
    } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found.',
      });
    }

    if (name) medicine.name = name.trim();
    if (genericName) medicine.genericName = genericName.trim();
    if (category) medicine.category = category;
    if (dosageForm) medicine.dosageForm = dosageForm;
    if (strength !== undefined) medicine.strength = strength.trim();
    if (manufacturer) medicine.manufacturer = manufacturer.trim();
    if (rackLocation) medicine.rackLocation = rackLocation.trim();
    if (unitPrice !== undefined) medicine.unitPrice = Number(unitPrice);
    if (mrp !== undefined) medicine.mrp = Number(mrp);
    if (taxPercent !== undefined) medicine.taxPercent = Number(taxPercent);
    if (reorderLevel !== undefined) medicine.reorderLevel = Number(reorderLevel);
    if (description !== undefined) medicine.description = description.trim();
    if (isActive !== undefined) medicine.isActive = isActive;

    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully.',
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Adjust batch stock quantity (Manual audit reconciliation)
 * @route   PUT /api/v1/pharmacy/medicines/:id/adjust-stock
 * @access  Private (Pharmacist, Admin)
 */
export const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { batchNumber, newQuantity, reason = 'Stock Audit' } = req.body;

    if (!batchNumber || newQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Batch number and new quantity are required.',
      });
    }

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found.',
      });
    }

    const batch = medicine.batches.find((b) => b.batchNumber === batchNumber);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Batch ${batchNumber} not found on this medicine.`,
      });
    }

    batch.quantity = Math.max(0, Number(newQuantity));
    await medicine.save();

    res.status(200).json({
      success: true,
      message: `Batch ${batchNumber} stock adjusted to ${batch.quantity} (${reason}).`,
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. MEDICINE PURCHASES (PROCUREMENT)
// ============================================================================

/**
 * @desc    Record a vendor medicine purchase & increment stock atomically
 * @route   POST /api/v1/pharmacy/purchases
 * @access  Private (Pharmacist, Admin)
 */
export const recordPurchase = async (req, res, next) => {
  try {
    const {
      supplier,
      supplierContact = '',
      invoiceNumber,
      purchaseDate,
      items,
      discount = 0,
      paymentStatus = 'Paid',
      paymentMethod = 'Bank Transfer',
      notes = '',
    } = req.body;

    if (!supplier || !invoiceNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name, invoice number, and at least one purchase item are required.',
      });
    }

    const purchaseNumber = await generatePurchaseNumber();

    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const {
        medicineId,
        batchNumber,
        manufacturingDate,
        expiryDate,
        quantity,
        unitCost,
        mrp,
        taxPercent = 12,
      } = item;

      if (!medicineId || !batchNumber || !expiryDate || !quantity || !unitCost) {
        return res.status(400).json({
          success: false,
          message: 'All items must include medicine ID, batch number, expiry date, quantity, and unit cost.',
        });
      }

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${medicineId} not found.`,
        });
      }

      const itemQty = Number(quantity);
      const cost = Number(unitCost);
      const itemMrp = Number(mrp || medicine.mrp);
      const itemTax = (cost * itemQty * Number(taxPercent)) / 100;
      const lineTotal = cost * itemQty + itemTax;

      subtotal += cost * itemQty;
      taxAmount += itemTax;

      processedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        batchNumber: batchNumber.trim(),
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: new Date(expiryDate),
        quantity: itemQty,
        unitCost: cost,
        mrp: itemMrp,
        taxPercent: Number(taxPercent),
        totalCost: Math.round(lineTotal * 100) / 100,
      });

      // Update Medicine Batches: if batch exists, increment quantity; otherwise push new batch
      const existingBatch = medicine.batches.find(
        (b) => b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase()
      );

      if (existingBatch) {
        existingBatch.quantity += itemQty;
        existingBatch.purchasePrice = cost;
        existingBatch.mrp = itemMrp;
        existingBatch.expiryDate = new Date(expiryDate);
      } else {
        medicine.batches.push({
          batchNumber: batchNumber.trim(),
          quantity: itemQty,
          purchasePrice: cost,
          mrp: itemMrp,
          manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
          expiryDate: new Date(expiryDate),
          supplier: supplier.trim(),
        });
      }

      // Update medicine default cost and MRP if updated
      medicine.unitPrice = cost;
      medicine.mrp = itemMrp;
      await medicine.save();
    }

    const finalSubtotal = Math.round(subtotal * 100) / 100;
    const finalTax = Math.round(taxAmount * 100) / 100;
    const finalDiscount = Number(discount) || 0;
    const totalAmount = Math.max(0, Math.round((finalSubtotal + finalTax - finalDiscount) * 100) / 100);

    const purchase = await MedicinePurchase.create({
      purchaseNumber,
      supplier: supplier.trim(),
      supplierContact: supplierContact.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      items: processedItems,
      subtotal: finalSubtotal,
      taxAmount: finalTax,
      discount: finalDiscount,
      totalAmount,
      paymentStatus,
      paymentMethod,
      notes: notes ? notes.trim() : '',
      receivedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Purchase invoice ${purchaseNumber} recorded. Stock updated atomically.`,
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get purchase procurement records ledger with search
 * @route   GET /api/v1/pharmacy/purchases
 * @access  Private (Pharmacist, Admin)
 */
export const getPurchases = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ purchaseNumber: regex }, { supplier: regex }, { invoiceNumber: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, purchases] = await Promise.all([
      MedicinePurchase.countDocuments(query),
      MedicinePurchase.find(query)
        .populate('receivedBy', 'name email')
        .sort({ purchaseDate: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      purchases,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single purchase record details by ID
 * @route   GET /api/v1/pharmacy/purchases/:id
 * @access  Private (Pharmacist, Admin)
 */
export const getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const purchase = await MedicinePurchase.findById(id).populate('receivedBy', 'name email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase record not found.',
      });
    }

    res.status(200).json({
      success: true,
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. PRESCRIPTION PROCESSING & FEFO DISPENSING
// ============================================================================

/**
 * @desc    Look up prescription by ID or number & match against inventory with FEFO recommendations
 * @route   GET /api/v1/pharmacy/prescriptions/:prescriptionNumber
 * @access  Private
 */
export const getPrescriptionForDispensing = async (req, res, next) => {
  try {
    const { prescriptionNumber } = req.params;
    const cleanNum = prescriptionNumber.trim();

    let prescription = null;
    let patientData = null;
    let doctorData = null;
    let prescriptionDate = null;
    let prescriptionType = 'OPD Prescription';
    let rawMedicines = [];

    // 1. Check OPD Visit
    const opd = await OpdVisit.findOne({
      $or: [{ 'prescription.prescriptionId': cleanNum }, { visitId: cleanNum }],
    })
      .populate('patient', 'name email phone dateOfBirth gender')
      .populate('doctor', 'name');

    if (opd && opd.prescription) {
      prescription = opd.prescription;
      patientData = opd.patient;
      doctorData = opd.doctor;
      prescriptionDate = opd.prescription.issuedAt || opd.visitDate;
      prescriptionType = 'Outpatient (OPD)';
      rawMedicines = opd.prescription.medicines || [];
    } else {
      // 2. Check IPD Admission discharge regimen
      const ipd = await IpdAdmission.findOne({
        $or: [{ admissionId: cleanNum }, { _id: mongoose.Types.ObjectId.isValid(cleanNum) ? cleanNum : null }],
      })
        .populate('patient', 'name email phone dateOfBirth gender')
        .populate('attendingDoctor', 'name');

      if (ipd && ipd.dischargeDetails?.dischargeMedications?.length > 0) {
        patientData = ipd.patient;
        doctorData = ipd.attendingDoctor;
        prescriptionDate = ipd.dischargeDetails.dischargeDate || ipd.updatedAt;
        prescriptionType = 'Inpatient (IPD)';
        rawMedicines = ipd.dischargeDetails.dischargeMedications || [];
        prescription = {
          prescriptionId: `${ipd.admissionId}-RX`,
          medicines: rawMedicines,
          dietaryAdvice: ipd.dischargeDetails.dietaryAndActivityAdvice,
          generalNotes: ipd.dischargeDetails.courseInHospital,
        };
      }
    }

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: `Prescription ${cleanNum} not found in outpatient or inpatient registers.`,
      });
    }

    // Check if prescription has already been dispensed
    const existingBill = await PharmacyBill.findOne({
      prescriptionNumber: prescription.prescriptionId || cleanNum,
    });

    const now = new Date();

    // Analyze each prescribed medicine against inventory using FEFO
    const matchedMedicines = await Promise.all(
      rawMedicines.map(async (rxMed) => {
        // Try exact match or partial match on brand name or generic name
        const searchRegex = new RegExp(rxMed.name.trim().split(' ')[0], 'i');
        const inventoryMatch = await Medicine.findOne({
          isActive: true,
          $or: [{ name: searchRegex }, { genericName: searchRegex }],
        });

        if (!inventoryMatch) {
          return {
            prescribedName: rxMed.name,
            dosage: rxMed.dosage,
            frequency: rxMed.frequency,
            duration: rxMed.duration,
            instructions: rxMed.instructions,
            matchStatus: 'Not In Catalog',
            availableMedicine: null,
            fefoBatch: null,
            stockAvailable: 0,
          };
        }

        // FEFO: Filter non-expired batches with quantity > 0 and sort ascending by expiryDate
        const validBatches = (inventoryMatch.batches || [])
          .filter((b) => new Date(b.expiryDate) > now && b.quantity > 0)
          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        const totalStock = validBatches.reduce((acc, b) => acc + b.quantity, 0);
        const bestBatch = validBatches.length > 0 ? validBatches[0] : null;

        return {
          prescribedName: rxMed.name,
          dosage: rxMed.dosage,
          frequency: rxMed.frequency,
          duration: rxMed.duration,
          instructions: rxMed.instructions,
          matchStatus: totalStock > 0 ? 'Available' : 'Out of Stock',
          availableMedicine: {
            _id: inventoryMatch._id,
            itemCode: inventoryMatch.itemCode,
            name: inventoryMatch.name,
            genericName: inventoryMatch.genericName,
            dosageForm: inventoryMatch.dosageForm,
            rackLocation: inventoryMatch.rackLocation,
            unitPrice: inventoryMatch.unitPrice,
            mrp: inventoryMatch.mrp,
            taxPercent: inventoryMatch.taxPercent,
          },
          fefoBatch: bestBatch
            ? {
                batchNumber: bestBatch.batchNumber,
                quantity: bestBatch.quantity,
                expiryDate: bestBatch.expiryDate,
                mrp: bestBatch.mrp,
              }
            : null,
          stockAvailable: totalStock,
          allBatches: validBatches,
        };
      })
    );

    res.status(200).json({
      success: true,
      prescriptionNumber: prescription.prescriptionId || cleanNum,
      prescriptionType,
      prescriptionDate,
      patient: patientData,
      doctor: doctorData,
      isAlreadyDispensed: !!existingBill,
      existingBillNumber: existingBill?.billNumber || null,
      medicines: matchedMedicines,
      dietaryAdvice: prescription.dietaryAdvice || '',
      generalNotes: prescription.generalNotes || '',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dispense prescription items atomically with FEFO deduction & generate bill
 * @route   POST /api/v1/pharmacy/dispense
 * @access  Private (Pharmacist, Admin)
 */
export const dispensePrescription = async (req, res, next) => {
  try {
    const {
      prescriptionNumber,
      billType = 'Outpatient (OPD)',
      patientId,
      patientName,
      patientPhone = '',
      doctorName = 'Consulting Physician',
      items,
      discount = 0,
      paymentMethod = 'Cash',
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one medicine item to dispense.',
      });
    }

    const now = new Date();
    const processedItems = [];
    let subtotal = 0;
    let totalTax = 0;

    // Validate & Deduct each item from batch
    for (const item of items) {
      const { medicineId, batchNumber, quantity, discountPercent = 0 } = item;

      if (!medicineId || !batchNumber || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each item requires a valid medicine ID, batch number, and quantity > 0.',
        });
      }

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found in catalog.`,
        });
      }

      const batch = medicine.batches.find((b) => b.batchNumber === batchNumber);
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batchNumber} not found for ${medicine.name}.`,
        });
      }

      if (new Date(batch.expiryDate) <= now) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batchNumber} of ${medicine.name} has EXPIRED and cannot be dispensed.`,
        });
      }

      if (batch.quantity < Number(quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock in batch ${batchNumber} for ${medicine.name}. Available: ${batch.quantity}, Requested: ${quantity}.`,
        });
      }

      // Deduct stock
      batch.quantity -= Number(quantity);
      await medicine.save(); // pre-save recomputes medicine.currentStock

      const unitPrice = Number(batch.mrp || medicine.mrp);
      const taxPercent = Number(medicine.taxPercent || 12);
      const discPct = Number(discountPercent) || 0;

      const itemBase = unitPrice * Number(quantity);
      const itemDisc = (itemBase * discPct) / 100;
      const taxableAmount = itemBase - itemDisc;
      const itemTax = (taxableAmount * taxPercent) / 100;
      const itemTotal = taxableAmount + itemTax;

      subtotal += taxableAmount;
      totalTax += itemTax;

      processedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: Number(quantity),
        unitPrice,
        taxPercent,
        discountPercent: discPct,
        itemTotal: Math.round(itemTotal * 100) / 100,
      });
    }

    const finalSubtotal = Math.round(subtotal * 100) / 100;
    const finalTax = Math.round(totalTax * 100) / 100;
    const finalDiscount = Number(discount) || 0;
    const netAmount = Math.max(0, Math.round((finalSubtotal + finalTax - finalDiscount) * 100) / 100);

    const billNumber = await generateBillNumber();

    const bill = await PharmacyBill.create({
      billNumber,
      billType,
      patient: mongoose.Types.ObjectId.isValid(patientId) ? patientId : null,
      patientName: patientName ? patientName.trim() : 'Walk-in Patient',
      patientPhone: patientPhone.trim(),
      prescriptionNumber: prescriptionNumber ? prescriptionNumber.trim() : '',
      doctorName: doctorName.trim(),
      items: processedItems,
      subtotal: finalSubtotal,
      totalTax: finalTax,
      discount: finalDiscount,
      netAmount,
      paymentStatus: 'Paid',
      paymentMethod,
      billedBy: req.user._id,
      notes: notes ? notes.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `Prescription dispensed successfully. Pharmacy Bill #${billNumber} generated.`,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. PHARMACY POS RETAIL BILLING
// ============================================================================

/**
 * @desc    Generate a retail / walk-in pharmacy point-of-sale invoice
 * @route   POST /api/v1/pharmacy/bills
 * @access  Private (Pharmacist, Admin, Receptionist)
 */
export const createPharmacyBill = async (req, res, next) => {
  try {
    const {
      billType = 'Walk-in / Retail',
      patientId,
      patientName,
      patientPhone = '',
      doctorName = 'Self / Over The Counter',
      items,
      discount = 0,
      paymentMethod = 'Cash',
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one medicine item to the billing cart.',
      });
    }

    if (!patientName || patientName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer / patient name is required for pharmacy billing.',
      });
    }

    const now = new Date();
    const processedItems = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const { medicineId, batchNumber, quantity, discountPercent = 0 } = item;

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found.`,
        });
      }

      const batch = medicine.batches.find((b) => b.batchNumber === batchNumber);
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batchNumber} not found for ${medicine.name}.`,
        });
      }

      if (new Date(batch.expiryDate) <= now) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batchNumber} of ${medicine.name} has EXPIRED.`,
        });
      }

      if (batch.quantity < Number(quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock in batch ${batchNumber}. Available: ${batch.quantity}.`,
        });
      }

      // Deduct stock
      batch.quantity -= Number(quantity);
      await medicine.save();

      const unitPrice = Number(batch.mrp || medicine.mrp);
      const taxPercent = Number(medicine.taxPercent || 12);
      const discPct = Number(discountPercent) || 0;

      const itemBase = unitPrice * Number(quantity);
      const itemDisc = (itemBase * discPct) / 100;
      const taxableAmount = itemBase - itemDisc;
      const itemTax = (taxableAmount * taxPercent) / 100;
      const itemTotal = taxableAmount + itemTax;

      subtotal += taxableAmount;
      totalTax += itemTax;

      processedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: Number(quantity),
        unitPrice,
        taxPercent,
        discountPercent: discPct,
        itemTotal: Math.round(itemTotal * 100) / 100,
      });
    }

    const finalSubtotal = Math.round(subtotal * 100) / 100;
    const finalTax = Math.round(totalTax * 100) / 100;
    const finalDiscount = Number(discount) || 0;
    const netAmount = Math.max(0, Math.round((finalSubtotal + finalTax - finalDiscount) * 100) / 100);

    const billNumber = await generateBillNumber();

    const bill = await PharmacyBill.create({
      billNumber,
      billType,
      patient: mongoose.Types.ObjectId.isValid(patientId) ? patientId : null,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      doctorName: doctorName.trim(),
      items: processedItems,
      subtotal: finalSubtotal,
      totalTax: finalTax,
      discount: finalDiscount,
      netAmount,
      paymentStatus: 'Paid',
      paymentMethod,
      billedBy: req.user._id,
      notes: notes ? notes.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `Invoice #${billNumber} generated successfully.`,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pharmacy invoices ledger with search and filters
 * @route   GET /api/v1/pharmacy/bills
 * @access  Private
 */
export const getBills = async (req, res, next) => {
  try {
    const { search, billType, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    // Patient can only view their own pharmacy bills
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }

    if (billType && billType !== 'All') {
      query.billType = billType;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { billNumber: regex },
        { patientName: regex },
        { patientPhone: regex },
        { prescriptionNumber: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, bills] = await Promise.all([
      PharmacyBill.countDocuments(query),
      PharmacyBill.find(query)
        .populate('billedBy', 'name email')
        .sort({ dispensedAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      bills,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single pharmacy invoice details for printing
 * @route   GET /api/v1/pharmacy/bills/:id
 * @access  Private
 */
export const getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await PharmacyBill.findById(id)
      .populate('patient', 'name email phone dateOfBirth gender address')
      .populate('billedBy', 'name email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy bill record not found.',
      });
    }

    // Patient access check
    if (
      req.user.role === 'patient' &&
      bill.patient &&
      bill.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this pharmacy bill.',
      });
    }

    res.status(200).json({
      success: true,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. EXPIRY TRACKING & LOW STOCK ALERTS
// ============================================================================

/**
 * @desc    Get comprehensive pharmacy KPI alerts: low stock, expiring batches, inventory valuation
 * @route   GET /api/v1/pharmacy/alerts
 * @access  Private
 */
export const getPharmacyAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const medicines = await Medicine.find({ isActive: true });

    const lowStockMedicines = [];
    const outOfStockMedicines = [];
    const expiredBatches = [];
    const criticalExpiryBatches = []; // < 30 days
    const nearExpiryBatches = []; // 30 - 90 days

    let totalCostValuation = 0;
    let totalMrpValuation = 0;
    let totalValidPills = 0;

    medicines.forEach((med) => {
      let validStock = 0;

      (med.batches || []).forEach((b) => {
        const exp = new Date(b.expiryDate);
        const qty = b.quantity || 0;

        if (exp <= now) {
          if (qty > 0) {
            expiredBatches.push({
              medicineId: med._id,
              itemCode: med.itemCode,
              name: med.name,
              genericName: med.genericName,
              rackLocation: med.rackLocation,
              batchNumber: b.batchNumber,
              quantity: qty,
              expiryDate: b.expiryDate,
              mrp: b.mrp,
            });
          }
        } else {
          validStock += qty;
          totalValidPills += qty;
          totalCostValuation += qty * (b.purchasePrice || med.unitPrice);
          totalMrpValuation += qty * (b.mrp || med.mrp);

          if (exp <= thirtyDaysFromNow && qty > 0) {
            const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            criticalExpiryBatches.push({
              medicineId: med._id,
              itemCode: med.itemCode,
              name: med.name,
              genericName: med.genericName,
              rackLocation: med.rackLocation,
              batchNumber: b.batchNumber,
              quantity: qty,
              expiryDate: b.expiryDate,
              daysRemaining: daysLeft,
              mrp: b.mrp,
            });
          } else if (exp <= ninetyDaysFromNow && qty > 0) {
            const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            nearExpiryBatches.push({
              medicineId: med._id,
              itemCode: med.itemCode,
              name: med.name,
              genericName: med.genericName,
              rackLocation: med.rackLocation,
              batchNumber: b.batchNumber,
              quantity: qty,
              expiryDate: b.expiryDate,
              daysRemaining: daysLeft,
              mrp: b.mrp,
            });
          }
        }
      });

      if (validStock === 0) {
        outOfStockMedicines.push({
          medicineId: med._id,
          itemCode: med.itemCode,
          name: med.name,
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm,
          reorderLevel: med.reorderLevel,
          currentStock: 0,
          shortfall: med.reorderLevel,
          unitPrice: med.unitPrice || 0,
          mrp: med.mrp || 0,
          manufacturer: med.manufacturer || 'Hospital Pharma Supplies',
          rackLocation: med.rackLocation,
        });
      } else if (validStock <= med.reorderLevel) {
        lowStockMedicines.push({
          medicineId: med._id,
          itemCode: med.itemCode,
          name: med.name,
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm,
          reorderLevel: med.reorderLevel,
          currentStock: validStock,
          shortfall: med.reorderLevel - validStock,
          unitPrice: med.unitPrice || 0,
          mrp: med.mrp || 0,
          manufacturer: med.manufacturer || 'Hospital Pharma Supplies',
          rackLocation: med.rackLocation,
        });
      }
    });

    // Compute today's pharmacy revenue
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayBills = await PharmacyBill.find({
      dispensedAt: { $gte: startOfToday },
      paymentStatus: 'Paid',
    });

    const todaySalesRevenue = todayBills.reduce((acc, b) => acc + (b.netAmount || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalMedicinesCount: medicines.length,
        totalValidUnitsInStock: totalValidPills,
        costValuation: Math.round(totalCostValuation),
        mrpValuation: Math.round(totalMrpValuation),
        todaySalesRevenue: Math.round(todaySalesRevenue),
        todayBillsCount: todayBills.length,
        lowStockCount: lowStockMedicines.length,
        outOfStockCount: outOfStockMedicines.length,
        criticalExpiryCount: criticalExpiryBatches.length,
        nearExpiryCount: nearExpiryBatches.length,
        expiredBatchesCount: expiredBatches.length,
      },
      lowStockMedicines,
      outOfStockMedicines,
      criticalExpiryBatches,
      nearExpiryBatches,
      expiredBatches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reconcile & Synchronize medicine batches, current stock, and alert thresholds
 * @route   POST /api/v1/pharmacy/sync
 * @access  Private
 */
export const syncInventory = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ isActive: true });
    let reconciledCount = 0;
    let totalStockUnits = 0;
    const now = new Date();

    for (const med of medicines) {
      const calculatedStock = (med.batches || []).reduce(
        (acc, b) => acc + (Number(b.quantity) || 0),
        0
      );
      totalStockUnits += calculatedStock;

      if (med.currentStock !== calculatedStock) {
        med.currentStock = calculatedStock;
        await med.save();
        reconciledCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Inventory successfully synchronized! ${medicines.length} formulations checked, ${reconciledCount} stock counters reconciled.`,
      data: {
        totalFormulations: medicines.length,
        reconciledCount,
        totalStockUnits,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
