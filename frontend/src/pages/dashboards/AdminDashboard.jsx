import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  ClipboardList,
  Activity,
  CheckCircle,
  Pill,
  FlaskConical,
  UserPlus,
  X,
  Search,
  Lock,
  Mail,
  Phone,
  BadgeCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  Eye,
  EyeOff,
  Trash2,
  Power,
  AlertTriangle,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Staff Management State
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pharmacist',
    phone: '',
    gender: 'male',
    department: 'General Medicine',
    specialization: 'General Physician',
    consultationFee: 500,
  });

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const data = await adminService.getStaffList();
      if (data.success && data.staff) {
        setStaffList(data.staff);
      }
    } catch (err) {
      console.error('Failed to load hospital staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    try {
      setDeletingId(staffId);
      const res = await adminService.removeStaff(staffId);
      if (res.success) {
        toast.success(res.message || 'Staff member removed successfully.');
        setStaffToDelete(null);
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove staff member.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (staffId) => {
    try {
      setTogglingId(staffId);
      const res = await adminService.toggleStaffStatus(staffId);
      if (res.success) {
        toast.success(res.message);
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff status.');
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (defaultRole = 'pharmacist') => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: defaultRole,
      phone: '',
      gender: 'male',
      department: 'General Medicine',
      specialization: 'General Physician',
      consultationFee: 500,
    });
    setFormError('');
    setShowOnboardModal(true);
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email) {
      setFormError('Please enter the full name and email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { ...formData };
      if (!payload.password) {
        payload.password = 'Staff@123';
      }

      const res = await adminService.registerStaff(payload);
      if (res.success) {
        toast.success(res.message || `New ${formData.role} onboarded successfully!`);
        setShowOnboardModal(false);
        fetchStaff();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to onboard staff. Please verify credentials.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRoleFilter === 'all' || member.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Role Badge Helper
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldCheck className="w-3 h-3" /> Administrator
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Stethoscope className="w-3 h-3" /> Doctor
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ClipboardList className="w-3 h-3" /> Receptionist
          </span>
        );
      case 'pharmacist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Pill className="w-3 h-3" /> Pharmacist
          </span>
        );
      case 'lab_technician':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FlaskConical className="w-3 h-3" /> Lab Technician
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  return (
    <PageContainer>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3 sm:mb-4">
              <ShieldCheck className="w-4 h-4" /> System Administrator Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Administrator'}
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Centralized hospital administration, role management, doctor credentials, staff onboarding, and clinical security oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenModal('pharmacist')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-950/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Hospital Staff
            </button>
          </div>
        </div>
      </div>

      {/* RBAC Demonstration Highlights */}
      <StatsGrid columns={4}>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Access</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">Super Admin</p>
          </div>
          <span className="inline-flex items-center text-xs text-emerald-600 font-semibold mt-3">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Unrestricted Access
          </span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctors</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {staffList.filter((s) => s.role === 'doctor').length || 'Active'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-3 block">Physicians & Surgeons</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receptionists</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {staffList.filter((s) => s.role === 'receptionist').length || 'Active'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-3 block">Central Lobby Front Desk</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pharmacy & Lab</h3>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {staffList.filter((s) => s.role === 'pharmacist' || s.role === 'lab_technician').length || 'Active'}
            </p>
          </div>
          <span className="text-xs text-slate-500 mt-3 block">Dispensing & Diagnostics</span>
        </div>
      </StatsGrid>

      {/* Hospital Staff Directory & Provisioning Console */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Hospital Staff Management & Directory
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized clinical personnel (Pharmacists, Lab Techs, Receptionists, Doctors, Admins). Staff accounts are created by Administrators with auto-verification.
            </p>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'pharmacist', label: 'Pharmacists' },
              { id: 'lab_technician', label: 'Lab Technicians' },
              { id: 'receptionist', label: 'Receptionists' },
              { id: 'doctor', label: 'Doctors' },
              { id: 'admin', label: 'Admins' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRoleFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role / Department</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingStaff && staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading hospital staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hospital staff members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                          {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{staff.name}</p>
                          <span className="text-[11px] text-slate-400 capitalize">{staff.gender || 'Staff'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(staff.role)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{staff.email}</td>
                    <td className="py-3 px-4 text-slate-600">{staff.phone || '—'}</td>
                    <td className="py-3 px-4">
                      {staff.isActive === false ? (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          <Power className="w-3 h-3" /> Deactivated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          <BadgeCheck className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {staff._id === user?._id ? (
                        <span className="text-[11px] text-indigo-700 font-semibold px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                          You (Super Admin)
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(staff._id)}
                            disabled={togglingId === staff._id}
                            title={staff.isActive === false ? "Re-activate staff account" : "Deactivate staff account"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              staff.isActive === false
                                ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffToDelete(staff)}
                            title="Remove staff member from hospital system"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPD Operations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600 shrink-0" />
              OPD (Outpatient Department) Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Triage walk-in registration, live doctor queues, consultation desks, and digital prescriptions.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/opd/register"
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors"
            >
              Walk-in Check-in
            </Link>
            <Link
              to="/opd/queue"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              OPD Queue
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100">
            <p className="font-bold text-cyan-900 mb-1">Queue & Token Engine</p>
            <p className="text-slate-600">Daily reset token sequence per doctor with real-time status transitions.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <p className="font-bold text-emerald-900 mb-1">Doctor Consultation Desk</p>
            <p className="text-slate-600">Clinical notes, physical exams, ICD condition tagging, and allergy warnings.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100">
            <p className="font-bold text-purple-900 mb-1">Digital Rx & Follow-up</p>
            <p className="text-slate-600">Printable prescription slips, multi-medication builder, and direct appointment creation.</p>
          </div>
        </div>
      </div>

      {/* Pharmacy Operations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600 shrink-0" />
              Pharmacy & Medicine Inventory Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Batch-wise FEFO inventory, stock procurement purchase orders, OPD prescription dispensing, and retail POS.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/pharmacy"
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Open Pharmacy Console
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100">
            <p className="font-bold text-teal-900 mb-1">Catalog & Batches</p>
            <p className="text-slate-600">Commercial names, generic salt, rack/shelf coordinates, and stock reconciliations.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <p className="font-bold text-emerald-900 mb-1">Procurement Inward</p>
            <p className="text-slate-600">Supplier invoices, multi-batch inward consignment, and atomic stock increment.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="font-bold text-amber-900 mb-1">FEFO Dispensing</p>
            <p className="text-slate-600">First-Expired First-Out auto-allocation, expired batch block, and invoice creation.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <p className="font-bold text-indigo-900 mb-1">POS & Expiry Alerts</p>
            <p className="text-slate-600">Retail counter checkout, NABH printable tax invoices, and low stock reorder sheets.</p>
          </div>
        </div>
      </div>

      {/* Laboratory Diagnostic Operations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600 shrink-0" />
              Laboratory Management & Diagnostic Testing
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagnostic test booking, barcode phlebotomy accessioning, auto-flagging analyzers, critical panic alerts & EMR sync.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/lab"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Open Diagnostic Laboratory
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <p className="font-bold text-indigo-900 mb-1">Master Test Catalog</p>
            <p className="text-slate-600">Hematology, Biochemistry, Serology panels, normal intervals, and panic limits.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100">
            <p className="font-bold text-purple-900 mb-1">Phlebotomy & Barcoding</p>
            <p className="text-slate-600">Sequential SMP barcodes, specimen condition tracking, and queue management.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="font-bold text-amber-900 mb-1">Result Entry & Auto-Flags</p>
            <p className="text-slate-600">Real-time biological evaluation (Normal, Low, High, Critical) with pathologist sign-off.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100">
            <p className="font-bold text-red-900 mb-1">Panic Alerts & EMR Sync</p>
            <p className="text-slate-600">Instant doctor alerts for critical values and auto-sync into patient health records.</p>
          </div>
        </div>
      </div>

      {/* Staff Onboarding Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Onboard Hospital Staff</h3>
                <p className="text-xs text-slate-500">
                  Provision credentials for clinical or administrative personnel.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              {/* Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Staff Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'pharmacist', label: 'Pharmacist', icon: Pill, color: 'text-teal-600 bg-teal-50' },
                    { id: 'lab_technician', label: 'Lab Tech', icon: FlaskConical, color: 'text-indigo-600 bg-indigo-50' },
                    { id: 'receptionist', label: 'Receptionist', icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
                    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50' },
                    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
                  ].map((r) => {
                    const IconComp = r.icon;
                    const isSelected = formData.role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setFormData((prev) => ({ ...prev, role: r.id }))}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 font-bold text-indigo-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${r.color}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Alex Chen, RPh"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. alex.chen@hms.local"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Default: Staff@123"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showStaffPassword ? 'Hide password' : 'Show password'}
                      aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                    >
                      {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Leave blank to use default 'Staff@123'
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Conditional Doctor Fields */}
              {formData.role === 'doctor' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-3">
                  <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" /> Doctor Clinical Profile
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-600 mb-0.5">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="Cardiology, General Medicine..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-0.5">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="General Physician, Surgeon..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-800">Auto-Verified Account:</strong> Staff accounts provisioned by an Administrator are pre-verified and can immediately sign in at <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">/login</code> with these credentials.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Onboard {formData.role}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Remove Hospital Staff Member?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800">{staffToDelete.name}</strong> ({staffToDelete.role}) from the hospital directory? Their access to all clinical and administrative portals will be permanently revoked.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                disabled={deletingId === staffToDelete._id}
                className="w-1/2 py-2.5 px-4 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveStaff(staffToDelete._id)}
                disabled={deletingId === staffToDelete._id}
                className="w-1/2 py-2.5 px-4 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingId === staffToDelete._id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Removal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AdminDashboard;
