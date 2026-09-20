import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDoctors } from '../../services/doctorService';
import { getPatients } from '../../services/patientService';
import { getAvailableSlots, bookAppointment } from '../../services/appointmentService';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  MapPin,
  FileText,
  Phone,
  Sparkles,
  Search,
  Check,
  Printer,
  ChevronRight,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const COMMON_REASONS = [
  'Routine Health Checkup',
  'Follow-up Consultation',
  'Chronic Condition Review',
  'Prescription Refill & Assessment',
  'Chest / Heart Discomfort',
  'Joint Pain & Mobility Issues',
  'Neurological / Headache Symptoms',
  'Lab / Diagnostic Report Review',
  'Fever, Cough & Cold Symptoms',
  'Digestive / Abdominal Pain',
  'Skin Rash / Allergy Evaluation',
  'Preventive Health Screening',
];

const DEPARTMENTS = [
  'All',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'General Medicine',
  'Dermatology',
  'Oncology',
  'Gynecology',
];

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wizard Step: 1 = Select Doctor, 2 = Pick Date & Slot, 3 = Patient Details & Reason, 4 = Confirmation Pass
  const [step, setStep] = useState(1);

  // Doctors & Department State
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  // Date & Slot State
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState('');

  // Patient & Reason State (For staff booking on behalf of patient)
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [bookingType, setBookingType] = useState('Online');
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const escapeRegex = (string) => {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  // Toggle multiple reasons simultaneously
  const handleToggleReason = (reasonText) => {
    const isCurrentlyActive =
      selectedReasons.includes(reasonText) || reasonForVisit.includes(reasonText);

    if (isCurrentlyActive) {
      // Remove from selectedReasons
      const updatedList = selectedReasons.filter((r) => r !== reasonText);
      setSelectedReasons(updatedList);

      // Cleanly remove this reason from reasonForVisit without deleting user's custom typed notes
      let text = reasonForVisit;
      text = text.replace(
        new RegExp(`(^|,\\s*|;\\s*|•\\s*)${escapeRegex(reasonText)}(,\\s*|;\\s*)?`, 'gi'),
        (match, p1, p2) => (p1 && p1.includes(',') && p2 ? ', ' : '')
      );
      if (text.includes(reasonText)) {
        text = text.replace(reasonText, '');
      }
      text = text.replace(/^[\s,;—\-•\n]+|[\s,;—\-•\n]+$/g, '').replace(/,\s*,/g, ',').trim();
      setReasonForVisit(text);
    } else {
      // Add to selectedReasons
      const updatedList = [...selectedReasons, reasonText];
      setSelectedReasons(updatedList);

      // Append to reasonForVisit
      const trimmed = reasonForVisit.trim();
      if (!trimmed) {
        setReasonForVisit(reasonText);
      } else {
        setReasonForVisit(`${trimmed}, ${reasonText}`);
      }
    }
  };

  // Clear all selected reasons
  const handleClearAllReasons = () => {
    setSelectedReasons([]);
    let text = reasonForVisit;
    COMMON_REASONS.forEach((r) => {
      text = text.replace(r, '');
    });
    text = text.replace(/^[\s,;—\-•\n]+|[\s,;—\-•\n]+$/g, '').replace(/,\s*,/g, ',').trim();
    setReasonForVisit(text);
  };

  // Result state
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  // Load initial doctors
  useEffect(() => {
    fetchDoctors();
    if (isStaff) {
      fetchPatientsList();
    }
  }, [user]);

  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const data = await getDoctors();
      setDoctors(data.doctors || []);

      // Check if doctorId was passed in query params
      const docParam = searchParams.get('doctorId');
      if (docParam && data.doctors) {
        const found = data.doctors.find((d) => d._id === docParam || d.doctorId === docParam);
        if (found) {
          setSelectedDoctor(found);
          setStep(2);
        }
      }
    } catch (error) {
      toast.error('Failed to load doctor directory.');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const fetchPatientsList = async () => {
    try {
      const data = await getPatients({ limit: 100 });
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Set default appointment date to tomorrow when advancing to Step 2
  useEffect(() => {
    if (step === 2 && !selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      setSelectedDate(tomorrowStr);
      if (selectedDoctor) {
        fetchSlots(selectedDoctor._id, tomorrowStr);
      }
    }
  }, [step, selectedDoctor]);

  const fetchSlots = async (docId, date) => {
    if (!docId || !date) return;
    setIsLoadingSlots(true);
    setSlotMessage('');
    setSelectedSlot(null);

    try {
      const data = await getAvailableSlots(docId, date);
      if (!data.available) {
        setAvailableSlots([]);
        setSlotMessage(data.reason || 'Doctor is not available on this date.');
      } else {
        setAvailableSlots(data.slots || []);
        if (data.availableSlotsCount === 0) {
          setSlotMessage('All consultation slots are booked for this date.');
        }
      }
    } catch (error) {
      setAvailableSlots([]);
      setSlotMessage(error.response?.data?.message || 'Failed to retrieve available slots.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    if (selectedDoctor) {
      fetchSlots(selectedDoctor._id, newDate);
    }
  };

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setStep(2);
    if (selectedDate) {
      fetchSlots(doc._id, selectedDate);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      toast.error('Please select a doctor.');
      setStep(1);
      return;
    }
    if (!selectedDate || !selectedSlot) {
      toast.error('Please choose a date and time slot.');
      setStep(2);
      return;
    }
    if (!reasonForVisit.trim()) {
      toast.error('Please provide a reason for the consultation.');
      setStep(3);
      return;
    }
    if (isStaff && !selectedPatientId) {
      toast.error('Staff must select a registered patient.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot.timeSlot,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reasonForVisit: reasonForVisit.trim(),
        bookingType: isStaff ? bookingType : 'Online',
        ...(isStaff && { patientId: selectedPatientId }),
      };

      const res = await bookAppointment(payload);
      setConfirmedAppointment(res.appointment);
      toast.success('Appointment booked successfully!');
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept =
      selectedDepartment === 'All' || doc.department === selectedDepartment;
    const matchesSearch =
      doc.user?.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.doctorId?.toLowerCase().includes(doctorSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Filtered Patients (for staff)
  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.user?.name?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.user?.phone?.toLowerCase().includes(q)
    );
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <PageContainer size="narrow" className="animate-fade-in space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
      {/* Top Header - Hidden when step === 4 and always hidden during print */}
      <div className={`mb-6 print:hidden ${step === 4 ? 'hidden' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Medical Scheduling</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Book a Consultation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Reserve an appointment with board-certified medical specialists with instant slot confirmation.
            </p>
          </div>
          <Link
            to="/appointments"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            View Existing Appointments
          </Link>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mt-8 relative print:hidden">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Choose Doctor' },
              { num: 2, label: 'Date & Slot' },
              { num: 3, label: 'Reason & Info' },
              { num: 4, label: 'Confirmation' },
            ].map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                      isPassed
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : isCurrent
                        ? 'bg-cyan-600 text-white ring-4 ring-cyan-100 shadow-md'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium mt-2 ${
                      isCurrent
                        ? 'text-cyan-700 font-bold'
                        : isPassed
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-cyan-600 transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* STEP 1: SELECT SPECIALIST */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Search & Filter Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search specialist doctor by name, qualification, or department..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Department Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 hms-scrollbar">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
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

          {/* Doctor Cards Grid */}
          {isLoadingDoctors ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-slate-100 animate-pulse rounded-xl border border-slate-200"
                />
              ))}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Specialists Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your search query or selecting another medical department.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor?._id === doc._id;
                const isAvailable = doc.availabilityStatus === 'Available';

                return (
                  <div
                    key={doc._id}
                    onClick={() => handleDoctorSelect(doc)}
                    className={`relative bg-white rounded-xl p-5 border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-cyan-600 ring-2 ring-cyan-500 shadow-md'
                        : 'border-slate-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
                        {doc.user?.name
                          ? doc.user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                          : 'DR'}
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {doc.user?.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-700'
                                : doc.availabilityStatus === 'In Consultation'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {doc.availabilityStatus}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-cyan-700 mt-0.5">
                          {doc.specialization}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {doc.department} • {doc.experienceYears} Years Experience
                        </p>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {doc.roomNumber}
                          </span>
                          <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                            <DollarSign className="w-3.5 h-3.5" />${doc.consultationFee} Fee
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-4 w-full py-2 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      Select Specialist & View Slots
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: DATE & AVAILABLE TIME SLOTS */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-6">
          {/* Selected Doctor Banner */}
          <div className="bg-gradient-to-r from-cyan-900 to-slate-900 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center font-bold text-lg">
                {selectedDoctor.user?.name
                  ? selectedDoctor.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                  : 'DR'}
              </div>
              <div>
                <span className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                  Selected Specialist
                </span>
                <h3 className="text-lg font-bold">{selectedDoctor.user?.name}</h3>
                <p className="text-xs text-slate-300">
                  {selectedDoctor.specialization} • {selectedDoctor.department}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Change Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Date Selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-600" />
                Select Consultation Date
              </h3>
              <p className="text-xs text-slate-500">
                Choose an upcoming date to see the doctor's live available shift hours and time slots.
              </p>

              <div>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Working days hint */}
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                <p className="font-bold text-slate-700 mb-1">Scheduled Clinic Days:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDoctor.availableDays?.map((day) => (
                    <span
                      key={day}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Slot Grid (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    Available Consultation Slots
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Pick a date'}
                  </p>
                </div>

                {selectedSlot && (
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedSlot.timeSlot}
                  </span>
                )}
              </div>

              {isLoadingSlots ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Checking real-time doctor schedule...</p>
                </div>
              ) : slotMessage ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-amber-800">{slotMessage}</p>
                  <p className="text-xs text-amber-700">
                    Please pick another date on which Dr. {selectedDoctor.user?.name} is on duty.
                  </p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">No slots generated for this date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-white border border-slate-300" />
                      Available ({availableSlots.filter((s) => s.isAvailable).length})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 line-through" />
                      Booked ({availableSlots.filter((s) => !s.isAvailable).length})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.timeSlot === slot.timeSlot;
                      return (
                        <button
                          key={slot.timeSlot}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                            !slot.isAvailable
                              ? 'bg-slate-50 text-slate-300 border-slate-100 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow ring-2 ring-cyan-400 ring-offset-1'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50'
                          }`}
                        >
                          {slot.timeSlot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Doctors
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Proceed to Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REASON & PATIENT DETAILS */}
      {step === 3 && (
        <form onSubmit={handleConfirmBooking} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Input Form (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                Consultation Details
              </h3>

              {/* Staff-only Patient Selector */}
              {isStaff && (
                <div className="p-4 bg-cyan-50/50 border border-cyan-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-900 uppercase tracking-wider">
                      Target Registered Patient (Staff Booking)
                    </label>
                    <span className="text-[11px] font-medium text-cyan-700">
                      Total: {patients.length} patients
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Search patient by name, PAT ID, or phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  />

                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-medium text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    <option value="">-- Choose Registered Patient --</option>
                    {filteredPatients.map((p) => (
                      <option key={p.user?._id || p._id} value={p.user?._id || p.user}>
                        {p.user?.name} ({p.patientId || 'PAT'}) • Phone: {p.user?.phone || 'N/A'}
                      </option>
                    ))}
                  </select>

                  {/* Booking channel */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Booking Channel
                    </label>
                    <div className="flex gap-4">
                      {['Walk-in', 'Phone', 'Online'].map((ch) => (
                        <label key={ch} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <input
                            type="radio"
                            name="bookingType"
                            value={ch}
                            checked={bookingType === ch}
                            onChange={(e) => setBookingType(e.target.value)}
                            className="text-cyan-600 focus:ring-cyan-500"
                          />
                          {ch}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation Reason Presets - Multi-Select Enabled */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quick Select Common Reasons
                    {COMMON_REASONS.filter((r) => selectedReasons.includes(r) || reasonForVisit.includes(r)).length > 0 && (
                      <span className="ml-2 text-[10px] font-extrabold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                        {COMMON_REASONS.filter((r) => selectedReasons.includes(r) || reasonForVisit.includes(r)).length} Selected
                      </span>
                    )}
                  </label>
                  {COMMON_REASONS.filter((r) => selectedReasons.includes(r) || reasonForVisit.includes(r)).length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllReasons}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Select one or more reasons to include in your consultation details. Click again to unselect:
                </p>

                <div className="flex flex-wrap gap-2">
                  {COMMON_REASONS.map((r) => {
                    const active = selectedReasons.includes(r) || reasonForVisit.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleToggleReason(r)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          active
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs shadow-cyan-600/30 ring-2 ring-cyan-200 font-bold scale-102'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {active ? (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">+</span>
                        )}
                        <span>{r}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Describe Symptoms or Reason for Visit *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (Multi-reason auto-synchronized)
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Select one or more reasons above or describe symptoms, duration, prior treatments, and specific questions for the doctor..."
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 leading-relaxed shadow-2xs"
                />
              </div>
            </div>

            {/* Right: Booking Summary Ticket Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  Appointment Summary
                </h4>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Doctor:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDoctor?.user?.name}
                    </span>
                    <span className="text-slate-500 block">
                      {selectedDoctor?.specialization} ({selectedDoctor?.department})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Date:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(selectedDate).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Time Slot:</span>
                    <span className="font-bold text-cyan-700 text-sm">
                      {selectedSlot?.timeSlot}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Consultation Suite:</span>
                    <span className="font-bold text-slate-700">
                      {selectedDoctor?.roomNumber}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Consultation Fee:</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      ${selectedDoctor?.consultationFee}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Confirming Booking...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Reserve Slot
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Change Date / Slot
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION PASS */}
      {step === 4 && confirmedAppointment && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-scale-up print-sheet print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0">
          {/* Ticket Header (On-Screen View) */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-7 text-white text-center print:hidden">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Consultation Confirmed!</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-md mx-auto">
              Your appointment pass has been issued and confirmation email dispatched.
            </p>
          </div>

          {/* Official Hospital Letterhead (Print-Only View) */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  MedCare Hospital & Medical Centre
                </h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                  Department of Outpatient Services (OPD) • Consultation Pass
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  100 Healthcare Boulevard, Metro Medical City • OPD Desk: Ext. 101 • Helpline: 1800-MED-CARE
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded">
                  OFFICIAL APPOINTMENT PASS
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Issued: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Pass Body */}
          <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 print:p-0 print:space-y-4">
            {/* Reference Pass Identifier */}
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:bg-white print:border-2 print:border-slate-800 print:rounded-lg print:p-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">
                  Appointment Reference Pass
                </p>
                <p className="text-2xl sm:text-3xl font-black text-cyan-800 tracking-wider font-mono print:text-slate-900">
                  {confirmedAppointment.appointmentId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black rounded-full uppercase tracking-wider print:border-emerald-600 print:text-emerald-900">
                  ● {confirmedAppointment.status || 'Confirmed'}
                </span>
                <span className="hidden sm:inline-block px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full print:inline-block print:border print:border-slate-300">
                  {confirmedAppointment.bookingType || 'In-Clinic'}
                </span>
              </div>
            </div>

            {/* Essential Details 4-Quadrant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs print:grid-cols-2 print:gap-3 print:text-[11px]">
              {/* 1. Patient Information */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">
                  Patient Information
                </span>
                <p className="font-extrabold text-slate-900 text-sm print:text-xs">
                  {confirmedAppointment.patient?.name || selectedPatient?.user?.name || user?.name || 'Registered Patient'}
                </p>
                <p className="text-slate-500 text-xs print:text-[11px] mt-0.5">
                  Patient ID: <span className="font-mono font-bold text-slate-700">{confirmedAppointment.patientProfile?.patientId || selectedPatient?.patientId || user?.patientProfile?.patientId || 'REG-PATIENT'}</span>
                </p>
                <p className="text-slate-500 text-xs print:text-[11px] mt-0.5">
                  Contact: {confirmedAppointment.patient?.phone || selectedPatient?.user?.phone || user?.phone || 'On Record'}
                </p>
              </div>

              {/* 2. Attending Specialist */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">
                  Attending Specialist
                </span>
                <p className="font-extrabold text-slate-900 text-sm print:text-xs">
                  {confirmedAppointment.doctor?.name ? (confirmedAppointment.doctor.name.startsWith('Dr.') ? confirmedAppointment.doctor.name : `Dr. ${confirmedAppointment.doctor.name}`) : (selectedDoctor?.user?.name || 'Consultant Specialist')}
                </p>
                <p className="text-cyan-700 font-semibold text-xs print:text-[11px] print:text-slate-700 mt-0.5">
                  {confirmedAppointment.doctorProfile?.specialization || selectedDoctor?.specialization || confirmedAppointment.department}
                </p>
                <p className="text-slate-500 text-xs print:text-[11px] mt-0.5">
                  Department: {confirmedAppointment.department || selectedDoctor?.department}
                </p>
              </div>

              {/* 3. Date & Allocated Slot */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">
                  Scheduled Consultation Time
                </span>
                <p className="font-extrabold text-slate-900 text-sm print:text-xs">
                  {new Date(confirmedAppointment.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-cyan-700 font-extrabold text-sm print:text-xs print:text-slate-900 mt-0.5 font-mono">
                  Allocated Slot: {confirmedAppointment.timeSlot}
                </p>
                <p className="text-slate-400 text-[10px] print:text-slate-600 mt-0.5">
                  Please report 15 mins prior
                </p>
              </div>

              {/* 4. Consultation Location & Fee */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">
                  Consultation Suite & Billing
                </span>
                <p className="font-extrabold text-slate-900 text-sm print:text-xs">
                  {confirmedAppointment.roomNumber || selectedDoctor?.roomNumber || 'Consultation Suite 105'}
                </p>
                <p className="text-slate-500 text-xs print:text-[11px] mt-0.5">
                  Main Hospital Block • OPD Wing
                </p>
                <p className="text-emerald-700 font-extrabold text-xs print:text-[11px] print:text-slate-900 mt-0.5">
                  Consultation Fee: ${confirmedAppointment.consultationFee || confirmedAppointment.doctorProfile?.consultationFee || selectedDoctor?.consultationFee || 50} (Standard)
                </p>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="p-3.5 bg-cyan-50/50 rounded-xl border border-cyan-100 text-xs text-cyan-950 print:bg-white print:border-slate-300 print:text-[11px] print:text-slate-900">
              <span className="font-bold text-cyan-900 print:text-slate-900">Reason for Visit / Chief Complaint:</span>{' '}
              {confirmedAppointment.reasonForVisit || 'Routine Consultation & Medical Evaluation'}
            </div>

            {/* Essential Patient Guidelines */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs space-y-1 print:bg-white print:border-slate-300 print:text-[10px]">
              <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                Essential Patient Guidelines
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 print:text-slate-700">
                <li>Please report to the OPD reception counter at least 15 minutes before your time slot.</li>
                <li>Present this consultation pass (printed copy or digital pass on mobile) at the doctor's suite.</li>
                <li>Carry your prior medical records, diagnostic test reports, and current medication lists.</li>
              </ul>
            </div>

            {/* Verification Barcode & Signature Line */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 print:flex-row print:pt-3 print:text-[10px]">
              <div>
                <p className="font-mono font-bold tracking-widest text-slate-700 text-sm print:text-xs">
                  ||| | ||||| | |||| ||| | ||||| | ||
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  PASS-ID: {confirmedAppointment.appointmentId}
                </p>
              </div>
              <div className="text-center sm:text-right print:text-right">
                <div className="w-48 h-0.5 bg-slate-300 mb-1 mx-auto sm:ml-auto print:ml-auto" />
                <p className="font-bold text-slate-700 text-[11px]">Authorized Hospital Registrar</p>
                <p className="text-[10px] text-slate-400">MedCare Outpatient Department (OPD)</p>
              </div>
            </div>

            {/* Action Buttons - NEVER DISPLAYED DURING PRINT */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Pass
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedDoctor(null);
                  setSelectedSlot(null);
                  setSelectedReasons([]);
                  setReasonForVisit('');
                  setConfirmedAppointment(null);
                }}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                Book Another
              </button>

              <Link
                to="/appointments"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-sm transition-colors cursor-pointer text-center"
              >
                Go to Appointments
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default BookAppointment;
