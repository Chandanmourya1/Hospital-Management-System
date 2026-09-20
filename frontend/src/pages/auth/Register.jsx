import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Heart,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'prefer-not-to-say',
    dateOfBirth: '',
    bloodGroup: 'Unknown',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.get('/auth/setup-status');
        if (res.data?.success && !res.data.hasAdmin) {
          setIsInitialSetup(true);
          setFormData((prev) => ({ ...prev, role: 'admin' }));
        }
      } catch (err) {
        // Silently ignore if check fails
      }
    };
    checkSetup();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await register(formData);
    setIsSubmitting(false);

    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin');
        return;
      }
      setRegistrationSuccess({
        email: formData.email,
        verificationToken: result.verificationToken,
        emailPreviewUrl: result.emailPreviewUrl,
      });
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Registration Complete!</h2>
          <p className="text-sm text-slate-600">
            We sent a verification link to{' '}
            <strong className="text-slate-800">{registrationSuccess.email}</strong>.
          </p>

          {/* Quick Dev/Viva direct verification helper */}
          {registrationSuccess.verificationToken && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-left space-y-2">
              <p className="text-xs font-bold text-sky-900 flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" /> Viva / Local Demo Verification Link:
              </p>
              <p className="text-xs text-slate-600">
                In local development or viva presentation, click below to verify instantly without opening an external inbox:
              </p>
              <Link
                to={`/verify-email/${registrationSuccess.verificationToken}`}
                className="block text-center py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Verify Account Now
              </Link>
            </div>
          )}

          {registrationSuccess.emailPreviewUrl && (
            <a
              href={registrationSuccess.emailPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-semibold text-sky-600 hover:underline"
            >
              Open Ethereal Email Preview &rarr;
            </a>
          )}

          <div className="pt-2">
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Go to Patient Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        {isInitialSetup && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-indigo-50 border border-rose-200 text-slate-800 text-xs flex items-start gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 text-sm">System Bootstrap: Initial Administrator Setup</p>
              <p className="text-slate-600 mt-1 leading-relaxed">
                No Administrator account was detected in the database. You are registering the primary <strong>Super Administrator</strong>. Once registered, you will have exclusive access to onboard all hospital doctors, pharmacists, lab technicians, and receptionists.
              </p>
            </div>
          </div>
        )}

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isInitialSetup ? 'Super Admin Registration' : 'Patient Registration'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isInitialSetup
              ? 'Initialize the primary hospital administration authority account'
              : 'Create your patient portal account for doctor appointments and medical records'}
          </p>
        </div>

        <div className="bg-white py-6 sm:py-8 px-4 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Johnathan Smith"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="password"
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Gender, DOB & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full py-2.5 px-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="block w-full py-2.5 px-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-4 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white shadow-md disabled:opacity-60 transition-all cursor-pointer ${
                isInitialSetup
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 shadow-rose-950/20'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
              }`}
            >
              {isSubmitting
                ? 'Configuring Account...'
                : isInitialSetup
                ? 'Register & Initialize Super Admin'
                : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 pt-4 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
