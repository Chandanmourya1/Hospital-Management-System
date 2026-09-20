import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAdmissionById,
  getAllWardRooms,
  transferBed,
  addDoctorRound,
  addNursingRecord,
  dischargePatient,
} from '../../services/ipdService';
import toast from 'react-hot-toast';
import {
  Building,
  User,
  Bed,
  Stethoscope,
  Activity,
  Calendar,
  Clock,
  FileText,
  Heart,
  Droplet,
  ShieldAlert,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronLeft,
  ArrowRightLeft,
  DollarSign,
  Loader2,
  Sparkles,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const TABS = [
  'Overview & Baseline',
  'Doctor Rounds & Orders',
  'Nursing Care & Fluids',
  'Bed Transfer',
  'Discharge Clearance',
];

const IpdPatientDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview & Baseline');

  // Operational Rooms for Bed Transfer
  const [wardRooms, setWardRooms] = useState([]);

  // Sub-forms toggles & state
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showNursingModal, setShowNursingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Doctor Round Form State
  const [roundForm, setRoundForm] = useState({
    clinicalObservations: '',
    patientCondition: 'Stable',
    medicationOrders: [
      { name: '', dosage: '', route: 'Oral', frequency: '1-0-1', instructions: 'After food' },
    ],
    investigationsOrdered: '',
    dietaryInstructions: '',
  });

  // New Nursing Record Form State
  const [nursingForm, setNursingForm] = useState({
    nurseName: user?.name || '',
    shift: 'Morning',
    vitals: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      spO2: '',
      bloodSugar: '',
    },
    intakeOutput: {
      oralIntakeMl: 0,
      ivFluidsMl: 0,
      urineOutputMl: 0,
      drainOutputMl: 0,
    },
    painScale: 0,
    nursingNotes: '',
  });

  // Bed Transfer Form State
  const [transferForm, setTransferForm] = useState({
    targetWardRoomId: '',
    targetBedNumber: '',
    reason: '',
  });

  // Discharge Form State
  const [dischargeForm, setDischargeForm] = useState({
    finalDiagnosis: '',
    courseInHospital: '',
    conditionAtDischarge: 'Improved',
    dischargeMedications: [
      { name: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: 'After food' },
    ],
    dietaryAndActivityAdvice: '',
    followUpAdvice: {
      recommendedDate: '',
      instructions: 'Review in OPD clinic with discharge summary',
    },
    treatmentAndNursingCharges: 0,
    paymentStatus: 'Pending',
  });

  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'doctor';

  const fetchAdmission = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdmissionById(id);
      setAdmission(res.admission);

      // Pre-fill discharge final diagnosis with provisional if empty
      if (res.admission?.provisionalDiagnosis) {
        setDischargeForm((prev) => ({
          ...prev,
          finalDiagnosis: prev.finalDiagnosis || res.admission.provisionalDiagnosis,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inpatient clinical chart');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAdmission();
  }, [fetchAdmission]);

  // Fetch rooms for bed transfer
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await getAllWardRooms();
        setWardRooms(res.rooms || []);
      } catch (err) {
        console.error('Failed to load rooms for transfer', err);
      }
    };
    fetchRooms();
  }, []);

  // Medication Row Handlers (Rounds)
  const handleAddRoundMedRow = () => {
    setRoundForm((prev) => ({
      ...prev,
      medicationOrders: [
        ...prev.medicationOrders,
        { name: '', dosage: '', route: 'Oral', frequency: '1-0-1', instructions: 'After food' },
      ],
    }));
  };

  const handleRemoveRoundMedRow = (idx) => {
    setRoundForm((prev) => ({
      ...prev,
      medicationOrders: prev.medicationOrders.filter((_, i) => i !== idx),
    }));
  };

  const handleRoundMedChange = (idx, field, val) => {
    setRoundForm((prev) => {
      const updated = [...prev.medicationOrders];
      updated[idx][field] = val;
      return { ...prev, medicationOrders: updated };
    });
  };

  // Submit Doctor Round
  const handleSubmitRound = async (e) => {
    e.preventDefault();
    if (!roundForm.clinicalObservations.trim()) {
      toast.error('Please enter clinical progress observations');
      return;
    }

    try {
      setActionLoading(true);
      const investigationsArray = roundForm.investigationsOrdered
        ? roundForm.investigationsOrdered
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      await addDoctorRound(id, {
        clinicalObservations: roundForm.clinicalObservations,
        patientCondition: roundForm.patientCondition,
        medicationOrders: roundForm.medicationOrders.filter((m) => m.name.trim() !== ''),
        investigationsOrdered: investigationsArray,
        dietaryInstructions: roundForm.dietaryInstructions,
      });

      toast.success('Doctor progress round & orders recorded');
      setShowRoundModal(false);
      setRoundForm({
        clinicalObservations: '',
        patientCondition: 'Stable',
        medicationOrders: [
          { name: '', dosage: '', route: 'Oral', frequency: '1-0-1', instructions: 'After food' },
        ],
        investigationsOrdered: '',
        dietaryInstructions: '',
      });
      await fetchAdmission();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record doctor round');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Nursing Record
  const handleSubmitNursing = async (e) => {
    e.preventDefault();
    if (!nursingForm.nursingNotes.trim()) {
      toast.error('Please enter nursing shift notes');
      return;
    }

    try {
      setActionLoading(true);
      await addNursingRecord(id, nursingForm);
      toast.success('Nursing care chart logged');
      setShowNursingModal(false);
      setNursingForm({
        nurseName: user?.name || '',
        shift: 'Morning',
        vitals: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          respiratoryRate: '',
          spO2: '',
          bloodSugar: '',
        },
        intakeOutput: {
          oralIntakeMl: 0,
          ivFluidsMl: 0,
          urineOutputMl: 0,
          drainOutputMl: 0,
        },
        painScale: 0,
        nursingNotes: '',
      });
      await fetchAdmission();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log nursing record');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Bed Transfer
  const handleTransferBed = async (e) => {
    e.preventDefault();
    if (!transferForm.targetWardRoomId || !transferForm.targetBedNumber) {
      toast.error('Please select destination room and bed');
      return;
    }

    try {
      setActionLoading(true);
      await transferBed(id, transferForm);
      toast.success('Patient transferred successfully! Previous bed marked for cleaning.');
      setTransferForm({ targetWardRoomId: '', targetBedNumber: '', reason: '' });
      await fetchAdmission();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer bed');
    } finally {
      setActionLoading(false);
    }
  };

  // Medication Row Handlers (Discharge)
  const handleAddDischargeMedRow = () => {
    setDischargeForm((prev) => ({
      ...prev,
      dischargeMedications: [
        ...prev.dischargeMedications,
        { name: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: 'After food' },
      ],
    }));
  };

  const handleRemoveDischargeMedRow = (idx) => {
    setDischargeForm((prev) => ({
      ...prev,
      dischargeMedications: prev.dischargeMedications.filter((_, i) => i !== idx),
    }));
  };

  const handleDischargeMedChange = (idx, field, val) => {
    setDischargeForm((prev) => {
      const updated = [...prev.dischargeMedications];
      updated[idx][field] = val;
      return { ...prev, dischargeMedications: updated };
    });
  };

  // Submit Discharge
  const handleExecuteDischarge = async (e) => {
    e.preventDefault();
    if (!dischargeForm.finalDiagnosis.trim()) {
      toast.error('Please specify the final clinical diagnosis');
      return;
    }
    if (!dischargeForm.courseInHospital.trim()) {
      toast.error('Please summarize the clinical course during hospital stay');
      return;
    }

    try {
      setActionLoading(true);
      const res = await dischargePatient(id, {
        ...dischargeForm,
        dischargeMedications: dischargeForm.dischargeMedications.filter((m) => m.name.trim() !== ''),
      });

      toast.success('Patient discharged successfully! Bed released for sanitization.');
      await fetchAdmission();
      navigate(`/ipd/admissions/${id}/discharge-summary`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to discharge patient');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading clinical inpatient chart...</p>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Admission Record Not Found</h3>
        <Link
          to="/ipd/admissions"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white"
        >
          Return to Admissions Ledger
        </Link>
      </div>
    );
  }

  const isDischarged = admission.status === 'Discharged';
  const selectedTransferRoom = wardRooms.find((r) => r._id === transferForm.targetWardRoomId);
  const availableTransferBeds =
    selectedTransferRoom?.beds?.filter((b) => b.status === 'Available') || [];

  return (
    <PageContainer className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/ipd/admissions"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>Inpatient Department Clinical EMR Chart</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {admission.admissionId} — {admission.patient?.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/ipd/beds"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <Bed className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Bed Matrix</span>
          </Link>

          {isDischarged && (
            <Link
              to={`/ipd/admissions/${id}/discharge-summary`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print Discharge Summary</span>
            </Link>
          )}
        </div>
      </div>

      {/* Patient Inpatient Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Patient Overview */}
          <div className="space-y-1 lg:border-r lg:border-slate-100 pr-0 lg:pr-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inpatient</div>
            <h2 className="text-lg font-black text-slate-900">{admission.patient?.name}</h2>
            <div className="text-xs text-slate-600">
              {admission.patient?.gender || 'N/A'} • {admission.patientProfile?.bloodGroup || 'Blood: N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Phone: {admission.patient?.phone || 'N/A'}
            </div>

            {/* Allergies Pill */}
            {admission.patientProfile?.allergies && admission.patientProfile.allergies.length > 0 ? (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Allergies: {admission.patientProfile.allergies.map((a) => a.allergen || a).join(', ')}</span>
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
                No Known Allergies
              </div>
            )}
          </div>

          {/* Bed Allocation */}
          <div className="space-y-1 lg:border-r lg:border-slate-100 pr-0 lg:pr-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allocated Bed</div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900">
                {admission.bedAllocation?.roomNumber} - {admission.bedAllocation?.bedNumber}
              </span>
              <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                ₹{admission.bedAllocation?.dailyRate?.toLocaleString('en-IN')}/day
              </span>
            </div>
            <div className="text-xs text-slate-600">{admission.bedAllocation?.wardName}</div>
            <div className="text-[11px] text-slate-400">
              Allocated:{' '}
              {admission.bedAllocation?.allocatedAt
                ? new Date(admission.bedAllocation.allocatedAt).toLocaleDateString()
                : 'N/A'}
            </div>
          </div>

          {/* Attending Doctor */}
          <div className="space-y-1 lg:border-r lg:border-slate-100 pr-0 lg:pr-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attending Physician</div>
            <div className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>{admission.attendingDoctor?.name || 'On Duty'}</span>
            </div>
            <div className="text-xs text-slate-600">{admission.department}</div>
            <div className="text-[11px] text-slate-500">
              Admission Type: <span className="font-semibold text-slate-700">{admission.admissionType}</span>
            </div>
          </div>

          {/* Admission Date & Status */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Status</div>
            <div>
              <span
                className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${
                  isDischarged
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse'
                }`}
              >
                {admission.status}
              </span>
            </div>
            <div className="text-xs text-slate-600">
              Admitted: {new Date(admission.admissionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto hms-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: Overview & Baseline Vitals */}
      {activeTab === 'Overview & Baseline' && (
        <div className="space-y-6">
          {/* Diagnosis & Complaints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Provisional Clinical Diagnosis</span>
              </div>
              <p className="text-base font-bold text-slate-900 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                {admission.provisionalDiagnosis}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Chief Complaints at Admission</span>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {admission.chiefComplaints}
              </p>
            </div>
          </div>

          {/* Initial Baseline Vitals Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Activity className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-black text-slate-900">Initial Admission Baseline Vitals</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Blood Pressure</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {admission.initialVitals?.bloodPressure || 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">mmHg</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Heart Rate</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {admission.initialVitals?.heartRate || 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">bpm</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Temperature</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {admission.initialVitals?.temperature ? `${admission.initialVitals.temperature}°F` : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">Fahrenheit</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">SpO2 Oxygen</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {admission.initialVitals?.spO2 ? `${admission.initialVitals.spO2}%` : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">Pulse Oximetry</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Respiratory Rate</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {admission.initialVitals?.respiratoryRate || 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">breaths/min</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Weight & Height</div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {admission.initialVitals?.weight ? `${admission.initialVitals.weight} kg` : 'N/A'} •{' '}
                  {admission.initialVitals?.height ? `${admission.initialVitals.height} cm` : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">Anthropometry</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Body Mass Index (BMI)</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {admission.initialVitals?.bmi ? `${admission.initialVitals.bmi}` : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">kg/m²</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Recorded On</div>
                <div className="text-sm font-black text-slate-900 mt-1">
                  {admission.initialVitals?.recordedAt
                    ? new Date(admission.initialVitals.recordedAt).toLocaleDateString()
                    : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400">Baseline Triage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Doctor Rounds & Inpatient Orders */}
      {activeTab === 'Doctor Rounds & Orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Clinical Progress Rounds & Orders</h3>
            {!isDischarged && isDoctor && (
              <button
                onClick={() => setShowRoundModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Record Doctor Round</span>
              </button>
            )}
          </div>

          {/* Rounds List */}
          {admission.doctorRounds?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Doctor Progress Rounds Logged Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Attending physicians can record daily clinical reviews and medication orders.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {admission.doctorRounds?.map((round, idx) => (
                <div
                  key={round._id || idx}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      <span className="text-sm font-black text-slate-900">
                        Daily Doctor Progress Round #{admission.doctorRounds.length - idx}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {new Date(round.roundDate).toLocaleString()}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                        round.patientCondition === 'Improving'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : round.patientCondition === 'Critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-200 animate-bounce'
                          : round.patientCondition === 'Guarded'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      Condition: {round.patientCondition}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Clinical Observations</h5>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {round.clinicalObservations}
                    </p>
                  </div>

                  {/* Active Medication Orders */}
                  {round.medicationOrders?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-500 uppercase">Active Inpatient Medication Orders</h5>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Medication</th>
                              <th className="py-2.5 px-3">Dosage</th>
                              <th className="py-2.5 px-3">Route</th>
                              <th className="py-2.5 px-3">Frequency</th>
                              <th className="py-2.5 px-3">Instructions</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {round.medicationOrders.map((med, mIdx) => (
                              <tr key={mIdx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-bold text-slate-900">{med.name}</td>
                                <td className="py-2.5 px-3 text-slate-700">{med.dosage}</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                                    {med.route}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-700">{med.frequency}</td>
                                <td className="py-2.5 px-3 text-slate-500">{med.instructions}</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {med.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Investigations & Dietary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {round.investigationsOrdered?.length > 0 && (
                      <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                        <span className="font-bold text-purple-900">Investigations Ordered: </span>
                        <span className="text-purple-800">{round.investigationsOrdered.join(', ')}</span>
                      </div>
                    )}

                    {round.dietaryInstructions && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                        <span className="font-bold text-amber-900">Dietary Instructions: </span>
                        <span className="text-amber-800">{round.dietaryInstructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Form: Add Doctor Progress Round */}
          {showRoundModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-sky-600" />
                    <h3 className="text-lg font-black text-slate-900">Log Doctor Progress Round & Orders</h3>
                  </div>
                  <button
                    onClick={() => setShowRoundModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitRound} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Patient Condition Rating <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={roundForm.patientCondition}
                        onChange={(e) => setRoundForm({ ...roundForm, patientCondition: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="Stable">Stable</option>
                        <option value="Improving">Improving</option>
                        <option value="Guarded">Guarded</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Clinical Observations & Progress Notes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Document physical exam, chest sounds, cardiovascular review, and treatment response..."
                      value={roundForm.clinicalObservations}
                      onChange={(e) => setRoundForm({ ...roundForm, clinicalObservations: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  {/* Medications Ordered Rows */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Active Inpatient Medication Orders
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRoundMedRow}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Medication
                      </button>
                    </div>

                    {roundForm.medicationOrders.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Drug name (e.g. Ceftriaxone)"
                            value={med.name}
                            onChange={(e) => handleRoundMedChange(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Dose (1g, 500mg)"
                            value={med.dosage}
                            onChange={(e) => handleRoundMedChange(idx, 'dosage', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            value={med.route}
                            onChange={(e) => handleRoundMedChange(idx, 'route', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <option value="Oral">Oral</option>
                            <option value="IV (Intravenous)">IV (Intravenous)</option>
                            <option value="IM (Intramuscular)">IM (Intramuscular)</option>
                            <option value="Subcutaneous">Subcutaneous</option>
                            <option value="Inhalation">Inhalation</option>
                            <option value="Topical">Topical</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Freq (1-0-1, Q8H)"
                            value={med.frequency}
                            onChange={(e) => handleRoundMedChange(idx, 'frequency', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={med.instructions}
                            onChange={(e) => handleRoundMedChange(idx, 'instructions', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-1 text-center">
                          {roundForm.medicationOrders.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRoundMedRow(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Investigations Ordered (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12-lead ECG, Serum Electrolytes, Chest X-Ray"
                      value={roundForm.investigationsOrdered}
                      onChange={(e) => setRoundForm({ ...roundForm, investigationsOrdered: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Dietary & Nursing Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Low sodium cardiac diet, strict fluid chart, bed rest"
                      value={roundForm.dietaryInstructions}
                      onChange={(e) => setRoundForm({ ...roundForm, dietaryInstructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRoundModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Saving...' : 'Save Round & Orders'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Nursing Care & Fluid Chart */}
      {activeTab === 'Nursing Care & Fluids' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Nursing Care Logs & Fluid Balance Chart</h3>
            {!isDischarged && isStaff && (
              <button
                onClick={() => setShowNursingModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Log Nursing Shift Care</span>
              </button>
            )}
          </div>

          {admission.nursingRecords?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Nursing Records Logged Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Ward nurses can log shift vitals, fluid intake/output balance, and observation notes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {admission.nursingRecords?.map((log, idx) => {
                const totalIn = (log.intakeOutput?.oralIntakeMl || 0) + (log.intakeOutput?.ivFluidsMl || 0);
                const totalOut = (log.intakeOutput?.urineOutputMl || 0) + (log.intakeOutput?.drainOutputMl || 0);
                const netBalance = totalIn - totalOut;

                return (
                  <div
                    key={log._id || idx}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span className="text-sm font-black text-slate-900">
                          {log.nurseName} • Shift: {log.shift}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({new Date(log.recordedAt).toLocaleString()})
                        </span>
                      </div>

                      {/* Pain Scale Pill */}
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          log.painScale > 6
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : log.painScale > 3
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        Pain Scale: {log.painScale}/10
                      </span>
                    </div>

                    {/* Vitals */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">BP</div>
                        <div className="text-sm font-black text-slate-800">{log.vitals?.bloodPressure || '--'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Pulse</div>
                        <div className="text-sm font-black text-slate-800">{log.vitals?.heartRate || '--'} bpm</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Temp</div>
                        <div className="text-sm font-black text-slate-800">{log.vitals?.temperature ? `${log.vitals.temperature}°F` : '--'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">SpO2</div>
                        <div className="text-sm font-black text-slate-800">{log.vitals?.spO2 ? `${log.vitals.spO2}%` : '--'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Resp</div>
                        <div className="text-sm font-black text-slate-800">{log.vitals?.respiratoryRate || '--'} /min</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Sugar (RBS)</div>
                        <div className="text-sm font-black text-slate-800">{log.vitals?.bloodSugar ? `${log.vitals.bloodSugar} mg/dL` : '--'}</div>
                      </div>
                    </div>

                    {/* Fluid Intake & Output Chart */}
                    <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-sky-900">Total Intake: </span>
                        <span className="text-sky-800">
                          {totalIn} mL (Oral: {log.intakeOutput?.oralIntakeMl || 0} mL, IV: {log.intakeOutput?.ivFluidsMl || 0} mL)
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-sky-900">Total Output: </span>
                        <span className="text-sky-800">
                          {totalOut} mL (Urine: {log.intakeOutput?.urineOutputMl || 0} mL, Drain: {log.intakeOutput?.drainOutputMl || 0} mL)
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-sky-900">Net Fluid Balance: </span>
                        <span className={`font-black ${netBalance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {netBalance > 0 ? `+${netBalance}` : netBalance} mL
                        </span>
                      </div>
                    </div>

                    {/* Nursing Notes */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Shift Observations</h5>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {log.nursingNotes}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal: Log Nursing Care */}
          {showNursingModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h3 className="text-lg font-black text-slate-900">Log Nursing Shift Chart</h3>
                  </div>
                  <button
                    onClick={() => setShowNursingModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitNursing} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nurse Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nursingForm.nurseName}
                        onChange={(e) => setNursingForm({ ...nursingForm, nurseName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Shift <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={nursingForm.shift}
                        onChange={(e) => setNursingForm({ ...nursingForm, shift: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      >
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Shift Vitals</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="BP (120/80)"
                        value={nursingForm.vitals.bloodPressure}
                        onChange={(e) =>
                          setNursingForm({
                            ...nursingForm,
                            vitals: { ...nursingForm.vitals, bloodPressure: e.target.value },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Pulse (bpm)"
                        value={nursingForm.vitals.heartRate}
                        onChange={(e) =>
                          setNursingForm({
                            ...nursingForm,
                            vitals: { ...nursingForm.vitals, heartRate: e.target.value },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Temp (°F)"
                        value={nursingForm.vitals.temperature}
                        onChange={(e) =>
                          setNursingForm({
                            ...nursingForm,
                            vitals: { ...nursingForm.vitals, temperature: e.target.value },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="SpO2 (%)"
                        value={nursingForm.vitals.spO2}
                        onChange={(e) =>
                          setNursingForm({
                            ...nursingForm,
                            vitals: { ...nursingForm.vitals, spO2: e.target.value },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Resp (/min)"
                        value={nursingForm.vitals.respiratoryRate}
                        onChange={(e) =>
                          setNursingForm({
                            ...nursingForm,
                            vitals: { ...nursingForm.vitals, respiratoryRate: e.target.value },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="RBS Sugar (mg/dL)"
                        value={nursingForm.vitals.bloodSugar}
                        onChange={(e) =>
                          setNursingForm({
                            ...nursingForm,
                            vitals: { ...nursingForm.vitals, bloodSugar: e.target.value },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Fluid Intake / Output */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Fluid Balance (mL)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold">Oral Intake</span>
                        <input
                          type="number"
                          value={nursingForm.intakeOutput.oralIntakeMl}
                          onChange={(e) =>
                            setNursingForm({
                              ...nursingForm,
                              intakeOutput: { ...nursingForm.intakeOutput, oralIntakeMl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold">IV Fluids</span>
                        <input
                          type="number"
                          value={nursingForm.intakeOutput.ivFluidsMl}
                          onChange={(e) =>
                            setNursingForm({
                              ...nursingForm,
                              intakeOutput: { ...nursingForm.intakeOutput, ivFluidsMl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold">Urine Output</span>
                        <input
                          type="number"
                          value={nursingForm.intakeOutput.urineOutputMl}
                          onChange={(e) =>
                            setNursingForm({
                              ...nursingForm,
                              intakeOutput: { ...nursingForm.intakeOutput, urineOutputMl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold">Drain Output</span>
                        <input
                          type="number"
                          value={nursingForm.intakeOutput.drainOutputMl}
                          onChange={(e) =>
                            setNursingForm({
                              ...nursingForm,
                              intakeOutput: { ...nursingForm.intakeOutput, drainOutputMl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pain Scale */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Pain Scale Rating (0 = No Pain, 10 = Severe Pain):{' '}
                      <span className="text-sky-600 font-black">{nursingForm.painScale}/10</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={nursingForm.painScale}
                      onChange={(e) => setNursingForm({ ...nursingForm, painScale: parseInt(e.target.value, 10) })}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nursing Shift Notes & Care Observations <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Document IV cannula site, mobility, medication administration compliance, and patient general state..."
                      value={nursingForm.nursingNotes}
                      onChange={(e) => setNursingForm({ ...nursingForm, nursingNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNursingModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Logging...' : 'Log Nursing Chart'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Bed Transfer */}
      {activeTab === 'Bed Transfer' && (
        <div className="space-y-6">
          {/* Active Bed Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-black text-slate-900">Current Bed Assignment</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Room & Bed</span>
                <div className="text-lg font-black text-slate-900">
                  {admission.bedAllocation?.roomNumber} - {admission.bedAllocation?.bedNumber}
                </div>
                <div className="text-xs text-slate-600">{admission.bedAllocation?.wardName}</div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase">Daily Rate</span>
                <div className="text-lg font-black text-sky-700">
                  ₹{admission.bedAllocation?.dailyRate?.toLocaleString('en-IN')}/day
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Form (Disabled if already discharged) */}
          {!isDischarged && isStaff ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ArrowRightLeft className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-black text-slate-900">Transfer Patient to Another Room/Bed</h3>
              </div>

              <form onSubmit={handleTransferBed} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Destination Ward Room <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={transferForm.targetWardRoomId}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          targetWardRoomId: e.target.value,
                          targetBedNumber: '',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    >
                      <option value="">-- Select Destination Room --</option>
                      {wardRooms.map((rm) => {
                        const freeBeds = rm.beds?.filter((b) => b.status === 'Available').length || 0;
                        return (
                          <option key={rm._id} value={rm._id}>
                            {rm.roomNumber} ({rm.wardType} - {rm.wardName}) - {freeBeds} Free (₹{rm.dailyRate}/day)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Destination Available Bed <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!transferForm.targetWardRoomId}
                      value={transferForm.targetBedNumber}
                      onChange={(e) => setTransferForm({ ...transferForm, targetBedNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm disabled:bg-slate-100"
                    >
                      <option value="">-- Select Free Bed --</option>
                      {availableTransferBeds.map((b) => (
                        <option key={b.bedNumber} value={b.bedNumber}>
                          {b.bedNumber} {b.features?.length ? `(${b.features.join(', ')})` : ''}
                        </option>
                      ))}
                    </select>
                    {transferForm.targetWardRoomId && availableTransferBeds.length === 0 && (
                      <p className="text-xs text-rose-500 mt-1 font-semibold">
                        No free beds in this room.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Clinical / Patient Reason for Bed Transfer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Upgraded to Private suite, Step-down transfer from ICU, Isolation required"
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading || !transferForm.targetBedNumber}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                    <span>Execute Bed Transfer</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    * The patient's previous bed will automatically be marked for sanitization cleaning.
                  </p>
                </div>
              </form>
            </div>
          ) : isDischarged ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
              Patient is discharged. Bed transfers are disabled.
            </div>
          ) : null}

          {/* Transfer History Audit Log */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Bed Transfer History</h3>
            {!admission.bedAllocation?.transferHistory?.length ? (
              <p className="text-xs text-slate-400">Patient has not been transferred during this admission.</p>
            ) : (
              <div className="space-y-3">
                {admission.bedAllocation.transferHistory.map((tr, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>
                        {tr.fromRoom} ({tr.fromBed}) ➔ {tr.toRoom} ({tr.toBed})
                      </span>
                      <span className="text-slate-400 font-normal">
                        {new Date(tr.transferredAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Reason: <span className="italic">"{tr.reason || 'Clinical transfer'}"</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Discharge Clearance */}
      {activeTab === 'Discharge Clearance' && (
        <div className="space-y-6">
          {isDischarged ? (
            /* Discharged View */
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>Inpatient Discharged Successfully</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    Discharged on {new Date(admission.dischargeDetails?.dischargeDate).toLocaleString()} • Condition:{' '}
                    <strong>{admission.dischargeDetails?.conditionAtDischarge}</strong>
                  </p>
                </div>

                <Link
                  to={`/ipd/admissions/${id}/discharge-summary`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>View Printable Discharge Slip</span>
                </Link>
              </div>

              {/* Billing Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <DollarSign className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-black text-slate-900">Hospital Billing & Stay Summary</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Length of Stay</div>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      {admission.dischargeDetails?.billingSummary?.totalDays} Days
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Bed Rate</div>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      ₹{admission.dischargeDetails?.billingSummary?.bedChargesPerDay?.toLocaleString('en-IN')}/day
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Bed Charges</div>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      ₹{admission.dischargeDetails?.billingSummary?.totalBedCharges?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Treatment / Nursing</div>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      ₹{admission.dischargeDetails?.billingSummary?.treatmentAndNursingCharges?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-sky-600">Total Bill Amount</div>
                    <div className="text-xl font-black text-sky-900 mt-1">
                      ₹{admission.dischargeDetails?.billingSummary?.totalBillAmount?.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {admission.dischargeDetails?.billingSummary?.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Take-home Medications */}
              {admission.dischargeDetails?.dischargeMedications?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-base font-black text-slate-900">Take-Home Prescribed Medications</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Medication</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {admission.dischargeDetails.dischargeMedications.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                            <td className="py-2.5 px-3 text-slate-700">{m.dosage}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">{m.frequency}</td>
                            <td className="py-2.5 px-3 text-slate-700">{m.duration}</td>
                            <td className="py-2.5 px-3 text-slate-500">{m.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : isDoctor ? (
            /* Discharge Form */
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">Inpatient Discharge & Medical Clearance</h3>
                  <p className="text-xs text-slate-500">
                    Document final clinical diagnosis, take-home prescriptions, and calculate billing charges.
                  </p>
                </div>
              </div>

              <form onSubmit={handleExecuteDischarge} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Final Discharge Diagnosis <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acute Coronary Syndrome (Stabilized)"
                      value={dischargeForm.finalDiagnosis}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Condition at Discharge <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={dischargeForm.conditionAtDischarge}
                      onChange={(e) =>
                        setDischargeForm({ ...dischargeForm, conditionAtDischarge: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                    >
                      <option value="Recovered">Recovered</option>
                      <option value="Improved">Improved</option>
                      <option value="Referred">Referred</option>
                      <option value="LAMA - Against Medical Advice">LAMA - Against Medical Advice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Summary of Hospital Course & Treatment <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Summarize interventions, clinical progress, response to IV therapy, and stabilization..."
                    value={dischargeForm.courseInHospital}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, courseInHospital: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>

                {/* Take-Home Medications Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Take-Home Prescriptions (Discharge Medications)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddDischargeMedRow}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Medication
                    </button>
                  </div>

                  {dischargeForm.dischargeMedications.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Drug name"
                          value={med.name}
                          onChange={(e) => handleDischargeMedChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dose"
                          value={med.dosage}
                          onChange={(e) => handleDischargeMedChange(idx, 'dosage', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={med.frequency}
                          onChange={(e) => handleDischargeMedChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Duration"
                          value={med.duration}
                          onChange={(e) => handleDischargeMedChange(idx, 'duration', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Instructions"
                          value={med.instructions}
                          onChange={(e) => handleDischargeMedChange(idx, 'instructions', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        {dischargeForm.dischargeMedications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDischargeMedRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Dietary & Activity Restrictions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Low sodium diet, limit fluids to 2L, avoid heavy exertion"
                      value={dischargeForm.dietaryAndActivityAdvice}
                      onChange={(e) =>
                        setDischargeForm({ ...dischargeForm, dietaryAndActivityAdvice: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Follow-up Review Advice & Date
                    </label>
                    <input
                      type="date"
                      value={dischargeForm.followUpAdvice.recommendedDate}
                      onChange={(e) =>
                        setDischargeForm({
                          ...dischargeForm,
                          followUpAdvice: {
                            ...dischargeForm.followUpAdvice,
                            recommendedDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mb-2"
                    />
                    <input
                      type="text"
                      placeholder="Follow-up instructions"
                      value={dischargeForm.followUpAdvice.instructions}
                      onChange={(e) =>
                        setDischargeForm({
                          ...dischargeForm,
                          followUpAdvice: {
                            ...dischargeForm.followUpAdvice,
                            instructions: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Billing Details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Billing Clearance</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Treatment & Nursing Service Charges (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={dischargeForm.treatmentAndNursingCharges}
                        onChange={(e) =>
                          setDischargeForm({
                            ...dischargeForm,
                            treatmentAndNursingCharges: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-400">
                        * Daily bed charges are automatically calculated based on total days stay.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Payment Status</label>
                      <select
                        value={dischargeForm.paymentStatus}
                        onChange={(e) =>
                          setDischargeForm({ ...dischargeForm, paymentStatus: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Settled">Settled (Paid)</option>
                        <option value="Insurance Claimed">Insurance Claimed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Execute Discharge, Release Bed & Generate Summary</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Discharge Authorization Required</h4>
              <p className="text-xs text-slate-400 mt-1">
                Only attending physicians and administrators are authorized to execute patient discharge and sign off medical summaries.
              </p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default IpdPatientDetail;
