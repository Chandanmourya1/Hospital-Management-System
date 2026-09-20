import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  User,
  LogOut,
  AlertCircle,
  Pill,
  FlaskConical,
  Menu,
  X,
  Calendar,
  Bed,
  FolderHeart,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Building2,
  Award,
  HelpCircle,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isVerified, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu and dropdown whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Super Admin
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            <Stethoscope className="w-3.5 h-3.5 shrink-0" /> Doctor
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            <ClipboardList className="w-3.5 h-3.5 shrink-0" /> Receptionist
          </span>
        );
      case 'pharmacist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
            <Pill className="w-3.5 h-3.5 shrink-0" /> Pharmacist
          </span>
        );
      case 'lab_technician':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
            <FlaskConical className="w-3.5 h-3.5 shrink-0" /> Lab Director
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
            <User className="w-3.5 h-3.5 shrink-0" /> Patient
          </span>
        );
    }
  };

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

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path === '/') return false;
    if (path.startsWith('/ipd') && location.pathname.startsWith('/ipd')) return true;
    if (path.startsWith('/opd') && location.pathname.startsWith('/opd')) return true;
    if (path.startsWith('/emr') && location.pathname.startsWith('/emr')) return true;
    if (path.startsWith('/doctors') && location.pathname.startsWith('/doctors')) return true;
    if (location.pathname.startsWith(path)) return true;
    return false;
  };

  // Roles with >= 6 links use the Clinical & Depts dropdown on desktop for compact layout
  const hasSubmenu = ['admin', 'doctor', 'receptionist'].includes(role);

  // Core navigation items displayed directly in top navbar
  const coreLinks = [
    { name: 'Dashboard', path: getDashboardPath(), icon: Activity, show: isAuthenticated },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      show: isAuthenticated && role !== 'pharmacist' && role !== 'lab_technician',
    },
    {
      name: role === 'patient' ? 'OPD Visits' : 'OPD Queue',
      path: role === 'patient' ? '/opd/history' : '/opd/queue',
      icon: ClipboardList,
      show: isAuthenticated && role !== 'pharmacist' && role !== 'lab_technician',
    },
    {
      name: 'IPD / Wards',
      path: '/ipd/beds',
      icon: Bed,
      show: isAuthenticated && ['admin', 'doctor', 'receptionist'].includes(role),
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: User,
      show: isAuthenticated && ['admin', 'doctor', 'receptionist'].includes(role),
    },
    // Public informative links when not authenticated
    {
      name: 'Services & Facilities',
      path: '/services',
      icon: Building2,
      show: !isAuthenticated,
    },
    {
      name: 'About Us',
      path: '/about',
      icon: Award,
      show: !isAuthenticated,
    },
    {
      name: 'FAQ',
      path: '/faq',
      icon: HelpCircle,
      show: !isAuthenticated,
    },
    // For roles without dropdown, display direct links
    {
      name: 'Doctors',
      path: '/doctors',
      icon: Stethoscope,
      show: !hasSubmenu,
    },
    {
      name: 'EMR Records',
      path: '/emr',
      icon: FolderHeart,
      show: isAuthenticated && !hasSubmenu,
    },
    {
      name: 'Pharmacy',
      path: '/pharmacy',
      icon: Pill,
      show: isAuthenticated && role === 'pharmacist',
    },
    {
      name: 'Laboratory',
      path: '/lab',
      icon: FlaskConical,
      show: isAuthenticated && role === 'lab_technician',
    },
  ];

  // Secondary departmental services grouped into dropdown for admin, doctor, receptionist
  const servicesLinks = hasSubmenu
    ? [
        {
          name: 'EMR Records',
          path: '/emr',
          icon: FolderHeart,
          desc: 'Patient history & clinical summaries',
          show: true,
        },
        {
          name: 'Pharmacy',
          path: '/pharmacy',
          icon: Pill,
          desc: 'Inventory & prescription billing',
          show: true,
        },
        {
          name: 'Laboratory',
          path: '/lab',
          icon: FlaskConical,
          desc: 'Diagnostic orders & panic alerts',
          show: true,
        },
        {
          name: 'Doctors Directory',
          path: '/doctors',
          icon: Stethoscope,
          desc: 'Specialists, schedules & roster',
          show: true,
        },
      ]
    : [];

  const isServicesActive = servicesLinks.some((item) => isActive(item.path));

  // Flattened link list for the mobile drawer
  const allMobileLinks = [
    ...coreLinks.filter((item) => item.show),
    ...servicesLinks.filter((item) => item.show),
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-xs">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Project Title */}
          <Link to="/" className="flex items-center gap-2 group shrink-0 mr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 flex items-center gap-1.5 leading-tight">
                MedCare
                <span className="text-sky-600 font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-100">
                  HMS
                </span>
              </span>
              <span className="hidden 2xl:block text-[11px] font-medium text-slate-400 -mt-0.5">
                Hospital Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {isAuthenticated ? (
              <>
                {/* Core Top-Level Links */}
                {coreLinks
                  .filter((item) => item.show)
                  .map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`text-xs xl:text-sm font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                        isActive(item.path)
                          ? 'text-sky-600 bg-sky-50 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}

                {/* Secondary Clinical & Departments Dropdown (for roles with many links) */}
                {servicesLinks.length > 0 && (
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setServicesOpen(!servicesOpen)}
                      className={`text-xs xl:text-sm font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        isServicesActive
                          ? 'text-sky-600 bg-sky-50 font-bold border border-sky-200/70 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                      }`}
                      aria-expanded={servicesOpen}
                      aria-haspopup="true"
                    >
                      <span>Services</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          servicesOpen ? 'rotate-180 text-sky-600' : 'text-slate-400'
                        }`}
                      />
                      {isServicesActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600 ml-0.5" />
                      )}
                    </button>

                    {servicesOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-2 py-1 mb-1 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Clinical Departments
                          </span>
                        </div>
                        <div className="space-y-1">
                          {servicesLinks.map((item) => {
                            const ItemIcon = item.icon;
                            const active = isActive(item.path);
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setServicesOpen(false)}
                                className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                                  active
                                    ? 'bg-sky-50 text-sky-700 font-bold'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    active
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <ItemIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold leading-tight">{item.name}</p>
                                  {item.desc && (
                                    <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 truncate">
                                      {item.desc}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Role badge */}
                <div className="ml-1 shrink-0">{getRoleBadge(role)}</div>

                {/* Email Verification status flag */}
                {!isVerified && role === 'patient' && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                    <AlertCircle className="w-3 h-3" /> Unverified
                  </span>
                )}

                {/* User info & Logout */}
                <div className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-slate-200 shrink-0 ml-1">
                  <div className="text-right hidden 2xl:block max-w-[130px] truncate">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold hidden xl:inline">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 xl:gap-2">
                <Link
                  to="/services"
                  className={`text-xs xl:text-sm font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive('/services')
                      ? 'text-sky-600 bg-sky-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Services
                </Link>
                <Link
                  to="/about"
                  className={`text-xs xl:text-sm font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive('/about')
                      ? 'text-sky-600 bg-sky-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  About Us
                </Link>
                <Link
                  to="/faq"
                  className={`text-xs xl:text-sm font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive('/faq')
                      ? 'text-sky-600 bg-sky-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  FAQ
                </Link>
                <Link
                  to="/doctors"
                  className={`text-xs xl:text-sm font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive('/doctors')
                      ? 'text-sky-600 bg-sky-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Doctors
                </Link>
                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
                <Link
                  to="/login"
                  className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs xl:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3.5 py-1.5 rounded-lg shadow-sm shadow-sky-600/30 transition-all hover:shadow whitespace-nowrap"
                >
                  Patient Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Right Controls: Role Badge + Hamburger Button (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            {isAuthenticated && (
              <div className="scale-90 origin-right sm:scale-100 shrink-0">
                {getRoleBadge(role)}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 shrink-0"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-start">
          <div className="bg-white w-full max-h-[85vh] overflow-y-auto hms-scrollbar border-b border-slate-200 shadow-2xl p-4 sm:p-6 space-y-5 animate-fade-in">
            {/* User Profile Summary (Mobile) */}
            {isAuthenticated ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-sky-50/50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-slate-900 truncate leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {getRoleBadge(role)}
                      {!isVerified && role === 'patient' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 text-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 text-center text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition"
                >
                  Patient Register
                </Link>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
                Navigation Menu
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {allMobileLinks.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all min-h-[46px] ${
                        active
                          ? 'bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/20'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-50 ${active ? 'text-white' : 'text-slate-400'}`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions / Role Shortcuts */}
            {isAuthenticated && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {role === 'patient' && (
                  <Link
                    to="/appointments/book"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition"
                  >
                    <Calendar className="w-4 h-4" /> Book Consultation
                  </Link>
                )}

                {(role === 'admin' || role === 'receptionist') && (
                  <Link
                    to="/opd/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition"
                  >
                    <PlusCircle className="w-4 h-4" /> OPD Walk-in Check-in
                  </Link>
                )}

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out of Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
