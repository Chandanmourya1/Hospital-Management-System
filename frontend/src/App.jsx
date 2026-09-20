import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { ScrollToTop } from './components/common';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import About from './pages/public/About';
import Faq from './pages/public/Faq';
import Services from './pages/public/Services';

// Protected Role Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import ReceptionistDashboard from './pages/dashboards/ReceptionistDashboard';
import PatientDashboard from './pages/dashboards/PatientDashboard';

// Patient Management Pages
import PatientList from './pages/patients/PatientList';
import PatientDetail from './pages/patients/PatientDetail';

// Doctor Management Pages
import DoctorList from './pages/doctors/DoctorList';
import DoctorDetail from './pages/doctors/DoctorDetail';

// Appointment Management Pages
import AppointmentList from './pages/appointments/AppointmentList';
import BookAppointment from './pages/appointments/BookAppointment';

// OPD (Outpatient Department) Pages
import OpdRegistration from './pages/opd/OpdRegistration';
import OpdQueue from './pages/opd/OpdQueue';
import OpdConsultationDesk from './pages/opd/OpdConsultationDesk';
import PrescriptionView from './pages/opd/PrescriptionView';
import PatientVisitHistory from './pages/opd/PatientVisitHistory';

// IPD (Inpatient Department) Pages
import BedOccupancyMatrix from './pages/ipd/BedOccupancyMatrix';
import IpdAdmissionForm from './pages/ipd/IpdAdmissionForm';
import IpdPatientList from './pages/ipd/IpdPatientList';
import IpdPatientDetail from './pages/ipd/IpdPatientDetail';
import DischargeSummaryView from './pages/ipd/DischargeSummaryView';

// EMR (Electronic Medical Records) Pages
import EmrPortal from './pages/emr/EmrPortal';

// Pharmacy Management Pages
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import PharmacyInvoiceView from './pages/pharmacy/PharmacyInvoiceView';

// Laboratory Management Pages
import LabDashboard from './pages/lab/LabDashboard';
import LabReportView from './pages/lab/LabReportView';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#0f172a',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500',
              },
            }}
          />

          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Doctor Directory & Public Profiles */}
              <Route path="/doctors" element={<DoctorList />} />
              <Route path="/doctors/:id" element={<DoctorDetail />} />

              {/* Public Informational, Knowledge & Facility Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/services" element={<Services />} />
              <Route path="/gallery" element={<Services />} />

              {/* Protected Role-Based Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/receptionist/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                    <ReceptionistDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'admin']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Patient Management Routes */}
              <Route
                path="/patients"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                    <PatientList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patients/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <PatientDetail />
                  </ProtectedRoute>
                }
              />

              {/* Appointment Management Routes */}
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <AppointmentList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments/book"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist', 'patient']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />

              {/* OPD (Outpatient Department) Routes */}
              <Route
                path="/opd/register"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <OpdRegistration />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/opd/queue"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                    <OpdQueue />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/opd/consultation/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                    <OpdConsultationDesk />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/opd/prescription/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <PrescriptionView />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/opd/history"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <PatientVisitHistory />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/opd/history/:patientId"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <PatientVisitHistory />
                  </ProtectedRoute>
                }
              />

              {/* IPD (Inpatient Department) Routes */}
              <Route
                path="/ipd/beds"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                    <BedOccupancyMatrix />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ipd/admissions"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                    <IpdPatientList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ipd/admit"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                    <IpdAdmissionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ipd/admissions/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <IpdPatientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ipd/admissions/:id/discharge-summary"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <DischargeSummaryView />
                  </ProtectedRoute>
                }
              />

              {/* EMR (Electronic Medical Records) Routes */}
              <Route
                path="/emr"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <EmrPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emr/:patientId"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                    <EmrPortal />
                  </ProtectedRoute>
                }
              />

              {/* Pharmacy Management Routes */}
              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'pharmacist', 'doctor', 'receptionist']}>
                    <PharmacyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/invoices/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'pharmacist', 'doctor', 'receptionist', 'patient']}>
                    <PharmacyInvoiceView />
                  </ProtectedRoute>
                }
              />

              {/* Laboratory Management Routes */}
              <Route
                path="/lab"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician', 'doctor', 'receptionist']}>
                    <LabDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/reports/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician', 'doctor', 'receptionist', 'patient']}>
                    <LabReportView />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Modern Rich Healthcare Footer */}
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
