import React, { useState, useEffect } from 'react';
import { getAvailableSlots, rescheduleAppointment } from '../../services/appointmentService';
import toast from 'react-hot-toast';
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Stethoscope,
} from 'lucide-react';

const RescheduleModal = ({ isOpen, onClose, appointment, onRescheduled }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default target date to tomorrow when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      setSelectedDate(tomorrowStr);
      setSelectedSlot(null);
      setRescheduleReason('');
      fetchSlots(tomorrowStr);
    }
  }, [isOpen, appointment]);

  const fetchSlots = async (date) => {
    if (!appointment || !date) return;
    setIsLoadingSlots(true);
    setSlotMessage('');
    setSelectedSlot(null);

    try {
      const docId =
        appointment.doctorProfile?._id ||
        appointment.doctorProfile ||
        appointment.doctor?._id ||
        appointment.doctor;

      const data = await getAvailableSlots(docId, date);

      if (!data.available) {
        setAvailableSlots([]);
        setSlotMessage(data.reason || 'Doctor is not available on this date.');
      } else {
        setAvailableSlots(data.slots || []);
        if (data.availableSlotsCount === 0) {
          setSlotMessage('All appointment slots are fully booked for this date.');
        }
      }
    } catch (error) {
      setAvailableSlots([]);
      setSlotMessage(error.response?.data?.message || 'Could not load slots for this date.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchSlots(newDate);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      await rescheduleAppointment(appointment._id, {
        appointmentDate: selectedDate,
        timeSlot: selectedSlot.timeSlot,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        rescheduleReason: rescheduleReason.trim() || 'Rescheduled via portal',
      });

      toast.success('Appointment rescheduled successfully!');
      onRescheduled();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const doctorName = appointment.doctor?.name || 'Assigned Specialist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/15">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Reschedule Consultation</h2>
              <p className="text-xs text-cyan-100 font-medium tracking-wide uppercase">
                {appointment.appointmentId} • {appointment.department}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleReschedule} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Current Appointment Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-cyan-600" />
                {doctorName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                {appointment.roomNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 pt-1">
              <span>Current Date:</span>
              <span className="font-medium text-slate-700">
                {new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Current Time Slot:</span>
              <span className="font-medium text-slate-700">{appointment.timeSlot}</span>
            </div>
          </div>

          {/* Select New Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select New Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={handleDateChange}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Available Time Slots
              </label>
              {selectedSlot && (
                <span className="text-xs font-bold text-cyan-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected: {selectedSlot.timeSlot}
                </span>
              )}
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                <span className="text-xs">Checking doctor availability...</span>
              </div>
            ) : slotMessage ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>{slotMessage}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.timeSlot === slot.timeSlot;
                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        !slot.isAvailable
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-cyan-600 border-cyan-600 text-white font-bold shadow-sm ring-2 ring-cyan-400 ring-offset-1'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-500 hover:bg-cyan-50/50'
                      }`}
                    >
                      {slot.timeSlot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reschedule Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Reason for Rescheduling
            </label>
            <input
              type="text"
              placeholder="e.g., Work conflict, personal urgency, need morning slot"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg shadow-sm hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Reschedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
