import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPatients } from '../../services/patientService';
import { getDoctors } from '../../services/doctorService';
import { registerOpdVisit } from '../../services/opdService';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Stethoscope,
  Activity,
  Heart,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  Building,
  User,
  Ticket,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  Flame,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const COMMON_COMPLAINTS = [
  'Acute High Fever & Chills',
  'Persistent Cough & Sore Throat',
  'Chest Tightness / Palpitations',
  'Severe Headache & Dizziness',
  'Abdominal Pain & Acid Reflux',
  'Joint Pain & Mobility Stiffness',
  'Generalized Weakness & Fatigue',
  'Skin Rash / Allergic Reaction',
];

const OpdRegistration = () => {
  const navigate = useNavigate();

  // Data lists
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Vitals State
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    spO2: '',
    weight: '',
    height: '',
  });

  // Chief Complaints
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [symptomsDuration, setSymptomsDuration] = useState('');
  const [billingStatus, setBillingStatus] = useState('Paid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Pass State
  const [registeredVisit, setRegisteredVisit] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingInitial(true);
    try {
      const [patRes, docRes] = await Promise.allSettled([
        getPatients({ limit: 100 }),
        getDoctors(),
      ]);

      if (patRes.status === 'fulfilled') {
        setPatients(patRes.value.patients || []);
      }
      if (docRes.status === 'fulfilled') {
        setDoctors(docRes.value.doctors || []);
      }
    } catch (error) {
      toast.error('Failed to load patient and doctor data.');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // Auto calculate BMI
  const computeBmi = () => {
    const w = parseFloat(vitals.weight);
    const h = parseFloat(vitals.height);
    if (!w || !h || h <= 0) return null;
    const heightM = h / 100;
    const bmi = w / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  };

  const bmiVal = computeBmi();
  const getBmiBadge = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Underweight</span>;
    } else if (bmi < 25) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Normal (Healthy)</span>;
    } else if (bmi < 30) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Overweight</span>;
    } else {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Obese (Class 1+)</span>;
    }
  };

  const handleVitalsChange = (field, val) => {
    setVitals((prev) => ({ ...prev, [field]: val }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a registered patient.');
      return;
    }
    if (!selectedDoctor) {
      toast.error('Please select a consulting doctor.');
      return;
    }
    if (!chiefComplaints.trim()) {
      toast.error('Please enter the chief medical complaints.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatient.user?._id || selectedPatient._id,
        doctorId: selectedDoctor._id,
        chiefComplaints: chiefComplaints.trim(),
        symptomsDuration: symptomsDuration.trim(),
        consultationFee: selectedDoctor.consultationFee,
        billingStatus,
        vitals: {
          bloodPressure: vitals.bloodPressure,
          heartRate: vitals.heartRate ? parseInt(vitals.heartRate, 10) : undefined,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : undefined,
          respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate, 10) : undefined,
          spO2: vitals.spO2 ? parseInt(vitals.spO2, 10) : undefined,
          weight: vitals.weight ? parseFloat(vitals.weight) : undefined,
          height: vitals.height ? parseFloat(vitals.height) : undefined,
        },
      };

      const res = await registerOpdVisit(payload);
      setRegisteredVisit(res.visit);
      toast.success(res.message || 'OPD Visit registered successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register OPD check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Patients
  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.user?.name?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.user?.phone?.toLowerCase().includes(q)
    );
  });

  // Filtered Doctors
  const filteredDoctors = doctors.filter((doc) => {
    const q = doctorSearch.toLowerCase();
    return (
      doc.user?.name?.toLowerCase().includes(q) ||
      doc.department?.toLowerCase().includes(q) ||
      doc.specialization?.toLowerCase().includes(q)
    );
  });

  return (
    <PageContainer size="narrow" className="animate-fade-in space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
      {/* Header - Hidden when token is issued and during print */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden ${registeredVisit ? 'hidden' : ''}`}>
        <div>
          <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Outpatient Department (OPD)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            OPD Walk-in Registration & Triage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Check-in walk-in patients, record preliminary vital signs, and issue real-time queue tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/opd/queue"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Clock className="w-4 h-4 text-cyan-600" />
            Live Clinic Queue
          </Link>
        </div>
      </div>

      {/* Success Token Pass View */}
      {registeredVisit ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up print-sheet print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0">
          {/* Print-Only Letterhead */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
            <h1 className="text-xl font-black text-slate-900 uppercase">MedCare Hospital & Medical Centre</h1>
            <p className="text-[10px] font-bold text-slate-600 uppercase">OPD Walk-in Registration & Queue Token Slip</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Helpline: 1800-MED-CARE • Issued: {new Date().toLocaleString()}</p>
          </div>

          {/* Header Badge */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white text-center print:hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs uppercase tracking-widest text-cyan-100 font-extrabold">
              MedCare Hospital • OPD Intake
            </p>
            <h2 className="text-3xl font-black mt-1">Token #{registeredVisit.tokenNumber}</h2>
            <p className="text-xs text-cyan-100 mt-1">Reference: {registeredVisit.visitId}</p>
          </div>

          {/* Print-only Token Banner */}
          <div className="hidden print:block text-center py-2 mb-3 bg-slate-100 border border-slate-300 rounded-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase">OPD Consultation Queue Token</p>
            <h2 className="text-3xl font-black text-slate-900 font-mono">TOKEN #{registeredVisit.tokenNumber}</h2>
            <p className="text-[10px] font-mono text-slate-600">Ref: {registeredVisit.visitId}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Consultation Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-extrabold text-slate-900">{registeredVisit.patient?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Consulting Doctor:</span>
                <span className="font-bold text-cyan-700">Dr. {registeredVisit.doctor?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-800">{registeredVisit.department}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Consultation Suite:</span>
                <span className="font-extrabold text-slate-900">
                  {registeredVisit.doctorProfile?.roomNumber || 'OPD Clinic Room'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Triage Vitals Recorded:</span>
                <span className="font-mono text-slate-700">
                  BP: {registeredVisit.vitals?.bloodPressure || 'N/A'} | Pulse: {registeredVisit.vitals?.heartRate || 'N/A'}
                </span>
              </div>
            </div>

            {/* Notice */}
            <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 text-xs text-cyan-800 text-center">
              Please proceed to <strong>{registeredVisit.doctorProfile?.roomNumber || 'Waiting Area'}</strong>. You will be called when your Token #{registeredVisit.tokenNumber} is announced.
            </div>

            {/* Actions - Hidden during print */}
            <div className="flex flex-col gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Token Slip
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisteredVisit(null);
                  setSelectedPatient(null);
                  setSelectedDoctor(null);
                  setChiefComplaints('');
                  setSymptomsDuration('');
                  setVitals({
                    bloodPressure: '',
                    heartRate: '',
                    temperature: '',
                    respiratoryRate: '',
                    spO2: '',
                    weight: '',
                    height: '',
                  });
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Register Next Patient
              </button>

              <Link
                to="/opd/queue"
                className="w-full py-2.5 text-center text-cyan-600 hover:text-cyan-700 font-bold text-xs transition-colors"
              >
                View Live Doctor Queue &rarr;
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* OPD Intake Form */
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Select Patient */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                1. Select Patient *
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search patient by name, ID (PAT-xxxx), or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredPatients.map((pat) => {
                  const isSelected = selectedPatient?._id === pat._id;
                  return (
                    <div
                      key={pat._id}
                      onClick={() => setSelectedPatient(pat)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-400/50'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {pat.user?.name}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-cyan-700 bg-white px-2 py-0.5 rounded border">
                          {pat.patientId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Phone: {pat.user?.phone || 'N/A'}</span>
                        <span>•</span>
                        <span>Blood: {pat.bloodGroup}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPatient && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                  <span className="font-bold">Selected: {selectedPatient.user?.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-emerald-700 hover:text-emerald-900 underline text-[11px]"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Select Doctor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-cyan-600" />
                2. Select Consulting Specialist *
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter doctor by name, specialty, or department..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctor?._id === doc._id;
                  return (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-400/50'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {doc.user?.name}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ${doc.consultationFee} Fee
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{doc.department}</span>
                        <span>•</span>
                        <span className="truncate">{doc.roomNumber}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedDoctor && (
                <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-xs text-cyan-800 flex items-center justify-between">
                  <span className="font-bold">Doctor: {selectedDoctor.user?.name} ({selectedDoctor.department})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="text-cyan-700 hover:text-cyan-900 underline text-[11px]"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Triage Vital Signs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  3. Triage Vital Signs Assessment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record baseline clinical parameters prior to consultation.
                </p>
              </div>

              {bmiVal && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">BMI: <strong className="text-slate-800">{bmiVal}</strong></span>
                  {getBmiBadge(bmiVal)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  BP (mmHg)
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={vitals.bloodPressure}
                  onChange={(e) => handleVitalsChange('bloodPressure', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Pulse (bpm)
                </label>
                <input
                  type="number"
                  placeholder="72"
                  value={vitals.heartRate}
                  onChange={(e) => handleVitalsChange('heartRate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={vitals.temperature}
                  onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  placeholder="99"
                  value={vitals.spO2}
                  onChange={(e) => handleVitalsChange('spO2', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Resp. Rate
                </label>
                <input
                  type="number"
                  placeholder="18"
                  value={vitals.respiratoryRate}
                  onChange={(e) => handleVitalsChange('respiratoryRate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="70"
                  value={vitals.weight}
                  onChange={(e) => handleVitalsChange('weight', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="175"
                  value={vitals.height}
                  onChange={(e) => handleVitalsChange('height', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Chief Complaints */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              4. Presenting Symptoms & Chief Complaints *
            </h3>

            {/* Quick Complaint Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Select Symptoms:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_COMPLAINTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (chiefComplaints) {
                        setChiefComplaints((prev) => `${prev}, ${c}`);
                      } else {
                        setChiefComplaints(c);
                      }
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 transition-colors"
                  >
                    + {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Describe Chief Medical Complaints *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe patient's presenting symptoms, severity, and urgency..."
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Symptoms Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 days, 1 week"
                    value={symptomsDuration}
                    onChange={(e) => setSymptomsDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    OPD Fee Collection
                  </label>
                  <select
                    value={billingStatus}
                    onChange={(e) => setBillingStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white font-medium"
                  >
                    <option value="Paid">Paid (${selectedDoctor?.consultationFee || 500})</option>
                    <option value="Pending">Pending Collection</option>
                    <option value="Waived">Waived (Emergency/Hospital Staff)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Link
              to="/opd/queue"
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatient || !selectedDoctor}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-center"
            >
              {isSubmitting ? (
                'Assigning Token...'
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  Generate OPD Token & Check-In
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </PageContainer>
  );
};

export default OpdRegistration;
