import React, { useState } from 'react';
import { createPatient } from '../../services/patientService';
import toast from 'react-hot-toast';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  Shield,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const AddPatientModal = ({ isOpen, onClose, onPatientAdded }) => {
  const [activeTab, setActiveTab] = useState('demographics'); // 'demographics' | 'emergency' | 'insurance'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '',
    bloodGroup: 'Unknown',
    maritalStatus: 'Single',
    occupation: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    emergencyContact: {
      name: '',
      relationship: 'Spouse',
      phone: '',
      alternatePhone: '',
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      expiryDate: '',
      coverageDetails: '',
    },
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value },
      }));
    } else if (name.startsWith('insurance.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        insurance: { ...prev.insurance, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Patient Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPatient(formData);
      toast.success(res.message || 'Patient registered successfully!');
      onPatientAdded(res.patient);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register patient.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-sky-600 shrink-0" /> Register In-Person / Walk-in Patient
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates auto-assigned sequential Patient ID and clinical record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white gap-2 pt-2 overflow-x-auto hms-scrollbar whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('demographics')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'demographics'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Personal & Demographics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'emergency'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Emergency Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('insurance')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'insurance'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Insurance Coverage
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Tab 1: Demographics */}
            {activeTab === 'demographics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. David Miller"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                      placeholder="david.miller@example.com"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 00000"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="Unknown">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Marital Status</label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      placeholder="e.g. Teacher, Engineer"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="123 Hospital Road, Apt 4"
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Emergency Contact */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Emergency contacts are notified in urgent clinical scenarios or prior to critical procedures.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      placeholder="e.g. Mary Miller"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleChange}
                      placeholder="e.g. Spouse, Parent, Sibling"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 11111"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
                    <input
                      type="tel"
                      name="emergencyContact.alternatePhone"
                      value={formData.emergencyContact.alternatePhone}
                      onChange={handleChange}
                      placeholder="Optional alternate number"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Insurance Details */}
            {activeTab === 'insurance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Insurance Provider</label>
                    <input
                      type="text"
                      name="insurance.provider"
                      value={formData.insurance.provider}
                      onChange={handleChange}
                      placeholder="e.g. BlueCross, UnitedHealthcare"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Policy / ID Number</label>
                    <input
                      type="text"
                      name="insurance.policyNumber"
                      value={formData.insurance.policyNumber}
                      onChange={handleChange}
                      placeholder="e.g. POL-894721"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Group Number</label>
                    <input
                      type="text"
                      name="insurance.groupNumber"
                      value={formData.insurance.groupNumber}
                      onChange={handleChange}
                      placeholder="e.g. GRP-1002"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Policy Expiry Date</label>
                    <input
                      type="date"
                      name="insurance.expiryDate"
                      value={formData.insurance.expiryDate}
                      onChange={handleChange}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Coverage Details / Copay Notes</label>
                  <textarea
                    rows={2}
                    name="insurance.coverageDetails"
                    value={formData.insurance.coverageDetails}
                    onChange={handleChange}
                    placeholder="e.g. 80% Inpatient coverage, $20 Specialist Copay"
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              {activeTab !== 'demographics' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'insurance' ? 'emergency' : 'demographics')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  &larr; Previous
                </button>
              )}
              {activeTab !== 'insurance' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'demographics' ? 'emergency' : 'insurance')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 cursor-pointer"
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
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all cursor-pointer text-center"
              >
                {isSubmitting ? 'Registering...' : 'Complete Patient Registration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
