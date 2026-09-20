import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Heart,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Calendar,
  ArrowUp,
  Award,
  Sparkles,
  Lock,
  ChevronRight,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const Footer = () => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  const handleLinkClick = () => {
    // Ensure smooth scroll to the top of the page when clicking any footer link
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 relative overflow-hidden print:hidden select-none">
      {/* Ambient Gradient Glows in Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-sky-500/40 to-transparent"></div>

      {/* ========================================================================= */}
      {/* 1. TOP EMERGENCY & RAPID ACTION HERO STRIP */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-800/70 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* 24x7 Emergency Helpline Widget */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-5">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  24/7 Emergency & Trauma Helpline:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+9118004567890"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-white font-mono font-black text-xs sm:text-sm border border-rose-500/30 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  +91 1800-456-7890
                </a>
                <span className="text-xs text-slate-500 hidden sm:inline">•</span>
                <a
                  href="tel:108"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs border border-slate-700 transition-colors"
                >
                  Ambulance: <strong className="text-amber-400">108 / 112</strong>
                </a>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/appointments/book"
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-105"
              >
                <Calendar className="w-4 h-4" />
                Book Consultation
              </Link>
              <Link
                to="/doctors"
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700/80 transition-colors"
              >
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                Find Specialists
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN MULTI-COLUMN CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Column 1: Hospital Brand & Accreditation */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" onClick={handleLinkClick} className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 leading-none">
                  MedCare
                  <span className="text-sky-400 font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                    HMS
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
                  Multi-Speciality Hospital & HMIS
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              NABH-accredited tertiary care hospital delivering world-class clinical excellence, advanced diagnostic medicine, and seamless digitized patient healthcare workflows.
            </p>

            {/* Quality Certifications & Badges */}
            <div className="pt-1 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-emerald-400">
                <Award className="w-3.5 h-3.5 text-emerald-500" /> NABH Accredited
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> NABL Pathology
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-purple-400">
                <Lock className="w-3.5 h-3.5 text-purple-500" /> HIPAA & EHR 2.0
              </span>
            </div>
          </div>

          {/* Column 2: Clinical Care & Departments */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              Clinical Specialties
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/doctors?dept=Cardiology"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Cardiology & Cath Lab
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors?dept=Neurology"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Neurology & Stroke Care
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors?dept=Orthopedics"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Orthopedics & Joint Replacement
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors?dept=Pediatrics"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Pediatrics & Neonatal Care
                </Link>
              </li>
              <li>
                <Link
                  to="/ipd/beds"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Inpatient Wards & ICU Care
                </Link>
              </li>
              <li>
                <Link
                  to="/pharmacy"
                  onClick={handleLinkClick}
                  className="hover:text-teal-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                  24x7 Central Pharmacy
                </Link>
              </li>
              <li>
                <Link
                  to="/lab"
                  onClick={handleLinkClick}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  Clinical Diagnostic Laboratories
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Patient Portal & Services */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Patient & OPD Portals
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/services"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Clinical Services & Specialities
                </Link>
              </li>
              <li>
                <Link
                  to="/services#gallery"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Hospital Facility Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  About MedCare Hospital
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Patient FAQ & Knowledge Base
                </Link>
              </li>
              <li>
                <Link
                  to="/appointments/book"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Book Doctor Consultation
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Browse Medical Specialists
                </Link>
              </li>
              <li>
                <Link
                  to="/opd/queue"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Live OPD Queue & Token Desk
                </Link>
              </li>
              <li>
                <Link
                  to="/emr"
                  onClick={handleLinkClick}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Electronic Medical Records (EMR)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Hospital Administration & Staff Portals */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Staff & Administration
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/doctor/dashboard"
                  onClick={handleLinkClick}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  Physician Consultation Desk
                </Link>
              </li>
              <li>
                <Link
                  to="/receptionist/dashboard"
                  onClick={handleLinkClick}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  Reception & Walk-in Triage
                </Link>
              </li>
              <li>
                <Link
                  to="/pharmacy"
                  onClick={handleLinkClick}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  FEFO Pharmacy Dispensary & POS
                </Link>
              </li>
              <li>
                <Link
                  to="/lab"
                  onClick={handleLinkClick}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  Diagnostic Specimen Accessioning
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/dashboard"
                  onClick={handleLinkClick}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  Admin Executive Command
                </Link>
              </li>
              <li>
                <Link
                  to="/ipd/beds"
                  onClick={handleLinkClick}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  Live Bed Occupancy Matrix
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Operating Hours & Hospital Coordinates */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Hospital Timings
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-300 block">Outpatient Clinics (OPD)</span>
                <p className="text-slate-400 font-mono text-[11px]">Mon – Sat: 08:00 AM – 08:00 PM</p>
                <p className="text-[10px] text-slate-500">Sunday: Specialist On-Call only</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Casualty & Emergency Unit
                </span>
                <p className="text-white font-mono text-[11px] font-bold">24 Hours / 7 Days Active</p>
              </div>
            </div>

            {/* Live System Status Indicator */}
            <div className="pt-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800/90 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold text-slate-200">HMIS Cloud Node Active</p>
                  <p className="text-[10px] text-emerald-400 font-mono">99.99% Uptime • SSL 256-bit</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.5. CENTERED ONE-LINE PUBLIC DIRECTORY STRIP */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-800/80 bg-slate-900/40 py-3.5 px-4 text-center">
        <div className="max-w-[1600px] mx-auto flex items-center justify-center flex-nowrap overflow-x-auto gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-300">
          <Link
            to="/about"
            onClick={handleLinkClick}
            className="hover:text-sky-400 transition-colors whitespace-nowrap"
          >
            About Us
          </Link>
          <span className="text-slate-600 select-none">•</span>
          <Link
            to="/services"
            onClick={handleLinkClick}
            className="hover:text-sky-400 transition-colors whitespace-nowrap"
          >
            Services
          </Link>
          <span className="text-slate-600 select-none">•</span>
          <Link
            to="/services#gallery"
            onClick={handleLinkClick}
            className="hover:text-sky-400 transition-colors whitespace-nowrap"
          >
            Facility Gallery
          </Link>
          <span className="text-slate-600 select-none">•</span>
          <Link
            to="/faq"
            onClick={handleLinkClick}
            className="hover:text-sky-400 transition-colors whitespace-nowrap"
          >
            FAQ
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM INTELLECTUAL PROPERTY & TECH STACK BAR */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-800/90 bg-slate-950/80 py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            {/* Copyright & Hospital Details */}
            <div className="text-center md:text-left space-y-1">
              <p className="text-slate-400">
                &copy; {currentYear} <strong className="text-slate-200 font-bold">MedCare Multi-Speciality Hospital & HMIS</strong>. All clinical rights reserved.
              </p>
              <p className="text-[11px] text-slate-500 flex flex-wrap items-center justify-center md:justify-start gap-2 pt-0.5">
                <span>100 Healthcare Boulevard, Metro City</span>
                <span>•</span>
                <span>Helpline: <strong className="text-slate-400">+91 1800-456-7890</strong></span>
                <span>•</span>
                <span>opd@medcare.org</span>
              </p>
            </div>

            {/* Tech Stack & Academic Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                MERN Stack
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                JWT &bull; RBAC
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                REST API v1
              </span>
              
              {/* Back to top button */}
              <button
                onClick={scrollToTop}
                title="Scroll back to top"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-800 hover:border-sky-500 text-xs font-semibold transition-all duration-200 ml-2 group cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                Back to Top
              </button>
            </div>
          </div>

          {/* Dedicated Centered Developer Credit */}
          <div className="pt-3.5 border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-300 inline-flex items-center justify-center gap-1.5 font-medium">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0 animate-pulse" />
              <span>
                Developed by <strong className="text-white font-bold tracking-wide">Chandan Mourya</strong>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
