import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  User,
  Pill,
  FlaskConical,
  ArrowLeft,
  ArrowRight,
  Lock,
  HelpCircle,
  PhoneCall,
  Key,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import PageContainer from './PageContainer';

const ROLE_CONFIGS = {
  lab_technician: {
    name: 'Lab Technician / Director',
    department: 'Diagnostic Laboratory & Pathology',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    primaryColor: 'indigo',
    gradientClass: 'from-indigo-600 to-purple-700',
    icon: FlaskConical,
    image: '/assets/roles/lab_access_denied.jpg',
    imageAlt: 'Diagnostic Laboratory Secure Terminal',
    watermark: 'LAB DIAGNOSTICS DEPT',
    deniedHeading: 'Laboratory Authorization Boundary',
    deniedMessage:
      'You cannot access this page. This hospital section is restricted. In strict accordance with laboratory compliance and hospital security protocols, your account is configured for diagnostic test execution, specimen accessioning, and critical panic value alerts.',
    dashboardPath: '/lab',
    dashboardLabel: 'Go to Laboratory Workstation',
    workstations: [
      {
        title: 'Diagnostic Lab Desk & Analyzer',
        desc: 'Process test orders, enter specimen findings, validate reagent controls & flag panic values.',
        path: '/lab',
        icon: FlaskConical,
        actionText: 'Open Lab Desk',
        color: 'indigo',
      },
      {
        title: 'EMR Records Portal',
        desc: 'Lookup patient clinical summaries and historical laboratory diagnostic reports.',
        path: '/emr',
        icon: Activity,
        actionText: 'Browse EMR',
        color: 'sky',
      },
      {
        title: 'Medical Staff Directory',
        desc: 'Directly consult ordering physicians and department specialists regarding panic values.',
        path: '/doctors',
        icon: Stethoscope,
        actionText: 'View Staff',
        color: 'emerald',
      },
    ],
  },
  pharmacist: {
    name: 'Hospital Pharmacist',
    department: 'Hospital Pharmacy & Dispensary',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    primaryColor: 'teal',
    gradientClass: 'from-teal-600 to-emerald-700',
    icon: Pill,
    image: '/assets/roles/pharmacy_access_denied.jpg',
    imageAlt: 'Hospital Pharmacy Secure Dispensary',
    watermark: 'PHARMACY DISPENSARY',
    deniedHeading: 'Pharmacy Dispensary Boundary',
    deniedMessage:
      'You cannot access this page. This medical or administrative area is outside your pharmacy dispensing privileges. Your credentials authorize medication stock inventory, prescription verification, and pharmaceutical billing.',
    dashboardPath: '/pharmacy',
    dashboardLabel: 'Go to Pharmacy Dashboard',
    workstations: [
      {
        title: 'Pharmacy Dispensary & Billing',
        desc: 'Dispense prescribed medications, track batch stock levels & generate patient invoices.',
        path: '/pharmacy',
        icon: Pill,
        actionText: 'Open Dispensary',
        color: 'teal',
      },
      {
        title: 'Patient EMR & Prescription Histories',
        desc: 'Verify patient medication allergies, contraindications, and active prescription records.',
        path: '/emr',
        icon: Activity,
        actionText: 'Open EMR Portal',
        color: 'sky',
      },
      {
        title: 'Consulting Physicians',
        desc: 'Coordinate dosage recommendations or alternative brand availability with prescribing doctors.',
        path: '/doctors',
        icon: Stethoscope,
        actionText: 'Doctor Directory',
        color: 'emerald',
      },
    ],
  },
  patient: {
    name: 'Registered Patient',
    department: 'Patient Health & Consultation Portal',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    primaryColor: 'sky',
    gradientClass: 'from-sky-600 to-blue-700',
    icon: User,
    image: '/assets/roles/patient_denied.jpg',
    imageAlt: 'Patient Health Portal & Personal Records',
    watermark: 'PATIENT PORTAL',
    deniedHeading: 'Restricted Hospital Staff Area',
    deniedMessage:
      'You cannot access this page. This section is restricted to hospital medical staff, doctors, and clinical administrators only. As a registered patient, you have complete 24/7 access to your personal appointments, visit history, and health records below.',
    dashboardPath: '/patient/dashboard',
    dashboardLabel: 'Return to My Health Hub',
    workstations: [
      {
        title: 'My Health Snapshot Dashboard',
        desc: 'Track your upcoming appointments, recent vital readings, and active clinical alerts.',
        path: '/patient/dashboard',
        icon: User,
        actionText: 'View My Dashboard',
        color: 'sky',
      },
      {
        title: 'Book a Doctor Consultation',
        desc: 'Schedule an in-clinic consultation or follow-up checkup with medical specialists.',
        path: '/appointments/book',
        icon: Activity,
        actionText: 'Book Appointment',
        color: 'blue',
      },
      {
        title: 'Outpatient Visit History',
        desc: 'Review past visit summaries, doctor advice, and digital prescription receipts.',
        path: '/opd/history',
        icon: ClipboardList,
        actionText: 'View My Visits',
        color: 'indigo',
      },
      {
        title: 'Electronic Medical Records (EMR)',
        desc: 'Access your longitudinal health records, allergy lists, and diagnostic lab reports.',
        path: '/emr',
        icon: Activity,
        actionText: 'Open Medical Record',
        color: 'emerald',
      },
    ],
  },
  doctor: {
    name: 'Medical Doctor / Specialist',
    department: 'Attending Physician & Clinical Medicine',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    primaryColor: 'emerald',
    gradientClass: 'from-emerald-600 to-teal-700',
    icon: Stethoscope,
    image: '/assets/roles/doctor_denied.jpg',
    imageAlt: 'Doctor Consultation & Clinical Suite',
    watermark: 'CLINICAL MEDICAL STAFF',
    deniedHeading: 'Administrative Area Restricted',
    deniedMessage:
      'You cannot access this page. This administrative or financial management section is restricted to hospital administrators and front-desk staff. Your credentials grant you full clinical authority across outpatient, inpatient, and diagnostic facilities.',
    dashboardPath: '/doctor/dashboard',
    dashboardLabel: 'Go to Doctor Clinical Desk',
    workstations: [
      {
        title: 'Doctor Clinical Workspace',
        desc: 'Your scheduled patient appointments, active consultations, and queue status.',
        path: '/doctor/dashboard',
        icon: Stethoscope,
        actionText: 'Doctor Workspace',
        color: 'emerald',
      },
      {
        title: 'Live OPD Queue & Consultation Desk',
        desc: 'Call next patient, examine vitals, record diagnoses, and issue digital prescriptions.',
        path: '/opd/queue',
        icon: ClipboardList,
        actionText: 'Launch OPD Desk',
        color: 'cyan',
      },
      {
        title: 'IPD Inpatient Wards & Beds',
        desc: 'Ward rounds, admission charts, daily progress notes & patient discharge plans.',
        path: '/ipd/beds',
        icon: Activity,
        actionText: 'Manage Inpatients',
        color: 'indigo',
      },
      {
        title: 'Comprehensive EMR Portal',
        desc: 'Access complete longitudinal patient clinical histories, lab reports & allergies.',
        path: '/emr',
        icon: Activity,
        actionText: 'Open EMR System',
        color: 'sky',
      },
    ],
  },
  receptionist: {
    name: 'Hospital Receptionist',
    department: 'Front Office & Patient Intake Desk',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    primaryColor: 'amber',
    gradientClass: 'from-amber-600 to-orange-700',
    icon: ClipboardList,
    image: '/assets/roles/reception_denied.jpg',
    imageAlt: 'Hospital Reception & Patient Intake Desk',
    watermark: 'FRONT OFFICE DESK',
    deniedHeading: 'Clinical / System Boundary',
    deniedMessage:
      'You cannot access this page. Clinical medical diagnosis and system administration are restricted to respective departments. Your credentials give you full operational control over patient intake, scheduling, and bed allocation.',
    dashboardPath: '/receptionist/dashboard',
    dashboardLabel: 'Go to Reception Desk',
    workstations: [
      {
        title: 'Receptionist Control Center',
        desc: 'Daily patient check-ins, appointment counter, and OPD queue token distribution.',
        path: '/receptionist/dashboard',
        icon: ClipboardList,
        actionText: 'Open Desk',
        color: 'amber',
      },
      {
        title: 'Walk-In OPD Registration',
        desc: 'Register incoming walk-in patients and assign real-time consultation tokens.',
        path: '/opd/register',
        icon: Activity,
        actionText: 'Register Patient',
        color: 'orange',
      },
      {
        title: 'Appointment Management',
        desc: 'Schedule, reschedule, or cancel patient bookings with medical specialists.',
        path: '/appointments',
        icon: Activity,
        actionText: 'Manage Bookings',
        color: 'sky',
      },
      {
        title: 'IPD Bed Matrix & Admissions',
        desc: 'Check live hospital bed availability across all wards and admit inpatients.',
        path: '/ipd/beds',
        icon: Activity,
        actionText: 'View Bed Matrix',
        color: 'indigo',
      },
    ],
  },
  admin: {
    name: 'Super Administrator',
    department: 'Hospital Security & System Administration',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    primaryColor: 'rose',
    gradientClass: 'from-rose-600 to-red-700',
    icon: ShieldCheck,
    image: '/assets/roles/security_denied.jpg',
    imageAlt: 'Hospital Cybersecurity & Data Command Center',
    watermark: 'CYBERSECURITY ACTIVE',
    deniedHeading: 'System Security Protocol',
    deniedMessage:
      'You cannot access this page. This resource is currently locked or requires specific operational parameters. As a Super Administrator, you have full privileges across the entire hospital system and security audit logs.',
    dashboardPath: '/admin/dashboard',
    dashboardLabel: 'Go to Admin Control Center',
    workstations: [
      {
        title: 'Master Admin Dashboard',
        desc: 'Hospital system telemetry, clinical statistics, user accounts & audit logs.',
        path: '/admin/dashboard',
        icon: ShieldCheck,
        actionText: 'Admin Center',
        color: 'rose',
      },
      {
        title: 'Patient Directory & Registry',
        desc: 'Comprehensive database of all registered patients in the hospital system.',
        path: '/patients',
        icon: User,
        actionText: 'View Patients',
        color: 'sky',
      },
      {
        title: 'Medical Staff Roster',
        desc: 'Hospital doctors, department assignments, and clinical consult schedules.',
        path: '/doctors',
        icon: Stethoscope,
        actionText: 'Doctors Roster',
        color: 'emerald',
      },
    ],
  },
};

const DEFAULT_CONFIG = {
  name: 'Hospital Guest / Unauthenticated',
  department: 'Secure Healthcare Network Access',
  badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  primaryColor: 'slate',
  gradientClass: 'from-slate-700 to-slate-900',
  icon: ShieldAlert,
  image: '/assets/roles/security_denied.jpg',
  imageAlt: 'Hospital Security Access Control',
  watermark: 'ACCESS RESTRICTED',
  deniedHeading: 'Authentication Required',
  deniedMessage:
    'You cannot access this page. This healthcare resource requires authenticated credentials with appropriate departmental privileges. Please sign in with your hospital account.',
  dashboardPath: '/login',
  dashboardLabel: 'Sign In to Portal',
  workstations: [
    {
      title: 'Sign In to Hospital Portal',
      desc: 'Authenticate with your email and password to access authorized clinical tools.',
      path: '/login',
      icon: Key,
      actionText: 'Sign In',
      color: 'sky',
    },
    {
      title: 'Register as New Patient',
      desc: 'Create an account to book doctor appointments and view medical records.',
      path: '/register',
      icon: User,
      actionText: 'Create Account',
      color: 'blue',
    },
    {
      title: 'Hospital Doctors Directory',
      desc: 'Browse our medical specialists, departments, and qualification profiles.',
      path: '/doctors',
      icon: Stethoscope,
      actionText: 'View Doctors',
      color: 'emerald',
    },
  ],
};

const RoleAccessDenied = ({ attemptedPath: propAttemptedPath, allowedRoles: propAllowedRoles }) => {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract attemptedPath and allowedRoles from props or router location.state
  const attemptedPath = propAttemptedPath || location.state?.attemptedPath || '';
  const allowedRoles = propAllowedRoles || location.state?.allowedRoles || [];

  // Default to user's actual role, or 'lab_technician' for demonstration if none
  const effectiveInitialRole = role || 'lab_technician';
  const [selectedRoleKey, setSelectedRoleKey] = useState(effectiveInitialRole);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const activeConfig = ROLE_CONFIGS[selectedRoleKey] || DEFAULT_CONFIG;
  const RoleIcon = activeConfig.icon;

  const roleTabKeys = [
    { key: 'lab_technician', label: 'Lab Tech', icon: FlaskConical },
    { key: 'pharmacist', label: 'Pharmacist', icon: Pill },
    { key: 'patient', label: 'Patient', icon: User },
    { key: 'doctor', label: 'Doctor', icon: Stethoscope },
    { key: 'receptionist', label: 'Receptionist', icon: ClipboardList },
    { key: 'admin', label: 'Super Admin', icon: ShieldCheck },
  ];

  return (
    <PageContainer size="wide">
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Interactive Role Preview Switcher Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                Interactive Role Access Demonstration
                <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  Live RBAC Preview
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Switch roles below to preview how the Access Denied screen dynamically adapts its design and permitted workstations:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto hms-scrollbar pb-1 md:pb-0 shrink-0">
            {roleTabKeys.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedRoleKey === tab.key;
              const isUserRealRole = role === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedRoleKey(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/20 scale-102'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {isUserRealRole && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title="Your logged-in role" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Hero Card: Split Layout on Desktop */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Content Area (7 Cols on Desktop) */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4 sm:space-y-5">
                {/* Top Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> 403 Forbidden
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${activeConfig.badgeClass}`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>Role: {activeConfig.name}</span>
                  </span>

                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                    <Lock className="w-3 h-3 text-slate-400" /> RBAC Policy Enforced
                  </span>
                </div>

                {/* Primary Heading */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    You Cannot Access This Page
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1">
                    {activeConfig.deniedHeading} • {activeConfig.department}
                  </p>
                </div>

                {/* Descriptive Explanation Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-2">
                  <p className="font-medium">{activeConfig.deniedMessage}</p>
                </div>

                {/* Technical Path & Policy Details (if redirected from ProtectedRoute) */}
                {attemptedPath && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold">Restricted Resource Attempted:</p>
                      <code className="text-[11px] bg-white px-2 py-0.5 rounded border border-amber-200 font-mono text-amber-800 break-all inline-block mt-1">
                        {attemptedPath}
                      </code>
                      {allowedRoles.length > 0 && (
                        <p className="mt-1 text-[11px] text-amber-700">
                          Authorized Roles for this path:{' '}
                          <span className="font-bold uppercase">
                            {allowedRoles.join(', ')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to={activeConfig.dashboardPath}
                  className={`inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r ${activeConfig.gradientClass} text-white font-bold text-sm shadow-lg shadow-sky-600/20 hover:shadow-xl hover:scale-101 transition-all cursor-pointer text-center`}
                >
                  <ArrowLeft className="w-4 h-4" /> {activeConfig.dashboardLabel}
                </Link>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer text-center"
                >
                  Go Back
                </button>

                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" /> Need Access?
                </button>
              </div>
            </div>

            {/* Right Illustration Area (5 Cols on Desktop) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200">
              {/* Background ambient lighting */}
              <div className="absolute inset-0 bg-radial from-sky-500/10 via-transparent to-transparent opacity-60" />

              {/* Image Container with Framing */}
              <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 group">
                <img
                  src={activeConfig.image}
                  alt={activeConfig.imageAlt}
                  className="w-full h-auto object-cover transform group-hover:scale-103 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to security image if custom role image fails to load
                    e.currentTarget.src = '/assets/roles/security_denied.jpg';
                  }}
                />

                {/* Overlaid Role Watermark Pill */}
                <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/15 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-extrabold tracking-wider text-[11px] truncate uppercase">
                      {activeConfig.watermark}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    SECURED
                  </span>
                </div>
              </div>

              {/* Security Compliance Note under image */}
              <div className="relative z-10 mt-4 text-center">
                <p className="text-[11px] font-semibold text-slate-400">
                  MedCare Hospital Operating System • Version 2.5
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Role-Based Security & Confidential Patient Health Records Protection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workstations Section: "What you CAN access with this role" */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Authorized Workstations for {activeConfig.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Here are the modules and departments your current credentials allow you to operate:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeConfig.workstations.map((ws) => {
              const WsIcon = ws.icon;
              return (
                <div
                  key={ws.path}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-600 flex items-center justify-center transition-colors">
                      <WsIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {ws.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        {ws.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <Link
                      to={ws.path}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 group-hover:text-sky-700 group-hover:underline"
                    >
                      <span>{ws.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Support Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-100 to-sky-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-xs">
              <PhoneCall className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Believe your account needs elevated permissions?
              </p>
              <p className="text-[11px] text-slate-500">
                Contact the Hospital IT Security Administrator: Ext. 404 • helpdesk@medcare.local
              </p>
            </div>
          </div>

          <Link
            to="/doctors"
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-colors shrink-0"
          >
            Staff Directory
          </Link>
        </div>
      </div>

      {/* Need Access Help Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Requesting Elevated Access</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hospital policies protect patient health privacy under Role-Based Access Control (RBAC). If your departmental duties require access to this section:
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="font-semibold text-slate-800">Hospital IT Administration Desk:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Internal Hospital Extension: <span className="font-bold text-slate-900">Ext. 404</span></li>
                <li>Direct Email: <span className="font-bold text-slate-900">admin@hms.local</span></li>
                <li>IT Security Operations: <span className="font-bold text-slate-900">Level 2, Block B</span></li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default RoleAccessDenied;
