import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  User,
  ArrowRight,
  Lock,
  MailCheck,
  Database,
  CheckCircle2,
  Award,
  Calendar,
  ChevronRight,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'receptionist':
        return '/receptionist/dashboard';
      case 'pharmacist':
        return '/pharmacy';
      case 'lab_technician':
        return '/lab';
      default:
        return '/patient/dashboard';
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs">
            <Activity className="w-4 h-4 text-sky-600 shrink-0" /> B.Tech Major Project • Hospital Management System
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Next-Generation Healthcare <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
              Management Platform
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            A comprehensive, cloud-ready Hospital Management System powered by the MERN stack. Designed with 4-tier Role-Based Access Control, JWT security, email verification, and intuitive clinical dashboards.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                to={getDashboardPath()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all hover:scale-105 text-center"
              >
                Access {role?.toUpperCase()} Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all hover:scale-105 text-center"
                >
                  Sign In to Hospital Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all hover:border-slate-300 text-center"
                >
                  Patient Self-Registration
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4 Role Gateways */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dedicated Stakeholder Portals
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Seamlessly engineered with Role-Based Access Control (RBAC)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Patient Card */}
          <Link
            to={isAuthenticated ? '/patient/dashboard' : '/register'}
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                Patient Portal
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Self-register, verify email, schedule appointments, view digital prescriptions, and track lab test reports.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-sky-600 flex items-center justify-between group-hover:text-sky-700">
              <span>Open Registration Available</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </Link>

          {/* Doctor Card */}
          <Link
            to="/doctor/dashboard"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">
                Doctor Portal
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Review assigned patient queues, manage consultation time slots, create prescriptions, and access medical history.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center justify-between group-hover:text-emerald-700">
              <span>Admin Provisioned</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </Link>

          {/* Receptionist Card */}
          <Link
            to="/receptionist/dashboard"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                Reception Desk
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                OPD patient check-in, in-person slot bookings, doctor availability coordination, and invoice generation.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-amber-600 flex items-center justify-between group-hover:text-amber-700">
              <span>Front Desk Staff</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            to="/admin/dashboard"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-rose-600 transition-colors">
                Super Admin
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Full hospital governance, doctor and receptionist onboarding, department management, and security logs.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-rose-600 flex items-center justify-between group-hover:text-rose-700">
              <span>Full System Control</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Centre for Clinical Excellence & Patient-Centered Care Showcase */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white relative overflow-hidden py-16 sm:py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8 xl:mx-10 2xl:mx-12 shadow-2xl border border-slate-800">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center space-y-5">
          {/* Accreditation Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200 shadow-sm">
            <Award className="w-4 h-4 text-sky-400" />
            <span>NABH Accredited Tertiary Referral Hospital</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Centre for Clinical Excellence &amp; Patient-Centered Care
          </h2>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">
            Established in 2005, MedCare Multi-Speciality Hospital represents the pinnacle of modern healthcare delivery. We unite world-renowned medical consultants, robotic surgical advancements, and an intelligent digital health information system to heal, protect, and empower human lives.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/appointments/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
            >
              <Calendar className="w-4 h-4" /> Book Consultation
            </Link>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" /> Medical Specialists
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
            >
              <span>Explore Services</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Highlights Section for B.Tech Major Project */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
              Core Technical Architecture
            </span>
            <h2 className="text-3xl font-extrabold mt-2">
              Engineered for Scalability & Security
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center sm:text-left">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">JWT & Cryptography</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                HMAC SHA-256 JWT tokens with 7-day expiration, bcrypt 10-round password salt hashing, and Bearer authorization.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">4-Tier RBAC Guard</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Middleware enforcement protecting sensitive API endpoints against unauthorized horizontal and vertical escalation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center">
                <MailCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">Email & Password Flows</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Secure 24-hr email verification links and 15-minute time-sensitive password reset tokens powered by Nodemailer.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">MongoDB Data Modeling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clean normalized relationships linking Users to specialized Doctor and Patient clinical profile collections.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
