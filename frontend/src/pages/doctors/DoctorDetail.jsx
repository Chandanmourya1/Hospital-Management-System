import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDoctorById,
  updateDoctor,
  updateSchedule,
  updateAvailability,
  deleteDoctor,
} from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Building,
  ShieldCheck,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/common/PageContainer';

const DoctorDetail = () => {
  const { id } = useParams();
  const { user: currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Forms state
  const [editForm, setEditForm] = useState({});
  const [scheduleList, setScheduleList] = useState([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const data = await getDoctorById(id);
      setDoctor(data.doctor);
      setEditForm({
        name: data.doctor.user?.name || '',
        phone: data.doctor.user?.phone || '',
        specialization: data.doctor.specialization || '',
        department: data.doctor.department || 'General Medicine',
        licenseNumber: data.doctor.licenseNumber || '',
        consultationFee: data.doctor.consultationFee || 500,
        experienceYears: data.doctor.experienceYears || 1,
        roomNumber: data.doctor.roomNumber || '',
        bio: data.doctor.bio || '',
      });

      // Initialize schedule form
      const existing = data.doctor.weeklySchedule || [];
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
    } catch (err) {
      console.error('Failed to load doctor:', err);
      toast.error('Doctor profile could not be loaded.');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const isOwner = currentUser && doctor && doctor.user?._id === currentUser._id;
  const isAdmin = role === 'admin';
  const canEdit = isAdmin || isOwner;

  // Handle Availability status quick toggle
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await updateAvailability(doctor._id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setDoctor((prev) => ({ ...prev, availabilityStatus: res.availabilityStatus }));
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Handle Edit profile submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateDoctor(doctor._id, editForm);
      toast.success('Doctor profile updated successfully.');
      setDoctor(res.doctor);
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor profile.');
    }
  };

  // Handle Schedule submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateSchedule(doctor._id, { weeklySchedule: scheduleList });
      toast.success('Doctor schedule updated.');
      setDoctor((prev) => ({
        ...prev,
        weeklySchedule: res.weeklySchedule,
        availableDays: res.availableDays,
      }));
      setIsScheduleModalOpen(false);
    } catch (err) {
      toast.error('Failed to update schedule.');
    }
  };

  // Handle Delete Doctor
  const handleDeleteDoctor = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${doctor.user?.name}'s account?`))
      return;
    try {
      await deleteDoctor(doctor._id);
      toast.success('Doctor deactivated successfully.');
      navigate('/doctors');
    } catch (err) {
      toast.error('Failed to delete doctor account.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving specialist credentials...</p>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/doctors')}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Specialist Directory
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" /> Edit Shift Schedule
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Profile
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteDoctor}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="Deactivate Doctor"
            >
              <Trash2 className="w-3.5 h-3.5" /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Main Specialist Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-emerald-600/20 shrink-0">
              {doctor.user?.name?.replace('Dr. ', '').charAt(0) || 'D'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {doctor.user?.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {doctor.doctorId || 'DOC-SPECIALIST'}
                </span>
              </div>

              <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <span>{doctor.specialization}</span> &bull;{' '}
                <span className="text-slate-600">{doctor.department}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {doctor.user?.email}
                </span>
                {doctor.user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {doctor.user?.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> {doctor.roomNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Availability Status & Fast Switcher (if doctor or admin) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right space-y-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Live Clinical Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                doctor.availabilityStatus === 'Available'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : doctor.availabilityStatus === 'In Consultation'
                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                  : doctor.availabilityStatus === 'On Leave'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {doctor.availabilityStatus}
            </span>

            {canEdit && (
              <div className="flex gap-1 pt-2">
                {['Available', 'In Consultation', 'On Leave'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      doctor.availabilityStatus === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Consultation Fee</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">${doctor.consultationFee}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Experience</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {doctor.experienceYears} Years
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Medical License</span>
            <p className="text-sm font-mono font-bold text-slate-800 mt-2 truncate">
              {doctor.licenseNumber}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Slot Duration</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {doctor.slotDurationMinutes} Mins
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column: Schedule on Left, Bio & Qualifications on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Shift Schedule (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" /> Weekly Consulting Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Working shifts and maximum daily patient capacities
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Modify Shifts &rarr;
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="pb-3 px-2">Day</th>
                  <th className="pb-3 px-2">Shift Status</th>
                  <th className="pb-3 px-2">Consultation Hours</th>
                  <th className="pb-3 px-2 text-right">Max Patient Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daysOfWeek.map((day) => {
                  const shift = doctor.weeklySchedule?.find((s) => s.day === day);
                  const isAvailable = shift?.isAvailable ?? false;
                  return (
                    <tr key={day} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-bold text-slate-800">{day}</td>
                      <td className="py-3 px-2">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> On Duty
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <XCircle className="w-3.5 h-3.5" /> Off
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-600 font-mono text-xs">
                        {isAvailable ? `${shift.startTime} - ${shift.endTime}` : 'No Sessions'}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-700">
                        {isAvailable ? `${shift.maxPatients || 20} Patients` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Qualifications & Bio (1 col) */}
        <div className="space-y-6">
          {/* Direct Consultation Booking Card */}
          <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-6 text-white shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/15 rounded-2xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-base">Book Consultation</h4>
                <p className="text-xs text-cyan-100">Reserve your dedicated slot</p>
              </div>
            </div>

            <p className="text-xs text-cyan-100 leading-relaxed">
              Dr. {doctor.user?.name} is accepting appointments for {doctor.department}.
              Consultation fee is <strong>${doctor.consultationFee}</strong>.
            </p>

            <Link
              to={`/appointments/book?doctorId=${doctor._id}&department=${doctor.department}`}
              className="block w-full py-3 bg-white hover:bg-cyan-50 text-cyan-800 font-extrabold text-xs text-center rounded-xl shadow-sm transition-colors"
            >
              Check Slots & Book Now
            </Link>
          </div>

          {/* Qualifications */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-emerald-600" />
              Credentials & Qualifications
            </h3>

            {!doctor.qualifications || doctor.qualifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No degrees on record.</p>
            ) : (
              <div className="space-y-3">
                {doctor.qualifications.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-xs text-slate-900">{q.degree}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{q.institution}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Class of {q.year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-sky-600" />
              Clinical Background
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {doctor.bio || 'No clinical biography provided for this specialist.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Doctor Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-slate-900">Edit Doctor Profile</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={editForm.roomNumber}
                    onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={editForm.consultationFee}
                    onChange={(e) => setEditForm({ ...editForm, consultationFee: Number(e.target.value) })}
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={editForm.experienceYears}
                    onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Biography</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full text-sm p-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Schedule Modal */}
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
                  <div key={slot.day} className="pt-2 flex items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 font-bold text-slate-800 w-28">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={(e) => {
                          const updated = [...scheduleList];
                          updated[idx].isAvailable = e.target.checked;
                          setScheduleList(updated);
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
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
                        className="p-1.5 border rounded-lg disabled:bg-slate-100 text-xs"
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
                        className="p-1.5 border rounded-lg disabled:bg-slate-100 text-xs"
                      />
                    </div>

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
                      className="w-16 p-1.5 border rounded-lg disabled:bg-slate-100 text-xs text-right"
                    />
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

export default DoctorDetail;
