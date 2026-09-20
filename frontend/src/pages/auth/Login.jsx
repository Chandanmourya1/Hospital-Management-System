import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Pill,
  FlaskConical,
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Demo accounts configured in seeder
  const demoAccounts = {
    admin: { email: 'admin@hms.local', pass: 'Admin@123', label: 'Admin' },
    doctor: { email: 'doctor@hms.local', pass: 'Doctor@123', label: 'Doctor' },
    receptionist: { email: 'receptionist@hms.local', pass: 'Receptionist@123', label: 'Receptionist' },
    pharmacist: { email: 'pharmacist@hms.local', pass: 'Pharmacist@123', label: 'Pharmacist' },
    lab_technician: { email: 'labtech@hms.local', pass: 'Labtech@123', label: 'Lab Tech' },
    patient: { email: 'patient@hms.local', pass: 'Patient@123', label: 'Patient' },
  };

  const handleFillDemo = (roleKey) => {
    setSelectedRole(roleKey);
    setEmail(demoAccounts[roleKey].email);
    setPassword(demoAccounts[roleKey].pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const result = await login(email, password, selectedRole);
    setIsSubmitting(false);

    if (result.success) {
      const destination = location.state?.from?.pathname;
      if (destination) {
        navigate(destination);
      } else {
        switch (result.user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'doctor':
            navigate('/doctor/dashboard');
            break;
          case 'receptionist':
            navigate('/receptionist/dashboard');
            break;
          case 'pharmacist':
            navigate('/pharmacy');
            break;
          case 'lab_technician':
            navigate('/lab');
            break;
          default:
            navigate('/patient/dashboard');
            break;
        }
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Hospital Portal
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Secure Role-Based Access for Patients, Medical Staff & Administration
          </p>
        </div>

        {/* Demo Fast-Fill Banner for Viva Presentation */}
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 mb-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Viva / Demo Quick Logins (Click to autofill):</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('patient')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-sky-500 hover:text-white border border-slate-200 transition-all text-slate-700 shadow-2xs text-center"
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('doctor')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-emerald-600 hover:text-white border border-slate-200 transition-all text-slate-700 shadow-2xs text-center"
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('receptionist')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-amber-600 hover:text-white border border-slate-200 transition-all text-slate-700 shadow-2xs text-center"
            >
              Reception
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('pharmacist')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-teal-600 hover:text-white border border-slate-200 transition-all text-slate-700 shadow-2xs text-center"
            >
              Pharmacy
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('lab_technician')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 transition-all text-slate-700 shadow-2xs text-center"
            >
              Lab Tech
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-rose-600 hover:text-white border border-slate-200 transition-all text-slate-700 shadow-2xs text-center"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          {/* Role selector tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Your Portal Role
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'patient'
                    ? 'bg-white text-sky-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 mb-1" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'doctor'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4 mb-1" />
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('receptionist')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'receptionist'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-4 h-4 mb-1" />
                Reception
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('pharmacist')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'pharmacist'
                    ? 'bg-white text-teal-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pill className="w-4 h-4 mb-1" />
                Pharmacy
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('lab_technician')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'lab_technician'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical className="w-4 h-4 mb-1" />
                Lab Tech
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1" />
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-md shadow-sky-600/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Authenticating...' : `Sign in as ${selectedRole.toUpperCase()}`}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 text-center text-sm text-slate-600 pt-4 border-t border-slate-100">
            Are you a new patient?{' '}
            <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
