import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllWardRooms, admitPatient } from '../../services/ipdService';
import { getPatients } from '../../services/patientService';
import { getDoctors } from '../../services/doctorService';
import toast from 'react-hot-toast';
import {
  Building,
  User,
  Stethoscope,
  Bed,
  Activity,
  Heart,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  FileText,
  ShieldAlert,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const ADMISSION_TYPES = ['Emergency', 'OPD Referral', 'Direct Admission', 'Transfer'];

const IpdAdmissionForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedWardRoomId = searchParams.get('wardRoomId') || '';
  const preselectedBedNumber = searchParams.get('bedNumber') || '';

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    attendingDoctorId: '',
    department: 'General Medicine',
    wardRoomId: preselectedWardRoomId,
    bedNumber: preselectedBedNumber,
    admissionType: 'Direct Admission',
    provisionalDiagnosis: '',
    chiefComplaints: '',
    initialVitals: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      spO2: '',
      weight: '',
      height: '',
      bmi: '',
    },
  });

  // Data lists
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wardRooms, setWardRooms] = useState([]);
  const [selectedPatientObj, setSelectedPatientObj] = useState(null);
  const [selectedRoomObj, setSelectedRoomObj] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [patientsRes, doctorsRes, roomsRes] = await Promise.all([
          getPatients({ limit: 100 }),
          getDoctors({ limit: 100 }),
          getAllWardRooms(),
        ]);

        const ptList = patientsRes.patients || [];
        setPatients(ptList);

        const docList = doctorsRes.doctors || [];
        setDoctors(docList);

        const rmList = roomsRes.rooms || [];
        setWardRooms(rmList);

        // Preselect room if passed via query params
        if (preselectedWardRoomId) {
          const rm = rmList.find((r) => r._id === preselectedWardRoomId);
          if (rm) {
            setSelectedRoomObj(rm);
          }
        }

        // If logged-in user is doctor, default attendingDoctorId to them
        if (user?.role === 'doctor') {
          const matchingDoc = docList.find(
            (d) => d.user?._id === user._id || d._id === user._id
          );
          if (matchingDoc) {
            setFormData((prev) => ({
              ...prev,
              attendingDoctorId: matchingDoc.user?._id || matchingDoc._id,
              department: matchingDoc.department || 'General Medicine',
            }));
          }
        }
      } catch (err) {
        toast.error('Failed to load admission prerequisites');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [preselectedWardRoomId, user]);

  // Handle patient change
  const handlePatientSelect = (e) => {
    const pId = e.target.value;
    setFormData((prev) => ({ ...prev, patientId: pId }));

    const pt = patients.find((p) => p.user?._id === pId || p._id === pId);
    setSelectedPatientObj(pt || null);
  };

  // Handle doctor change
  const handleDoctorSelect = (e) => {
    const docId = e.target.value;
    const doc = doctors.find((d) => d.user?._id === docId || d._id === docId);

    setFormData((prev) => ({
      ...prev,
      attendingDoctorId: docId,
      department: doc?.department || prev.department,
    }));
  };

  // Handle ward room change
  const handleRoomSelect = (e) => {
    const roomId = e.target.value;
    const rm = wardRooms.find((r) => r._id === roomId);
    setSelectedRoomObj(rm || null);

    // If previously selected bed does not belong to new room, reset bed
    setFormData((prev) => ({
      ...prev,
      wardRoomId: roomId,
      bedNumber: '',
    }));
  };

  // Handle Vitals input & auto BMI calculation
  const handleVitalsChange = (field, val) => {
    setFormData((prev) => {
      const nextVitals = { ...prev.initialVitals, [field]: val };

      const weight = parseFloat(field === 'weight' ? val : nextVitals.weight);
      const height = parseFloat(field === 'height' ? val : nextVitals.height);

      if (weight > 0 && height > 0) {
        const heightM = height / 100;
        nextVitals.bmi = (weight / (heightM * heightM)).toFixed(1);
      } else {
        nextVitals.bmi = '';
      }

      return {
        ...prev,
        initialVitals: nextVitals,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientId) {
      toast.error('Please select a patient for admission');
      return;
    }
    if (!formData.attendingDoctorId) {
      toast.error('Please assign an attending doctor');
      return;
    }
    if (!formData.wardRoomId || !formData.bedNumber) {
      toast.error('Please allocate a ward room and available bed');
      return;
    }
    if (!formData.provisionalDiagnosis.trim()) {
      toast.error('Please specify the provisional clinical diagnosis');
      return;
    }
    if (!formData.chiefComplaints.trim()) {
      toast.error('Please document chief complaints leading to admission');
      return;
    }

    try {
      setSubmitting(true);

      // Clean vitals numbers
      const cleanedVitals = {};
      Object.keys(formData.initialVitals).forEach((key) => {
        const val = formData.initialVitals[key];
        if (val !== '' && val !== null && val !== undefined) {
          cleanedVitals[key] = isNaN(val) ? val : parseFloat(val);
        }
      });

      const payload = {
        ...formData,
        initialVitals: cleanedVitals,
      };

      const res = await admitPatient(payload);
      toast.success(`Patient admitted successfully! ${res.admission?.admissionId || ''}`);
      navigate(`/ipd/admissions/${res.admission?._id || ''}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete admission');
    } finally {
      setSubmitting(false);
    }
  };

  // Available beds in currently selected room
  const availableBedsInSelectedRoom =
    selectedRoomObj?.beds?.filter(
      (b) => b.status === 'Available' || b.bedNumber === preselectedBedNumber
    ) || [];

  return (
    <PageContainer size="narrow" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/ipd/beds"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>Inpatient Department Admission</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Inpatient Admission Intake Form
            </h1>
          </div>
        </div>
      </div>

      {loadingData ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading hospital wards, doctors, and patients...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Patient Selection & Alert Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-black text-slate-900">1. Patient Identification</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Registered Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.patientId}
                  onChange={handlePatientSelect}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => {
                    const userId = p.user?._id || p._id;
                    const name = p.user?.name || 'Unnamed Patient';
                    const code = p.patientId || 'PAT';
                    const phone = p.user?.phone || '';
                    return (
                      <option key={userId} value={userId}>
                        {code} - {name} {phone ? `(${phone})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Admission Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.admissionType}
                  onChange={(e) => setFormData({ ...formData, admissionType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
                >
                  {ADMISSION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Patient Overview Alert Banner */}
            {selectedPatientObj && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Patient Profile</div>
                  <div className="text-sm font-black text-slate-900">
                    {selectedPatientObj.user?.name} ({selectedPatientObj.patientId})
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Gender: {selectedPatientObj.user?.gender || 'N/A'} • Blood Group:{' '}
                    <span className="font-bold text-rose-600">
                      {selectedPatientObj.bloodGroup || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Allergies Warning */}
                {selectedPatientObj.allergies && selectedPatientObj.allergies.length > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Known Allergies:{' '}
                      {selectedPatientObj.allergies.map((a) => a.allergen || a).join(', ')}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
                    No documented drug allergies
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Clinical Team & Department */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Stethoscope className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-black text-slate-900">2. Attending Physician & Department</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Attending Consultant Doctor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.attendingDoctorId}
                  onChange={handleDoctorSelect}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Attending Doctor --</option>
                  {doctors.map((d) => {
                    const docUserId = d.user?._id || d._id;
                    const name = d.user?.name || 'Dr. Unnamed';
                    const dept = d.department || 'Specialist';
                    return (
                      <option key={docUserId} value={docUserId}>
                        {name} - {dept}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Hospital Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  placeholder="e.g. Cardiology, Orthopedics, Neurology"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Room & Bed Allocation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bed className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-black text-slate-900">3. Ward & Bed Allocation</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Ward Room <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.wardRoomId}
                  onChange={handleRoomSelect}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Room / Ward --</option>
                  {wardRooms.map((rm) => {
                    const availCount = rm.beds?.filter((b) => b.status === 'Available').length || 0;
                    return (
                      <option key={rm._id} value={rm._id}>
                        {rm.roomNumber} ({rm.wardType} - {rm.wardName}) - {availCount} Beds Free - ₹
                        {rm.dailyRate}/day
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Available Bed <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  required
                  disabled={!formData.wardRoomId}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">-- Select Bed --</option>
                  {availableBedsInSelectedRoom.map((b) => (
                    <option key={b.bedNumber} value={b.bedNumber}>
                      {b.bedNumber} {b.features?.length ? `(${b.features.join(', ')})` : ''}
                    </option>
                  ))}
                </select>
                {formData.wardRoomId && availableBedsInSelectedRoom.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">
                    No available beds in this room. Please select another room.
                  </p>
                )}
              </div>
            </div>

            {selectedRoomObj && (
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 text-xs text-sky-800 flex items-center justify-between">
                <span>
                  <strong>Selected Ward:</strong> {selectedRoomObj.wardName} ({selectedRoomObj.roomNumber},{' '}
                  {selectedRoomObj.floor})
                </span>
                <span className="font-bold text-sky-900">
                  Rate: ₹{selectedRoomObj.dailyRate.toLocaleString('en-IN')}/day
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Clinical Triage & Diagnosis */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-black text-slate-900">4. Clinical Diagnosis & Chief Complaints</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Provisional Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.provisionalDiagnosis}
                onChange={(e) => setFormData({ ...formData, provisionalDiagnosis: e.target.value })}
                required
                placeholder="e.g. Acute Coronary Syndrome, Dengue Fever with Severe Thrombocytopenia"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chief Complaints & Admission History <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.chiefComplaints}
                onChange={(e) => setFormData({ ...formData, chiefComplaints: e.target.value })}
                required
                placeholder="Document patient presenting symptoms, onset, severity, and immediate triage findings..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm bg-white font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Section 5: Initial Baseline Vitals */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Activity className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-black text-slate-900">5. Baseline Admission Vitals</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={formData.initialVitals.bloodPressure}
                  onChange={(e) => handleVitalsChange('bloodPressure', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">mmHg</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Heart Rate
                </label>
                <input
                  type="number"
                  placeholder="72"
                  value={formData.initialVitals.heartRate}
                  onChange={(e) => handleVitalsChange('heartRate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">bpm</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={formData.initialVitals.temperature}
                  onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">°F</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  SpO2 (Oxygen)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={formData.initialVitals.spO2}
                  onChange={(e) => handleVitalsChange('spO2', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  placeholder="18"
                  value={formData.initialVitals.respiratoryRate}
                  onChange={(e) => handleVitalsChange('respiratoryRate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">breaths/min</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={formData.initialVitals.weight}
                  onChange={(e) => handleVitalsChange('weight', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">kg</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Height
                </label>
                <input
                  type="number"
                  placeholder="172"
                  value={formData.initialVitals.height}
                  onChange={(e) => handleVitalsChange('height', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400">cm</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Calculated BMI
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto"
                  value={formData.initialVitals.bmi ? `${formData.initialVitals.bmi} kg/m²` : 'Auto'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-bold text-slate-700"
                />
                <span className="text-[10px] text-slate-400">BMI Metric</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Link
              to="/ipd/beds"
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition disabled:opacity-50 text-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Admitting Patient...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Admission & Allocate Bed</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </PageContainer>
  );
};

export default IpdAdmissionForm;
