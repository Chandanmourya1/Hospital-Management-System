import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getPatientById,
  updatePatient,
  addMedicalHistory,
  deleteMedicalHistory,
  addAllergy,
  deleteAllergy,
} from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  Droplet,
  Shield,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertOctagon,
  Info,
  Building,
  FolderHeart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/common/PageContainer';

const PatientDetail = () => {
  const { id } = useParams();
  const { user: currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medical'); // 'medical' | 'allergies' | 'insurance' | 'emergency'

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false);
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);

  // Forms state
  const [historyForm, setHistoryForm] = useState({
    condition: '',
    status: 'Active',
    diagnosisDate: '',
    notes: '',
  });

  const [allergyForm, setAllergyForm] = useState({
    allergen: '',
    severity: 'Moderate',
    reaction: '',
  });

  const [editForm, setEditForm] = useState({});

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const data = await getPatientById(id);
      setPatient(data.patient);
      setEditForm({
        name: data.patient.user?.name || '',
        phone: data.patient.user?.phone || '',
        gender: data.patient.user?.gender || 'male',
        dateOfBirth: data.patient.user?.dateOfBirth ? data.patient.user.dateOfBirth.split('T')[0] : '',
        bloodGroup: data.patient.bloodGroup || 'Unknown',
        maritalStatus: data.patient.maritalStatus || 'Single',
        occupation: data.patient.occupation || '',
        emergencyContact: data.patient.emergencyContact || {},
        insurance: data.patient.insurance || {},
      });
    } catch (error) {
      console.error('Failed to load patient:', error);
      toast.error(error.response?.data?.message || 'Patient record could not be loaded.');
      if (role === 'patient') {
        navigate('/patient/dashboard');
      } else {
        navigate('/patients');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  // Permission helpers
  const isDoctorOrAdmin = role === 'doctor' || role === 'admin';
  const canAddAllergy = role === 'doctor' || role === 'receptionist' || role === 'admin';
  const canEditDemographics = role === 'admin' || role === 'receptionist' || role === 'doctor';

  // Handle Edit Patient Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updatePatient(patient._id, editForm);
      toast.success('Patient record updated successfully.');
      setPatient(res.patient);
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient record.');
    }
  };

  // Handle Add Medical History
  const handleAddHistorySubmit = async (e) => {
    e.preventDefault();
    if (!historyForm.condition) {
      toast.error('Condition name is required.');
      return;
    }
    try {
      const res = await addMedicalHistory(patient._id, historyForm);
      toast.success('Medical condition recorded successfully.');
      setPatient((prev) => ({ ...prev, medicalHistory: res.medicalHistory }));
      setIsAddHistoryModalOpen(false);
      setHistoryForm({ condition: '', status: 'Active', diagnosisDate: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medical history.');
    }
  };

  // Handle Delete Medical History
  const handleDeleteHistory = async (historyId) => {
    if (!window.confirm('Are you sure you want to remove this medical history record?')) return;
    try {
      const res = await deleteMedicalHistory(patient._id, historyId);
      toast.success('Medical record removed.');
      setPatient((prev) => ({ ...prev, medicalHistory: res.medicalHistory }));
    } catch (err) {
      toast.error('Failed to remove medical record.');
    }
  };

  // Handle Add Allergy
  const handleAddAllergySubmit = async (e) => {
    e.preventDefault();
    if (!allergyForm.allergen) {
      toast.error('Allergen name is required.');
      return;
    }
    try {
      const res = await addAllergy(patient._id, allergyForm);
      toast.success('Allergy alert recorded.');
      setPatient((prev) => ({ ...prev, allergies: res.allergies }));
      setIsAddAllergyModalOpen(false);
      setAllergyForm({ allergen: '', severity: 'Moderate', reaction: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record allergy.');
    }
  };

  // Handle Delete Allergy
  const handleDeleteAllergy = async (allergyId) => {
    if (!window.confirm('Are you sure you want to remove this allergy alert?')) return;
    try {
      const res = await deleteAllergy(patient._id, allergyId);
      toast.success('Allergy record removed.');
      setPatient((prev) => ({ ...prev, allergies: res.allergies }));
    } catch (err) {
      toast.error('Failed to delete allergy.');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving patient electronic health record...</p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={() => (role === 'patient' ? navigate('/patient/dashboard') : navigate('/patients'))}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />{' '}
          {role === 'patient' ? 'Return to Dashboard' : 'Back to Patient Directory'}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/emr/${patient.patientId || patient._id}`}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition shadow-sm"
          >
            <FolderHeart className="w-3.5 h-3.5" /> Open EMR Portal
          </Link>

          {canEditDemographics && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-sky-600" /> Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Patient Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-lg shadow-sky-500/20 shrink-0">
              {patient.user?.name?.charAt(0) || 'P'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {patient.user?.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                  {patient.patientId || 'PAT-NEW'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <Droplet className="w-3 h-3" /> Blood Group: {patient.bloodGroup || 'Unknown'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {patient.user?.email}
                </span>
                {patient.user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {patient.user?.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {calculateAge(patient.user?.dateOfBirth)} yrs &bull;{' '}
                  <span className="capitalize">{patient.user?.gender || 'N/A'}</span>
                </span>
                {patient.occupation && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> {patient.occupation}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs sm:text-sm font-bold overflow-x-auto hms-scrollbar">
        <button
          onClick={() => setActiveTab('medical')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'medical'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Medical History ({patient.medicalHistory?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('allergies')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'allergies'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" /> Allergy Records ({patient.allergies?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'insurance'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" /> Insurance Information
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'emergency'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" /> Emergency Contact
        </button>
      </div>

      {/* Tab 1: Medical History Timeline */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Medical History & Diagnoses</h3>
              <p className="text-xs text-slate-500">
                Chronological clinical events, chronic conditions, and past surgical procedures.
              </p>
            </div>
            {isDoctorOrAdmin && (
              <button
                onClick={() => setIsAddHistoryModalOpen(true)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record Medical History
              </button>
            )}
          </div>

          {!patient.medicalHistory || patient.medicalHistory.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No medical history records logged</p>
              <p className="text-xs text-slate-400">
                No past diagnoses or surgical records have been entered for this patient yet.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {patient.medicalHistory.map((item) => (
                <div key={item._id} className="p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-extrabold text-base text-slate-900">{item.condition}</h4>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.status === 'Chronic'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : item.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Diagnosed:{' '}
                        {item.diagnosisDate ? new Date(item.diagnosisDate).toLocaleDateString() : 'N/A'}
                      </span>
                      {isDoctorOrAdmin && (
                        <button
                          onClick={() => handleDeleteHistory(item._id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong>Clinical Notes:</strong> {item.notes}
                    </p>
                  )}

                  {item.recordedBy && (
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                      <User className="w-3 h-3" /> Recorded by Dr. {item.recordedBy.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Allergies */}
      {activeTab === 'allergies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Allergy Alert Register</h3>
              <p className="text-xs text-slate-500">
                Critical pharmacological and environmental allergies with severity ratings.
              </p>
            </div>
            {canAddAllergy && (
              <button
                onClick={() => setIsAddAllergyModalOpen(true)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record Allergy Alert
              </button>
            )}
          </div>

          {!patient.allergies || patient.allergies.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Known Allergies (NKA)</p>
              <p className="text-xs text-slate-400">
                No active adverse drug reactions or food allergies documented for this patient.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.allergies.map((allergy) => {
                const isSevere = allergy.severity === 'Severe';
                const isModerate = allergy.severity === 'Moderate';
                return (
                  <div
                    key={allergy._id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSevere
                        ? 'bg-rose-50/70 border-rose-200'
                        : isModerate
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-sky-50/70 border-sky-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isSevere ? (
                          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                        ) : isModerate ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        ) : (
                          <Info className="w-5 h-5 text-sky-600 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900">
                            {allergy.allergen}
                          </h4>
                          <span
                            className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 ${
                              isSevere
                                ? 'bg-rose-600 text-white'
                                : isModerate
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-500 text-white'
                            }`}
                          >
                            {allergy.severity} Risk
                          </span>
                        </div>
                      </div>

                      {isDoctorOrAdmin && (
                        <button
                          onClick={() => handleDeleteAllergy(allergy._id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete Allergy Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {allergy.reaction && (
                      <p className="text-xs text-slate-700 mt-3">
                        <strong>Observed Symptoms / Reaction:</strong> {allergy.reaction}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400 mt-2">
                      Identified on:{' '}
                      {allergy.identifiedDate
                        ? new Date(allergy.identifiedDate).toLocaleDateString()
                        : 'Recorded on file'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Insurance Information */}
      {activeTab === 'insurance' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Health Insurance & Coverage</h3>
            <p className="text-xs text-slate-500">
              Primary healthcare insurance, policy numbers, and copay entitlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Provider / Carrier</span>
              <p className="text-base font-extrabold text-slate-900">
                {patient.insurance?.provider || 'Self-Pay / No Provider'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Policy Number</span>
              <p className="text-base font-mono font-extrabold text-slate-900">
                {patient.insurance?.policyNumber || 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Group Number</span>
              <p className="text-base font-mono font-extrabold text-slate-900">
                {patient.insurance?.groupNumber || 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Policy Expiration Date</span>
              <p className="text-base font-extrabold text-slate-900">
                {patient.insurance?.expiryDate
                  ? new Date(patient.insurance.expiryDate).toLocaleDateString()
                  : 'Open / Not specified'}
              </p>
            </div>
          </div>

          {patient.insurance?.coverageDetails && (
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
              <span className="text-xs font-bold text-sky-800 uppercase">Coverage Notes</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {patient.insurance.coverageDetails}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Emergency Contact */}
      {activeTab === 'emergency' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Emergency Contact Information</h3>
            <p className="text-xs text-slate-500">
              Primary point of contact for clinical emergencies and critical updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Contact Name</span>
              <p className="text-lg font-extrabold text-slate-900">
                {patient.emergencyContact?.name || 'Not provided'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Relationship</span>
              <p className="text-lg font-extrabold text-slate-900">
                {patient.emergencyContact?.relationship || 'Not specified'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Primary Phone</span>
              <p className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-600" />
                {patient.emergencyContact?.phone || 'Not provided'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Alternate Phone</span>
              <p className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                {patient.emergencyContact?.alternatePhone || 'None'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-slate-900">Edit Patient Details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full text-sm p-2 border rounded-xl bg-white"
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marital Status</label>
                  <select
                    value={editForm.maritalStatus}
                    onChange={(e) => setEditForm({ ...editForm, maritalStatus: e.target.value })}
                    className="w-full text-sm p-2 border rounded-xl bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={editForm.occupation}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className="w-full text-sm p-2 border rounded-xl"
                />
              </div>

              {/* Emergency Contact fields */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editForm.emergencyContact?.name || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: { ...editForm.emergencyContact, name: e.target.value },
                      })
                    }
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={editForm.emergencyContact?.relationship || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: { ...editForm.emergencyContact, relationship: e.target.value },
                      })
                    }
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={editForm.emergencyContact?.phone || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: { ...editForm.emergencyContact, phone: e.target.value },
                      })
                    }
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="Alt Phone"
                    value={editForm.emergencyContact?.alternatePhone || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: { ...editForm.emergencyContact, alternatePhone: e.target.value },
                      })
                    }
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Insurance fields */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Insurance</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Provider Name"
                    value={editForm.insurance?.provider || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        insurance: { ...editForm.insurance, provider: e.target.value },
                      })
                    }
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Policy Number"
                    value={editForm.insurance?.policyNumber || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        insurance: { ...editForm.insurance, policyNumber: e.target.value },
                      })
                    }
                    className="w-full text-sm p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medical History Modal */}
      {isAddHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900">Record Medical History</h3>
            <form onSubmit={handleAddHistorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Condition / Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type 2 Diabetes, Appendectomy"
                  value={historyForm.condition}
                  onChange={(e) => setHistoryForm({ ...historyForm, condition: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={historyForm.status}
                    onChange={(e) => setHistoryForm({ ...historyForm, status: e.target.value })}
                    className="w-full text-sm p-2.5 border rounded-xl bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Chronic">Chronic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis Date</label>
                  <input
                    type="date"
                    value={historyForm.diagnosisDate}
                    onChange={(e) => setHistoryForm({ ...historyForm, diagnosisDate: e.target.value })}
                    className="w-full text-sm p-2.5 border rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Medications, triggers, or surgical notes..."
                  value={historyForm.notes}
                  onChange={(e) => setHistoryForm({ ...historyForm, notes: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHistoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Allergy Modal */}
      {isAddAllergyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900">Record Allergy Alert</h3>
            <form onSubmit={handleAddAllergySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allergen Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penicillin, Peanuts, Latex, Sulfa"
                  value={allergyForm.allergen}
                  onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Severity Rating</label>
                <select
                  value={allergyForm.severity}
                  onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-xl bg-white"
                >
                  <option value="Mild">Mild (e.g. minor rash, itching)</option>
                  <option value="Moderate">Moderate (e.g. hives, facial swelling)</option>
                  <option value="Severe">Severe (e.g. anaphylaxis, respiratory distress)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reaction Symptoms</label>
                <textarea
                  rows={2}
                  placeholder="Describe patient's observed physical reaction..."
                  value={allergyForm.reaction}
                  onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAllergyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm"
                >
                  Save Allergy Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default PatientDetail;
