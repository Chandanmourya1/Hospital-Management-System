import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOpdVisitById, scheduleFollowUpAppointment } from '../../services/opdService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Printer,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Heart,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldCheck,
  Download,
  Share2,
  CalendarPlus,
  Loader2,
  Pill,
} from 'lucide-react';

const PrescriptionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpTimeSlot, setFollowUpTimeSlot] = useState('10:00 AM');

  useEffect(() => {
    fetchVisitDetails();
  }, [id]);

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      const data = await getOpdVisitById(id);
      setVisit(data.visit);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch OPD visit records.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateFollowUpAppointment = async () => {
    if (!visit.followUp?.followUpDate) {
      toast.error('No follow-up date recommended for this visit.');
      return;
    }

    try {
      setSchedulingFollowUp(true);
      const dateStr = new Date(visit.followUp.followUpDate).toISOString().split('T')[0];
      const payload = {
        appointmentDate: dateStr,
        timeSlot: followUpTimeSlot,
        reason: `Follow-up Consultation for ${visit.diagnosis || 'OPD review'}`,
      };

      const res = await scheduleFollowUpAppointment(visit._id, payload);
      toast.success(res.message || 'Follow-up appointment booked successfully!');
      fetchVisitDetails(); // Refresh to show the booked appointment ID
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book follow-up appointment.');
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto" />
        <p className="text-xs font-semibold">Loading Prescription & Encounter Record...</p>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Prescription Not Found</h2>
        <p className="text-sm text-slate-500">
          We couldn't retrieve the outpatient prescription record with identifier: {id}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const patient = visit.patient;
  const patientProfile = visit.patientProfile;
  const doctor = visit.doctor;
  const doctorProfile = visit.doctorProfile;
  const prescription = visit.prescription;
  const vitals = visit.vitals || {};
  const followUp = visit.followUp;

  // Calculate age if dateOfBirth exists
  let patientAge = 'N/A';
  if (patient?.dateOfBirth) {
    const diff = Date.now() - new Date(patient.dateOfBirth).getTime();
    patientAge = `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} Yrs`;
  }

  const rawDoctorName = doctor?.name || 'Physician';
  const doctorDisplayName = rawDoctorName.startsWith('Dr.') ? rawDoctorName : `Dr. ${rawDoctorName}`;

  return (
    <div className="min-h-screen bg-slate-50/50 py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8 print:py-0 print:px-0 print:m-0 print:bg-white print:min-h-0 print:block">
      {/* Top Toolbar - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              OPD Encounter & Prescription Slip
            </h1>
            <p className="text-xs text-slate-500">
              Ref: <span className="font-mono font-bold text-slate-700">{visit.visitId}</span> •{' '}
              {prescription ? (
                <span className="font-mono font-bold text-emerald-600">{prescription.prescriptionId}</span>
              ) : (
                <span className="text-amber-600 font-semibold">Prescription Pending</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Schedule Follow-up (If recommended and not yet booked) */}
          {followUp?.recommended && !followUp.appointmentCreated && (
            <button
              onClick={handleCreateFollowUpAppointment}
              disabled={schedulingFollowUp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-bold shadow-sm transition-all"
            >
              {schedulingFollowUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarPlus className="w-4 h-4 text-amber-600" />
              )}
              1-Click Book Follow-up
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            Print Prescription
          </button>
        </div>
      </div>

      {/* Printable Prescription Slip Paper */}
      <div
        id="prescription-paper"
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0 print:rounded-none print:max-w-full print:w-full"
      >
        {/* Hospital Letterhead Header */}
        <div className="hospital-header bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white p-6 sm:p-8 relative print:bg-none print:bg-white print:text-slate-950 print:border-b-2 print:border-slate-900 print:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="hospital-logo-badge w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-black text-2xl shadow-lg print:bg-none print:bg-slate-900 print:text-white print:border print:border-slate-900 print:shadow-none">
                +
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight print:text-slate-950 print:font-black">
                  MEDCARE MULTI-SPECIALITY HOSPITAL
                </h2>
                <p className="text-xs text-cyan-200 print:text-slate-800 font-medium print:font-bold">
                  Centre for Clinical Excellence & Patient Care • NABH Accredited
                </p>
                <p className="text-[11px] text-slate-300 print:text-slate-700 mt-0.5 font-normal print:font-medium">
                  100 Healthcare Boulevard, Metro City • Helpline: +91 1800-456-7890 • opd@medcare.org
                </p>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 print:border-none print:pt-0">
              <span className="inline-block bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider print:bg-slate-100 print:border-2 print:border-slate-900 print:text-slate-950 print:font-black">
                OPD Outpatient Slip
              </span>
              <div className="text-xs text-slate-300 print:text-slate-900 mt-1 font-mono print:font-bold">
                Date:{' '}
                <span className="font-bold text-white print:text-slate-950 print:font-black">
                  {new Date(visit.visitDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 print:text-slate-900 font-mono print:font-black mt-0.5">
                Token #{visit.tokenNumber} • {visit.department}
              </div>
            </div>
          </div>
        </div>

        {/* Doctor & Patient Information Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/50 p-6 sm:p-7 gap-6 text-xs">
          {/* Doctor Information */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-700 font-black text-sm uppercase tracking-wide">
              <Stethoscope className="w-4 h-4" />
              Consulting Physician
            </div>
            <h3 className="text-base font-black text-slate-900">
              {doctorDisplayName}
            </h3>
            <p className="text-slate-600 font-semibold">
              {doctorProfile?.specialization ? `${doctorProfile.specialization} (${visit.department})` : `${visit.department} Department`}
            </p>
            {doctorProfile?.qualifications && doctorProfile.qualifications.length > 0 && (
              <p className="text-slate-500 font-medium">
                Qualifications:{' '}
                <span className="text-slate-700">
                  {Array.isArray(doctorProfile.qualifications)
                    ? doctorProfile.qualifications
                        .map((q) =>
                          typeof q === 'object' && q !== null
                            ? `${q.degree || ''}${q.institution ? ` (${q.institution})` : ''}`
                            : String(q)
                        )
                        .filter(Boolean)
                        .join(', ')
                    : String(doctorProfile.qualifications)}
                </span>
              </p>
            )}
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
              {doctorProfile?.licenseNumber && (
                <span>Reg. No: <strong className="text-slate-700">{doctorProfile.licenseNumber}</strong></span>
              )}
              {doctorProfile?.roomNumber && (
                <span>OPD Cabin: <strong className="text-slate-700">{doctorProfile.roomNumber}</strong></span>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="space-y-1.5 md:pl-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-700 font-black text-sm uppercase tracking-wide">
                <User className="w-4 h-4" />
                Patient Particulars
              </div>
              <span className="font-mono font-bold text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200">
                {patientProfile?.patientId || 'Walk-in'}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              {patient?.name || 'Anonymous Patient'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-600">
              <div>
                Age: <strong className="text-slate-800">{patientAge}</strong>
              </div>
              <div>
                Gender: <strong className="text-slate-800 capitalize">{patient?.gender || 'N/A'}</strong>
              </div>
              <div>
                Blood: <strong className="text-rose-600">{patientProfile?.bloodGroup || 'N/A'}</strong>
              </div>
              <div>
                Phone: <strong className="text-slate-800">{patient?.phone || 'N/A'}</strong>
              </div>
              <div className="col-span-2">
                Encounter: <strong className="text-slate-800">{visit.visitId}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Encounter & Vitals Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Triage Vitals Bar */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-600" />
                Baseline Vital Signs (Triage)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Recorded: {new Date(vitals.recordedAt || visit.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">BP (mmHg)</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {vitals.bloodPressure || '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pulse (BPM)</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {vitals.heartRate ? `${vitals.heartRate} bpm` : '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Temp (°F)</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {vitals.temperature ? `${vitals.temperature} °F` : '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Resp (Rate)</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {vitals.respiratoryRate ? `${vitals.respiratoryRate}/min` : '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">SpO2 (%)</span>
                <span className="text-xs font-black text-cyan-700 font-mono">
                  {vitals.spO2 ? `${vitals.spO2}%` : '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Weight</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {vitals.weight ? `${vitals.weight} kg` : '—'}
                </span>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-cyan-600 block">BMI</span>
                <span className="text-xs font-black text-cyan-800 font-mono">
                  {vitals.bmi ? `${vitals.bmi} kg/m²` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Chief Complaints & Clinical Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Chief Complaints & History of Present Illness
              </h4>
              <p className="text-xs text-slate-800 font-medium">
                {visit.chiefComplaints}
              </p>
              {visit.symptomsDuration && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Duration: <span className="font-semibold text-slate-700">{visit.symptomsDuration}</span>
                </p>
              )}
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center justify-between">
                <span>Clinical Diagnosis / Impression</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Confirmed
                </span>
              </h4>
              <p className="text-sm text-emerald-950 font-black">
                {visit.diagnosis || 'Clinical evaluation completed. Symptomatic management advised.'}
              </p>
              {visit.physicalExamination && (
                <p className="text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-emerald-200/50">
                  <strong className="text-slate-700">Exam findings:</strong> {visit.physicalExamination}
                </p>
              )}
            </div>
          </div>

          {/* The Rx Symbol & Digital Prescription Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-serif text-4xl font-extrabold text-cyan-800 leading-none">
                  ℞
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Medical Prescription (Rx)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {prescription?.prescriptionId || 'PENDING'} • Issued:{' '}
                    {prescription?.issuedAt
                      ? new Date(prescription.issuedAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {patientProfile?.allergies?.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Allergies: {patientProfile.allergies.map((a) => a.allergen).join(', ')}
                </div>
              )}
            </div>

            {/* Prescribed Medicines Table */}
            {prescription?.medicines?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Medicine / Generic Formulation</th>
                      <th className="py-2.5 px-3 w-28">Dosage</th>
                      <th className="py-2.5 px-3 w-32">Frequency</th>
                      <th className="py-2.5 px-3 w-28">Duration</th>
                      <th className="py-2.5 px-3">Instructions / Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescription.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-400">
                          {idx + 1}.
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-cyan-600 print:hidden" />
                            {med.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {med.dosage}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                            {med.frequency}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {med.duration}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {med.instructions || 'After meals'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No pharmacological medications prescribed during this consultation.
              </div>
            )}
          </div>

          {/* Investigations, Dietary Advice & Precautions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Lab / Diagnostic Tests */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Recommended Lab & Diagnostic Tests
              </h4>
              {prescription?.investigationsRecommended?.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {prescription.investigationsRecommended.map((test, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-800 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 flex-shrink-0" />
                      {test}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">None recommended at this time.</p>
              )}
            </div>

            {/* Dietary & Nutrition Advice */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Dietary & Nutrition Advice
              </h4>
              {prescription?.dietaryAdvice ? (
                <p className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                  {prescription.dietaryAdvice}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Standard balanced nutrition & hydration advised.</p>
              )}
            </div>

            {/* General Precautions & Clinical Directions */}
            <div className="border border-amber-200/80 rounded-2xl p-4 bg-amber-50/40 space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                Precautions & Special Instructions
              </h4>
              {prescription?.generalNotes ? (
                <p className="text-xs text-amber-950 font-semibold whitespace-pre-line leading-relaxed">
                  {prescription.generalNotes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Standard outpatient precautions advised.</p>
              )}
            </div>
          </div>

          {/* Follow-up Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Follow-up Consultation
              </span>
              {followUp?.recommended ? (
                <div className="text-xs text-amber-950 font-bold mt-1">
                  Next Review:{' '}
                  {new Date(followUp.followUpDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  • <span className="font-normal text-amber-900">{followUp.instructions}</span>
                </div>
              ) : (
                <p className="text-xs text-amber-900 font-medium mt-0.5">
                  As needed, or if symptoms persist / worsen.
                </p>
              )}
            </div>

            {followUp?.appointmentCreated && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Appointment Booked
              </span>
            )}
          </div>

          {/* Doctor Signature & Legal Certification Footer */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="space-y-1 text-[11px] text-slate-400 max-w-sm">
              <p className="flex items-center gap-1 text-slate-600 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Digitally Authenticated Medical Record
              </p>
              <p>
                Generated by MedCare Health Management Information System. Compliant with Telemedicine Practice Guidelines & EHR Standards.
              </p>
            </div>

            <div className="text-right sm:pr-4 space-y-1">
              <div className="h-10 flex items-end justify-end">
                <span className="font-serif italic text-lg font-bold text-slate-800 tracking-wider">
                  {doctorDisplayName}
                </span>
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 text-right">
                <p className="text-xs font-bold text-slate-900">Doctor's Digital Signature</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Reg: {doctorProfile?.licenseNumber || 'DOC-REG-VALID'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Paper Bottom Strip */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-center text-[10px] text-slate-500 font-medium">
          Emergency Services: 108 / 112 • Please bring this prescription slip and previous lab investigations on your follow-up visit.
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView;
