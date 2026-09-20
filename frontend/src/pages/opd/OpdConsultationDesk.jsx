import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOpdVisitById, completeConsultation } from '../../services/opdService';
import toast from 'react-hot-toast';
import {
  Stethoscope,
  User,
  Heart,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Pill,
  Sparkles,
  Loader2,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const COMMON_DIAGNOSES = [
  'Essential Hypertension',
  'Type 2 Diabetes Mellitus',
  'Acute Viral Pharyngitis',
  'Gastroesophageal Reflux Disease (GERD)',
  'Chronic Migraine with Aura',
  'Musculoskeletal Lumbago',
  'Seasonal Allergic Rhinitis',
  'Acute Bronchitis',
  'Osteoarthritis Knee',
  'Dyslipidemia',
];

const COMMON_INVESTIGATIONS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile Panel',
  'Fasting Blood Sugar & HbA1c',
  '12-Lead Electrocardiogram (ECG)',
  'Chest X-Ray (PA View)',
  'Serum Creatinine & Electrolytes',
  'Liver Function Tests (LFT)',
  'Urine Routine & Microscopic',
  '2D Echocardiogram',
  'Ultrasound Whole Abdomen',
];

const OpdConsultationDesk = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clinical Consultation Form
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Prescription Builder State
  const [medicines, setMedicines] = useState([
    {
      name: '',
      dosage: '1 tablet',
      frequency: '1-0-1',
      duration: '5 days',
      instructions: 'After food',
    },
  ]);

  const [selectedInvestigations, setSelectedInvestigations] = useState([]);
  const [dietaryAdvice, setDietaryAdvice] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Follow-up recommendation
  const [recommendedFollowUp, setRecommendedFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(14);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  useEffect(() => {
    fetchVisitData();
  }, [id]);

  const fetchVisitData = async () => {
    setLoading(true);
    try {
      const data = await getOpdVisitById(id);
      setVisit(data.visit);

      if (data.visit.diagnosis) {
        setDiagnosis(data.visit.diagnosis);
      }
      if (data.visit.physicalExamination) {
        setPhysicalExamination(data.visit.physicalExamination);
      }
      if (data.visit.clinicalNotes) {
        setClinicalNotes(data.visit.clinicalNotes);
      }
      if (data.visit.prescription?.medicines?.length > 0) {
        setMedicines(data.visit.prescription.medicines);
        setSelectedInvestigations(data.visit.prescription.investigationsRecommended || []);
        setDietaryAdvice(data.visit.prescription.dietaryAdvice || '');
        setGeneralNotes(data.visit.prescription.generalNotes || '');
      }

      // Calculate default follow-up date 14 days out
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setFollowUpDate(defaultDate.toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Failed to load OPD visit details.');
      navigate('/opd/queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: '',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'After food',
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length === 1) {
      toast.error('At least one medicine row must remain.');
      return;
    }
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleToggleInvestigation = (test) => {
    setSelectedInvestigations((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleSetFollowUpDays = (days) => {
    setFollowUpDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      toast.error('Please enter a clinical diagnosis.');
      return;
    }

    // Clean medicines: keep rows with non-empty names and provide default fallbacks
    const filteredMeds = medicines
      .filter((m) => m && m.name && m.name.trim() !== '')
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage?.trim() || '1 tablet',
        frequency: m.frequency?.trim() || '1-0-1',
        duration: m.duration?.trim() || '5 days',
        instructions: m.instructions?.trim() || 'After food',
      }));

    setIsSubmitting(true);
    try {
      const payload = {
        physicalExamination: physicalExamination.trim(),
        diagnosis: diagnosis.trim(),
        clinicalNotes: clinicalNotes.trim(),
        prescription: {
          medicines: filteredMeds,
          investigationsRecommended: selectedInvestigations,
          dietaryAdvice: dietaryAdvice.trim(),
          generalNotes: generalNotes.trim(),
        },
        followUp: {
          recommended: recommendedFollowUp,
          ...(recommendedFollowUp && {
            followUpDate,
            instructions: followUpInstructions.trim() || 'Review in OPD clinic with lab reports.',
          }),
        },
      };

      await completeConsultation(visit._id, payload);
      toast.success('Consultation completed and digital prescription generated!');
      navigate(`/opd/prescription/${visit._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto" />
        <p className="text-xs font-semibold">Opening Doctor Consultation Desk...</p>
      </div>
    );
  }

  if (!visit) return null;

  const patient = visit.patient;
  const profile = visit.patientProfile;
  const vitals = visit.vitals;

  return (
    <PageContainer size="wide" className="animate-fade-in space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Link
          to="/opd/queue"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live OPD Queue
        </Link>
        <span className="font-mono text-xs font-black text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 self-start sm:self-auto">
          Encounter {visit.visitId} • Token #{visit.tokenNumber}
        </span>
      </div>

      {/* Patient Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl flex-shrink-0 shadow-md">
              {patient?.name
                ? patient.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                : 'PT'}
            </div>

            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black">{patient?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  {profile?.patientId || 'PAT'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-cyan-400 text-slate-900">
                  Token #{visit.tokenNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cyan-200 mt-2">
                <span>Gender: <strong className="text-white capitalize">{patient?.gender || 'N/A'}</strong></span>
                <span>•</span>
                <span>Blood Group: <strong className="text-white">{profile?.bloodGroup || 'Unknown'}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-white">{patient?.phone || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold block">
              Consulting Doctor
            </span>
            <p className="text-base font-bold text-white">Dr. {visit.doctor?.name}</p>
            <p className="text-xs text-slate-300">
              {visit.department} • {visit.doctorProfile?.roomNumber || 'Clinic Room'}
            </p>
          </div>
        </div>
      </div>

      {/* ALLERGY SAFETY ALERT BAR */}
      {profile?.allergies && profile.allergies.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm animate-pulse-slow">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">
              Patient Clinical Allergy Safety Warning (Prescription Caution)
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.allergies.map((al) => (
              <span
                key={al._id || al.allergen}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${
                  al.severity === 'Severe'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {al.allergen} ({al.severity})
                {al.reaction && ` - ${al.reaction}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vitals Review & Chief Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vitals Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500" />
            Triage Vital Signs
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Blood Pressure</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {vitals?.bloodPressure || 'N/A'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Heart Rate</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {vitals?.heartRate ? `${vitals.heartRate} bpm` : 'N/A'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Temperature</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {vitals?.temperature ? `${vitals.temperature}°F` : 'N/A'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">SpO2</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {vitals?.spO2 ? `${vitals.spO2}%` : 'N/A'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Weight & Height</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {vitals?.weight ? `${vitals.weight} kg` : 'N/A'} • {vitals?.height ? `${vitals.height} cm` : 'N/A'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100">
              <span className="text-cyan-700 text-[10px] uppercase font-bold block">BMI</span>
              <span className="font-mono font-black text-cyan-800 text-sm">
                {vitals?.bmi ? `${vitals.bmi} kg/m²` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Presenting Complaints & Past History (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-600" />
            Presenting Symptoms & Patient Background
          </h3>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
            <p className="font-bold text-amber-900">
              Chief Complaints: <span className="font-normal text-slate-800">{visit.chiefComplaints}</span>
            </p>
            {visit.symptomsDuration && (
              <p className="text-[11px] text-amber-800 font-semibold">
                Duration: {visit.symptomsDuration}
              </p>
            )}
          </div>

          {/* Past History chips */}
          {profile?.medicalHistory && profile.medicalHistory.length > 0 && (
            <div className="text-xs space-y-1.5 pt-1">
              <span className="text-slate-500 font-bold text-[11px] uppercase">
                Documented Past History:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.medicalHistory.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    {m.condition} ({m.status})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Consultation Form */}
      <form onSubmit={handleSubmitConsultation} className="space-y-6">
        {/* Clinical Examination & Primary Diagnosis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="w-4 h-4 text-cyan-600" />
            Clinical Examination & Diagnosis
          </h3>

          {/* Diagnosis Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Primary Clinical Diagnosis *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_DIAGNOSES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiagnosis(d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    diagnosis === d
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              placeholder="Enter confirmed medical diagnosis / clinical condition..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Examination Findings
              </label>
              <textarea
                rows={3}
                placeholder="Cardiovascular, Respiratory, Abdominal, CNS, or Musculoskeletal examination findings..."
                value={physicalExamination}
                onChange={(e) => setPhysicalExamination(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Doctor's Clinical Notes & Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Diagnostic reasoning, differential diagnosis, patient counseling remarks..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* DIGITAL PRESCRIPTION BUILDER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-cyan-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Digital Prescription Builder (Rx)
                </h3>
                <p className="text-xs text-slate-500">
                  Formulate pharmacotherapy with dosage, dosing frequency, and administration instructions.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddMedicine}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
          </div>

          {/* Medicine Rows */}
          <div className="space-y-3">
            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    Medication #{idx + 1}
                  </span>

                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Medicine Name & Strength *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amoxicillin 500mg, Paracetamol 650mg"
                      value={med.name}
                      onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      placeholder="1 tab / 5ml"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Frequency
                    </label>
                    <select
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white font-medium"
                    >
                      <option value="1-0-1">1-0-1 (Morning & Night)</option>
                      <option value="1-0-0">1-0-0 (Morning only)</option>
                      <option value="0-0-1">0-0-1 (Night only)</option>
                      <option value="1-1-1">1-1-1 (Thrice daily)</option>
                      <option value="1-1-1-1">1-1-1-1 (Every 6 hrs)</option>
                      <option value="Once daily">Once daily</option>
                      <option value="PRN / As Needed">PRN / As needed (SOS)</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days, 1 month"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Timing & Administration Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. After meals with water, before breakfast, dissolve under tongue..."
                    value={med.instructions}
                    onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Diagnostic Investigations */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recommended Diagnostic Investigations / Lab Tests
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_INVESTIGATIONS.map((inv) => {
                const isSelected = selectedInvestigations.includes(inv);
                return (
                  <button
                    key={inv}
                    type="button"
                    onClick={() => handleToggleInvestigation(inv)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {inv}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary & Lifestyle Directions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dietary & Nutritional Advice
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Low sodium, high fiber, drink 2.5L water daily, avoid oily food..."
                value={dietaryAdvice}
                onChange={(e) => setDietaryAdvice(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                General Precautions & Warning Signs
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Report immediately to emergency if severe pain recurs or fever exceeds 102°F..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* FOLLOW-UP SCHEDULING ADVICE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recommendedFollowUp}
                onChange={(e) => setRecommendedFollowUp(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-600" />
                Schedule Recommended Follow-up Consultation
              </span>
            </label>
          </div>

          {recommendedFollowUp && (
            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Quick Interval:</span>
                {[7, 14, 21, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSetFollowUpDays(days)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      followUpDays === days
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    After {days} Days
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Follow-up Date *
                  </label>
                  <input
                    type="date"
                    required={recommendedFollowUp}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Follow-up Purpose / Lab Review Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Review with CBC and lipid profile reports"
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link
            to="/opd/queue"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finalizing Consultation...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete Consultation & Issue Rx Slip
              </>
            )}
          </button>
        </div>
      </form>
    </PageContainer>
  );
};

export default OpdConsultationDesk;
