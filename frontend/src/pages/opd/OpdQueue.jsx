import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOpdQueue } from '../../services/opdService';
import { getDoctors } from '../../services/doctorService';
import toast from 'react-hot-toast';
import {
  Clock,
  User,
  Stethoscope,
  Building,
  Activity,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  ChevronRight,
  Printer,
  Heart,
  Calendar,
  Loader2,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';

const STATUS_BADGES = {
  Waiting: 'bg-amber-100 text-amber-800 border-amber-200',
  'In Consultation': 'bg-sky-100 text-sky-800 border-sky-200 animate-pulse',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const OpdQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalInQueue: 0,
    waitingCount: 0,
    inConsultationCount: 0,
    completedCount: 0,
  });

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  useEffect(() => {
    // Default date is today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    if (isDoctor) {
      setSelectedDoctorId(user._id);
    }

    loadDoctors();
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      fetchQueue();
    }
  }, [selectedDoctorId, selectedDate, statusFilter]);

  const loadDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Failed to load doctors list:', error);
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = {
        date: selectedDate,
        ...(selectedDoctorId && { doctorId: selectedDoctorId }),
        ...(statusFilter !== 'All' && { status: statusFilter }),
      };

      const data = await getOpdQueue(params);
      setQueue(data.queue || []);
      setStats(
        data.stats || {
          totalInQueue: 0,
          waitingCount: 0,
          inConsultationCount: 0,
          completedCount: 0,
        }
      );
    } catch (error) {
      toast.error('Failed to retrieve live OPD queue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Real-Time Clinical Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live OPD Consultation Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily outpatient tokens, triage vitals, waiting times, and consultation handoffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isStaff && (
            <Link
              to="/opd/register"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Register Walk-in Patient
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <StatsGrid cols={4}>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total in Queue
          </span>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalInQueue}</p>
          <span className="text-xs text-slate-500 mt-1 block">Registered check-ins</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Waiting (In Lobby)
          </span>
          <p className="text-3xl font-black text-amber-600 mt-1">{stats.waitingCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Awaiting doctor call</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">
            In Consultation
          </span>
          <p className="text-3xl font-black text-sky-600 mt-1">{stats.inConsultationCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Active in clinic room</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Completed (Discharged)
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-1">{stats.completedCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Rx issued & closed</span>
        </div>
      </StatsGrid>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor Filter (Staff can select, Doctor locked to self or all) */}
          <div className="min-w-[200px]">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="">-- All Doctors / Clinics --</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.user?.name} ({doc.department})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{queue.length}</span> patient visits
        </div>
      </div>

      {/* Main Queue List */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
          <p className="text-xs font-medium">Loading OPD queue records...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patients in Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no patients registered in the outpatient queue for the selected clinic and date.
          </p>
          {isStaff && (
            <div className="pt-2">
              <Link
                to="/opd/register"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> Check-in Walk-in Patient
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((visit) => {
            const isCompleted = visit.status === 'Completed';
            const isWaiting = visit.status === 'Waiting';

            return (
              <div
                key={visit._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Token Badge & Patient Info */}
                <div className="flex items-start gap-4">
                  {/* Token Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Token</span>
                    <span className="text-xl font-black leading-none">#{visit.tokenNumber}</span>
                  </div>

                  {/* Patient Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {visit.visitId}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {visit.patient?.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          STATUS_BADGES[visit.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {visit.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Doctor: <strong className="text-slate-700">Dr. {visit.doctor?.name}</strong></span>
                      <span>•</span>
                      <span>Department: {visit.department}</span>
                      <span>•</span>
                      <span>Room: {visit.doctorProfile?.roomNumber || 'Clinic Room'}</span>
                    </div>

                    {/* Vitals Summary Pill */}
                    {visit.vitals && (
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] font-mono text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100">
                          BP: {visit.vitals.bloodPressure || 'N/A'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100">
                          Pulse: {visit.vitals.heartRate ? `${visit.vitals.heartRate} bpm` : 'N/A'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100">
                          Temp: {visit.vitals.temperature ? `${visit.vitals.temperature}°F` : 'N/A'}
                        </span>
                        {visit.vitals.bmi && (
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold">
                            BMI: {visit.vitals.bmi}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Chief Complaints */}
                    <p className="text-xs text-slate-600 pt-0.5">
                      <strong className="text-slate-800">Chief Complaint:</strong> {visit.chiefComplaints}
                      {visit.symptomsDuration && ` (${visit.symptomsDuration})`}
                    </p>

                    {/* Completed Diagnosis if any */}
                    {visit.diagnosis && (
                      <p className="text-xs text-emerald-800 font-medium">
                        <strong>Diagnosis:</strong> {visit.diagnosis}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                  {/* Doctor Launch Consultation */}
                  {isDoctor && (isWaiting || visit.status === 'In Consultation') && (
                    <Link
                      to={`/opd/consultation/${visit._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Stethoscope className="w-4 h-4" />
                      Start Consultation
                    </Link>
                  )}

                  {/* View Prescription (If Completed) */}
                  {isCompleted && (
                    <Link
                      to={`/opd/prescription/${visit._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 font-bold text-xs transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Rx Slip
                    </Link>
                  )}

                  {/* General Detail View */}
                  <Link
                    to={`/opd/prescription/${visit._id}`}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="View Encounter"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default OpdQueue;
