import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';
import { getMyPatientProfile } from '../../services/patientService';
import { getMyPatientAppointments } from '../../services/appointmentService';
import {
  User,
  Heart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Droplet,
  Clock,
  Shield,
  FileText,
  AlertOctagon,
  Info,
  Plus,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

const PatientDashboard = () => {
  const { user, isVerified } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, aptData] = await Promise.allSettled([
          getMyPatientProfile(),
          getMyPatientAppointments(),
        ]);

        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value.patient);
        }
        if (aptData.status === 'fulfilled') {
          setAppointments(aptData.value.appointments || []);
        }
      } catch (err) {
        console.error('Failed to load patient data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <PageContainer>
      {/* Verification Warning Notice if not yet verified */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-900">Email Verification Required</h4>
            <p className="text-amber-700 mt-0.5">
              Please verify your email address to enable online appointment bookings and doctor messaging. A verification link was sent to your inbox when registering.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <User className="w-4 h-4" /> Personal Health Portal
              </span>
              {profile?.patientId && (
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                  Patient ID: {profile.patientId}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Patient'}
            </h1>
            <p className="mt-2 text-sky-200 max-w-2xl text-xs sm:text-sm">
              Your centralized medical dashboard. Review your clinical diagnoses, allergy alert records, insurance policy status, and upcoming appointments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/appointments/book"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Book Consultation
            </Link>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <Calendar className="w-4 h-4" />
              My Appointments
            </Link>
            <Link
              to="/opd/history"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 font-bold text-xs border border-cyan-400/30 transition-all"
            >
              <FileText className="w-4 h-4" />
              OPD Prescriptions
            </Link>
            <Link
              to="/emr"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-bold text-xs border border-purple-400/30 transition-all"
            >
              <Heart className="w-4 h-4" />
              My EMR Dossier
            </Link>
          </div>
        </div>
      </div>

      {/* Outpatient Department (OPD) Quick Access Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-sky-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cyan-500/20">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight">Outpatient Encounters & Digital Prescriptions</h3>
            <p className="text-xs text-cyan-200/80 mt-0.5">
              Access your digital Rx slips, vital sign history (BP, Pulse, BMI), doctor diagnoses, and follow-up consultation dates.
            </p>
          </div>
        </div>
        <Link
          to="/opd/history"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto shrink-0"
        >
          View Rx & History <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Electronic Medical Records (EMR) Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-500/20">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight">Electronic Medical Records (EMR)</h3>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Access your lifetime health timeline, diagnostic laboratory & scan reports, clinical diagnoses, treatment history, and printable medical dossier.
            </p>
          </div>
        </div>
        <Link
          to="/emr"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto shrink-0"
        >
          Open My EMR <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <StatsGrid columns={4}>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointments</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {appointments.length}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Scheduled visits</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Group</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {profile?.bloodGroup || 'Unknown'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Clinical Blood Typing</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allergies</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {profile?.allergies?.length || 0} Documented
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Active clinical alerts</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medical History</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {profile?.medicalHistory?.length || 0} Diagnoses
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Chronic & surgical records</span>
        </div>
      </StatsGrid>

      {/* Upcoming Consultations Widget */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
              Upcoming Medical Consultations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled appointments with hospital specialists
            </p>
          </div>
          <Link
            to="/appointments"
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
          >
            View All ({appointments.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled').length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No upcoming consultations scheduled.</p>
            <p className="text-xs text-slate-400 mt-1">Book a visit with a doctor whenever you need medical care.</p>
            <Link
              to="/appointments/book"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" /> Book Consultation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments
              .filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled')
              .slice(0, 2)
              .map((apt) => (
                <div
                  key={apt._id}
                  className="p-4 rounded-2xl bg-cyan-50/40 border border-cyan-100 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[11px] font-black text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200">
                        {apt.appointmentId}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
                        Dr. {apt.doctor?.name}
                      </h4>
                      <p className="text-xs text-slate-500">{apt.department} • {apt.roomNumber}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {apt.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-cyan-100/60 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-bold text-cyan-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {apt.timeSlot}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Main 2-Column Section: Allergies & Medical History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Allergy Alerts Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              Active Allergy Alerts
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {profile?.allergies?.length || 0} on record
            </span>
          </div>

          {!profile?.allergies || profile.allergies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No active allergy alerts on file.
            </div>
          ) : (
            <div className="space-y-3">
              {profile.allergies.map((allergy) => {
                const isSevere = allergy.severity === 'Severe';
                const isModerate = allergy.severity === 'Moderate';
                return (
                  <div
                    key={allergy._id}
                    className={`p-4 rounded-2xl border ${
                      isSevere
                        ? 'bg-rose-50/70 border-rose-200'
                        : isModerate
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-sky-50/70 border-sky-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-sm">{allergy.allergen}</h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isSevere
                            ? 'bg-rose-600 text-white'
                            : isModerate
                            ? 'bg-amber-500 text-white'
                            : 'bg-sky-500 text-white'
                        }`}
                      >
                        {allergy.severity}
                      </span>
                    </div>
                    {allergy.reaction && (
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Reaction:</strong> {allergy.reaction}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Medical History Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Clinical History & Diagnoses
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {profile?.medicalHistory?.length || 0} events
            </span>
          </div>

          {!profile?.medicalHistory || profile.medicalHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No past medical diagnoses or surgical history on record.
            </div>
          ) : (
            <div className="space-y-3">
              {profile.medicalHistory.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-sm">{item.condition}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Chronic'
                          ? 'bg-indigo-100 text-indigo-800'
                          : item.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.notes && <p className="text-xs text-slate-600">{item.notes}</p>}
                  <p className="text-[10px] text-slate-400">
                    Diagnosed on:{' '}
                    {item.diagnosisDate
                      ? new Date(item.diagnosisDate).toLocaleDateString()
                      : 'Recorded on file'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact & Insurance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Emergency Contact */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Registered Emergency Contact
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase">Name</span>
              <span className="font-bold text-slate-800">
                {profile?.emergencyContact?.name || 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase">Relationship</span>
              <span className="font-bold text-slate-800">
                {profile?.emergencyContact?.relationship || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase">Phone</span>
              <span className="font-mono font-bold text-sky-600">
                {profile?.emergencyContact?.phone || 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-600" />
            Active Insurance Plan
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase">Provider</span>
              <span className="font-bold text-slate-800">
                {profile?.insurance?.provider || 'Self-Pay'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase">Policy #</span>
              <span className="font-mono font-bold text-slate-800">
                {profile?.insurance?.policyNumber || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase">Group #</span>
              <span className="font-mono font-bold text-slate-800">
                {profile?.insurance?.groupNumber || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default PatientDashboard;
