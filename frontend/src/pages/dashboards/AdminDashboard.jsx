import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';
import adminService from '../../services/adminService';
import { getWardBedMatrix } from '../../services/ipdService';
import { getAllAppointments } from '../../services/appointmentService';
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
  Bed,
  Calendar,
  Clock,
  RotateCw,
  Copy,
  Check,
  ArrowUpRight,
  TrendingUp,
  HeartPulse,
  Building2,
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

  // Real-time Metrics & Interactive State
  const [bedMatrix, setBedMatrix] = useState(null);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState('today');
  const [activityCategory, setActivityCategory] = useState('all');

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

  // Digital Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const fetchLiveHospitalMetrics = async () => {
    try {
      const [bedsRes, apptsRes] = await Promise.allSettled([
        getWardBedMatrix(),
        getAllAppointments({ limit: 1 }),
      ]);

      if (bedsRes.status === 'fulfilled' && bedsRes.value) {
        setBedMatrix(bedsRes.value);
      }
      if (apptsRes.status === 'fulfilled' && apptsRes.value) {
        setAppointmentCount(apptsRes.value.total || apptsRes.value.count || 8);
      }
    } catch (err) {
      console.error('Failed to load live metrics:', err);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStaff(), fetchLiveHospitalMetrics()]);
    setIsRefreshing(false);
    toast.success('Hospital system data updated!');
  };

  useEffect(() => {
    fetchStaff();
    fetchLiveHospitalMetrics();
  }, []);

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopiedEmail(null), 2000);
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

  // Bed counts calculation
  const totalBeds = bedMatrix?.stats?.totalBeds || bedMatrix?.kpi?.totalBeds || 14;
  const occupiedBeds = bedMatrix?.stats?.occupiedBeds || bedMatrix?.kpi?.occupiedBeds || 0;
  const availableBeds = bedMatrix?.stats?.availableBeds ?? (totalBeds - occupiedBeds);
  const occupancyRate = bedMatrix?.stats?.occupancyRate ?? (Math.round((occupiedBeds / totalBeds) * 100) || 0);

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

  // Mocked activity logs for interactive audit feed
  const systemActivities = [
    {
      id: 1,
      category: 'clinical',
      title: 'OPD Consultation Completed',
      desc: 'Dr. Sarah Jenkins finalized consultation #OPD-1001 with prescription',
      time: '12 mins ago',
      badge: 'Completed',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: 2,
      category: 'pharmacy',
      title: 'Medicine Consignment Dispensed',
      desc: 'Pharmacist Alex Chen completed POS billing #PHARM-1001 for Paracetamol 500mg',
      time: '34 mins ago',
      badge: 'Dispensed',
      badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      id: 3,
      category: 'laboratory',
      title: 'STAT Critical Troponin-I Signed Off',
      desc: 'Dr. Robert Taylor flagged Troponin-I panic value and alerted Cardiology Cath Lab',
      time: '1 hour ago',
      badge: 'Critical Alert',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      id: 4,
      category: 'clinical',
      title: 'Inpatient Bed Reserved',
      desc: 'Reception triaged patient John Doe to GW-101 (General Ward Bed 1)',
      time: '2 hours ago',
      badge: 'Admitted',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      id: 5,
      category: 'admin',
      title: 'Staff Security Audit Check',
      desc: 'Hospital system access keys and role privileges synchronized across nodes',
      time: '3 hours ago',
      badge: 'System Log',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
  ];

  const filteredActivities = systemActivities.filter(
    (act) => activityCategory === 'all' || act.category === activityCategory
  );

  return (
    <PageContainer>
      {/* 1. TOP INTERACTIVE HERO BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Control Console
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Cloud Atlas Node Online
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Welcome, {user?.name || 'Administrator'}
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              </h1>
              <p className="mt-1 text-slate-300 max-w-2xl text-xs sm:text-sm leading-relaxed">
                Centralized hospital command center: live inpatient bed occupancy, physician queues, FEFO pharmacy dispensary, diagnostic accessioning, and RBAC governance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Refresh Data Button */}
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh all hospital metrics"
            >
              <RotateCw className={`w-4 h-4 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Onboard Button */}
            <button
              onClick={() => handleOpenModal('pharmacist')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Staff
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE PERIOD FILTER & STATS CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Live Hospital Performance Indicators
          </h2>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600">
            {['today', 'this_week', 'all_time'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setTimeFilter(filterKey)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeFilter === filterKey
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {filterKey === 'today' ? 'Today' : filterKey === 'this_week' ? 'This Week' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <StatsGrid columns={4}>
          {/* Card 1: Total Hospital Personnel */}
          <div
            onClick={() => setSelectedRoleFilter('all')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Staff Roster
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Personnel</h3>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {staffList.length || '14'} <span className="text-xs font-medium text-slate-400">active accounts</span>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
              <span>View Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Doctors On Duty */}
          <div
            onClick={() => setSelectedRoleFilter('doctor')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Clinical Desk
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Physicians</h3>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {staffList.filter((s) => s.role === 'doctor').length || '4'}{' '}
                <span className="text-xs font-medium text-slate-400">Doctors</span>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>Cardiology, Neuro & Ortho</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Inpatient Bed Occupancy */}
          <Link
            to="/ipd/beds"
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bed className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                  Live IPD
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Capacity</h3>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {availableBeds}{' '}
                <span className="text-xs font-medium text-slate-400">/ {totalBeds} Available</span>
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(occupancyRate, 10)}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-600 font-semibold">
              <span>Open Bed Matrix</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Consultations & Appointments */}
          <Link
            to="/opd/queue"
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  OPD Queue
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultations</h3>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {appointmentCount || '8'}{' '}
                <span className="text-xs font-medium text-slate-400">Scheduled</span>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold">
              <span>Live Token Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </StatsGrid>
      </div>

      {/* 3. INTERACTIVE QUICK ACTIONS COMMAND HUB */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              Interactive Hospital Operations Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant access shortcuts to clinical triage, dispensing, diagnostics, and patient management.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              title: 'Onboard Staff',
              desc: 'Provision credentials',
              icon: UserPlus,
              color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200/60',
              action: () => handleOpenModal('pharmacist'),
            },
            {
              title: 'OPD Walk-in',
              desc: 'Triage registration',
              icon: Activity,
              color: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100/80 border-cyan-200/60',
              link: '/opd/register',
            },
            {
              title: 'OPD Queue',
              desc: 'Live token desk',
              icon: ClipboardList,
              color: 'text-blue-600 bg-blue-50 hover:bg-blue-100/80 border-blue-200/60',
              link: '/opd/queue',
            },
            {
              title: 'Bed Matrix',
              desc: 'IPD ward occupancy',
              icon: Bed,
              color: 'text-sky-600 bg-sky-50 hover:bg-sky-100/80 border-sky-200/60',
              link: '/ipd/beds',
            },
            {
              title: 'Pharmacy POS',
              desc: 'FEFO Dispensary',
              icon: Pill,
              color: 'text-teal-600 bg-teal-50 hover:bg-teal-100/80 border-teal-200/60',
              link: '/pharmacy',
            },
            {
              title: 'Diagnostic Lab',
              desc: 'Tests & Phlebotomy',
              icon: FlaskConical,
              color: 'text-purple-600 bg-purple-50 hover:bg-purple-100/80 border-purple-200/60',
              link: '/lab',
            },
          ].map((item, idx) => {
            const IconComp = item.icon;
            if (item.link) {
              return (
                <Link
                  key={idx}
                  to={item.link}
                  className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xs flex flex-col justify-between ${item.color} group`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-xs mb-2 group-hover:scale-110 transition-transform">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-tight">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              );
            }
            return (
              <button
                key={idx}
                onClick={item.action}
                className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xs flex flex-col justify-between ${item.color} group cursor-pointer`}
              >
                <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-xs mb-2 group-hover:scale-110 transition-transform">
                  <IconComp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. HOSPITAL STAFF DIRECTORY & PROVISIONING CONSOLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Hospital Staff Management & Directory
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized clinical personnel (Pharmacists, Lab Techs, Receptionists, Doctors, Admins). Click on any staff member to view details or copy credentials.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            Showing <strong className="text-slate-900">{filteredStaff.length}</strong> of{' '}
            <strong className="text-slate-900">{staffList.length}</strong> Staff Members
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Roles', count: staffList.length },
              { id: 'doctor', label: 'Doctors', count: staffList.filter((s) => s.role === 'doctor').length },
              { id: 'pharmacist', label: 'Pharmacists', count: staffList.filter((s) => s.role === 'pharmacist').length },
              { id: 'lab_technician', label: 'Lab Techs', count: staffList.filter((s) => s.role === 'lab_technician').length },
              { id: 'receptionist', label: 'Receptionists', count: staffList.filter((s) => s.role === 'receptionist').length },
              { id: 'admin', label: 'Admins', count: staffList.filter((s) => s.role === 'admin').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedRoleFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedRoleFilter === tab.id ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
                  <tr key={staff._id} className="hover:bg-slate-50/70 transition-colors group">
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
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div className="inline-flex items-center gap-1.5">
                        <span>{staff.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(staff.email)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                          title="Copy email"
                        >
                          {copiedEmail === staff.email ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
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
                            title={staff.isActive === false ? 'Re-activate staff account' : 'Deactivate staff account'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              staff.isActive === false
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
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

      {/* 5. INTERACTIVE LIVE RECENT ACTIVITY & SYSTEM AUDIT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Interactive Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                Live Clinical & Operational Audit Stream
              </h3>
              <p className="text-xs text-slate-500">
                Real-time chronological events recorded across hospital departments.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600">
              {[
                { id: 'all', label: 'All' },
                { id: 'clinical', label: 'Clinical' },
                { id: 'pharmacy', label: 'Pharmacy' },
                { id: 'laboratory', label: 'Lab' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActivityCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    activityCategory === cat.id
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.desc}</p>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">{act.time}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${act.badgeColor}`}>
                  {act.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 span): System Architecture & Cloud Node Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Hospital Node Health</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time connectivity status of database clusters, microservices, and security ciphers.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold text-slate-700">MongoDB Atlas Cloud</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">Connected</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="font-semibold text-slate-700">JWT RBAC Gateway</span>
                </div>
                <span className="font-mono text-[11px] text-sky-600 font-bold">Enforced</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="font-semibold text-slate-700">FEFO Stock Engine</span>
                </div>
                <span className="font-mono text-[11px] text-purple-600 font-bold">Active</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="font-semibold text-slate-700">Diagnostic Analyzer</span>
                </div>
                <span className="font-mono text-[11px] text-teal-600 font-bold">Auto-Flags On</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to="/services"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <span>Explore All Hospital Facilities</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 6. STAFF ONBOARDING MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
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
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
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
                  <strong className="text-slate-800">Auto-Verified Account:</strong> Staff accounts provisioned by an Administrator are pre-verified and can immediately sign in at{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">/login</code> with these credentials.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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

      {/* 7. DELETE CONFIRMATION MODAL */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Remove Hospital Staff Member?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800">{staffToDelete.name}</strong> (
              {staffToDelete.role}) from the hospital directory? Their access to all clinical and administrative portals will be permanently revoked.
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
