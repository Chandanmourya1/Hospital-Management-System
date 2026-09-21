import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  ArrowUp,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';

const Footer = () => {
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
      {/* Subtle Ambient Light */}
      <div className="absolute top-0 left-1/3 w-96 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* 1. TOP EMERGENCY BANNER - Clean, human, purposeful */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-semibold text-slate-200">
                24/7 Emergency & Ambulance Helpline:
              </span>
              <a
                href="tel:+9118004567890"
                className="text-rose-400 hover:text-rose-300 font-bold transition-colors"
              >
                +91 1800-456-7890
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/appointments/book"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT - 4 clean, human-designed columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Column 1: Hospital Brand & Contact */}
          <div className="space-y-4">
            <Link to="/" onClick={scrollToTop} className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                MedCare <span className="text-sky-400 font-semibold text-sm">Hospital</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Dedicated to compassionate, modern healthcare. Providing comprehensive medical treatments, advanced diagnostics, and dedicated patient care.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>100 Healthcare Boulevard, Metro City, 400001</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>care@medcarehospital.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>General Enquiries: +91 98765-43210</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links (About Us, Services, Facility Gallery, FAQ) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  to="/about"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  to="/services#gallery"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Hospital Facilities & Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Find a Doctor
                </Link>
              </li>
              <li>
                <Link
                  to="/appointments/book"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Schedule an Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Medical Specialties */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              Specialties
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  to="/doctors?dept=Cardiology"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Cardiology (Heart Care)
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors?dept=Neurology"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Neurology & Brain Health
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors?dept=Orthopedics"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Orthopedics & Joint Care
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors?dept=Pediatrics"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Pediatrics & Child Care
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  onClick={scrollToTop}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  Diagnostics & Pharmacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Hospital Hours & Trust */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Opening Hours
            </h4>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="font-semibold text-slate-200 block mb-1">OPD Clinic Hours</span>
                <p className="text-slate-400">Monday – Saturday</p>
                <p className="text-slate-300 font-medium">08:00 AM – 08:00 PM</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="font-semibold text-rose-400 block mb-1">Emergency & Trauma</span>
                <p className="text-white font-medium">Open 24 Hours / 7 Days</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. BOTTOM BAR - Authentic, human, clean with clearly visible Chandan attribution */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
            
            {/* Left: Copyright */}
            <p className="text-slate-400 text-center sm:text-left">
              &copy; {currentYear} <span className="text-slate-200 font-medium">MedCare Hospital</span>. All rights reserved.
            </p>

            {/* Center: Developer Credit */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0 animate-pulse" />
              <span className="text-slate-300 text-xs sm:text-sm font-medium">
                Developed by <strong className="text-white font-bold tracking-wide">Chandan Mourya</strong>
              </span>
            </div>

            {/* Right: Back to Top */}
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
