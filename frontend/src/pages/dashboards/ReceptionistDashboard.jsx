import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageContainer from '../../components/common/PageContainer';
import { StatsGrid } from '../../components/common/ResponsiveGrid';
import {
  ClipboardList,
  UserPlus,
  CalendarCheck,
  ShieldCheck,
  Clock,
  Users,
  Activity,
  ArrowRight,
  Ticket,
  Calendar,
  Bed,
  Building,
  Plus,
  Pill,
} from 'lucide-react';

const ReceptionistDashboard = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 sm:mb-4">
              <ClipboardList className="w-4 h-4" /> Front Desk & Patient Reception Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Receptionist'}
            </h1>
            <p className="mt-2 text-amber-200 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Manage patient walk-ins, perform vital signs triage, issue daily OPD queue tokens, coordinate appointments, and register new patients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/opd/register"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all hover:scale-105"
            >
              <Ticket className="w-4 h-4" />
              OPD Walk-in Check-in
            </Link>
            <Link
              to="/opd/queue"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <Clock className="w-4 h-4" />
              Live Clinic Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Front-Desk Quick Operational Cards */}
      <StatsGrid columns={4}>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 5 OPD</h3>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-1">Walk-in Triage Desk</p>
            <p className="text-xs text-slate-500 mt-1">
              Check in walk-in patients, take vitals (BP, HR, BMI), and generate OPD tokens.
            </p>
          </div>
          <Link
            to="/opd/register"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Start Check-in <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue Tracking</h3>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-1">Live Clinic Queue</p>
            <p className="text-xs text-slate-500 mt-1">
              Monitor doctor queues, waiting counts, and in-consultation statuses in real-time.
            </p>
          </div>
          <Link
            to="/opd/queue"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            Monitor Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointments</h3>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-1">Central Booking</p>
            <p className="text-xs text-slate-500 mt-1">
              Schedule, reschedule, or cancel patient appointments across hospital departments.
            </p>
          </div>
          <Link
            to="/appointments"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            Manage Bookings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">EMR Directory</h3>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-1">Patient Registry</p>
            <p className="text-xs text-slate-500 mt-1">
              Search patients, create demographic records, update allergies and insurance info.
            </p>
          </div>
          <Link
            to="/patients"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700"
          >
            Browse Patients <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </StatsGrid>

      {/* Step 6 IPD: Inpatient Care & Bed Management Grid */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>Step 6: Inpatient Department (IPD)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Ward Occupancy, Bed Allocation & Inpatient Care
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live hospital bed matrix, patient admissions intake, room sanitization tracking, and discharge clearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/ipd/admit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Admit Patient</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 font-black">
                <Bed className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Bed Occupancy Matrix</h3>
              <p className="text-xs text-slate-500 mt-1">
                Visual floor-wise grid showing Available, Occupied, and Cleaning beds across wards.
              </p>
            </div>
            <Link
              to="/ipd/beds"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
            >
              Open Bed Matrix <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 font-black">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Active Inpatients Ledger</h3>
              <p className="text-xs text-slate-500 mt-1">
                Directory of currently admitted patients with doctor rounds, nursing care, and transfer logs.
              </p>
            </div>
            <Link
              to="/ipd/admissions"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
            >
              View Inpatients <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 font-black">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">New Inpatient Admission</h3>
              <p className="text-xs text-slate-500 mt-1">
                Walk-in and emergency admission form with real-time bed selection and triage vitals.
              </p>
            </div>
            <Link
              to="/ipd/admit"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
            >
              Intake Admission <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Step 8 Pharmacy: Pharmacy & POS Billing Quick Access */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
              <Pill className="w-4 h-4" />
              <span>Step 8: Central Pharmacy & POS Counter</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Prescription Fulfillment & Walk-in Pharmacy Billing
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Look up patient prescriptions, check unexpired stock availability, and process retail counter receipts.
            </p>
          </div>

          <Link
            to="/pharmacy"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition shrink-0"
          >
            <span>Open Pharmacy Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default ReceptionistDashboard;
