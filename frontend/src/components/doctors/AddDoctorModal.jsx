import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createDoctor } from '../../services/doctorService';
import toast from 'react-hot-toast';
import {
  X,
  Stethoscope,
  Mail,
  Lock,
  Phone,
  DollarSign,
  Award,
  Building,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const AddDoctorModal = ({ isOpen, onClose, onDoctorAdded }) => {
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'clinical' | 'schedule'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const departmentsList = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'General Medicine',
    'Dermatology',
    'Oncology',
    'Gynecology',
    'Radiology',
    'Emergency',
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Doctor@123',
    phone: '',
    gender: 'male',
    department: 'General Medicine',
    specialization: '',
    licenseNumber: '',
    consultationFee: 500,
    experienceYears: 5,
    roomNumber: 'Consultation Suite 101',
    slotDurationMinutes: 30,
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    bio: '',
    qualificationsText: 'MBBS, MD',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('workingHours.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        workingHours: { ...prev.workingHours, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const exists = prev.availableDays.includes(day);
      const updated = exists
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.specialization) {
      toast.error('Name, Email, and Specialization are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Format qualifications
      const qualifications = formData.qualificationsText
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean)
        .map((deg) => ({
          degree: deg,
          institution: 'Medical University',
          year: 2015,
        }));

      // Build weekly schedule
      const weeklySchedule = daysOfWeek.map((day) => ({
        day,
        isAvailable: formData.availableDays.includes(day),
        startTime: formData.workingHours.start,
        endTime: formData.workingHours.end,
        maxPatients: 20,
      }));

      const payload = {
        ...formData,
        qualifications,
        weeklySchedule,
      };

      const res = await createDoctor(payload);
      toast.success(res.message || 'Doctor onboarded successfully!');
      onDoctorAdded(res.doctor);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard doctor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600 shrink-0" /> Onboard Medical Specialist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin Doctor credentialing, department mapping, and weekly schedule creation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Allied Staff Hint Banner */}
        <div className="bg-sky-50/70 border-b border-sky-100 px-4 sm:px-6 py-2 flex items-center justify-between text-[11px] text-sky-800">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            Looking to onboard a <strong>Pharmacist</strong>, <strong>Lab Tech</strong>, or <strong>Receptionist</strong>?
          </span>
          <Link
            to="/admin"
            onClick={onClose}
            className="font-bold text-sky-700 hover:text-sky-900 underline ml-2 shrink-0"
          >
            Admin Staff Console →
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white gap-2 pt-2 overflow-x-auto hms-scrollbar whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. User Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'clinical'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Clinical Profile & Fees
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'schedule'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Weekly Shift & Schedule
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Tab 1: Credentials */}
            {activeTab === 'credentials' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name *</label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Robert House"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="robert.house@hms.local"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full text-sm py-2 pl-3 pr-9 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 00000"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Clinical Profile */}
            {activeTab === 'clinical' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Specialization Title *</label>
                    <input
                      type="text"
                      required
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Consultant Neurosurgeon"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">License Number</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g. MED-REG-2023-0101"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee ($/₹)</label>
                    <input
                      type="number"
                      name="consultationFee"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Room / Cabin</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                      placeholder="e.g. Suite 305, 3rd Floor"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Degrees (Comma Separated)</label>
                    <input
                      type="text"
                      name="qualificationsText"
                      value={formData.qualificationsText}
                      onChange={handleChange}
                      placeholder="e.g. MBBS, MD Cardiology, FACS"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Biography</label>
                  <textarea
                    rows={2}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Brief background on surgical experience, fellowships, and clinical focus..."
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Schedule */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Available Consulting Days</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {daysOfWeek.map((day) => {
                      const isSelected = formData.availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Start Time</label>
                    <input
                      type="time"
                      name="workingHours.start"
                      value={formData.workingHours.start}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift End Time</label>
                    <input
                      type="time"
                      name="workingHours.end"
                      value={formData.workingHours.end}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Slot Duration (Minutes)</label>
                    <select
                      name="slotDurationMinutes"
                      value={formData.slotDurationMinutes}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value={15}>15 mins</option>
                      <option value={20}>20 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              {activeTab !== 'credentials' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'schedule' ? 'clinical' : 'credentials')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  &larr; Previous
                </button>
              )}
              {activeTab !== 'schedule' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'credentials' ? 'clinical' : 'schedule')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                >
                  Next &rarr;
                </button>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer text-center"
              >
                {isSubmitting ? 'Onboarding Specialist...' : 'Onboard Doctor'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctorModal;
