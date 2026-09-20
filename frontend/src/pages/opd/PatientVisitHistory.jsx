import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getPatientVisitHistory, getAllOpdVisits } from '../../services/opdService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Heart,
  FileText,
  Activity,
  ArrowLeft,
  ChevronRight,
  Pill,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
  Printer,
  History,
  Loader2,
  CalendarPlus,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';

const PatientVisitHistory = () => {
  const { patientId: paramPatientId } = useParams();
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patientId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPatient = user?.role === 'patient';
  const effectivePatientId = paramPatientId || queryPatientId || (isPatient ? 'me' : '');

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  useEffect(() => {
    fetchHistory();
  }, [effectivePatientId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (effectivePatientId) {
        const data = await getPatientVisitHistory(effectivePatientId);
        setVisits(data.visits || []);
      } else {
        // Staff viewing master outpatient ledger
        const data = await getAllOpdVisits({ limit: 50 });
        setVisits(data.visits || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch visit history.');
    } finally {
      setLoading(false);
    }
  };

  // Filter visits
  const departments = ['All', ...new Set(visits.map((v) => v.department).filter(Boolean))];

  const filteredVisits = visits.filter((visit) => {
    const matchesDept =
      selectedDepartment === 'All' || visit.department === selectedDepartment;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      visit.visitId?.toLowerCase().includes(searchLower) ||
      visit.diagnosis?.toLowerCase().includes(searchLower) ||
      visit.chiefComplaints?.toLowerCase().includes(searchLower) ||
      visit.doctor?.name?.toLowerCase().includes(searchLower) ||
      visit.prescription?.prescriptionId?.toLowerCase().includes(searchLower);

    return matchesDept && matchesSearch;
  });

  // Summary Metrics
  const totalVisits = visits.length;
  const completedVisits = visits.filter((v) => v.status === 'Completed').length;
  const prescriptionsCount = visits.filter((v) => v.prescription?.prescriptionId).length;
  const followUpsCount = visits.filter((v) => v.followUp?.recommended).length;

  return (
    <PageContainer className="animate-fade-in space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            Outpatient Department
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Outpatient Visit History & EMR Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review past consultations, vital signs logs, clinical diagnoses, and digital prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'patient' && (
            <Link
              to="/appointments/book"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:from-cyan-700 hover:to-blue-700 shadow-sm transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              Book Appointment
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <Link
              to="/opd/register"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 shadow-sm transition-all"
            >
              OPD Check-in
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <StatsGrid cols={4}>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Visits</p>
            <p className="text-xl font-black text-slate-800">{totalVisits}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
            <p className="text-xl font-black text-slate-800">{completedVisits}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prescriptions</p>
            <p className="text-xl font-black text-slate-800">{prescriptionsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Follow-ups</p>
            <p className="text-xl font-black text-slate-800">{followUpsCount}</p>
          </div>
        </div>
      </StatsGrid>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by diagnosis, doctor, visit ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hms-scrollbar">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Department:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDepartment === dept
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Visits Chronological List */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto" />
          <p className="text-xs font-semibold">Loading Outpatient Visit History...</p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Outpatient Encounters Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || selectedDepartment !== 'All'
              ? 'No outpatient visit records match your selected filters.'
              : 'You do not have any recorded OPD visits or consultations yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const hasRx = !!visit.prescription?.prescriptionId;
            const isCompleted = visit.status === 'Completed';

            return (
              <div
                key={visit._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Date, Visit ID, Doctor */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-lg">
                        {visit.visitId}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Token #{visit.tokenNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : visit.status === 'In Consultation'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {visit.status}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(visit.visitDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs">
                        Dr
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Dr. {visit.doctor?.name || 'Physician'}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {visit.doctorProfile?.specialization || visit.department} Department
                          {visit.doctorProfile?.roomNumber && ` • Cabin ${visit.doctorProfile.roomNumber}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-start">
                    {hasRx ? (
                      <Link
                        to={`/opd/prescription/${visit._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Prescription Slip ({visit.prescription.prescriptionId})
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 italic px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        Prescription Pending
                      </span>
                    )}

                    <Link
                      to={`/opd/prescription/${visit._id}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="View Details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Clinical Content Box */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Complaints & Symptoms */}
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Chief Complaints
                    </p>
                    <p className="font-semibold text-slate-800">{visit.chiefComplaints}</p>
                    {visit.symptomsDuration && (
                      <p className="text-[11px] text-slate-500">Duration: {visit.symptomsDuration}</p>
                    )}
                  </div>

                  {/* Diagnosis */}
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      Diagnosis / Impression
                    </p>
                    <p className="font-bold text-emerald-950">
                      {visit.diagnosis || 'Clinical evaluation completed.'}
                    </p>
                    {visit.prescription?.medicines?.length > 0 && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {visit.prescription.medicines.length} medicine(s) prescribed
                      </p>
                    )}
                  </div>

                  {/* Vitals Summary */}
                  <div className="bg-cyan-50/40 p-3 rounded-xl border border-cyan-100 space-y-1">
                    <p className="text-[10px] font-black uppercase text-cyan-800 tracking-wider">
                      Vital Signs
                    </p>
                    {visit.vitals ? (
                      <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-slate-700">
                        <span>BP: {visit.vitals.bloodPressure || '—'}</span>
                        <span>Pulse: {visit.vitals.heartRate ? `${visit.vitals.heartRate} bpm` : '—'}</span>
                        <span>Temp: {visit.vitals.temperature ? `${visit.vitals.temperature}°F` : '—'}</span>
                        <span>BMI: {visit.vitals.bmi || '—'}</span>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No vitals logged.</p>
                    )}
                  </div>
                </div>

                {/* Follow-up Note if recommended */}
                {visit.followUp?.recommended && (
                  <div className="mt-3 bg-amber-50/70 border border-amber-200/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>
                        <strong>Follow-up:</strong> Review on{' '}
                        {new Date(visit.followUp.followUpDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        • {visit.followUp.instructions}
                      </span>
                    </div>
                    {visit.followUp.appointmentCreated && (
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        Appointment Confirmed
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default PatientVisitHistory;
