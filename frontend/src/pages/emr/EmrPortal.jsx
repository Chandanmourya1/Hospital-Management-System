import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getPatientEmrOverview,
  getPatientTimeline,
  getPatientDocuments,
  uploadMedicalDocument,
  deleteDocument,
  addDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  addTreatment,
  updateTreatment,
  deleteTreatment,
  getPatientPrescriptions,
} from '../../services/emrService';
import { getPatients } from '../../services/patientService';
import toast from 'react-hot-toast';
import {
  FolderHeart,
  Activity,
  FileText,
  UploadCloud,
  FileCheck,
  Calendar,
  Clock,
  User,
  Heart,
  Droplet,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Printer,
  Search,
  Filter,
  Eye,
  Download,
  Stethoscope,
  Building,
  CheckCircle2,
  AlertCircle,
  Pill,
  Hospital,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  X,
  Loader2,
  FileQuestion,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';

const TABS = [
  { id: 'timeline', label: 'Longitudinal Timeline', icon: Clock },
  { id: 'diagnoses', label: 'Diagnoses & Treatments', icon: Activity },
  { id: 'reports', label: 'Diagnostic Test Reports', icon: FileCheck },
  { id: 'upload', label: 'Upload Medical Docs', icon: UploadCloud },
  { id: 'prescriptions', label: 'Digital Prescriptions', icon: Pill },
  { id: 'summary', label: 'Printable EMR Summary', icon: Printer },
];

const EmrPortal = () => {
  const { patientId: routePatientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';

  // Target patient selection
  const [selectedPatientId, setSelectedPatientId] = useState(
    routePatientId || (isPatient ? 'me' : 'PAT-1001')
  );
  const [patientList, setPatientList] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState('timeline');

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);

  // EMR Core State
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [docCategoryFilter, setDocCategoryFilter] = useState('All');
  const [docAbnormalOnly, setDocAbnormalOnly] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [pendingPrint, setPendingPrint] = useState(false);

  // Modals state
  const [isAddDiagModalOpen, setIsAddDiagModalOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);
  const [isAddTreatModalOpen, setIsAddTreatModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form states
  const [diagForm, setDiagForm] = useState({
    condition: '',
    status: 'Active',
    diagnosisDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [treatForm, setTreatForm] = useState({
    treatmentName: '',
    treatmentType: 'Medication Course',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    outcome: 'Ongoing',
    department: '',
    notes: '',
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    documentType: 'Pathology / Lab',
    category: 'Pathology',
    facility: 'MedCare Multi-Speciality Hospital',
    documentDate: new Date().toISOString().split('T')[0],
    findings: '',
    isAbnormal: false,
    abnormalDetails: '',
    tags: '',
    file: null,
  });
  const [uploading, setUploading] = useState(false);

  // Initial load: fetch patient list for staff selector
  useEffect(() => {
    if (!isPatient) {
      fetchPatientsList();
    }
  }, [isPatient]);

  // When selectedPatientId changes, fetch overview and refresh active tab data
  useEffect(() => {
    if (selectedPatientId) {
      fetchOverview();
    }
  }, [selectedPatientId]);

  // When active tab or its filters change, fetch tab-specific data
  useEffect(() => {
    if (!selectedPatientId) return;
    if (activeTab === 'timeline') {
      fetchTimeline();
    } else if (activeTab === 'reports') {
      fetchDocuments();
    } else if (activeTab === 'prescriptions') {
      fetchPrescriptions();
    } else if (activeTab === 'summary') {
      fetchPrescriptions();
    }
  }, [activeTab, selectedPatientId, timelineFilter, docCategoryFilter, docAbnormalOnly]);

  // Handle triggered print: wait for summary tab and overview to be rendered
  useEffect(() => {
    if (pendingPrint && activeTab === 'summary' && !loadingOverview && !loadingTab) {
      setPendingPrint(false);
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingPrint, activeTab, loadingOverview, loadingTab]);

  const fetchPatientsList = async () => {
    try {
      const res = await getPatients({ limit: 100 });
      const pts = res.patients || [];
      setPatientList(pts);
      if (pts.length > 0 && (!selectedPatientId || selectedPatientId === 'PAT-1001')) {
        const hasCurrent = pts.some(
          (p) => (p.patientId && p.patientId === selectedPatientId) || p._id === selectedPatientId
        );
        if (!hasCurrent) {
          setSelectedPatientId(pts[0].patientId || pts[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading patient list:', err);
    }
  };

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await getPatientEmrOverview(selectedPatientId);
      setOverview(res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load patient EMR overview.');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      setLoadingTab(true);
      const res = await getPatientTimeline(selectedPatientId, {
        type: timelineFilter === 'all' ? 'all' : timelineFilter,
      });
      setTimeline(res.timeline || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load health timeline.');
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingTab(true);
      const params = {};
      if (docCategoryFilter !== 'All') params.category = docCategoryFilter;
      if (docAbnormalOnly) params.isAbnormal = 'true';
      if (docSearch) params.search = docSearch;

      const res = await getPatientDocuments(selectedPatientId, params);
      setDocuments(res.documents || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load test reports.');
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoadingTab(true);
      const res = await getPatientPrescriptions(selectedPatientId);
      setPrescriptions(res.prescriptions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load prescriptions.');
    } finally {
      setLoadingTab(false);
    }
  };

  // Handler: Add or Update Diagnosis
  const handleSaveDiagnosis = async (e) => {
    e.preventDefault();
    if (!diagForm.condition.trim()) {
      toast.error('Please enter diagnosis / condition name.');
      return;
    }
    try {
      if (editingDiagnosis) {
        await updateDiagnosis(selectedPatientId, editingDiagnosis._id, diagForm);
        toast.success('Diagnosis updated successfully.');
      } else {
        await addDiagnosis(selectedPatientId, diagForm);
        toast.success('Clinical diagnosis documented.');
      }
      setIsAddDiagModalOpen(false);
      setEditingDiagnosis(null);
      setDiagForm({
        condition: '',
        status: 'Active',
        diagnosisDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchOverview();
      if (activeTab === 'timeline') fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save diagnosis.');
    }
  };

  // Handler: Add or Update Treatment
  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!treatForm.treatmentName.trim()) {
      toast.error('Please enter treatment / procedure name.');
      return;
    }
    try {
      if (editingTreatment) {
        await updateTreatment(selectedPatientId, editingTreatment._id, treatForm);
        toast.success('Treatment progress updated.');
      } else {
        await addTreatment(selectedPatientId, treatForm);
        toast.success('Treatment record created.');
      }
      setIsAddTreatModalOpen(false);
      setEditingTreatment(null);
      setTreatForm({
        treatmentName: '',
        treatmentType: 'Medication Course',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        outcome: 'Ongoing',
        department: '',
        notes: '',
      });
      fetchOverview();
      if (activeTab === 'timeline') fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save treatment.');
    }
  };

  // Handler: Upload Document
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      toast.error('Document title is required.');
      return;
    }
    if (!uploadForm.file) {
      toast.error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('title', uploadForm.title);
    formData.append('documentType', uploadForm.documentType);
    formData.append('category', uploadForm.category);
    formData.append('facility', uploadForm.facility);
    formData.append('documentDate', uploadForm.documentDate);
    formData.append('findings', uploadForm.findings);
    formData.append('isAbnormal', uploadForm.isAbnormal);
    formData.append('abnormalDetails', uploadForm.abnormalDetails);
    formData.append('tags', uploadForm.tags);
    formData.append('file', uploadForm.file);

    try {
      setUploading(true);
      await uploadMedicalDocument(selectedPatientId, formData);
      toast.success('Medical document uploaded successfully.');
      setUploadForm({
        title: '',
        documentType: 'Pathology / Lab',
        category: 'Pathology',
        facility: 'MedCare Multi-Speciality Hospital',
        documentDate: new Date().toISOString().split('T')[0],
        findings: '',
        isAbnormal: false,
        abnormalDetails: '',
        tags: '',
        file: null,
      });
      // Switch to reports tab to view newly uploaded document
      setActiveTab('reports');
      fetchOverview();
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Document upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handler: Delete Document
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this medical document?')) return;
    try {
      await deleteDocument(docId);
      toast.success('Document deleted successfully.');
      fetchDocuments();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  // Handler: Delete Diagnosis
  const handleDeleteDiagnosis = async (diagId) => {
    if (!window.confirm('Are you sure you want to remove this diagnosis record?')) return;
    try {
      await deleteDiagnosis(selectedPatientId, diagId);
      toast.success('Diagnosis removed successfully.');
      fetchOverview();
      if (activeTab === 'timeline') fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete diagnosis.');
    }
  };

  // Handler: Delete Treatment
  const handleDeleteTreatment = async (treatId) => {
    if (!window.confirm('Are you sure you want to remove this treatment record?')) return;
    try {
      await deleteTreatment(selectedPatientId, treatId);
      toast.success('Treatment record removed successfully.');
      fetchOverview();
      if (activeTab === 'timeline') fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete treatment.');
    }
  };

  // Handle Print Action (Safely switches tab and triggers print)
  const handleTriggerPrint = () => {
    if (activeTab === 'summary') {
      window.print();
    } else {
      setPendingPrint(true);
      setActiveTab('summary');
    }
  };

  // Helpers
  const patient = overview?.patient;
  const profile = overview?.profile;
  const stats = overview?.stats;

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    const age = Math.abs(ageDt.getUTCFullYear() - 1970);
    return isNaN(age) ? 'N/A' : age;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-5 sm:py-8 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 print:p-0 print:m-0 print:bg-white">
      {/* Print-Only CSS Styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          nav, footer, .sidebar {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-[1600px] mx-auto space-y-6 print:m-0 print:max-w-none print:w-full">
        {/* Top Header & Patient Selector Bar (No-Print) */}
        <div className="no-print bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FolderHeart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Electronic Medical Records (EMR)
                  </h1>
                  <p className="text-sm text-slate-500">
                    Comprehensive Longitudinal Health Timeline, Diagnoses, Test Reports & Digital Prescriptions
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Patient Selector */}
            {!isPatient && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Select Patient --
                    </option>
                    {patientList.map((p) => (
                      <option key={p._id} value={p.patientId || p._id}>
                        {p.user?.name || 'Patient'} ({p.patientId || 'Pending ID'}) - {p.bloodGroup || 'Blood N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Summary
                </button>
              </div>
            )}

            {isPatient && (
              <button
                onClick={handleTriggerPrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print My EMR
              </button>
            )}
          </div>

          {/* Patient Bio & Demographics Banner */}
          {loadingOverview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-sm text-slate-500">Loading patient medical records...</span>
            </div>
          ) : patient ? (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Basic Demographics */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                    {patient.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                        {profile?.patientId || 'Pending ID'}
                      </span>
                      <span>•</span>
                      <span>{calculateAge(patient.dateOfBirth)} Yrs</span>
                      <span>•</span>
                      <span className="capitalize">{patient.gender || 'Unknown'}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      📞 {patient.phone || 'No phone'} | ✉️ {patient.email}
                    </p>
                  </div>
                </div>

                {/* Blood Group & Vitals profile */}
                <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" /> Blood Group
                    </span>
                    <span className="text-sm font-extrabold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                      {profile?.bloodGroup || 'Unknown'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="text-slate-400">Emergency:</span>{' '}
                    {profile?.emergencyContact?.name
                      ? `${profile.emergencyContact.name} (${profile.emergencyContact.relationship || 'Contact'}) - ${profile.emergencyContact.phone}`
                      : 'Not recorded'}
                  </div>
                </div>

                {/* Insurance Details */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-blue-500" /> Health Insurance
                    </span>
                    <span className="text-xs font-bold text-blue-700">
                      {profile?.insurance?.provider || 'Self-Pay / Cash'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="text-slate-400">Policy:</span>{' '}
                    {profile?.insurance?.policyNumber || 'N/A'} (Exp: {profile?.insurance?.validTill ? new Date(profile.insurance.validTill).toLocaleDateString() : 'N/A'})
                  </p>
                </div>

                {/* Allergen Alerts */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Known Allergies
                  </span>
                  {profile?.allergies && profile.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {profile.allergies.map((all, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300"
                        >
                          <ShieldAlert className="w-3 h-3 text-red-600" />
                          {all.allergen} ({all.severity})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No Known Drug Allergies (NKDA)
                    </span>
                  )}
                </div>
              </div>

              {/* Statistics Pill Bar */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-xs font-medium text-slate-500">Active Diagnoses</div>
                  <div className="text-lg font-bold text-slate-900">{stats?.activeDiagnosesCount ?? 0}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-xs font-medium text-slate-500">Treatments</div>
                  <div className="text-lg font-bold text-indigo-600">{stats?.treatmentsCount ?? 0}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-xs font-medium text-slate-500">Test Reports</div>
                  <div className="text-lg font-bold text-emerald-600">{stats?.testReportsCount ?? 0}</div>
                </div>
                <div
                  className={`border rounded-xl p-2.5 text-center ${
                    stats?.abnormalReportsCount > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="text-xs font-medium">Abnormal Alerts</div>
                  <div className="text-lg font-bold">{stats?.abnormalReportsCount ?? 0}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-xs font-medium text-slate-500">OPD Visits</div>
                  <div className="text-lg font-bold text-blue-600">{stats?.opdVisitsCount ?? 0}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-xs font-medium text-slate-500">IPD Admissions</div>
                  <div className="text-lg font-bold text-purple-600">{stats?.ipdAdmissionsCount ?? 0}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-sm">
              Please select a patient from the dropdown above to view complete medical records.
            </div>
          )}
        </div>

        {/* Navigation Tabs (No-Print) */}
        <div className="no-print bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex items-center gap-1.5 overflow-x-auto hms-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Longitudinal Health Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Timeline Filter Controls */}
            <div className="no-print bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span>Filter Events:</span>
                <div className="flex flex-wrap gap-1.5 ml-2">
                  {[
                    { key: 'all', label: 'All Encounters' },
                    { key: 'opd', label: 'OPD Visits' },
                    { key: 'ipd', label: 'IPD Admissions' },
                    { key: 'reports', label: 'Diagnostic Reports' },
                    { key: 'diagnoses', label: 'Diagnoses' },
                    { key: 'treatments', label: 'Treatments & Procedures' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setTimelineFilter(f.key)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                        timelineFilter === f.key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Showing {timeline.length} chronological events
              </span>
            </div>

            {/* Timeline Events Stream */}
            {loadingTab ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Compiling longitudinal health events...</p>
              </div>
            ) : timeline.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Timeline Records Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No encounters or records match the selected filter for this patient.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-indigo-200 ml-4 md:ml-6 space-y-6 pb-6">
                {timeline.map((event, idx) => {
                  const eventDate = new Date(event.date);
                  const isAbnormal = event.isAbnormal;

                  // Category icon & colors
                  let catBg = 'bg-indigo-600';
                  let CatIcon = Clock;
                  if (event.category === 'OPD Visit') {
                    catBg = 'bg-blue-600';
                    CatIcon = Stethoscope;
                  } else if (event.category === 'IPD Hospital Stay') {
                    catBg = 'bg-purple-600';
                    CatIcon = Hospital;
                  } else if (event.category === 'Diagnostic Report') {
                    catBg = isAbnormal ? 'bg-rose-600' : 'bg-emerald-600';
                    CatIcon = FileCheck;
                  } else if (event.category === 'Diagnosis') {
                    catBg = 'bg-amber-600';
                    CatIcon = Activity;
                  } else if (event.category === 'Treatment & Procedure') {
                    catBg = 'bg-teal-600';
                    CatIcon = Pill;
                  }

                  return (
                    <div key={idx} className="relative pl-6 md:pl-8 group">
                      {/* Timeline node dot */}
                      <div
                        className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full ${catBg} text-white flex items-center justify-center shadow-md border-4 border-white`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>

                      {/* Event Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {event.category}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                isAbnormal
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {event.badge}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {eventDate.toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            <span>at</span>
                            {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="mt-3">
                          <h4 className="text-base font-bold text-slate-900">{event.title}</h4>
                          {event.doctorName && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Provider / Facility: <span className="text-slate-700 font-semibold">{event.doctorName}</span>
                            </p>
                          )}
                        </div>

                        {/* Event Details Content */}
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-700 space-y-1.5">
                          {event.category === 'OPD Visit' && (
                            <>
                              <div>
                                <span className="font-semibold text-slate-500">Diagnosis:</span> {event.details.diagnosis}
                              </div>
                              {event.details.complaints && (
                                <div>
                                  <span className="font-semibold text-slate-500">Chief Complaints:</span>{' '}
                                  {event.details.complaints}
                                </div>
                              )}
                              {event.details.hasPrescription && (
                                <div className="text-indigo-600 font-medium flex items-center gap-1 mt-1">
                                  <Pill className="w-3.5 h-3.5" /> Digital Prescription Issued
                                </div>
                              )}
                            </>
                          )}

                          {event.category === 'IPD Hospital Stay' && (
                            <>
                              <div>
                                <span className="font-semibold text-slate-500">Bed / Ward:</span> {event.details.ward} -{' '}
                                {event.details.room} (Bed {event.details.bed})
                              </div>
                              <div>
                                <span className="font-semibold text-slate-500">Admission Diagnosis:</span>{' '}
                                {event.details.diagnosis}
                              </div>
                              {event.details.dischargeDate && (
                                <div>
                                  <span className="font-semibold text-slate-500">Discharge:</span>{' '}
                                  {new Date(event.details.dischargeDate).toLocaleDateString()}
                                </div>
                              )}
                            </>
                          )}

                          {event.category === 'Diagnostic Report' && (
                            <>
                              <div>
                                <span className="font-semibold text-slate-500">Findings:</span> {event.details.findings}
                              </div>
                              {event.details.facility && (
                                <div>
                                  <span className="font-semibold text-slate-500">Lab:</span> {event.details.facility}
                                </div>
                              )}
                            </>
                          )}

                          {event.category === 'Diagnosis' && (
                            <>
                              <div>
                                <span className="font-semibold text-slate-500">Clinical Status:</span>{' '}
                                <span className="font-bold">{event.details.status}</span>
                              </div>
                              {event.details.notes && (
                                <div>
                                  <span className="font-semibold text-slate-500">Clinical Notes:</span> {event.details.notes}
                                </div>
                              )}
                            </>
                          )}

                          {event.category === 'Treatment & Procedure' && (
                            <>
                              <div>
                                <span className="font-semibold text-slate-500">Outcome:</span>{' '}
                                <span className="font-bold text-teal-700">{event.details.outcome}</span>
                              </div>
                              {event.details.department && (
                                <div>
                                  <span className="font-semibold text-slate-500">Department:</span> {event.details.department}
                                </div>
                              )}
                              {event.details.notes && (
                                <div>
                                  <span className="font-semibold text-slate-500">Progress:</span> {event.details.notes}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Action buttons on cards */}
                        <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {event.linkUrl && (
                            <Link
                              to={event.linkUrl}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <span>View Encounter Record</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {event.fileUrl && (
                            <a
                              href={event.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Document</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Diagnoses & Treatment History */}
        {activeTab === 'diagnoses' && (
          <div className="space-y-6">
            {/* Section 1: Diagnoses */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Patient Clinical Diagnoses
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documented clinical conditions, chronic health concerns, and resolved medical events
                  </p>
                </div>
                {isDoctorOrAdmin && (
                  <button
                    onClick={() => {
                      setEditingDiagnosis(null);
                      setDiagForm({
                        condition: '',
                        status: 'Active',
                        diagnosisDate: new Date().toISOString().split('T')[0],
                        notes: '',
                      });
                      setIsAddDiagModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Document Diagnosis
                  </button>
                )}
              </div>

              <div className="mt-4">
                {profile?.medicalHistory && profile.medicalHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Condition / Diagnosis</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Diagnosed Date</th>
                          <th className="py-3 px-4">Clinical Notes</th>
                          {isDoctorOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.medicalHistory.map((item, idx) => {
                          const isResolved = item.status === 'Resolved';
                          const isChronic = item.status === 'Chronic';
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">{item.condition}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-bold ${
                                    isResolved
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isChronic
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {item.diagnosisDate ? new Date(item.diagnosisDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-md">{item.notes || '—'}</td>
                              {isDoctorOrAdmin && (
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingDiagnosis(item);
                                        setDiagForm({
                                          condition: item.condition,
                                          status: item.status,
                                          diagnosisDate: item.diagnosisDate
                                            ? new Date(item.diagnosisDate).toISOString().split('T')[0]
                                            : '',
                                          notes: item.notes || '',
                                        });
                                        setIsAddDiagModalOpen(true);
                                      }}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                      title="Edit Diagnosis"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDiagnosis(item._id)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                      title="Delete Diagnosis"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No clinical diagnoses documented for this patient.
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Treatment History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-teal-600" />
                    Therapeutic Treatments & Surgical Procedures
                  </h3>
                  <p className="text-xs text-slate-500">
                    Interventions, surgeries, therapy regimens, and longitudinal recovery outcomes
                  </p>
                </div>
                {isDoctorOrAdmin && (
                  <button
                    onClick={() => {
                      setEditingTreatment(null);
                      setTreatForm({
                        treatmentName: '',
                        treatmentType: 'Medication Course',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: '',
                        outcome: 'Ongoing',
                        department: '',
                        notes: '',
                      });
                      setIsAddTreatModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Record Treatment
                  </button>
                )}
              </div>

              <div className="mt-4">
                {profile?.treatments && profile.treatments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Treatment / Procedure</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Dates</th>
                          <th className="py-3 px-4">Outcome</th>
                          <th className="py-3 px-4">Department / Notes</th>
                          {isDoctorOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.treatments.map((tr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">{tr.treatmentName}</td>
                            <td className="py-3 px-4 text-slate-600">{tr.treatmentType}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {tr.startDate ? new Date(tr.startDate).toLocaleDateString() : 'N/A'}
                              {tr.endDate ? ` → ${new Date(tr.endDate).toLocaleDateString()}` : ' (Ongoing)'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold ${
                                  tr.outcome === 'Successful'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : tr.outcome === 'Improved'
                                    ? 'bg-teal-100 text-teal-800'
                                    : tr.outcome === 'Ongoing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {tr.outcome}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-sm">
                              {tr.department && <span className="font-semibold text-slate-700">[{tr.department}] </span>}
                              {tr.notes || '—'}
                            </td>
                            {isDoctorOrAdmin && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingTreatment(tr);
                                      setTreatForm({
                                        treatmentName: tr.treatmentName,
                                        treatmentType: tr.treatmentType,
                                        startDate: tr.startDate ? new Date(tr.startDate).toISOString().split('T')[0] : '',
                                        endDate: tr.endDate ? new Date(tr.endDate).toISOString().split('T')[0] : '',
                                        outcome: tr.outcome,
                                        department: tr.department || '',
                                        notes: tr.notes || '',
                                      });
                                      setIsAddTreatModalOpen(true);
                                    }}
                                    className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                                    title="Update Treatment"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTreatment(tr._id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete Treatment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No therapeutic interventions or surgical records logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Diagnostic Test Reports & Storage */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="no-print bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Category:</span>
                {['All', 'Pathology', 'Radiology', 'Cardiology', 'Surgery', 'General'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDocCategoryFilter(cat)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      docCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  onClick={() => setDocAbnormalOnly(!docAbnormalOnly)}
                  className={`ml-2 px-3 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 ${
                    docAbnormalOnly
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Abnormal / Critical Only
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-64">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search test findings..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={fetchDocuments}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Reports Cards Grid */}
            {loadingTab ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Loading diagnostic reports...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Diagnostic Reports Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No laboratory or radiology documents matching this filter have been uploaded for this patient.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  const isAbnormal = doc.isAbnormal;
                  const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf');
                  const isImage = /\.(png|jpe?g|webp)$/i.test(doc.fileName || '');

                  return (
                    <div
                      key={doc._id}
                      className={`bg-white rounded-2xl border ${
                        isAbnormal ? 'border-rose-300 shadow-rose-50' : 'border-slate-200'
                      } p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between`}
                    >
                      <div>
                        {/* Header badges */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {doc.category}
                          </span>
                          {isAbnormal ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Abnormal Critical
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                              Normal
                            </span>
                          )}
                        </div>

                        {/* Title & Date */}
                        <div className="mt-3 flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl ${
                              isPdf ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(doc.documentDate).toLocaleDateString()} • {doc.facility}
                            </p>
                          </div>
                        </div>

                        {/* Findings Preview */}
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-700">
                          <span className="font-semibold text-slate-500">Summary / Findings:</span>
                          <p className="mt-0.5 leading-relaxed">{doc.findings || 'No findings recorded.'}</p>
                          {isAbnormal && doc.abnormalDetails && (
                            <div className="mt-2 pt-2 border-t border-rose-200 text-rose-800 font-medium">
                              ⚠️ <span className="font-bold">Critical Alert:</span> {doc.abnormalDetails}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {doc.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {(doc.fileSize / 1024).toFixed(0)} KB
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Quick Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                          {isDoctorOrAdmin && (
                            <button
                              onClick={() => handleDeleteDoc(doc._id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Upload Medical Documents */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-3xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                Upload Medical Document / Test Report
              </h3>
              <p className="text-xs text-slate-500">
                Upload pathology labs, radiology scans (MRI/CT/X-Ray), discharge summaries, or external medical records
              </p>
            </div>

            <form onSubmit={handleUploadDocument} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document / Test Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12-Lead Resting ECG, Serum Ferritin Report"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={uploadForm.documentType}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Diagnostic Report">Diagnostic Report</option>
                    <option value="Pathology / Lab">Pathology / Lab</option>
                    <option value="Radiology / Scan">Radiology / Scan</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Referral Letter">Referral Letter</option>
                    <option value="Consent Form">Consent Form</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Pathology">Pathology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Surgery">Surgery</option>
                    <option value="General">General</option>
                    <option value="External Record">External Record</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Facility */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Testing Facility / Lab</label>
                  <input
                    type="text"
                    value={uploadForm.facility}
                    onChange={(e) => setUploadForm({ ...uploadForm, facility: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Document</label>
                  <input
                    type="date"
                    value={uploadForm.documentDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Findings */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Findings / Diagnostic Impression
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter key numerical results, impressions, or diagnostic highlights..."
                  value={uploadForm.findings}
                  onChange={(e) => setUploadForm({ ...uploadForm, findings: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Abnormal Critical Flag */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAbnormalCheck"
                    checked={uploadForm.isAbnormal}
                    onChange={(e) => setUploadForm({ ...uploadForm, isAbnormal: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <label htmlFor="isAbnormalCheck" className="text-xs font-bold text-rose-900 cursor-pointer">
                    Flag as Critical / Abnormal Finding requiring physician attention
                  </label>
                </div>

                {uploadForm.isAbnormal && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-rose-800 mb-1">
                      Abnormal Details / Warning Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Troponin elevated > 0.04 ng/mL, Ischemic ST segment elevation"
                      value={uploadForm.abnormalDetails}
                      onChange={(e) => setUploadForm({ ...uploadForm, abnormalDetails: e.target.value })}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-rose-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Index Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, ECG, Arrhythmia, Post-Op"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* File Attachment Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attach Medical Document File (PDF, PNG, JPG, WebP, DOCX, DICOM - Max 10MB) <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-500 transition bg-slate-50">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-xs text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                      >
                        <span>Choose a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          required
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.dicom"
                          onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-[11px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                    {uploadForm.file && (
                      <div className="mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 py-1 px-3 rounded-lg inline-block">
                        Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(0)} KB)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Document...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload to Patient EMR
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: Unified Digital Prescriptions Repository */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {/* Search & Statistics Bar */}
            <div className="no-print bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-indigo-600" />
                  Prescriptions & Discharge Regimens
                </h3>
                <p className="text-xs text-slate-500">
                  Aggregated digital outpatient prescriptions and inpatient discharge drug regimens
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search drug name or diagnosis..."
                  value={prescriptionSearch}
                  onChange={(e) => setPrescriptionSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {loadingTab ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Retrieving prescription records...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Prescriptions Issued</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No outpatient prescriptions or inpatient discharge regimens are on record for this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions
                  .filter((rx) => {
                    if (!prescriptionSearch) return true;
                    const q = prescriptionSearch.toLowerCase();
                    return (
                      rx.prescriptionId.toLowerCase().includes(q) ||
                      rx.diagnosis.toLowerCase().includes(q) ||
                      rx.doctor?.name.toLowerCase().includes(q) ||
                      rx.medications?.some((m) => m.name.toLowerCase().includes(q))
                    );
                  })
                  .map((rx) => (
                    <div
                      key={rx.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                            #{rx.prescriptionId}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              rx.type.includes('Discharge')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {rx.type}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            • Issued by {rx.doctor?.name} ({rx.doctor?.department || 'Medicine'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {new Date(rx.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {rx.viewUrl && (
                            <Link
                              to={rx.viewUrl}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              View Slip
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="text-xs text-slate-500 font-medium">Indication / Diagnosis: </span>
                        <span className="text-xs font-bold text-slate-900">{rx.diagnosis}</span>
                      </div>

                      {/* Medications Table */}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Medication Name</th>
                              <th className="py-2 px-3">Dosage</th>
                              <th className="py-2 px-3">Frequency</th>
                              <th className="py-2 px-3">Duration</th>
                              <th className="py-2 px-3">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rx.medications && rx.medications.length > 0 ? (
                              rx.medications.map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-bold text-indigo-900">{m.name}</td>
                                  <td className="py-2 px-3 text-slate-700">{m.dosage || '—'}</td>
                                  <td className="py-2 px-3 text-slate-700">{m.frequency || '—'}</td>
                                  <td className="py-2 px-3 text-slate-700">{m.duration || '—'}</td>
                                  <td className="py-2 px-3 text-slate-600">{m.instructions || '—'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-2 px-3 text-center text-slate-400">
                                  No pharmaceutical items listed.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Advice / Notes */}
                      {(rx.dietaryAdvice || rx.generalNotes) && (
                        <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {rx.dietaryAdvice && (
                            <div className="text-slate-600">
                              <span className="font-semibold text-slate-500">Diet & Lifestyle: </span>
                              {rx.dietaryAdvice}
                            </div>
                          )}
                          {rx.generalNotes && (
                            <div className="text-slate-600">
                              <span className="font-semibold text-slate-500">Course & Follow-Up: </span>
                              {rx.generalNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Comprehensive Printable EMR Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="no-print flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clinical EMR Summary Ready for Print</h3>
                <p className="text-xs text-slate-500">
                  Consolidated medical dossier formatted cleanly for case sheets, referral letters, and patient handoffs
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Clinical Summary
              </button>
            </div>

            {/* Print Sheet Card */}
            <div className="print-sheet bg-white rounded-2xl border border-slate-300 p-8 shadow-sm text-slate-900 font-sans space-y-6">
              {/* Hospital Print Header */}
              <div className="border-b-2 border-indigo-900 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Hospital className="w-6 h-6 text-indigo-900" />
                    <h1 className="text-2xl font-extrabold text-indigo-950 tracking-tight">
                      MEDCARE MULTI-SPECIALITY HOSPITAL
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Central Electronic Medical Records Registry • 100 Medical Center Blvd • Tel: +1 (800) 555-0199 • emr@medcare.org
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded border border-indigo-200">
                    Comprehensive EMR Dossier
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Ref: EMR-{profile?.patientId || 'PAT'}-{patient?._id ? patient._id.toString().slice(-6).toUpperCase() : 'REC'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Generated: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Patient Profile Demographics */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs print-avoid-break">
                <div>
                  <div className="text-slate-500 font-medium">Patient Full Name:</div>
                  <div className="font-bold text-sm text-slate-900">{patient?.name || 'N/A'}</div>
                  <div className="text-slate-500 font-medium mt-1">EMR Identifier:</div>
                  <div className="font-mono font-bold text-indigo-800">{profile?.patientId || 'Pending ID'}</div>
                  <div className="text-slate-500 font-medium mt-1">Contact Phone:</div>
                  <div className="text-slate-800 font-semibold">{patient?.phone || 'Not recorded'}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Age & Gender:</div>
                  <div className="font-bold text-slate-800">
                    {calculateAge(patient?.dateOfBirth)} Yrs / {patient?.gender || 'N/A'}
                  </div>
                  <div className="text-slate-500 font-medium mt-1">Blood Group:</div>
                  <div className="font-bold text-rose-700">{profile?.bloodGroup || 'Unknown'}</div>
                  <div className="text-slate-500 font-medium mt-1">Email Address:</div>
                  <div className="text-slate-700">{patient?.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Emergency Contact:</div>
                  <div className="font-semibold text-slate-800">
                    {profile?.emergencyContact?.name
                      ? `${profile.emergencyContact.name} (${profile.emergencyContact.relationship || 'Contact'}) - ${profile.emergencyContact.phone || '—'}`
                      : 'None documented'}
                  </div>
                  <div className="text-slate-500 font-medium mt-1">Insurance Policy:</div>
                  <div className="font-semibold text-slate-800">
                    {profile?.insurance?.provider || 'Self-Pay / Cash'}
                    {profile?.insurance?.policyNumber ? ` (Pol: ${profile.insurance.policyNumber})` : ''}
                  </div>
                  <div className="text-slate-500 font-medium mt-1">Marital Status:</div>
                  <div className="text-slate-700">{profile?.maritalStatus || 'Single'}</div>
                </div>
              </div>

              {/* Allergen & Hypersensitivity Warning Box */}
              <div className="border border-rose-200 bg-rose-50/50 p-3 rounded-xl text-xs print-avoid-break">
                <span className="font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Critical Hypersensitivity / Allergy Profile:
                </span>
                {profile?.allergies && profile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.allergies.map((all, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-rose-300 text-rose-900 px-2 py-0.5 rounded font-bold"
                      >
                        ⚠️ {all.allergen} ({all.severity} - {all.reaction || 'Reaction'})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-800 font-semibold">No Known Drug Allergies (NKDA) on file.</span>
                )}
              </div>

              {/* 1. Documented Clinical Diagnoses */}
              <div className="print-avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
                  1. Clinical Diagnoses & Medical History
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-1.5 px-3 border-b">Condition / Diagnosis</th>
                      <th className="py-1.5 px-3 border-b">Status</th>
                      <th className="py-1.5 px-3 border-b">Diagnosed Date</th>
                      <th className="py-1.5 px-3 border-b">Clinical Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile?.medicalHistory && profile.medicalHistory.length > 0 ? (
                      profile.medicalHistory.map((m, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{m.condition}</td>
                          <td className="py-1.5 px-3 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                m.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : m.status === 'Chronic'
                                  ? 'bg-purple-50 text-purple-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-slate-500">
                            {m.diagnosisDate ? new Date(m.diagnosisDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-1.5 px-3 text-slate-700">{m.notes || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-2.5 text-center text-slate-400">
                          No active diagnoses or historical conditions on file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. Treatments & Surgical Procedures */}
              <div className="print-avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
                  2. Treatments, Surgical Interventions & Therapies
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-1.5 px-3 border-b">Treatment / Procedure</th>
                      <th className="py-1.5 px-3 border-b">Type</th>
                      <th className="py-1.5 px-3 border-b">Dates</th>
                      <th className="py-1.5 px-3 border-b">Outcome</th>
                      <th className="py-1.5 px-3 border-b">Notes / Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile?.treatments && profile.treatments.length > 0 ? (
                      profile.treatments.map((tr, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{tr.treatmentName}</td>
                          <td className="py-1.5 px-3 text-slate-600">{tr.treatmentType}</td>
                          <td className="py-1.5 px-3 text-slate-500">
                            {tr.startDate ? new Date(tr.startDate).toLocaleDateString() : 'N/A'}
                            {tr.endDate ? ` → ${new Date(tr.endDate).toLocaleDateString()}` : ' (Ongoing)'}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-teal-800">{tr.outcome}</td>
                          <td className="py-1.5 px-3 text-slate-600">
                            {tr.department ? `[${tr.department}] ` : ''}{tr.notes || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-2.5 text-center text-slate-400">
                          No surgical procedures or therapeutic interventions on record.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 3. Active Medications & Digital Prescriptions */}
              <div className="print-avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
                  3. Active Medications & Prescribed Regimens
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-1.5 px-3 border-b">Medication Name</th>
                      <th className="py-1.5 px-3 border-b">Dosage</th>
                      <th className="py-1.5 px-3 border-b">Frequency</th>
                      <th className="py-1.5 px-3 border-b">Duration</th>
                      <th className="py-1.5 px-3 border-b">Prescribing Doctor / Source</th>
                      <th className="py-1.5 px-3 border-b">Special Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescriptions && prescriptions.length > 0 && prescriptions.some((p) => p.medications?.length > 0) ? (
                      prescriptions.flatMap((rx) =>
                        (rx.medications || []).map((m, idx) => (
                          <tr key={`${rx.id}-${idx}`}>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{m.name}</td>
                            <td className="py-1.5 px-3 text-slate-700">{m.dosage || '—'}</td>
                            <td className="py-1.5 px-3 text-slate-700">{m.frequency || '—'}</td>
                            <td className="py-1.5 px-3 text-slate-700">{m.duration || '—'}</td>
                            <td className="py-1.5 px-3 text-slate-600">
                              {rx.doctor?.name || 'Physician'} ({rx.type})
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">{m.instructions || '—'}</td>
                          </tr>
                        ))
                      )
                    ) : overview?.activeMedications && overview.activeMedications.length > 0 ? (
                      overview.activeMedications.map((m, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{m.name}</td>
                          <td className="py-1.5 px-3 text-slate-700">{m.dosage || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-700">{m.frequency || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-700">{m.duration || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-600">
                            {m.prescribedBy || 'Attending'} ({m.source || 'OPD'})
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{m.instructions || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-2.5 text-center text-slate-400">
                          No active pharmaceutical prescriptions or discharge regimens on file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. Key Diagnostic & Pathology Test Reports */}
              <div className="print-avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
                  4. Key Diagnostic & Laboratory Test Reports
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-1.5 px-3 border-b">Test Title / Investigation</th>
                      <th className="py-1.5 px-3 border-b">Category</th>
                      <th className="py-1.5 px-3 border-b">Date</th>
                      <th className="py-1.5 px-3 border-b">Result Status</th>
                      <th className="py-1.5 px-3 border-b">Findings & Laboratory Impression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview?.recentReports && overview.recentReports.length > 0 ? (
                      overview.recentReports.map((r, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{r.title}</td>
                          <td className="py-1.5 px-3 text-slate-600">{r.category}</td>
                          <td className="py-1.5 px-3 text-slate-500">
                            {r.documentDate ? new Date(r.documentDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                r.isAbnormal
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {r.isAbnormal ? `CRITICAL ALERT` : 'Normal'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-slate-700">
                            {r.findings || 'Verified findings recorded.'}
                            {r.isAbnormal && r.abnormalDetails ? (
                              <span className="block text-rose-700 font-semibold mt-0.5">
                                Alert Note: {r.abnormalDetails}
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-2.5 text-center text-slate-400">
                          No diagnostic or laboratory reports recorded for this patient.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. Summary of Encounters */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-around text-center print-avoid-break">
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Outpatient Visits</span>
                  <span className="font-bold text-sm text-slate-800">{stats?.opdVisitsCount ?? 0}</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 block text-[11px]">Inpatient Admissions</span>
                  <span className="font-bold text-sm text-slate-800">{stats?.ipdAdmissionsCount ?? 0}</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 block text-[11px]">Diagnostic Investigations</span>
                  <span className="font-bold text-sm text-slate-800">{stats?.testReportsCount ?? 0}</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 block text-[11px]">Critical Alerts Logged</span>
                  <span className={`font-bold text-sm ${stats?.abnormalReportsCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {stats?.abnormalReportsCount ?? 0}
                  </span>
                </div>
              </div>

              {/* 6. Clinical Attestation & Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600 print-avoid-break">
                <div>
                  <p className="font-medium text-slate-700">Clinical Attestation:</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    I hereby attest that this consolidated Electronic Medical Record accurately represents the patient's
                    diagnoses, interventions, medication regimens, and clinical findings on record at MedCare Hospital.
                  </p>
                  <p className="font-bold text-slate-900 mt-3">Dr. Sarah Jenkins, MD</p>
                  <p className="text-[11px] text-slate-400">Chief Medical Officer / Central EMR Custodian</p>
                </div>
                <div className="text-right flex flex-col justify-end items-end">
                  <div className="h-10 border-b border-slate-400 w-52 mb-1"></div>
                  <p className="text-[11px] text-slate-500 font-semibold">Authorized Physician / Records Officer</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date & Hospital Seal</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Diagnosis */}
      {isAddDiagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingDiagnosis ? 'Edit Clinical Diagnosis' : 'Document Clinical Diagnosis'}
              </h3>
              <button
                onClick={() => setIsAddDiagModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Condition / Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hypertension Stage 1, Type 2 Diabetes"
                  value={diagForm.condition}
                  onChange={(e) => setDiagForm({ ...diagForm, condition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={diagForm.status}
                    onChange={(e) => setDiagForm({ ...diagForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Chronic">Chronic</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diagnosed Date</label>
                  <input
                    type="date"
                    value={diagForm.diagnosisDate}
                    onChange={(e) => setDiagForm({ ...diagForm, diagnosisDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes & Observations</label>
                <textarea
                  rows={3}
                  placeholder="Clinical findings, severity, management plan..."
                  value={diagForm.notes}
                  onChange={(e) => setDiagForm({ ...diagForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDiagModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Diagnosis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Treatment */}
      {isAddTreatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTreatment ? 'Update Treatment / Surgical Procedure' : 'Record Treatment or Procedure'}
              </h3>
              <button
                onClick={() => setIsAddTreatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Treatment / Surgical Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coronary Angiography, Metformin Therapy, Physical Rehabilitation"
                  value={treatForm.treatmentName}
                  onChange={(e) => setTreatForm({ ...treatForm, treatmentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Treatment Type</label>
                  <select
                    value={treatForm.treatmentType}
                    onChange={(e) => setTreatForm({ ...treatForm, treatmentType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Medication Course">Medication Course</option>
                    <option value="Surgical Procedure">Surgical Procedure</option>
                    <option value="Physical Therapy">Physical Therapy</option>
                    <option value="Radiation Therapy">Radiation Therapy</option>
                    <option value="Dietary & Lifestyle">Dietary & Lifestyle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Outcome</label>
                  <select
                    value={treatForm.outcome}
                    onChange={(e) => setTreatForm({ ...treatForm, outcome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Successful">Successful</option>
                    <option value="Improved">Improved</option>
                    <option value="Complications">Complications</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={treatForm.startDate}
                    onChange={(e) => setTreatForm({ ...treatForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={treatForm.endDate}
                    onChange={(e) => setTreatForm({ ...treatForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Orthopedics, General Surgery"
                  value={treatForm.department}
                  onChange={(e) => setTreatForm({ ...treatForm, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Progress Notes</label>
                <textarea
                  rows={3}
                  placeholder="Response to therapy, post-op observations, discharge goals..."
                  value={treatForm.notes}
                  onChange={(e) => setTreatForm({ ...treatForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTreatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Preview Document */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-4xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500">
                  {previewDoc.category} • {new Date(previewDoc.documentDate).toLocaleDateString()} • {previewDoc.facility}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-auto bg-slate-100 rounded-xl flex items-center justify-center min-h-[350px] p-4">
              {previewDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[500px] rounded-lg border border-slate-300"
                />
              ) : /\.(png|jpe?g|webp)$/i.test(previewDoc.fileName || '') ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">{previewDoc.fileName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct browser preview not supported for this file format. Please download the document to inspect.
                  </p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-600">
                <span className="font-semibold">Findings:</span> {previewDoc.findings || 'None recorded'}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmrPortal;
