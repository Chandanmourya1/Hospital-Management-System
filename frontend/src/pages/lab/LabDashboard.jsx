import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import labService from '../../services/labService';
import { getPatients } from '../../services/patientService';
import toast from 'react-hot-toast';
import {
  FlaskConical,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
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
  Barcode,
  Eye,
  FileCheck,
  FileText,
  Microscope,
  Stethoscope,
  Info,
  Check,
  X,
  PlusCircle,
  Trash2,
  Sparkles,
  Phone,
  Layers,
  ChevronRight,
} from 'lucide-react';

const LabDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active tab: 'orders' | 'phlebotomy' | 'results' | 'catalog' | 'alerts'
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);

  // KPIs & Panic Alerts
  const [summary, setSummary] = useState(null);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [alertFilter, setAlertFilter] = useState('active'); // 'active' | 'acknowledged' | 'all'
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  // Tab 1: Orders Ledger
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Tab 2: Phlebotomy
  const [selectedOrderForSample, setSelectedOrderForSample] = useState(null);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [sampleCondition, setSampleCondition] = useState('Good / Normal');
  const [sampleNotes, setSampleNotes] = useState('');

  // Tab 3: Result Entry & Pathologist Verification
  const [selectedOrderForResult, setSelectedOrderForResult] = useState(null);
  const [selectedTestForResult, setSelectedTestForResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultValues, setResultValues] = useState({});
  const [resultInterpretation, setResultInterpretation] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);

  // Tab 4: Master Catalog
  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [newTestForm, setNewTestForm] = useState({
    testCode: '',
    testName: '',
    category: 'Hematology',
    department: 'Central Diagnostic Laboratory',
    sampleType: 'EDTA Whole Blood (Purple Top)',
    sampleVolume: '3 ml',
    fastingRequired: false,
    turnaroundHours: 4,
    price: '',
    description: '',
    parameters: [
      {
        name: '',
        unit: '',
        referenceRange: '',
        minNormal: '',
        maxNormal: '',
        criticalLow: '',
        criticalHigh: '',
      },
    ],
  });

  // Booking Modal State
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [bookingOrderType, setBookingOrderType] = useState('Outpatient (OPD)');
  const [bookingPriority, setBookingPriority] = useState('Routine');
  const [bookingDoctor, setBookingDoctor] = useState('Consulting Physician');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('UPI / QR');
  const [bookingDiscount, setBookingDiscount] = useState(0);

  // Load KPI alerts & data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const alertsData = await labService.getLabAlerts();
      if (alertsData.success) {
        setSummary(alertsData.summary);
        setCriticalAlerts(alertsData.criticalAlerts || []);
      }

      await fetchOrders();
      await fetchCatalog();
    } catch (error) {
      console.error('Error loading lab data:', error);
      toast.error('Failed to load lab data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await labService.getLabOrders({
        search: orderSearch,
        orderStatus: orderStatusFilter !== 'All' ? orderStatusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
      });
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await labService.getTestCatalog({
        search: catalogSearch,
        category: catalogCategory !== 'All' ? catalogCategory : undefined,
      });
      if (res.success) {
        setCatalog(res.tests || []);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [orderSearch, orderStatusFilter, priorityFilter]);

  useEffect(() => {
    fetchCatalog();
  }, [catalogSearch, catalogCategory]);

  // Load patients for booking modal
  const openBookModal = async () => {
    try {
      const pRes = await getPatients({ limit: 50 });
      if (pRes.success) {
        setPatientsList(pRes.patients || []);
      }
      setSelectedPatientId(pRes.patients?.[0]?._id || '');
      setSelectedTestIds([]);
      setIsBookModalOpen(true);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Could not load patient registry');
    }
  };

  // Handle Book Lab Test Submit
  const handleBookOrder = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient.');
      return;
    }
    if (selectedTestIds.length === 0) {
      toast.error('Please select at least one diagnostic test.');
      return;
    }

    try {
      const res = await labService.bookLabTest({
        patientId: selectedPatientId,
        orderType: bookingOrderType,
        priority: bookingPriority,
        referringDoctor: bookingDoctor,
        testIds: selectedTestIds,
        clinicalNotes: bookingNotes,
        paymentMethod: bookingPaymentMethod,
        discount: Number(bookingDiscount) || 0,
      });

      if (res.success) {
        toast.success(`Lab Order #${res.order.orderNumber} booked with Barcode: ${res.order.sampleDetails?.barcode}`);
        setIsBookModalOpen(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book lab test');
    }
  };

  // Open Sample Collection Modal
  const openSampleModal = (order) => {
    setSelectedOrderForSample(order);
    setSampleCondition('Good / Normal');
    setSampleNotes('');
    setIsSampleModalOpen(true);
  };

  // Submit Sample Collection
  const handleCollectSample = async (e) => {
    e.preventDefault();
    if (!selectedOrderForSample) return;

    try {
      const res = await labService.updateSampleCollection(selectedOrderForSample._id, {
        sampleCondition,
        sampleNotes,
      });

      if (res.success) {
        toast.success(`Specimen accessioned! Barcode ${res.order.sampleDetails.barcode} logged in lab.`);
        setIsSampleModalOpen(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update sample collection');
    }
  };

  // Open Result Entry Modal
  const openResultModal = (order, testItem) => {
    setSelectedOrderForResult(order);
    setSelectedTestForResult(testItem);

    // Find test definition from catalog to initialize parameter inputs
    const catalogTest = catalog.find((c) => c._id === (testItem.test?._id || testItem.test) || c.testCode === testItem.testCode);
    const initialValues = {};
    if (catalogTest && catalogTest.parameters) {
      catalogTest.parameters.forEach((param) => {
        initialValues[param.name] = '';
      });
    }
    setResultValues(initialValues);
    setResultInterpretation('');
    setResultNotes('');
    setIsResultModalOpen(true);
  };

  // Dynamic Parameter Flag Evaluation for Live UI Feedback
  const getLiveFlag = (paramDef, value) => {
    if (!paramDef || value === undefined || value === null || value === '') return 'Normal';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Normal';

    if (paramDef.criticalLow !== null && paramDef.criticalLow !== undefined && num < paramDef.criticalLow) {
      return 'Critical';
    }
    if (paramDef.criticalHigh !== null && paramDef.criticalHigh !== undefined && num > paramDef.criticalHigh) {
      return 'Critical';
    }
    if (paramDef.minNormal !== null && paramDef.minNormal !== undefined && num < paramDef.minNormal) {
      return 'Low';
    }
    if (paramDef.maxNormal !== null && paramDef.maxNormal !== undefined && num > paramDef.maxNormal) {
      return 'High';
    }
    return 'Normal';
  };

  // Handle Submit Test Results & Pathologist Verification
  const handleSubmitResult = async (e, autoVerify = false) => {
    e.preventDefault();
    if (!selectedOrderForResult || !selectedTestForResult) return;

    // Find catalog test definition
    const catalogTest = catalog.find(
      (c) => c._id === (selectedTestForResult.test?._id || selectedTestForResult.test) || c.testCode === selectedTestForResult.testCode
    );

    const formattedResults = Object.keys(resultValues).map((paramName) => {
      const paramDef = catalogTest?.parameters?.find((p) => p.name === paramName);
      return {
        parameterName: paramName,
        value: resultValues[paramName] || 'Normal',
        unit: paramDef?.unit || '',
        referenceRange: paramDef?.referenceRange || '',
        method: 'Automated Analyzer / Standard Clinical Method',
      };
    });

    try {
      setSubmittingResult(true);
      const res = await labService.enterTestResults(
        selectedOrderForResult._id,
        selectedTestForResult.test?._id || selectedTestForResult.test,
        {
          results: formattedResults,
          interpretation: resultInterpretation,
          notes: resultNotes,
        }
      );

      if (res.success) {
        const report = res.report;
        if (autoVerify) {
          // Auto certify & sync to EMR
          const verifyRes = await labService.verifyAndApproveReport(report._id, {
            interpretation: resultInterpretation || report.interpretation,
          });
          if (verifyRes.success) {
            toast.success(`Report #${report.reportNumber} Certified & Auto-Synced to Patient EMR!`, {
              icon: '🔬',
              duration: 4000,
            });
          }
        } else {
          toast.success(`Results logged for ${selectedTestForResult.testName}. Ready for Pathologist Review.`);
        }

        setIsResultModalOpen(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error entering results');
    } finally {
      setSubmittingResult(false);
    }
  };

  // Add Dynamic Parameter to Catalog Creator Form
  const addParameterRow = () => {
    setNewTestForm((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        {
          name: '',
          unit: '',
          referenceRange: '',
          minNormal: '',
          maxNormal: '',
          criticalLow: '',
          criticalHigh: '',
        },
      ],
    }));
  };

  const removeParameterRow = (index) => {
    setNewTestForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!newTestForm.testCode || !newTestForm.testName || !newTestForm.price) {
      toast.error('Test code, name, and price are required.');
      return;
    }

    try {
      const payload = {
        ...newTestForm,
        price: Number(newTestForm.price),
        turnaroundHours: Number(newTestForm.turnaroundHours) || 4,
        parameters: newTestForm.parameters
          .filter((p) => p.name.trim() !== '')
          .map((p) => ({
            ...p,
            minNormal: p.minNormal !== '' ? Number(p.minNormal) : null,
            maxNormal: p.maxNormal !== '' ? Number(p.maxNormal) : null,
            criticalLow: p.criticalLow !== '' ? Number(p.criticalLow) : null,
            criticalHigh: p.criticalHigh !== '' ? Number(p.criticalHigh) : null,
          })),
      };

      const res = await labService.createTest(payload);
      if (res.success) {
        toast.success(`Test ${res.test.testCode} added to Diagnostic Master Catalog!`);
        setIsAddTestModalOpen(false);
        fetchCatalog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create test');
    }
  };

  // Helper badge renderers
  const renderPriorityBadge = (priority) => {
    if (priority === 'Emergency / STAT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse border border-red-300">
          <AlertOctagon className="w-3 h-3 mr-1" /> STAT
        </span>
      );
    }
    if (priority === 'Urgent') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Urgent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Routine
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Ordered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" /> Ordered
          </span>
        );
      case 'Sample Collected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FlaskConical className="w-3 h-3 mr-1" /> Sample Collected
          </span>
        );
      case 'In Lab / Processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Microscope className="w-3 h-3 mr-1" /> In Processing
          </span>
        );
      case 'Completed':
      case 'Verified / Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed / Certified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const activeAlerts = criticalAlerts.filter((c) => !c.criticalAlertAcknowledged);
  const acknowledgedAlerts = criticalAlerts.filter((c) => c.criticalAlertAcknowledged);
  const activeAlertsCount = activeAlerts.length;
  const displayedAlerts =
    alertFilter === 'active'
      ? activeAlerts
      : alertFilter === 'acknowledged'
      ? acknowledgedAlerts
      : criticalAlerts;

  return (
    <div className="min-h-screen bg-slate-50 py-5 sm:py-8 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        {/* Header with Certified Pathologist & Accreditation banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <FlaskConical className="w-7 sm:w-8 h-7 sm:h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Diagnostic Laboratory</h1>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> NABL Accredited
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Automated analyzers, barcoded phlebotomy tracking, real-time panic values & EMR-synced reports.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={openBookModal}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Book Diagnostic Test
            </button>
            <button
              onClick={() => setIsAddTestModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-indigo-600" /> Master Catalog
            </button>
            <button
              onClick={loadDashboardData}
              title="Refresh Data"
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today Orders</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{summary.ordersToday || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Direct, OPD & IPD requests</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Phlebotomy</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <FlaskConical className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{summary.pendingCollection || 0}</p>
              <p className="text-xs text-purple-600 font-medium mt-1">Awaiting sample draw</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Processing</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Microscope className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{summary.inProcessing || 0}</p>
              <p className="text-xs text-slate-500 mt-1">In analyzer run queues</p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-sm transition-all cursor-pointer ${
                summary.criticalPanicCount > 0
                  ? 'bg-red-50 border-red-300 ring-2 ring-red-400 ring-opacity-50'
                  : 'bg-white border-slate-200'
              }`}
              onClick={() => setActiveTab('alerts')}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wider ${summary.criticalPanicCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                  Panic Values
                </span>
                <div className={`p-2 rounded-lg ${summary.criticalPanicCount > 0 ? 'bg-red-200 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold mt-3 ${summary.criticalPanicCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                {summary.criticalPanicCount || 0}
              </p>
              <p className={`text-xs mt-1 font-semibold ${summary.criticalPanicCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {summary.criticalPanicCount > 0 ? 'Critical intervention alert!' : 'No critical alerts'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today Revenue</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">${summary.todayRevenue || 0}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">{summary.totalCatalogTests || 10} master tests active</p>
            </div>
          </div>
        )}

        {/* Critical Panic Value Immediate Alert Banner */}
        {activeAlertsCount > 0 && activeTab !== 'alerts' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-full animate-pulse shrink-0 mt-0.5 sm:mt-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  CRITICAL PANIC VALUE ALERT: {activeAlertsCount} patient report(s) require urgent doctor attention!
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Latest: {activeAlerts[0]?.testName} for {activeAlerts[0]?.patientName} ({activeAlerts[0]?.reportNumber})
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="w-full sm:w-auto px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center cursor-pointer shrink-0"
            >
              View Panic Monitor <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 sm:px-6 pt-3 flex space-x-4 sm:space-x-8 overflow-x-auto hms-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-semibold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Orders Ledger</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('phlebotomy')}
            className={`pb-4 text-sm font-semibold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'phlebotomy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Phlebotomy & Specimen Desk</span>
            {summary?.pendingCollection > 0 && (
              <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full text-xs ml-1">
                {summary.pendingCollection}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`pb-4 text-sm font-semibold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'results'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Result Entry & Verification</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-4 text-sm font-semibold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Test Catalog & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-4 text-sm font-semibold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Panic Alerts Monitor</span>
            {activeAlertsCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: ORDERS LEDGER */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by order #, patient name, barcode..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Sample Collected">Sample Collected</option>
                  <option value="In Lab / Processing">In Lab / Processing</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Priorities</option>
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency / STAT">Emergency / STAT</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto hms-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order # & Priority</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Tests Ordered</th>
                    <th className="py-3 px-4">Barcode / Phlebotomy</th>
                    <th className="py-3 px-4">Billing</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No laboratory orders found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{ord.orderNumber}</div>
                          <div className="mt-1 flex items-center space-x-1.5">
                            {renderPriorityBadge(ord.priority)}
                            <span className="text-xs text-slate-400">({ord.orderType?.split(' ')[0]})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{ord.patientName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>{ord.patientGender}</span>
                            {ord.patientAge && <span>• {ord.patientAge} yrs</span>}
                            <span>• {ord.patientPhone}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {ord.tests?.map((t, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-xs">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                  {t.testCode}
                                </span>
                                <span className="text-slate-800 font-medium truncate max-w-[180px]">{t.testName}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {ord.sampleDetails?.barcode ? (
                            <div>
                              <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold">
                                {ord.sampleDetails.barcode}
                              </span>
                              <div className="text-xs text-slate-400 mt-1">
                                {ord.sampleDetails.sampleCollectedAt
                                  ? new Date(ord.sampleDetails.sampleCollectedAt).toLocaleDateString()
                                  : 'Pending draw'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not generated</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">${ord.netAmount}</div>
                          <span
                            className={`text-xs px-1.5 py-0.2 rounded font-medium ${
                              ord.billingStatus === 'Paid' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                            }`}
                          >
                            {ord.billingStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{renderStatusBadge(ord.orderStatus)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {ord.orderStatus === 'Ordered' && (
                              <button
                                onClick={() => openSampleModal(ord)}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Draw Sample
                              </button>
                            )}

                            {(ord.orderStatus === 'Sample Collected' || ord.orderStatus === 'In Lab / Processing') && (
                              <button
                                onClick={() => openResultModal(ord, ord.tests?.[0])}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors flex items-center"
                              >
                                <Edit3 className="w-3 h-3 mr-1" /> Enter Results
                              </button>
                            )}

                            {ord.orderStatus === 'Completed' && (
                              <Link
                                to={`/lab/reports/${ord.tests?.[0]?.test?._id || ord._id}`}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center"
                              >
                                <Printer className="w-3 h-3 mr-1" /> Report
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PHLEBOTOMY & SPECIMEN DESK */}
        {activeTab === 'phlebotomy' && (
          <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-950">Phlebotomy Accessioning Desk</h3>
                  <p className="text-xs text-purple-800 mt-0.5">
                    Scan patient barcode or verify identity to draw specimen, log tube condition and route to analyzers.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Scan / Type Barcode (e.g. SMP-1001)..."
                  className="px-3 py-2 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-64"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Orders Waiting for Sample Draw ({orders.filter((o) => o.orderStatus === 'Ordered').length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.filter((o) => o.orderStatus === 'Ordered').length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">All pending samples collected!</p>
                    <p className="text-xs text-slate-400 mt-1">No orders currently awaiting phlebotomy.</p>
                  </div>
                ) : (
                  orders
                    .filter((o) => o.orderStatus === 'Ordered')
                    .map((ord) => (
                      <div
                        key={ord._id}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              {ord.sampleDetails?.barcode || 'PENDING'}
                            </span>
                            {renderPriorityBadge(ord.priority)}
                          </div>

                          <h4 className="font-bold text-slate-900 mt-2">{ord.patientName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Order #{ord.orderNumber} • Ref: {ord.referringDoctor}
                          </p>

                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className="text-xs font-semibold text-slate-600 block mb-1">Tests to Draw:</span>
                            <div className="flex flex-wrap gap-1">
                              {ord.tests?.map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded font-medium"
                                >
                                  {t.testName} ({t.sampleType})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Ordered: {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => openSampleModal(ord)}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center"
                          >
                            <FlaskConical className="w-3.5 h-3.5 mr-1" />
                            Collect Sample
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESULT ENTRY & PATHOLOGIST VERIFICATION */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pathology Bench & Analyzer Result Entry</h3>
                <p className="text-sm text-slate-500">
                  Enter observed parameter values, review real-time biological reference flags, and electronically certify reports.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto hms-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order / Barcode</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Investigation Test</th>
                    <th className="py-3 px-4">Specimen Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders
                    .filter((o) => o.orderStatus !== 'Ordered')
                    .map((ord) =>
                      ord.tests?.map((t, idx) => (
                        <tr key={`${ord._id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{ord.orderNumber}</span>
                            <div className="font-mono text-xs text-purple-700 mt-0.5">{ord.sampleDetails?.barcode}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{ord.patientName}</span>
                            <div className="text-xs text-slate-400">{ord.patientGender} • Ref: {ord.referringDoctor}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 mr-2 font-bold">
                              {t.testCode}
                            </span>
                            <span className="font-semibold text-slate-800">{t.testName}</span>
                            <div className="text-xs text-slate-400">{t.sampleType}</div>
                          </td>
                          <td className="py-3 px-4">{renderStatusBadge(ord.orderStatus)}</td>
                          <td className="py-3 px-4">{renderPriorityBadge(ord.priority)}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openResultModal(ord, t)}
                              className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              {ord.orderStatus === 'Completed' ? 'Review / Edit' : 'Enter Results'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MASTER TEST CATALOG & PRICING */}
        {activeTab === 'catalog' && (
          <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search test name, code, sample type..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  'All',
                  'Hematology',
                  'Biochemistry',
                  'Microbiology & Serology',
                  'Clinical Pathology',
                  'Immunology & Endocrinology',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      catalogCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalog.map((t) => (
                <div
                  key={t._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {t.testCode}
                      </span>
                      <span className="font-bold text-emerald-600 text-base">${t.price}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mt-2">{t.testName}</h4>
                    <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {t.category}
                    </span>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Specimen</span>
                        <span className="font-medium truncate block">{t.sampleType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">TAT / Fasting</span>
                        <span className="font-medium block">
                          {t.turnaroundHours}h {t.fastingRequired ? '• Fasting' : '• Random'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600">
                      <span className="font-semibold text-slate-700 block mb-1">
                        Parameters ({t.parameters?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {t.parameters?.slice(0, 4).map((p, idx) => (
                          <span key={idx} className="bg-white px-1.5 py-0.5 rounded border text-[11px] text-slate-600">
                            {p.name}
                          </span>
                        ))}
                        {t.parameters?.length > 4 && (
                          <span className="text-[11px] text-slate-400">+{t.parameters.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CRITICAL PANIC ALERTS MONITOR */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 text-red-700 rounded-xl animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-red-950">Panic Values & Critical Alerts Center</h3>
                  <p className="text-xs text-red-800 mt-0.5">
                    Lab-detected life-threatening values requiring immediate verbal & digital notification to attending doctors.
                  </p>
                </div>
              </div>

              {/* Sub-filter tabs */}
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs p-1 rounded-xl border border-red-200 shadow-2xs self-stretch md:self-auto">
                <button
                  type="button"
                  onClick={() => setAlertFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertFilter === 'active'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  Active ({activeAlerts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAlertFilter('acknowledged')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertFilter === 'acknowledged'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Acknowledged ({acknowledgedAlerts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAlertFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({criticalAlerts.length})
                </button>
              </div>
            </div>

            {displayedAlerts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">
                  {alertFilter === 'active'
                    ? 'No Active Critical Alerts'
                    : alertFilter === 'acknowledged'
                    ? 'No Acknowledged Alerts Yet'
                    : 'No Critical Panic Alerts Found'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {alertFilter === 'active'
                    ? 'All processed diagnostic parameters are within safe physiological limits or already acknowledged.'
                    : alertFilter === 'acknowledged'
                    ? 'Critical panic alerts that have been acknowledged will appear here with notification audit logs.'
                    : 'No lab test reports with critical panic alerts.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedAlerts.map((crit) => {
                  const isAck = crit.criticalAlertAcknowledged;
                  const isBusy = acknowledgingId === crit._id;

                  return (
                    <div
                      key={crit._id}
                      className={`bg-white border-2 ${
                        isAck ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-300'
                      } rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                    >
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          {isAck ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ACKNOWLEDGED
                            </span>
                          ) : (
                            <span className="bg-red-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full animate-pulse flex items-center">
                              <AlertOctagon className="w-3.5 h-3.5 mr-1" /> CRITICAL PANIC
                            </span>
                          )}
                          <span className="font-mono text-xs text-slate-500 font-bold">{crit.reportNumber}</span>
                          <span className="text-xs text-slate-400">• Order: {crit.orderNumber}</span>
                        </div>

                        <h4 className="text-lg font-bold text-slate-900">
                          {crit.testName} — Patient: <span className={isAck ? 'text-slate-800 font-bold' : 'text-red-700 font-black'}>{crit.patientName}</span>
                        </h4>

                        <p className={`text-sm ${isAck ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-red-800 bg-red-50 border-red-100'} p-2.5 rounded-xl border font-medium`}>
                          {crit.interpretation || 'Critical panic value detected during analyzer processing.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Ref Doctor: <strong className="text-slate-700">{crit.referringDoctor || 'Consultant'}</strong></span>
                          <span>Patient Phone: <strong className="text-slate-700">{crit.patientPhone || 'N/A'}</strong></span>
                          <span>Date: <strong>{new Date(crit.reportDate).toLocaleTimeString()}</strong></span>
                          {isAck && (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Notified by: {crit.acknowledgedByName || 'Doctor / Staff'} {crit.acknowledgedAt && `(${new Date(crit.acknowledgedAt).toLocaleTimeString()})`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
                        <Link
                          to={`/lab/reports/${crit._id}`}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1.5" /> View Certified Slip
                        </Link>
                        {isAck ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={async () => {
                              try {
                                setAcknowledgingId(crit._id);
                                await labService.acknowledgeCriticalAlert(crit._id, { acknowledged: false });
                                toast.success(`Alert ${crit.reportNumber} reset to unacknowledged.`);
                                await loadDashboardData();
                              } catch (err) {
                                console.error('Failed to reset alert:', err);
                                toast.error(err.response?.data?.message || 'Failed to update alert status.');
                              } finally {
                                setAcknowledgingId(null);
                              }
                            }}
                            className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center border border-slate-200 cursor-pointer disabled:opacity-50"
                            title="Re-open alert if further clinical follow-up is needed"
                          >
                            {isBusy ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Updating...
                              </>
                            ) : (
                              'Re-open Alert'
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={async () => {
                              try {
                                setAcknowledgingId(crit._id);
                                await labService.acknowledgeCriticalAlert(crit._id, { acknowledged: true });
                                toast.success(`Critical alert ${crit.reportNumber} acknowledged and doctor notified!`);
                                await loadDashboardData();
                              } catch (err) {
                                console.error('Failed to acknowledge alert:', err);
                                toast.error(err.response?.data?.message || 'Failed to acknowledge critical alert.');
                              } finally {
                                setAcknowledgingId(null);
                              }
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isBusy ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Acknowledging...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1.5" /> Acknowledge Alert
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: BOOK DIAGNOSTIC LAB TEST */}
      {/* ---------------------------------------------------- */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Book Diagnostic Lab Test</h3>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Patient from Registry --</option>
                  {patientsList.map((p) => (
                    <option key={p._id} value={p.user?._id || p._id}>
                      {p.user?.name || p.patientId} ({p.patientId} - {p.user?.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Order Type</label>
                  <select
                    value={bookingOrderType}
                    onChange={(e) => setBookingOrderType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Outpatient (OPD)">Outpatient (OPD)</option>
                    <option value="Inpatient (IPD)">Inpatient (IPD)</option>
                    <option value="Walk-in / Direct">Walk-in / Direct</option>
                    <option value="Emergency / STAT">Emergency / STAT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={bookingPriority}
                    onChange={(e) => setBookingPriority(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency / STAT">Emergency / STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Referring Doctor</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins (Cardiology)"
                  value={bookingDoctor}
                  onChange={(e) => setBookingDoctor(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Diagnostic Tests ({selectedTestIds.length} chosen) *
                </label>
                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {catalog.map((test) => {
                    const isChecked = selectedTestIds.includes(test._id);
                    return (
                      <label
                        key={test._id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTestIds([...selectedTestIds, test._id]);
                              } else {
                                setSelectedTestIds(selectedTestIds.filter((id) => id !== test._id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="font-mono text-xs font-bold text-indigo-700">{test.testCode}</span>
                          <span className="text-sm font-medium text-slate-800">{test.testName}</span>
                        </div>
                        <span className="font-bold text-slate-700 text-sm">${test.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={bookingPaymentMethod}
                    onChange={(e) => setBookingPaymentMethod(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Insurance">Insurance / TPA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookingDiscount}
                    onChange={(e) => setBookingDiscount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Indication / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Clinical reason for lab evaluation..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors text-center"
                >
                  Confirm Booking & Print Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SAMPLE COLLECTION / ACCESSION */}
      {/* ---------------------------------------------------- */}
      {isSampleModalOpen && selectedOrderForSample && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900">Phlebotomy Sample Collection</h3>
              </div>
              <button
                onClick={() => setIsSampleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl space-y-1.5 border border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-purple-800 font-semibold">Order #{selectedOrderForSample.orderNumber}</span>
                <span className="font-mono text-xs font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                  Barcode: {selectedOrderForSample.sampleDetails?.barcode}
                </span>
              </div>
              <h4 className="font-bold text-slate-900">{selectedOrderForSample.patientName}</h4>
              <p className="text-xs text-slate-600">
                {selectedOrderForSample.tests?.map((t) => t.testName).join(', ')}
              </p>
            </div>

            <form onSubmit={handleCollectSample} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specimen Condition</label>
                <select
                  value={sampleCondition}
                  onChange={(e) => setSampleCondition(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Good / Normal">Good / Normal</option>
                  <option value="Hemolyzed">Hemolyzed</option>
                  <option value="Lipemic">Lipemic</option>
                  <option value="Clotted">Clotted</option>
                  <option value="Insufficient Volume">Insufficient Volume</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phlebotomist Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Clean venipuncture right median cubital vein, 3ml collected."
                  value={sampleNotes}
                  onChange={(e) => setSampleNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSampleModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-sm text-center"
                >
                  Log Sample Collected
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ENTER TEST RESULTS & PATHOLOGIST VERIFY */}
      {/* ---------------------------------------------------- */}
      {isResultModalOpen && selectedOrderForResult && selectedTestForResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Microscope className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Result Entry: {selectedTestForResult.testName}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Order #{selectedOrderForResult.orderNumber} • Patient: <strong>{selectedOrderForResult.patientName}</strong> • Barcode: {selectedOrderForResult.sampleDetails?.barcode}
                </p>
              </div>
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-5">
              <div className="border border-slate-200 rounded-xl overflow-x-auto hms-scrollbar">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Parameter</th>
                      <th className="py-2.5 px-4">Biological Reference Range</th>
                      <th className="py-2.5 px-4 w-40">Observed Value</th>
                      <th className="py-2.5 px-4">Live Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const catTest = catalog.find(
                        (c) =>
                          c._id === (selectedTestForResult.test?._id || selectedTestForResult.test) ||
                          c.testCode === selectedTestForResult.testCode
                      );
                      const paramsList = catTest?.parameters || [
                        { name: selectedTestForResult.testName, unit: '', referenceRange: 'Normal' },
                      ];

                      return paramsList.map((p, idx) => {
                        const val = resultValues[p.name] || '';
                        const flag = getLiveFlag(p, val);

                        let flagBadgeClass = 'bg-slate-100 text-slate-700';
                        if (flag === 'Normal') flagBadgeClass = 'bg-emerald-100 text-emerald-800 font-semibold';
                        if (flag === 'Low') flagBadgeClass = 'bg-blue-100 text-blue-800 font-semibold';
                        if (flag === 'High') flagBadgeClass = 'bg-amber-100 text-amber-800 font-semibold';
                        if (flag === 'Critical') flagBadgeClass = 'bg-red-600 text-white font-bold animate-pulse';

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-medium text-slate-900">
                              {p.name}
                              {p.unit && <span className="text-xs text-slate-400 ml-1 font-mono">({p.unit})</span>}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-slate-500">
                              {p.referenceRange || 'Standard Normal'}
                            </td>
                            <td className="py-2.5 px-4">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  setResultValues({
                                    ...resultValues,
                                    [p.name]: e.target.value,
                                  })
                                }
                                placeholder="Value..."
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${flagBadgeClass}`}>
                                {flag}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pathologist Clinical Impression & Interpretation
                </label>
                <textarea
                  rows="3"
                  placeholder="Clinical interpretation, differential diagnostic remarks or panic value telephonic notification note..."
                  value={resultInterpretation}
                  onChange={(e) => setResultInterpretation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Electronic Certification automatically logs Pathologist Digital Sign-Off and mirrors report to Patient EMR.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row flex-wrap justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingResult}
                  onClick={(e) => handleSubmitResult(e, false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm text-center"
                >
                  Save Results Draft
                </button>
                <button
                  type="button"
                  disabled={submittingResult}
                  onClick={(e) => handleSubmitResult(e, true)}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm flex items-center justify-center text-center"
                >
                  <FileCheck className="w-4 h-4 mr-1.5" /> Certify & Sync to EMR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD MASTER TEST TO CATALOG */}
      {/* ---------------------------------------------------- */}
      {isAddTestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Add Master Diagnostic Test</h3>
              </div>
              <button
                onClick={() => setIsAddTestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Test Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CRP-01, DENGUE-01"
                    value={newTestForm.testCode}
                    onChange={(e) => setNewTestForm({ ...newTestForm, testCode: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C-Reactive Protein (Quantitative)"
                    value={newTestForm.testName}
                    onChange={(e) => setNewTestForm({ ...newTestForm, testName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={newTestForm.category}
                    onChange={(e) => setNewTestForm({ ...newTestForm, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology & Serology">Microbiology & Serology</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Immunology & Endocrinology">Immunology & Endocrinology</option>
                    <option value="Histopathology / Cytology">Histopathology / Cytology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specimen / Tube *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serum (Gold Top Tube)"
                    value={newTestForm.sampleType}
                    onChange={(e) => setNewTestForm({ ...newTestForm, sampleType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="450"
                    value={newTestForm.price}
                    onChange={(e) => setNewTestForm({ ...newTestForm, price: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Parameter Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Test Parameters & Normal / Panic Thresholds
                  </label>
                  <button
                    type="button"
                    onClick={addParameterRow}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Parameter
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3">
                  {newTestForm.parameters.map((param, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Parameter #{idx + 1}</span>
                        {newTestForm.parameters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeParameterRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Name (e.g. Hemoglobin)"
                          value={param.name}
                          onChange={(e) => {
                            const copy = [...newTestForm.parameters];
                            copy[idx].name = e.target.value;
                            setNewTestForm({ ...newTestForm, parameters: copy });
                          }}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Unit (e.g. g/dL)"
                          value={param.unit}
                          onChange={(e) => {
                            const copy = [...newTestForm.parameters];
                            copy[idx].unit = e.target.value;
                            setNewTestForm({ ...newTestForm, parameters: copy });
                          }}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Range (e.g. 13.0 - 17.0)"
                          value={param.referenceRange}
                          onChange={(e) => {
                            const copy = [...newTestForm.parameters];
                            copy[idx].referenceRange = e.target.value;
                            setNewTestForm({ ...newTestForm, parameters: copy });
                          }}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Min Normal</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Min"
                            value={param.minNormal}
                            onChange={(e) => {
                              const copy = [...newTestForm.parameters];
                              copy[idx].minNormal = e.target.value;
                              setNewTestForm({ ...newTestForm, parameters: copy });
                            }}
                            className="w-full border rounded px-1.5 py-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block">Max Normal</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Max"
                            value={param.maxNormal}
                            onChange={(e) => {
                              const copy = [...newTestForm.parameters];
                              copy[idx].maxNormal = e.target.value;
                              setNewTestForm({ ...newTestForm, parameters: copy });
                            }}
                            className="w-full border rounded px-1.5 py-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-red-500 font-semibold block">Critical Low</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Panic Low"
                            value={param.criticalLow}
                            onChange={(e) => {
                              const copy = [...newTestForm.parameters];
                              copy[idx].criticalLow = e.target.value;
                              setNewTestForm({ ...newTestForm, parameters: copy });
                            }}
                            className="w-full border border-red-200 rounded px-1.5 py-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-red-500 font-semibold block">Critical High</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Panic High"
                            value={param.criticalHigh}
                            onChange={(e) => {
                              const copy = [...newTestForm.parameters];
                              copy[idx].criticalHigh = e.target.value;
                              setNewTestForm({ ...newTestForm, parameters: copy });
                            }}
                            className="w-full border border-red-200 rounded px-1.5 py-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Description</label>
                <textarea
                  rows="2"
                  placeholder="Clinical indications, diagnostic utility..."
                  value={newTestForm.description}
                  onChange={(e) => setNewTestForm({ ...newTestForm, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTestModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm text-center"
                >
                  Save to Master Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
