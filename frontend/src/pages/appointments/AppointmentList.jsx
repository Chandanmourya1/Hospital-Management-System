import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllAppointments,
  getMyPatientAppointments,
  getDoctorSchedule,
  cancelAppointment,
  updateAppointmentStatus,
  sendAppointmentReminder,
} from '../../services/appointmentService';
import RescheduleModal from '../../components/appointments/RescheduleModal';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  Phone,
  Mail,
  Loader2,
  Eye,
  Check,
  X,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const STATUS_COLORS = {
  Confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  Rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  'No Show': 'bg-amber-100 text-amber-800 border-amber-200',
};

const AppointmentList = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [patientTab, setPatientTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Modals state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  // Cancel Modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Complete Consultation Modal state (Doctor)
  const [completeTarget, setCompleteTarget] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Sending reminder loading tracker by appointment ID
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  useEffect(() => {
    fetchAppointments();
  }, [user, page, statusFilter, dateFilter, searchQuery, patientTab]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (isPatient) {
        const data = await getMyPatientAppointments();
        const allList = data.appointments || [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filtered = allList.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);

          if (patientTab === 'upcoming') {
            return (
              aptDate >= now &&
              (apt.status === 'Confirmed' || apt.status === 'Rescheduled')
            );
          } else {
            return (
              aptDate < now ||
              apt.status === 'Completed' ||
              apt.status === 'Cancelled' ||
              apt.status === 'No Show'
            );
          }
        });

        setAppointments(filtered);
        setTotal(filtered.length);
        setPages(1);
      } else if (isDoctor) {
        const params = {
          ...(dateFilter && { date: dateFilter }),
          ...(statusFilter !== 'All' && { status: statusFilter }),
        };
        const data = await getDoctorSchedule(params);
        setAppointments(data.appointments || []);
        setTotal(data.count || 0);
        setPages(1);
      } else {
        // Staff / Admin Master List
        const params = {
          page,
          limit: 10,
          ...(statusFilter !== 'All' && { status: statusFilter }),
          ...(dateFilter && { date: dateFilter }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
        };
        const data = await getAllAppointments(params);
        setAppointments(data.appointments || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (error) {
      toast.error('Failed to load appointment records.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel Submit
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setIsCancelling(true);
    try {
      await cancelAppointment(
        cancelTarget._id,
        cancellationReason.trim() || 'Cancelled via portal'
      );
      toast.success(`Appointment ${cancelTarget.appointmentId} cancelled.`);
      setCancelTarget(null);
      setCancellationReason('');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Complete Consultation (Doctor)
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeTarget) return;

    setIsCompleting(true);
    try {
      await updateAppointmentStatus(
        completeTarget._id,
        'Completed',
        consultationNotes.trim()
      );
      toast.success(`Consultation ${completeTarget.appointmentId} marked as Completed.`);
      setCompleteTarget(null);
      setConsultationNotes('');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete consultation.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Handle Mark No-Show (Doctor or Staff)
  const handleMarkNoShow = async (apt) => {
    if (!window.confirm(`Mark ${apt.appointmentId} as 'No Show'?`)) return;
    try {
      await updateAppointmentStatus(apt._id, 'No Show', 'Patient did not arrive for scheduled slot.');
      toast.success(`Appointment ${apt.appointmentId} marked as No Show.`);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  // Handle Send Reminder Email
  const handleSendReminder = async (apt) => {
    setSendingReminderId(apt._id);
    try {
      const res = await sendAppointmentReminder(apt._id);
      toast.success(res.message || 'Reminder dispatched successfully!');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send reminder.');
    } finally {
      setSendingReminderId(null);
    }
  };

  return (
    <PageContainer className="animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>
              {isPatient
                ? 'Personal Healthcare Schedule'
                : isDoctor
                ? 'Clinical Outpatient Queue'
                : 'Hospital-wide Appointment Registry'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isPatient
              ? 'My Consultations'
              : isDoctor
              ? 'Doctor Schedule & Queue'
              : 'Master Appointment Ledger'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isPatient
              ? 'Review your upcoming visits, manage rescheduling, and check consultation passes.'
              : isDoctor
              ? 'Consultation appointments assigned to you. Mark attendance and log diagnoses.'
              : 'Comprehensive administration ledger for patient booking, reminder dispatching, and triage.'}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAppointments}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isDoctor && (
            <Link
              to="/appointments/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {isPatient ? 'Book Consultation' : 'Book Walk-in / Phone'}
            </Link>
          )}
        </div>
      </div>

      {/* Patient View Tabs */}
      {isPatient && (
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setPatientTab('upcoming')}
            className={`pb-3 border-b-2 transition-colors ${
              patientTab === 'upcoming'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Upcoming Consultations
          </button>
          <button
            type="button"
            onClick={() => setPatientTab('past')}
            className={`pb-3 border-b-2 transition-colors ${
              patientTab === 'past'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Past & Cancelled Records
          </button>
        </div>
      )}

      {/* Staff & Doctor Filters Bar */}
      {!isPatient && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search (Staff) */}
            {isStaff && (
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by ID (APT-xxxx) or Reason..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-slate-700"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-slate-700 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>

            {(dateFilter || statusFilter !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('All');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-cyan-700 underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{appointments.length}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> total
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
          <p className="text-xs font-medium">Loading appointment records...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isPatient
              ? patientTab === 'upcoming'
                ? "You don't have any upcoming medical appointments booked right now."
                : 'No past consultations found in your history.'
              : 'No appointments match the selected filters or date range.'}
          </p>
          {isPatient && patientTab === 'upcoming' && (
            <div className="pt-2">
              <Link
                to="/appointments/book"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Book Your First Consultation
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const formattedDate = new Date(apt.appointmentDate).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            const isUpcoming =
              apt.status === 'Confirmed' || apt.status === 'Rescheduled';

            return (
              <div
                key={apt._id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: ID & Main Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex flex-col items-center justify-center text-cyan-700 flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {apt.appointmentId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          STATUS_COLORS[apt.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        • {apt.bookingType || 'Online'}
                      </span>
                    </div>

                    {/* Parties */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
                        Dr. {apt.doctor?.name} ({apt.department})
                      </span>

                      {!isPatient && (
                        <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Patient: {apt.patient?.name}
                        </span>
                      )}

                      <span className="text-slate-500 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {apt.roomNumber}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-slate-500 pt-0.5">
                      <span className="font-semibold text-slate-700">Reason:</span>{' '}
                      {apt.reasonForVisit}
                    </p>

                    {/* Consultation Notes if present */}
                    {apt.consultationNotes && (
                      <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900">
                        <span className="font-bold">Consultation Notes:</span>{' '}
                        {apt.consultationNotes}
                      </div>
                    )}

                    {/* Cancellation Reason if present */}
                    {apt.cancellationReason && (
                      <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                        <span className="font-bold">Cancellation Reason:</span>{' '}
                        {apt.cancellationReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Date, Slot & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <div className="text-xs font-extrabold text-slate-800">{formattedDate}</div>
                    <div className="text-xs font-bold text-cyan-600 flex items-center md:justify-end gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {apt.timeSlot}
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Send Reminder (Staff / Doctor) */}
                    {!isPatient && isUpcoming && (
                      <button
                        type="button"
                        onClick={() => handleSendReminder(apt)}
                        disabled={sendingReminderId === apt._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                        title="Send automated reminder email to patient"
                      >
                        {sendingReminderId === apt._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                        Reminder
                      </button>
                    )}

                    {/* Doctor Consultation Controls */}
                    {isDoctor && isUpcoming && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCompleteTarget(apt);
                            setConsultationNotes('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkNoShow(apt)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          No Show
                        </button>
                      </>
                    )}

                    {/* Reschedule Button */}
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => setRescheduleTarget(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reschedule
                      </button>
                    )}

                    {/* Cancel Button */}
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(apt);
                          setCancellationReason('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination for Staff */}
          {isStaff && pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Page {page} of {pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          appointment={rescheduleTarget}
          onRescheduled={() => {
            setRescheduleTarget(null);
            fetchAppointments();
          }}
        />
      )}

      {/* Cancel Appointment Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Cancel Consultation
              </h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel appointment{' '}
              <strong className="text-slate-900 font-mono">{cancelTarget.appointmentId}</strong>{' '}
              with Dr. {cancelTarget.doctor?.name}? This action will release the reserved time slot.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Scheduling conflict, recovered from illness, emergency..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal (Doctor) */}
      {completeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Consultation: {completeTarget.appointmentId}
              </h3>
              <button
                type="button"
                onClick={() => setCompleteTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Patient:</span>{' '}
                {completeTarget.patient?.name}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Chief Complaint:</span>{' '}
                {completeTarget.reasonForVisit}
              </p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Notes & Medical Advice
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter clinical observations, diagnosis, dietary advice, or prescription notes..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isCompleting ? 'Saving...' : 'Mark as Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AppointmentList;
