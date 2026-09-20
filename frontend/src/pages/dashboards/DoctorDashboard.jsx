import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyDoctorProfile, updateAvailability, updateSchedule } from '../../services/doctorService';
import { getDoctorSchedule, updateAppointmentStatus } from '../../services/appointmentService';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';
import {
  Stethoscope,
  Calendar,
  Clock,
  Award,
  DollarSign,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  ArrowRight,
  Sparkles,
  User,
  Check,
  Bed,
  Activity,
  Pill,
  FlaskConical,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleList, setScheduleList] = useState([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadDoctorData = async () => {
    try {
      const [profileData, scheduleData] = await Promise.allSettled([
        getMyDoctorProfile(),
        getDoctorSchedule(),
      ]);

      if (profileData.status === 'fulfilled') {
        const doc = profileData.value.doctor;
        setProfile(doc);
        const existing = doc.weeklySchedule || [];
        const formatted = daysOfWeek.map((day) => {
          const found = existing.find((s) => s.day === day);
          return (
            found || {
              day,
              isAvailable: false,
              startTime: '09:00',
              endTime: '17:00',
              maxPatients: 20,
            }
          );
        });
        setScheduleList(formatted);
      }

      if (scheduleData.status === 'fulfilled') {
        setAppointments(scheduleData.value.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load doctor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!profile) return;
    try {
      const res = await updateAvailability(profile._id, newStatus);
      toast.success(`Availability updated: ${newStatus}`);
      setProfile((prev) => ({ ...prev, availabilityStatus: res.availabilityStatus }));
    } catch (err) {
      toast.error('Failed to update availability status.');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const res = await updateSchedule(profile._id, { weeklySchedule: scheduleList });
      toast.success('Consultation schedule updated.');
      setProfile((prev) => ({
        ...prev,
        weeklySchedule: res.weeklySchedule,
        availableDays: res.availableDays,
      }));
      setIsScheduleModalOpen(false);
    } catch (err) {
      toast.error('Failed to update schedule.');
    }
  };

  return (
    <PageContainer>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Stethoscope className="w-4 h-4" /> Medical Practitioner Portal
              </span>
              {profile?.doctorId && (
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                  Doctor ID: {profile.doctorId}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Doctor'}
            </h1>
            <p className="mt-2 text-emerald-200 max-w-2xl text-xs sm:text-sm">
              Clinical schedule management, OPD sessions, real-time availability tracking, and specialist credentialing.
            </p>
          </div>

          {/* Real-time Status Selector */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2 shrink-0">
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
              Toggle Live Availability:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {['Available', 'In Consultation', 'On Leave', 'Offline'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                    profile?.availabilityStatus === st
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                      : 'bg-white/5 text-emerald-100 hover:bg-white/15 border-transparent'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live OPD Consultation Desk Quick Access */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
              Live Clinical Workspace • Step 5 OPD
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              Outpatient Department (OPD) Consultation Desk
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
              Access your real-time waiting token queue, view triage vitals & allergy alerts, conduct clinical examinations, generate digital prescriptions, and schedule 1-click follow-up consultations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/opd/queue"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
          >
            Launch OPD Queue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live IPD Inpatient & Bed Matrix Quick Access */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-sky-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-300">
              Inpatient Care • Step 6 IPD
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              Inpatient Department (IPD) & Bed Matrix
            </h2>
            <p className="text-xs text-sky-100/80 mt-1 max-w-xl">
              Monitor real-time ward bed occupancy, conduct daily doctor clinical progress rounds, review nursing care charts & fluid balance, and issue medical discharge summaries.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/ipd/admissions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition"
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Active Inpatients</span>
          </Link>
          <Link
            to="/ipd/beds"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Bed Occupancy Grid</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live EMR & Health Records Quick Access */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
              Clinical Records • Step 7 EMR
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              Electronic Medical Records (EMR) Portal
            </h2>
            <p className="text-xs text-purple-100/80 mt-1 max-w-xl">
              Inspect longitudinal health timelines, manage active/chronic diagnoses & surgical interventions, review abnormal pathology/radiology test reports, and access unified digital prescriptions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/emr"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Open EMR Portal</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Pharmacy & Medicine Dispensary Quick Access */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-300">
              Formulary & Dispensary • Step 8 Pharmacy
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              Hospital Pharmacy & Medicine Inventory
            </h2>
            <p className="text-xs text-teal-100/80 mt-1 max-w-xl">
              Check real-time formulary availability, verify unexpired stock batches before prescribing, trace prescription dispensing fulfillment, and review drug retail pricing.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/pharmacy"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Check Pharmacy Inventory</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Laboratory & Critical Panic Values Quick Access */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
              Diagnostics & Pathology • Step 9 Laboratory
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              Diagnostic Laboratory & Panic Values Monitor
            </h2>
            <p className="text-xs text-indigo-100/80 mt-1 max-w-xl">
              Order outpatient & inpatient diagnostic tests, track phlebotomy barcode statuses, review real-time panic values (Troponin, Electrolytes), and view NABL-accredited diagnostic reports.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/lab"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Open Diagnostic Lab Portal</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <StatsGrid columns={4}>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</h3>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              {profile?.department || 'General Medicine'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block truncate">
            {profile?.specialization || 'Clinician'}
          </span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Fee</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">
              ${profile?.consultationFee || 500}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Per 30-minute session</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Room</h3>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
              {profile?.roomNumber || 'Clinic Room 101'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Hospital OPD wing</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working Hours</h3>
            <p className="text-sm sm:text-base font-mono font-extrabold text-slate-900 mt-1">
              {profile?.workingHours?.start || '09:00'} - {profile?.workingHours?.end || '17:00'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Standard daily shift</span>
        </div>
      </StatsGrid>

      {/* Weekly Consulting Schedule Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Weekly Consultation Schedule & Shifts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients can only book appointments on days and hours you are marked On-Duty.
            </p>
          </div>

          <div className="flex gap-2">
            {profile && (
              <Link
                to={`/doctors/${profile._id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Public Profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Update My Shifts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {daysOfWeek.map((day) => {
            const shift = profile?.weeklySchedule?.find((s) => s.day === day);
            const isAvailable = shift?.isAvailable ?? false;
            return (
              <div
                key={day}
                className={`p-4 rounded-2xl border transition-all ${
                  isAvailable
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-slate-900">{day}</span>
                  {isAvailable ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      On-Duty
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Off
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 font-mono">
                  {isAvailable ? `${shift.startTime} - ${shift.endTime}` : 'No sessions scheduled'}
                </div>

                {isAvailable && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Cap: <strong>{shift.maxPatients || 20}</strong> patients
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Consultation Queue Widget */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" />
              Assigned Patient Consultation Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Appointments booked by patients for your clinical consultation sessions.
            </p>
          </div>

          <Link
            to="/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Manage All Appointments ({appointments.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">No appointments in your queue.</p>
            <p className="text-[11px] text-slate-400">When patients book consultations with you, they will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 5).map((apt) => {
              const isConfirmed = apt.status === 'Confirmed' || apt.status === 'Rescheduled';
              return (
                <div key={apt._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200">
                          {apt.appointmentId}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{apt.patient?.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>Reason:</strong> {apt.reasonForVisit}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Date: {new Date(apt.appointmentDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-600" /> {apt.timeSlot}
                        </span>
                        <span>•</span>
                        <span>Room: {apt.roomNumber}</span>
                      </div>
                    </div>
                  </div>

                  {isConfirmed && (
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateAppointmentStatus(apt._id, 'Completed');
                            toast.success(`Appointment ${apt.appointmentId} marked as Completed.`);
                            loadDoctorData();
                          } catch (err) {
                            toast.error('Failed to update status.');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Complete
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateAppointmentStatus(apt._id, 'No Show', 'Patient did not arrive.');
                            toast.success(`Appointment ${apt.appointmentId} marked as No Show.`);
                            loadDoctorData();
                          } catch (err) {
                            toast.error('Failed to update status.');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors"
                      >
                        No Show
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Edit Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-slate-900">Manage Weekly Shift Schedule</h3>
            <p className="text-xs text-slate-500">
              Configure consulting days, shift hours, and patient capacity
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div className="space-y-2 divide-y divide-slate-100">
                {scheduleList.map((slot, idx) => (
                  <div key={slot.day} className="pt-2.5 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-2 font-bold text-slate-800 w-28 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={(e) => {
                          const updated = [...scheduleList];
                          updated[idx].isAvailable = e.target.checked;
                          setScheduleList(updated);
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      {slot.day}
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        disabled={!slot.isAvailable}
                        value={slot.startTime}
                        onChange={(e) => {
                          const updated = [...scheduleList];
                          updated[idx].startTime = e.target.value;
                          setScheduleList(updated);
                        }}
                        className="p-1.5 border rounded-lg disabled:bg-slate-100 text-xs w-28 sm:w-auto"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        disabled={!slot.isAvailable}
                        value={slot.endTime}
                        onChange={(e) => {
                          const updated = [...scheduleList];
                          updated[idx].endTime = e.target.value;
                          setScheduleList(updated);
                        }}
                        className="p-1.5 border rounded-lg disabled:bg-slate-100 text-xs w-28 sm:w-auto"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <span className="text-[11px] text-slate-400 sm:hidden">Max Patients:</span>
                      <input
                        type="number"
                        disabled={!slot.isAvailable}
                        placeholder="Cap"
                        value={slot.maxPatients}
                        onChange={(e) => {
                          const updated = [...scheduleList];
                          updated[idx].maxPatients = Number(e.target.value);
                          setScheduleList(updated);
                        }}
                        className="w-20 sm:w-16 p-1.5 border rounded-lg disabled:bg-slate-100 text-xs text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default DoctorDashboard;
