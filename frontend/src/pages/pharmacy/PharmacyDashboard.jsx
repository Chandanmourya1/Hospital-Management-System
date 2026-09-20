import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import pharmacyService from '../../services/pharmacyService';
import toast from 'react-hot-toast';
import {
  Pill,
  Package,
  Layers,
  ShoppingBag,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertOctagon,
  Printer,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw,
  Edit3,
  ShoppingCart,
  Trash2,
  ChevronRight,
  ClipboardList,
  Check,
  Building,
  Phone,
  Barcode,
  Truck,
  PlusCircle,
  HelpCircle,
  Stethoscope,
  Info,
  Eye,
} from 'lucide-react';
import { ResponsiveModal } from '../../components/common';

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'catalog' | 'batches' | 'purchases' | 'dispense' | 'alerts' | 'pos'
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [isPreviewReorderModalOpen, setIsPreviewReorderModalOpen] = useState(false);

  // KPIs & Alerts
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [lowStockList, setLowStockList] = useState([]);
  const [expiredList, setExpiredList] = useState([]);
  const [criticalExpiryList, setCriticalExpiryList] = useState([]);
  const [nearExpiryList, setNearExpiryList] = useState([]);

  // Tab 1: Catalog
  const [medicines, setMedicines] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);

  // Tab 2: Batches & Adjustments
  const [selectedMedicineForAdjust, setSelectedMedicineForAdjust] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    batchNumber: '',
    newQuantity: '',
    reason: 'Stock Audit Reconciliation',
  });

  // Tab 3: Purchases
  const [purchases, setPurchases] = useState([]);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [purchaseSearch, setPurchaseSearch] = useState('');

  // Tab 4: Prescription Dispensing
  const [rxQuery, setRxQuery] = useState('RX-1001');
  const [rxDispenseData, setRxDispenseData] = useState(null);
  const [rxLoading, setRxLoading] = useState(false);
  const [dispensePaymentMethod, setDispensePaymentMethod] = useState('UPI / QR');
  const [dispenseDiscount, setDispenseDiscount] = useState(0);
  const [dispenseItemsState, setDispenseItemsState] = useState({});

  // Tab 6: POS Retail Counter
  const [posPatientName, setPosPatientName] = useState('Walk-in Customer');
  const [posPatientPhone, setPosPatientPhone] = useState('');
  const [posDoctorName, setPosDoctorName] = useState('Over The Counter');
  const [posPaymentMethod, setPosPaymentMethod] = useState('Cash');
  const [posDiscount, setPosDiscount] = useState(0);
  const [posCart, setPosCart] = useState([]);
  const [posSearchTerm, setPosSearchTerm] = useState('');

  // Forms
  const [newMedicineForm, setNewMedicineForm] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    rackLocation: 'Rack A-1, Shelf 1',
    unitPrice: '',
    mrp: '',
    taxPercent: 12,
    reorderLevel: 50,
    description: '',
    initialBatchNumber: '',
    initialBatchQuantity: '',
    initialBatchExpiry: '',
  });

  const [newPurchaseForm, setNewPurchaseForm] = useState({
    supplier: 'Apex Pharma Logistics Ltd',
    supplierContact: '+91 99880 11223',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    discount: 0,
    notes: '',
    items: [
      {
        medicineId: '',
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        quantity: 100,
        unitCost: 10,
        mrp: 18,
        taxPercent: 12,
      },
    ],
  });

  // Fetch initial dashboard data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAlerts(),
        fetchCatalog(),
        fetchPurchases(),
      ]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pharmacy dashboard records');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncInventory = async () => {
    try {
      setIsSyncing(true);
      const res = await pharmacyService.syncInventory();
      await loadAllData();
      setLastSyncedAt(new Date());
      toast.success(res.message || 'Inventory synchronized! Stock counters, batches & alerts updated.');
    } catch (err) {
      console.error('Error syncing inventory:', err);
      toast.error(err.response?.data?.message || 'Failed to sync inventory.');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await pharmacyService.getAlerts();
      if (data.success) {
        setAlertsSummary(data.summary);
        setLowStockList(data.lowStockMedicines || []);
        setExpiredList(data.expiredBatches || []);
        setCriticalExpiryList(data.criticalExpiryBatches || []);
        setNearExpiryList(data.nearExpiryBatches || []);
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const params = {
        limit: 100,
      };
      if (catalogSearch.trim()) params.search = catalogSearch.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (stockFilter !== 'all') params.stockStatus = stockFilter;

      const data = await pharmacyService.getInventory(params);
      if (data.success) {
        setMedicines(data.medicines || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const data = await pharmacyService.getPurchases({ limit: 50 });
      if (data.success) {
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  // Re-fetch catalog on search or filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 250);
    return () => clearTimeout(timer);
  }, [catalogSearch, selectedCategory, stockFilter]);

  // Handle Prescription Lookup for Dispensing
  const handleLookupPrescription = async (e) => {
    if (e) e.preventDefault();
    if (!rxQuery.trim()) {
      toast.error('Please enter a prescription number (e.g. RX-1001)');
      return;
    }
    try {
      setRxLoading(true);
      const data = await pharmacyService.getPrescriptionForDispensing(rxQuery.trim());
      if (data.success) {
        setRxDispenseData(data);
        // Initialize default selection of suggested FEFO batches
        const initItems = {};
        (data.medicines || []).forEach((item, idx) => {
          if (item.availableMedicine && item.fefoBatch) {
            initItems[idx] = {
              selected: true,
              medicineId: item.availableMedicine._id,
              batchNumber: item.fefoBatch.batchNumber,
              quantity: Math.min(10, item.fefoBatch.quantity),
              unitPrice: item.fefoBatch.mrp,
              taxPercent: item.availableMedicine.taxPercent || 12,
              discountPercent: 0,
            };
          } else {
            initItems[idx] = {
              selected: false,
              medicineId: item.availableMedicine?._id || '',
              batchNumber: '',
              quantity: 0,
              unitPrice: 0,
              taxPercent: 12,
              discountPercent: 0,
            };
          }
        });
        setDispenseItemsState(initItems);
        toast.success(`Prescription ${data.prescriptionNumber} loaded successfully!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Prescription not found');
      setRxDispenseData(null);
    } finally {
      setRxLoading(false);
    }
  };

  // Calculate Dispense Totals
  const calculateDispenseTotals = () => {
    if (!rxDispenseData || !rxDispenseData.medicines) return { subtotal: 0, tax: 0, net: 0 };
    let sub = 0;
    let tax = 0;
    Object.keys(dispenseItemsState).forEach((key) => {
      const item = dispenseItemsState[key];
      if (item && item.selected && item.quantity > 0) {
        const itemBase = Number(item.unitPrice) * Number(item.quantity);
        const itemTax = (itemBase * Number(item.taxPercent)) / 100;
        sub += itemBase;
        tax += itemTax;
      }
    });
    const disc = Number(dispenseDiscount) || 0;
    const net = Math.max(0, sub + tax - disc);
    return {
      subtotal: Math.round(sub * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      net: Math.round(net * 100) / 100,
    };
  };

  // Submit Dispense Action
  const handleDispenseSubmit = async () => {
    if (!rxDispenseData) return;

    const itemsToDispense = [];
    Object.keys(dispenseItemsState).forEach((key) => {
      const item = dispenseItemsState[key];
      if (item && item.selected && item.quantity > 0 && item.medicineId && item.batchNumber) {
        itemsToDispense.push({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          quantity: Number(item.quantity),
          discountPercent: Number(item.discountPercent) || 0,
        });
      }
    });

    if (itemsToDispense.length === 0) {
      toast.error('Please select at least one valid in-stock medicine item to dispense.');
      return;
    }

    try {
      const payload = {
        prescriptionNumber: rxDispenseData.prescriptionNumber,
        billType: rxDispenseData.prescriptionType || 'Outpatient (OPD)',
        patientId: rxDispenseData.patient?._id,
        patientName: rxDispenseData.patient?.name || 'Patient',
        patientPhone: rxDispenseData.patient?.phone || '',
        doctorName: rxDispenseData.doctor?.name || 'Consulting Physician',
        paymentMethod: dispensePaymentMethod,
        discount: Number(dispenseDiscount) || 0,
        items: itemsToDispense,
        notes: `Dispensed at Central Pharmacy by ${user?.name}`,
      };

      const res = await pharmacyService.dispensePrescription(payload);
      if (res.success) {
        toast.success(`Prescription dispensed! Bill #${res.bill?.billNumber} created.`);
        // Reload all alerts and catalog to reflect decremented stock
        loadAllData();
        // Redirect to printable invoice view
        navigate(`/pharmacy/invoices/${res.bill._id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error processing prescription dispensing');
    }
  };

  // Add Medicine to POS Cart
  const handleAddToCart = (med, batch) => {
    if (!batch || batch.quantity <= 0) {
      toast.error('Selected batch has no stock remaining.');
      return;
    }
    const existingIndex = posCart.findIndex(
      (c) => c.medicineId === med._id && c.batchNumber === batch.batchNumber
    );

    if (existingIndex >= 0) {
      const updated = [...posCart];
      if (updated[existingIndex].quantity + 1 > batch.quantity) {
        toast.error(`Cannot add more than ${batch.quantity} available units in batch.`);
        return;
      }
      updated[existingIndex].quantity += 1;
      setPosCart(updated);
    } else {
      setPosCart([
        ...posCart,
        {
          medicineId: med._id,
          name: med.name,
          genericName: med.genericName,
          dosageForm: med.dosageForm,
          batchNumber: batch.batchNumber,
          maxAvailable: batch.quantity,
          expiryDate: batch.expiryDate,
          unitPrice: batch.mrp || med.mrp,
          taxPercent: med.taxPercent || 12,
          quantity: 1,
          discountPercent: 0,
        },
      ]);
    }
    toast.success(`Added ${med.name} (Batch: ${batch.batchNumber}) to cart`);
  };

  // POS Cart item operations
  const updateCartQty = (idx, delta) => {
    const updated = [...posCart];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else if (newQty > updated[idx].maxAvailable) {
      toast.error(`Only ${updated[idx].maxAvailable} units available in this batch.`);
      return;
    } else {
      updated[idx].quantity = newQty;
    }
    setPosCart(updated);
  };

  const removeCartItem = (idx) => {
    const updated = [...posCart];
    updated.splice(idx, 1);
    setPosCart(updated);
  };

  // Calculate POS Cart Totals
  const calculatePosTotals = () => {
    let sub = 0;
    let tax = 0;
    posCart.forEach((item) => {
      const itemBase = Number(item.unitPrice) * Number(item.quantity);
      const itemTax = (itemBase * Number(item.taxPercent)) / 100;
      sub += itemBase;
      tax += itemTax;
    });
    const disc = Number(posDiscount) || 0;
    const net = Math.max(0, sub + tax - disc);
    return {
      subtotal: Math.round(sub * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      net: Math.round(net * 100) / 100,
    };
  };

  // Checkout POS Cart
  const handlePosCheckout = async () => {
    if (posCart.length === 0) {
      toast.error('Cart is empty. Please add items to checkout.');
      return;
    }
    if (!posPatientName.trim()) {
      toast.error('Customer / patient name is required.');
      return;
    }

    try {
      const itemsPayload = posCart.map((item) => ({
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        discountPercent: item.discountPercent || 0,
      }));

      const payload = {
        billType: 'Walk-in / Retail',
        patientName: posPatientName.trim(),
        patientPhone: posPatientPhone.trim(),
        doctorName: posDoctorName.trim() || 'Over The Counter',
        paymentMethod: posPaymentMethod,
        discount: Number(posDiscount) || 0,
        items: itemsPayload,
        notes: 'Retail POS Sale at Pharmacy Counter',
      };

      const res = await pharmacyService.createPharmacyBill(payload);
      if (res.success) {
        toast.success(`Retail Invoice #${res.bill?.billNumber} generated!`);
        setPosCart([]);
        loadAllData();
        navigate(`/pharmacy/invoices/${res.bill._id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error processing POS checkout');
    }
  };

  // Submit New Medicine
  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicineForm.name || !newMedicineForm.genericName || !newMedicineForm.manufacturer) {
      toast.error('Medicine name, generic name, and manufacturer are required.');
      return;
    }
    try {
      const payload = {
        name: newMedicineForm.name,
        genericName: newMedicineForm.genericName,
        category: newMedicineForm.category,
        dosageForm: newMedicineForm.dosageForm,
        strength: newMedicineForm.strength,
        manufacturer: newMedicineForm.manufacturer,
        rackLocation: newMedicineForm.rackLocation,
        unitPrice: Number(newMedicineForm.unitPrice) || 0,
        mrp: Number(newMedicineForm.mrp) || 0,
        taxPercent: Number(newMedicineForm.taxPercent) || 12,
        reorderLevel: Number(newMedicineForm.reorderLevel) || 50,
        description: newMedicineForm.description,
      };

      if (newMedicineForm.initialBatchNumber && newMedicineForm.initialBatchQuantity) {
        payload.initialBatch = {
          batchNumber: newMedicineForm.initialBatchNumber,
          quantity: Number(newMedicineForm.initialBatchQuantity),
          purchasePrice: Number(newMedicineForm.unitPrice) || 0,
          mrp: Number(newMedicineForm.mrp) || 0,
          expiryDate: newMedicineForm.initialBatchExpiry || new Date(Date.now() + 365 * 86400000),
          supplier: 'Initial Setup Inward',
        };
      }

      const res = await pharmacyService.createMedicine(payload);
      if (res.success) {
        toast.success(`Medicine ${res.medicine.name} added with code ${res.medicine.itemCode}!`);
        setIsAddMedicineModalOpen(false);
        setNewMedicineForm({
          name: '',
          genericName: '',
          category: 'Antibiotic',
          dosageForm: 'Tablet',
          strength: '',
          manufacturer: '',
          rackLocation: 'Rack A-1, Shelf 1',
          unitPrice: '',
          mrp: '',
          taxPercent: 12,
          reorderLevel: 50,
          description: '',
          initialBatchNumber: '',
          initialBatchQuantity: '',
          initialBatchExpiry: '',
        });
        loadAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  // Submit Stock Adjustment
  const handleStockAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicineForAdjust || !adjustForm.batchNumber || adjustForm.newQuantity === '') {
      toast.error('Please select batch and enter reconciled quantity.');
      return;
    }
    try {
      const res = await pharmacyService.adjustStock(selectedMedicineForAdjust._id, {
        batchNumber: adjustForm.batchNumber,
        newQuantity: Number(adjustForm.newQuantity),
        reason: adjustForm.reason,
      });
      if (res.success) {
        toast.success(res.message);
        setIsAdjustModalOpen(false);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  // Submit Procurement Purchase
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!newPurchaseForm.supplier || !newPurchaseForm.invoiceNumber) {
      toast.error('Supplier and Invoice Number are required.');
      return;
    }
    for (const it of newPurchaseForm.items) {
      if (!it.medicineId || !it.batchNumber || !it.expiryDate || !it.quantity || !it.unitCost) {
        toast.error('All purchase items must have medicine, batch #, expiry date, quantity, and cost.');
        return;
      }
    }

    try {
      const res = await pharmacyService.recordPurchase(newPurchaseForm);
      if (res.success) {
        toast.success(`Purchase Order #${res.purchase.purchaseNumber} recorded! Stock incremented.`);
        setIsAddPurchaseModalOpen(false);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving purchase order');
    }
  };

  const addPurchaseLineItem = () => {
    setNewPurchaseForm({
      ...newPurchaseForm,
      items: [
        ...newPurchaseForm.items,
        {
          medicineId: '',
          batchNumber: '',
          manufacturingDate: '',
          expiryDate: '',
          quantity: 100,
          unitCost: 10,
          mrp: 18,
          taxPercent: 12,
        },
      ],
    });
  };

  const removePurchaseLineItem = (idx) => {
    if (newPurchaseForm.items.length <= 1) return;
    const items = [...newPurchaseForm.items];
    items.splice(idx, 1);
    setNewPurchaseForm({ ...newPurchaseForm, items });
  };

  const updatePurchaseItem = (idx, field, val) => {
    const items = [...newPurchaseForm.items];
    items[idx][field] = val;

    // Auto-fill defaults if medicine selected
    if (field === 'medicineId') {
      const med = medicines.find((m) => m._id === val);
      if (med) {
        items[idx].unitCost = med.unitPrice || 10;
        items[idx].mrp = med.mrp || 18;
        items[idx].taxPercent = med.taxPercent || 12;
      }
    }
    setNewPurchaseForm({ ...newPurchaseForm, items });
  };

  // Helper date formatter
  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpired = (date) => new Date(date) <= new Date();

  const getDaysRemaining = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Dedicated NABH Hospital-Grade Reorder Sheet Component Content
  const renderReorderSheetContent = (isModal = false) => {
    const totalDeficit = lowStockList.reduce((sum, item) => sum + (Number(item.shortfall) || 0), 0);
    const totalEstCost = lowStockList.reduce((sum, item) => {
      const price = Number(item.unitPrice) || Number(item.mrp) * 0.7 || 15;
      const roq = Math.max(Number(item.shortfall) * 2, Number(item.reorderLevel));
      return sum + (roq * price);
    }, 0);
    const totalRoqUnits = lowStockList.reduce((sum, item) => {
      return sum + Math.max(Number(item.shortfall) * 2, Number(item.reorderLevel));
    }, 0);

    const reqNumber = `REQ-PHARM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(lowStockList.length).padStart(3, '0')}`;
    const reqDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className={`w-full bg-white text-slate-950 ${isModal ? 'p-1' : 'p-6'}`}>
        {/* Official Hospital Letterhead */}
        <div className="border-b-2 border-slate-950 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xl tracking-tighter shrink-0">
                MC
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
                  MedCare Multi-Speciality Hospital
                </h1>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Centre for Clinical Excellence & Patient Care • NABH Accredited
                </p>
                <p className="text-[11px] text-slate-600">
                  100 Healthcare Boulevard, Metro City • Central Pharmacy & Drug Store Division • Helpline: +91 1800-456-7890
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block border-2 border-slate-950 bg-slate-100 text-slate-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded">
                NABH Purchase Requisition
              </span>
              <p className="text-[10px] font-mono text-slate-600 mt-1">Form Ref: NABH-PHARM-PO-04</p>
            </div>
          </div>
        </div>

        {/* Document Title Banner */}
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-800" />
              Pharmacy Purchase Requisition & Stock Reorder Sheet
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Material Management Notice: Safety stock buffer deficits & critical replenishment demand
            </p>
          </div>
          <div className="text-left sm:text-right font-mono text-[11px] shrink-0">
            <div><strong>Requisition No:</strong> {reqNumber}</div>
            <div><strong>Date & Time:</strong> {reqDate}</div>
            <div><strong>Prepared By:</strong> {user?.name || 'Pharmacist'} ({user?.role?.toUpperCase() || 'CHIEF PHARMACIST'})</div>
          </div>
        </div>

        {/* 4-Stat Summary KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
            <div className="text-[10px] font-bold uppercase text-slate-500">Deficit Line Items</div>
            <div className="text-lg font-black text-slate-950 mt-0.5">{lowStockList.length} Formulations</div>
          </div>
          <div className="border border-rose-200 rounded-lg p-2.5 bg-rose-50/60">
            <div className="text-[10px] font-bold uppercase text-rose-700">Net Stock Deficit</div>
            <div className="text-lg font-black text-rose-700 mt-0.5">{totalDeficit} Units</div>
          </div>
          <div className="border border-teal-200 rounded-lg p-2.5 bg-teal-50/60">
            <div className="text-[10px] font-bold uppercase text-teal-800">Recommended Order (ROQ)</div>
            <div className="text-lg font-black text-teal-800 mt-0.5">{totalRoqUnits} Units</div>
          </div>
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
            <div className="text-[10px] font-bold uppercase text-slate-500">Est. Procurement Budget</div>
            <div className="text-lg font-black text-slate-950 mt-0.5">₹{Math.round(totalEstCost).toLocaleString()}</div>
          </div>
        </div>

        {/* Detailed Reorder Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2 px-2.5 border-r border-slate-200 text-center w-8">#</th>
                <th className="py-2 px-2.5 border-r border-slate-200">Item Code</th>
                <th className="py-2 px-3 border-r border-slate-200">Medicine Formulation & Generic Name</th>
                <th className="py-2 px-2.5 border-r border-slate-200">Category</th>
                <th className="py-2 px-2.5 border-r border-slate-200">Location</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">Current Stock</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">Reorder Level</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right text-rose-700">Shortfall</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right font-black">ROQ (Units)</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">Est. Cost (₹)</th>
                <th className="py-2 px-2.5 text-right">Est. Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lowStockList.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-500">
                    No active medicines are below their safety threshold level. All stock levels are compliant.
                  </td>
                </tr>
              ) : (
                lowStockList.map((item, idx) => {
                  const estPrice = Number(item.unitPrice) || Number(item.mrp) * 0.7 || 15;
                  const roq = Math.max(Number(item.shortfall) * 2, Number(item.reorderLevel));
                  const lineTotal = roq * estPrice;
                  return (
                    <tr key={item.itemCode || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono text-[10px] text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono font-bold text-slate-900">{item.itemCode}</td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-950">{item.name}</div>
                        <div className="text-[10px] text-slate-500 italic">{item.genericName}</div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">{item.category}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-[10px] text-slate-600">{item.rackLocation || 'General Shelf'}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-right font-bold text-amber-700">{item.currentStock}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-right font-semibold text-slate-700">{item.reorderLevel}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-right font-black text-rose-700">+{item.shortfall}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-right font-black text-slate-950">{roq}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-right font-mono text-slate-700">₹{estPrice.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {lowStockList.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                <tr>
                  <td colSpan="7" className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider text-slate-700">Total Purchase Requisition Estimates:</td>
                  <td className="py-2.5 px-2.5 text-right font-black text-rose-700">+{totalDeficit}</td>
                  <td className="py-2.5 px-2.5 text-right font-black text-slate-950">{totalRoqUnits}</td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200"></td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-950">₹{Math.round(totalEstCost).toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Quality & NABH Compliance Directives */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 text-[10px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
            NABH Hospital Quality & Consignment Acceptance Protocol:
          </div>
          <p>1. All delivered stock must have a minimum remaining shelf life of 18 months from the date of inward delivery.</p>
          <p>2. Temperature-sensitive items (Insulin, Vaccines, IV Fluids) must be delivered with unbroken cold-chain verification (&lt; 8°C).</p>
          <p>3. Manufacturer Certificate of Analysis (COA) and batch test reports must accompany the delivery invoice.</p>
        </div>

        {/* Official Tripartite Authorization Block */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-300 text-xs">
          <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center">
            <div className="h-10 flex items-end justify-center font-serif text-slate-400 italic text-[11px]">
              {user?.name || 'Authorized Pharmacist'}
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 text-[11px]">
              Prepared By: Pharmacist In-Charge
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Signature & Date</div>
          </div>

          <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center">
            <div className="h-10 flex items-end justify-center font-serif text-slate-400 italic text-[11px]">
              Verified & Stock Audited
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 text-[11px]">
              Verified By: Central Store Auditor
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Signature & Date</div>
          </div>

          <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center">
            <div className="h-10 flex items-end justify-center font-serif text-slate-400 italic text-[11px]">
              Approved for Purchase Order
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 text-[11px]">
              Approved By: Medical Superintendent
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Official Stamp & Date</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Printable Reorder Sheet ONLY visible on window.print() */}
      <div id="pharmacy-reorder-sheet" className="hidden print:block">
        {renderReorderSheetContent(false)}
      </div>

      {/* Screen-Only Interactive Dashboard */}
      <div className="print:hidden">
        {/* Top Banner / Hero Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white shadow-lg">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 sm:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white/20 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5" /> Department of Pharmacy & Logistics
                  </span>
                  <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> FEFO Enabled
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight text-white flex items-center gap-2">
                  Pharmacy Management & Dispensing
                </h1>
                <p className="text-emerald-100/90 text-xs sm:text-sm mt-0.5">
                  Central Dispensary • Batch-wise FEFO Control • Inpatient/OPD Prescription Processing • Retail POS
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleSyncInventory}
                  disabled={isSyncing || loading}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition border border-white/20 shadow-sm cursor-pointer disabled:opacity-60"
                  title="Reconcile batches, recalculate stock, and update live alerts"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Inventory'}</span>
                </button>
                {lastSyncedAt && (
                  <span className="hidden sm:inline-flex items-center text-[10px] text-emerald-200 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-400/30">
                    Synced {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddMedicineModalOpen(true)}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Formulation
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseModalOpen(true)}
                  className="bg-emerald-950/50 hover:bg-emerald-900/60 text-white text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition border border-emerald-400/30 shadow-sm"
                >
                  <Truck className="w-4 h-4" /> Inward Stock
                </button>
              </div>
            </div>

          {/* Quick Alert Banner Ribbon */}
          {alertsSummary && (alertsSummary.expiredBatchesCount > 0 || alertsSummary.criticalExpiryCount > 0 || alertsSummary.lowStockCount > 0) && (
            <div className="mt-5 bg-amber-500/20 border border-amber-400/40 backdrop-blur-md rounded-xl p-3 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                <span>
                  <strong className="text-white">Active Stock Advisories:</strong>{' '}
                  {alertsSummary.expiredBatchesCount > 0 && (
                    <span className="text-rose-200 font-medium mr-2">
                      🚫 {alertsSummary.expiredBatchesCount} Expired Batches Blocked
                    </span>
                  )}
                  {alertsSummary.criticalExpiryCount > 0 && (
                    <span className="text-amber-200 font-medium mr-2">
                      ⏳ {alertsSummary.criticalExpiryCount} Batches Expiring in &lt;30 Days
                    </span>
                  )}
                  {alertsSummary.lowStockCount > 0 && (
                    <span className="text-yellow-200 font-medium">
                      ⚠️ {alertsSummary.lowStockCount} Medicines Below Reorder Level
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('alerts')}
                className="bg-amber-400/30 hover:bg-amber-400/40 text-white px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1"
              >
                View Alerts Center <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 -mt-4">
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {/* Total Formulations */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Catalog Items</span>
              <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
              {alertsSummary?.totalMedicinesCount ?? medicines.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active Formulations</div>
          </div>

          {/* Total Stock Units */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Stock Units</span>
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
              {alertsSummary?.totalValidUnitsInStock?.toLocaleString() ?? '—'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Dispense Ready Units
            </div>
          </div>

          {/* Cost Valuation */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Cost Valuation</span>
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100 truncate">
              ₹{alertsSummary?.costValuation?.toLocaleString() ?? '0'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              Retail: ₹{alertsSummary?.mrpValuation?.toLocaleString() ?? '0'}
            </div>
          </div>

          {/* Today's Sales */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Today's Sales</span>
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              ₹{alertsSummary?.todaySalesRevenue?.toLocaleString() ?? '0'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {alertsSummary?.todayBillsCount ?? 0} Invoices Dispensed
            </div>
          </div>

          {/* Low Stock Warning */}
          <div
            onClick={() => setActiveTab('alerts')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
              alertsSummary?.lowStockCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:bg-amber-100/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-amber-700 dark:text-amber-300">
              <span>Low Stock</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">
              {alertsSummary?.lowStockCount ?? 0}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Under Reorder Level
            </div>
          </div>

          {/* Expiry Risk Count */}
          <div
            onClick={() => setActiveTab('alerts')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
              (alertsSummary?.expiredBatchesCount > 0 || alertsSummary?.criticalExpiryCount > 0)
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 hover:bg-rose-100/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-rose-700 dark:text-rose-300">
              <span>Expiry Alerts</span>
              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">
              {(alertsSummary?.expiredBatchesCount ?? 0) + (alertsSummary?.criticalExpiryCount ?? 0)}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
              {alertsSummary?.expiredBatchesCount ?? 0} Exp / {alertsSummary?.criticalExpiryCount ?? 0} &lt;30d
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto pb-1 hms-scrollbar">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" /> Medicine Catalog ({medicines.length})
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'batches'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" /> Stock & Batches
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'purchases'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-4 h-4" /> Procurement Purchases ({purchases.length})
          </button>

          <button
            onClick={() => setActiveTab('dispense')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dispense'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Prescription Dispensing Desk
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alerts Center
            {(alertsSummary?.lowStockCount > 0 || alertsSummary?.expiredBatchesCount > 0) && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {(alertsSummary?.lowStockCount || 0) + (alertsSummary?.expiredBatchesCount || 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Retail POS Billing ({posCart.length})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MEDICINE CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search brand, generic, rack, code..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Antidiabetic">Antidiabetic</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Antihistamine">Antihistamine</option>
                  <option value="Antacid / PPI">Antacid / PPI</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Stock Status</option>
                  <option value="in_stock">In Stock (&gt; Reorder Level)</option>
                  <option value="low_stock">Low Stock (≤ Reorder Level)</option>
                  <option value="out_of_stock">Out of Stock (0 Units)</option>
                </select>

                <button
                  onClick={() => setIsAddMedicineModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition ml-auto shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>
            </div>

            {/* Medicines Catalog Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Commercial Name & Strength</th>
                      <th className="py-3 px-4">Generic Salt Composition</th>
                      <th className="py-3 px-4">Category / Form</th>
                      <th className="py-3 px-4">Rack Location</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Unit Cost / MRP</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medicines.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-400">
                          No medicines found matching the current search criteria.
                        </td>
                      </tr>
                    ) : (
                      medicines.map((med) => {
                        const isLowStock = med.validStock <= med.reorderLevel && med.validStock > 0;
                        const isOutOfStock = med.validStock === 0;

                        return (
                          <tr
                            key={med._id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-teal-700 dark:text-teal-400">
                              {med.itemCode}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {med.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {med.manufacturer} • {med.strength}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 italic">
                              {med.genericName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
                                {med.category}
                              </span>
                              <span className="text-[11px] text-slate-400">({med.dosageForm})</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                              📍 {med.rackLocation || 'General Shelf'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-100">
                                {med.validStock} units
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Min Level: {med.reorderLevel} • Batches: {med.activeBatchesCount}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                MRP: ₹{med.mrp}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Cost: ₹{med.unitPrice} (+{med.taxPercent}% GST)
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isOutOfStock ? (
                                <span className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Low Stock
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> In Stock
                                </span>
                              )}
                              {med.hasExpiredBatches && (
                                <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                                  ⚠️ Expired batch present
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedMedicineForAdjust(med);
                                  setAdjustForm({
                                    batchNumber: med.batches?.[0]?.batchNumber || '',
                                    newQuantity: med.batches?.[0]?.quantity || 0,
                                    reason: 'Stock Audit Reconciliation',
                                  });
                                  setIsAdjustModalOpen(true);
                                }}
                                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 text-xs font-medium px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-teal-950/40 transition inline-flex items-center gap-1"
                                title="Reconcile physical stock audit"
                              >
                                <Edit3 className="w-3 h-3" /> Reconcile
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STOCK & BATCH MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'batches' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Batch-wise Stock Ledger & Expiry Verification
                </h2>
                <p className="text-xs text-slate-500">
                  Each batch tracks manufacturing dates, expiry horizons, purchase pricing, and strict FEFO ordering.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold px-2 py-1 rounded">
                  Expired = Blocked
                </span>
                <span className="text-xs bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold px-2 py-1 rounded">
                  &lt;30 Days = Critical
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4">Medicine Item</th>
                      <th className="py-3 px-4">Shelf / Rack</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Purchase Price / MRP</th>
                      <th className="py-3 px-4">Manufacturing Date</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Expiry Horizon</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medicines.flatMap((med) =>
                      (med.batches || []).map((batch) => {
                        const expired = isExpired(batch.expiryDate);
                        const daysLeft = getDaysRemaining(batch.expiryDate);
                        const isCritical = !expired && daysLeft <= 30;
                        const isNear = !expired && daysLeft > 30 && daysLeft <= 90;

                        return (
                          <tr
                            key={`${med._id}-${batch.batchNumber}`}
                            className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                              expired
                                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                : isCritical
                                ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {batch.batchNumber}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                {med.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {med.genericName} • {med.dosageForm}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {med.rackLocation}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-xs ${
                                  batch.quantity === 0
                                    ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                }`}
                              >
                                {batch.quantity} units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              <div>Cost: ₹{batch.purchasePrice}</div>
                              <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                                MRP: ₹{batch.mrp}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {formatDate(batch.manufacturingDate)}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              {formatDate(batch.expiryDate)}
                            </td>
                            <td className="py-3 px-4">
                              {expired ? (
                                <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Expired (Strictly Blocked)
                                </span>
                              ) : isCritical ? (
                                <span className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Critical ({daysLeft}d left)
                                </span>
                              ) : isNear ? (
                                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                                  Near Expiry ({daysLeft}d left)
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                                  Valid ({daysLeft}d)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedMedicineForAdjust(med);
                                  setAdjustForm({
                                    batchNumber: batch.batchNumber,
                                    newQuantity: batch.quantity,
                                    reason: expired
                                      ? 'Write-off Expired Batch'
                                      : 'Stock Audit Reconciliation',
                                  });
                                  setIsAdjustModalOpen(true);
                                }}
                                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 text-xs font-medium px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-teal-950/40 transition inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROCUREMENT PURCHASES */}
        {/* ========================================================================= */}
        {activeTab === 'purchases' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Medicine Inward Purchase Orders & Invoices
                </h2>
                <p className="text-xs text-slate-500">
                  Vendor procurement ledger with automated batch registration and atomic stock increments.
                </p>
              </div>
              <button
                onClick={() => setIsAddPurchaseModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Record New Stock Purchase
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Purchase #</th>
                      <th className="py-3 px-4">Vendor / Supplier</th>
                      <th className="py-3 px-4">Invoice Number</th>
                      <th className="py-3 px-4">Purchase Date</th>
                      <th className="py-3 px-4">Items Received</th>
                      <th className="py-3 px-4">Subtotal / Tax</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Received By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-400">
                          No procurement purchase records logged yet.
                        </td>
                      </tr>
                    ) : (
                      purchases.map((pur) => (
                        <tr
                          key={pur._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                            {pur.purchaseNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {pur.supplier}
                            {pur.supplierContact && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                {pur.supplierContact}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {pur.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {formatDate(pur.purchaseDate)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                              {pur.items?.length || 0} line items
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div>₹{pur.subtotal?.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              +₹{pur.taxAmount} GST -₹{pur.discount} disc
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                            ₹{pur.totalAmount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                              {pur.paymentStatus} ({pur.paymentMethod})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                            {pur.receivedBy?.name || 'Pharmacist'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PRESCRIPTION DISPENSING DESK (FEFO) */}
        {/* ========================================================================= */}
        {activeTab === 'dispense' && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="max-w-xl">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Scan / Enter Prescription Number or Outpatient Visit ID
                </label>
                <form onSubmit={handleLookupPrescription} className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. RX-1001 or OPD-1001"
                      value={rxQuery}
                      onChange={(e) => setRxQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-mono font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={rxLoading}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
                  >
                    {rxLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Lookup Prescription
                  </button>
                </form>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  💡 Demo Hint: Prescriptions <strong>RX-1001</strong> (OPD Outpatient) and{' '}
                  <strong>IPD-1001</strong> (Discharge Regimen) are ready for dispensing.
                </div>
              </div>
            </div>

            {/* Loaded Prescription View */}
            {rxDispenseData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Prescribed Items & FEFO Batch Allocations */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Patient & Doctor Card */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold px-2 py-0.5 rounded font-mono">
                          {rxDispenseData.prescriptionNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {rxDispenseData.prescriptionType}
                        </span>
                        {rxDispenseData.isAlreadyDispensed && (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            ⚠️ Already Dispensed (#{rxDispenseData.existingBillNumber})
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-teal-600" />
                        {rxDispenseData.patient?.name || 'Walk-in Patient'}
                        <span className="text-xs font-normal text-slate-400">
                          ({rxDispenseData.patient?.gender || 'N/A'},{' '}
                          {rxDispenseData.patient?.phone || 'No phone'})
                        </span>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:pl-4 border-slate-200 dark:border-slate-800">
                      <div className="text-xs text-slate-400">Consulting Physician:</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {rxDispenseData.doctor?.name || 'Dr. Sarah Jenkins'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Issued: {formatDate(rxDispenseData.prescriptionDate)}
                      </div>
                    </div>
                  </div>

                  {/* Medicines List with FEFO Suggestions */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Prescribed Medicines & FEFO Match
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        First Expired First Out (FEFO) Auto-Allocated
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2">
                      {(rxDispenseData.medicines || []).map((item, idx) => {
                        const itemState = dispenseItemsState[idx] || {};
                        const isAvailable = item.matchStatus === 'Available';
                        const fefo = item.fefoBatch;

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-lg transition ${
                              itemState.selected
                                ? 'bg-teal-50/50 dark:bg-teal-950/20'
                                : 'opacity-70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  disabled={!isAvailable}
                                  checked={!!itemState.selected}
                                  onChange={(e) => {
                                    setDispenseItemsState({
                                      ...dispenseItemsState,
                                      [idx]: {
                                        ...itemState,
                                        selected: e.target.checked,
                                      },
                                    });
                                  }}
                                  className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                                />
                                <div>
                                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {item.prescribedName}
                                  </div>
                                  <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-0.5">
                                    <span>Dosage: <strong>{item.dosage}</strong></span>
                                    <span>•</span>
                                    <span>Freq: <strong>{item.frequency}</strong></span>
                                    <span>•</span>
                                    <span>Duration: <strong>{item.duration}</strong></span>
                                  </div>
                                  {item.instructions && (
                                    <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 italic">
                                      Instructions: {item.instructions}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                {isAvailable ? (
                                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Available in Stock
                                  </span>
                                ) : item.matchStatus === 'Out of Stock' ? (
                                  <span className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Out of Stock
                                  </span>
                                ) : (
                                  <span className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Not in Catalog
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Suggested FEFO Batch Details */}
                            {isAvailable && fefo && (
                              <div className="mt-3 ml-7 bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[11px]">Recommended FEFO Batch: </span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {fefo.batchNumber}
                                  </span>{' '}
                                  <span className="text-emerald-600 font-medium">
                                    (Exp: {formatDate(fefo.expiryDate)})
                                  </span>
                                  <div className="text-[11px] text-slate-400">
                                    Shelf Stock: {fefo.quantity} units • MRP: ₹{fefo.mrp} • Location: {item.availableMedicine?.rackLocation}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] text-slate-500 font-medium">Qty:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={fefo.quantity}
                                    value={itemState.quantity || 1}
                                    onChange={(e) => {
                                      const val = Math.min(fefo.quantity, Math.max(1, parseInt(e.target.value) || 1));
                                      setDispenseItemsState({
                                        ...dispenseItemsState,
                                        [idx]: {
                                          ...itemState,
                                          quantity: val,
                                        },
                                      });
                                    }}
                                    className="w-16 p-1 text-xs text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                  <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">
                                    ₹{((itemState.quantity || 1) * fefo.mrp).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Col: Bill Summary & Dispense Action */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <FileText className="w-4 h-4 text-teal-600" /> Pharmacy Invoice Summary
                    </h3>

                    {/* Totals Breakdown */}
                    {(() => {
                      const totals = calculateDispenseTotals();
                      return (
                        <div className="py-4 space-y-2.5 text-xs">
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Medicines Subtotal</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              ₹{totals.subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Estimated GST Tax</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              ₹{totals.tax.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span>Discount (₹)</span>
                            <input
                              type="number"
                              min="0"
                              value={dispenseDiscount}
                              onChange={(e) => setDispenseDiscount(parseFloat(e.target.value) || 0)}
                              className="w-20 p-1 text-right text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none"
                            />
                          </div>

                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-800 dark:text-slate-100">Net Payable</span>
                            <span className="text-teal-700 dark:text-teal-400 text-base">
                              ₹{totals.net.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Payment Method */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Settlement Payment Method
                      </label>
                      <select
                        value={dispensePaymentMethod}
                        onChange={(e) => setDispensePaymentMethod(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                      >
                        <option value="UPI / QR">UPI / QR Payment</option>
                        <option value="Cash">Cash Counter</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Insurance / TPA">Insurance / TPA Pre-auth</option>
                      </select>
                    </div>

                    {/* Submit Dispense Button */}
                    <button
                      onClick={handleDispenseSubmit}
                      disabled={calculateDispenseTotals().net <= 0}
                      className="w-full mt-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Dispense & Generate Tax Invoice
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Stock will be atomically deducted from allocated FEFO batches.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ALERTS CENTER (EXPIRY & LOW STOCK) */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* 1. Expired Batches (Blocked from dispensing) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-900/60 shadow-sm overflow-hidden">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Expired Batches Quarantine ({expiredList.length})
                    </h3>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Strict NABH Compliance: These batches are completely blocked from being dispensed or billed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Batch Number</th>
                      <th className="py-2.5 px-4">Medicine Item</th>
                      <th className="py-2.5 px-4">Shelf / Rack</th>
                      <th className="py-2.5 px-4">Expired Units</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {expiredList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
                          🎉 Zero expired batches! All inventory batches are currently valid.
                        </td>
                      </tr>
                    ) : (
                      expiredList.map((exp) => (
                        <tr key={exp.batchNumber} className="hover:bg-rose-50/20">
                          <td className="py-2.5 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">
                            {exp.batchNumber}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {exp.name}
                            <div className="text-[10px] text-slate-400">{exp.genericName}</div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            📍 {exp.rackLocation}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-rose-600">
                            {exp.quantity} units
                          </td>
                          <td className="py-2.5 px-4 text-rose-600 font-semibold">
                            {formatDate(exp.expiryDate)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                const med = medicines.find((m) => m._id === exp.medicineId);
                                if (med) {
                                  setSelectedMedicineForAdjust(med);
                                  setAdjustForm({
                                    batchNumber: exp.batchNumber,
                                    newQuantity: 0,
                                    reason: 'Expired Batch Write-Off & Disposal',
                                  });
                                  setIsAdjustModalOpen(true);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50 transition"
                            >
                              Write-Off (0 Qty)
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Critical Expiry (< 30 Days) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-900/60 shadow-sm overflow-hidden">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Critical Expiry Horizon &lt; 30 Days ({criticalExpiryList.length})
                    </h3>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      High urgency: Prioritize for immediate dispensing or initiate vendor return swap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Batch Number</th>
                      <th className="py-2.5 px-4">Medicine Formulation</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Available Units</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {criticalExpiryList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
                          No batches expiring within the next 30 days.
                        </td>
                      </tr>
                    ) : (
                      criticalExpiryList.map((crit) => (
                        <tr key={crit.batchNumber} className="hover:bg-amber-50/20">
                          <td className="py-2.5 px-4 font-mono font-bold text-amber-800 dark:text-amber-300">
                            {crit.batchNumber}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {crit.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            📍 {crit.rackLocation}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {crit.quantity} units
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-amber-700 dark:text-amber-400">
                            {formatDate(crit.expiryDate)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-bold px-2 py-0.5 rounded text-[10px]">
                              ⏳ {crit.daysRemaining} days remaining
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Low Stock & Reorder Shortfall List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Low Stock Reorder Shortfall List ({lowStockList.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Medicines whose valid unexpired stock is below hospital safety threshold.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewReorderModalOpen(true)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
                    title="Preview Official Purchase Requisition & Reorder Sheet"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Preview Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                    title="Print Official NABH Pharmacy Reorder & Material Requisition Sheet"
                  >
                    <Printer className="w-3.5 h-3.5 text-white" />
                    <span>Print Reorder Sheet</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Item Code</th>
                      <th className="py-2.5 px-4">Medicine Formulation</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Rack Location</th>
                      <th className="py-2.5 px-4">Available Stock</th>
                      <th className="py-2.5 px-4">Reorder Level</th>
                      <th className="py-2.5 px-4">Shortfall To Procure</th>
                      <th className="py-2.5 px-4 text-right">Procure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lowStockList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-6 text-center text-slate-400">
                          All medicine stock levels are safely above their reorder thresholds!
                        </td>
                      </tr>
                    ) : (
                      lowStockList.map((med) => (
                        <tr key={med.itemCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                            {med.itemCode}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {med.name}
                            <div className="text-[10px] text-slate-400">{med.genericName}</div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                            {med.category}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            📍 {med.rackLocation}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-amber-600">
                            {med.currentStock} units
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                            {med.reorderLevel} units
                          </td>
                          <td className="py-2.5 px-4 font-bold text-rose-600">
                            +{med.shortfall} units needed
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setNewPurchaseForm({
                                  ...newPurchaseForm,
                                  items: [
                                    {
                                      medicineId: med.medicineId,
                                      batchNumber: '',
                                      manufacturingDate: '',
                                      expiryDate: '',
                                      quantity: med.shortfall * 2,
                                      unitCost: 10,
                                      mrp: 18,
                                      taxPercent: 12,
                                    },
                                  ],
                                });
                                setIsAddPurchaseModalOpen(true);
                              }}
                              className="text-teal-600 hover:text-teal-700 font-semibold text-xs px-2 py-1 rounded hover:bg-teal-50 transition inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> PO
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: POINT-OF-SALE (POS) RETAIL BILLING */}
        {/* ========================================================================= */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Medicine Search & Selector */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Quick search medicine name or generic composition..."
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medicine Grid for Fast Pick */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {medicines
                  .filter((m) => {
                    if (!posSearchTerm.trim()) return true;
                    const q = posSearchTerm.toLowerCase();
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.genericName.toLowerCase().includes(q) ||
                      m.itemCode.toLowerCase().includes(q)
                    );
                  })
                  .map((med) => {
                    const validBatches = (med.batches || []).filter(
                      (b) => !isExpired(b.expiryDate) && b.quantity > 0
                    );

                    return (
                      <div
                        key={med._id}
                        className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                {med.name}
                              </div>
                              <div className="text-[11px] text-slate-500 italic">
                                {med.genericName}
                              </div>
                            </div>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                              {med.itemCode}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs mt-2 text-slate-600 dark:text-slate-400">
                            <span>Form: {med.dosageForm}</span>
                            <span>📍 {med.rackLocation}</span>
                          </div>
                        </div>

                        {/* Batch Selector & Add Button */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          {validBatches.length === 0 ? (
                            <span className="text-[11px] text-rose-500 font-semibold">
                              Out of stock
                            </span>
                          ) : (
                            <>
                              <div className="text-xs">
                                <span className="text-slate-400 text-[10px]">FEFO Batch: </span>
                                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                                  {validBatches[0].batchNumber}
                                </span>
                                <div className="text-teal-600 dark:text-teal-400 font-bold text-xs">
                                  ₹{validBatches[0].mrp}
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddToCart(med, validBatches[0])}
                                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Col: POS Billing Cart */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-teal-600" /> Active Cart ({posCart.length})
                  </h3>
                  {posCart.length > 0 && (
                    <button
                      onClick={() => setPosCart([])}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Customer Details Form */}
                <div className="py-3 space-y-2 text-xs border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      Customer / Patient Name *
                    </label>
                    <input
                      type="text"
                      value={posPatientName}
                      onChange={(e) => setPosPatientName(e.target.value)}
                      placeholder="e.g. Mr. Rajesh Kumar"
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={posPatientPhone}
                        onChange={(e) => setPosPatientPhone(e.target.value)}
                        placeholder="+91..."
                        className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                        Prescribing Doctor
                      </label>
                      <input
                        type="text"
                        value={posDoctorName}
                        onChange={(e) => setPosDoctorName(e.target.value)}
                        placeholder="Over The Counter"
                        className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="py-3 divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {posCart.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Cart is empty. Click "+ Add" on medicines to begin retail billing.
                    </div>
                  ) : (
                    posCart.map((item, idx) => (
                      <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Batch: {item.batchNumber} • ₹{item.unitPrice} each
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Qty Controls */}
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded">
                            <button
                              onClick={() => updateCartQty(idx, -1)}
                              className="px-2 py-0.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(idx, 1)}
                              className="px-2 py-0.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              +
                            </button>
                          </div>

                          <div className="w-16 text-right font-bold text-slate-800 dark:text-slate-200">
                            ₹{(item.quantity * item.unitPrice).toFixed(2)}
                          </div>

                          <button
                            onClick={() => removeCartItem(idx)}
                            className="text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Billing Summary Totals */}
                {(() => {
                  const totals = calculatePosTotals();
                  return (
                    <div className="py-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Items Subtotal</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ₹{totals.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>GST Tax</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ₹{totals.tax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Special Discount (₹)</span>
                        <input
                          type="number"
                          min="0"
                          value={posDiscount}
                          onChange={(e) => setPosDiscount(parseFloat(e.target.value) || 0)}
                          className="w-16 p-1 text-right text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold">
                        <span>Grand Total</span>
                        <span className="text-teal-700 dark:text-teal-400 text-lg">
                          ₹{totals.net.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Selector & Checkout */}
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={posPaymentMethod}
                      onChange={(e) => setPosPaymentMethod(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                    </select>
                  </div>

                  <button
                    onClick={handlePosCheckout}
                    disabled={posCart.length === 0}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Checkout & Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW MEDICINE FORMULATION */}
      {/* ========================================================================= */}
      {isAddMedicineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-600" /> Add Medicine Formulation
                </h3>
                <p className="text-xs text-slate-500">
                  Register commercial brand, generic salt, rack coordinates, and initial inventory batch.
                </p>
              </div>
              <button
                onClick={() => setIsAddMedicineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commercial Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625 Duo Tablet"
                    value={newMedicineForm.name}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, name: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Generic Salt Composition *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin & Potassium Clavulanate"
                    value={newMedicineForm.genericName}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, genericName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={newMedicineForm.category}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, category: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Antihistamine">Antihistamine</option>
                    <option value="Antacid / PPI">Antacid / PPI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newMedicineForm.dosageForm}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, dosageForm: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                    <option value="Suspension">Suspension</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Strength / Packaging
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 625mg (10 tabs/strip)"
                    value={newMedicineForm.strength}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, strength: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GlaxoSmithKline Pharmaceuticals"
                    value={newMedicineForm.manufacturer}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, manufacturer: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-1, Shelf 3"
                    value={newMedicineForm.rackLocation}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, rackLocation: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.00"
                    value={newMedicineForm.unitPrice}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, unitPrice: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="180.00"
                    value={newMedicineForm.mrp}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, mrp: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GST Tax %
                  </label>
                  <input
                    type="number"
                    value={newMedicineForm.taxPercent}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, taxPercent: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    value={newMedicineForm.reorderLevel}
                    onChange={(e) =>
                      setNewMedicineForm({ ...newMedicineForm, reorderLevel: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Optional Initial Batch */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Optional: Initial Stock Batch Setup
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Batch # (e.g. AUG-2026-X1)"
                      value={newMedicineForm.initialBatchNumber}
                      onChange={(e) =>
                        setNewMedicineForm({
                          ...newMedicineForm,
                          initialBatchNumber: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Quantity (e.g. 100)"
                      value={newMedicineForm.initialBatchQuantity}
                      onChange={(e) =>
                        setNewMedicineForm({
                          ...newMedicineForm,
                          initialBatchQuantity: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={newMedicineForm.initialBatchExpiry}
                      onChange={(e) =>
                        setNewMedicineForm({
                          ...newMedicineForm,
                          initialBatchExpiry: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedicineModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  Save to Inventory Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STOCK AUDIT RECONCILIATION */}
      {/* ========================================================================= */}
      {isAdjustModalOpen && selectedMedicineForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-teal-600" /> Reconcile Physical Stock
                </h3>
                <p className="text-xs text-slate-500">{selectedMedicineForAdjust.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Select Batch to Reconcile
                </label>
                <select
                  value={adjustForm.batchNumber}
                  onChange={(e) => {
                    const batch = selectedMedicineForAdjust.batches?.find(
                      (b) => b.batchNumber === e.target.value
                    );
                    setAdjustForm({
                      ...adjustForm,
                      batchNumber: e.target.value,
                      newQuantity: batch ? batch.quantity : '',
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                >
                  {(selectedMedicineForAdjust.batches || []).map((b) => (
                    <option key={b.batchNumber} value={b.batchNumber}>
                      Batch {b.batchNumber} (Current: {b.quantity} units, Exp: {formatDate(b.expiryDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Reconciled Physical Count (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustForm.newQuantity}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, newQuantity: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Audit Reconciliation Reason
                </label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="Stock Audit Reconciliation">Stock Audit Reconciliation</option>
                  <option value="Damaged in transit / handling">Damaged in transit / handling</option>
                  <option value="Expired Batch Write-Off">Expired Batch Write-Off</option>
                  <option value="Inventory Discrepancy Correction">Inventory Discrepancy Correction</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PROCUREMENT PURCHASE */}
      {/* ========================================================================= */}
      {isAddPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-600" /> Inward Stock Purchase Order
                </h3>
                <p className="text-xs text-slate-500">
                  Log incoming vendor consignments. Stock units will be added to batches atomically.
                </p>
              </div>
              <button
                onClick={() => setIsAddPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPurchaseForm.supplier}
                    onChange={(e) =>
                      setNewPurchaseForm({ ...newPurchaseForm, supplier: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Contact / GSTIN
                  </label>
                  <input
                    type="text"
                    value={newPurchaseForm.supplierContact}
                    onChange={(e) =>
                      setNewPurchaseForm({ ...newPurchaseForm, supplierContact: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-APEX-2026-99"
                    value={newPurchaseForm.invoiceNumber}
                    onChange={(e) =>
                      setNewPurchaseForm({ ...newPurchaseForm, invoiceNumber: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* Line Items List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Purchase Line Items ({newPurchaseForm.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addPurchaseLineItem}
                    className="text-teal-600 hover:text-teal-700 font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {newPurchaseForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-7 gap-2 items-center"
                    >
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                          Medicine Item *
                        </label>
                        <select
                          required
                          value={item.medicineId}
                          onChange={(e) => updatePurchaseItem(idx, 'medicineId', e.target.value)}
                          className="w-full p-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                        >
                          <option value="">Select Medicine</option>
                          {medicines.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} ({m.itemCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                          Batch # *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="BATCH-1"
                          value={item.batchNumber}
                          onChange={(e) => updatePurchaseItem(idx, 'batchNumber', e.target.value)}
                          className="w-full p-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={item.expiryDate}
                          onChange={(e) => updatePurchaseItem(idx, 'expiryDate', e.target.value)}
                          className="w-full p-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                          Qty Received *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                          Unit Cost (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unitCost}
                          onChange={(e) => updatePurchaseItem(idx, 'unitCost', e.target.value)}
                          className="w-full p-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3 sm:pt-0">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          ₹{(item.quantity * item.unitCost).toFixed(2)}
                        </div>
                        {newPurchaseForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePurchaseLineItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  Confirm & Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Reorder Sheet Modal */}
      <ResponsiveModal
        isOpen={isPreviewReorderModalOpen}
        onClose={() => setIsPreviewReorderModalOpen(false)}
        title="NABH Purchase Requisition & Reorder Sheet Preview"
        subtitle="Hospital procurement preview with deficit calculations and reorder quantities"
        size="4xl"
        icon={<Printer className="w-5 h-5 text-teal-600" />}
      >
        <div className="space-y-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between text-xs text-teal-900 dark:text-teal-200">
            <span>Official NABH hospital requisition format printed when clicking &quot;Print Reorder Sheet&quot;.</span>
            <button
              type="button"
              onClick={() => {
                setIsPreviewReorderModalOpen(false);
                setTimeout(() => window.print(), 150);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print This Document
            </button>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            {renderReorderSheetContent(true)}
          </div>
        </div>
      </ResponsiveModal>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
