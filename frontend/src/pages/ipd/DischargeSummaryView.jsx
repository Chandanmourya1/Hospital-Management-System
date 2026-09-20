import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAdmissionById } from '../../services/ipdService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Printer,
  ArrowLeft,
  Building,
  ShieldCheck,
  User,
  Stethoscope,
  Bed,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import PageContainer from '../../components/common/PageContainer';

const DischargeSummaryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmission = async () => {
      try {
        setLoading(true);
        const res = await getAdmissionById(id);
        setAdmission(res.admission);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load discharge summary');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmission();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm max-w-4xl mx-auto">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Generating official discharge summary...</p>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm max-w-4xl mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Inpatient Record Not Found</h3>
        <Link
          to="/ipd/admissions"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white"
        >
          Return to Admissions
        </Link>
      </div>
    );
  }

  const { dischargeDetails, bedAllocation, initialVitals } = admission;
  const billing = dischargeDetails?.billingSummary || {};

  return (
    <PageContainer size="narrow" className="pb-12">
      {/* Non-printable Top Bar */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/ipd/admissions/${id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inpatient Chart</span>
          </Link>
          <span className="hidden sm:inline text-xs text-slate-400">|</span>
          <span className="text-xs font-semibold text-slate-600">
            Official Discharge Slip #{admission.admissionId}
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Discharge Slip</span>
        </button>
      </div>

      {/* Printable Sheet Card */}
      <div className="bg-white border border-slate-300 rounded-3xl p-5 sm:p-8 md:p-12 shadow-lg print:shadow-none print:border-none print:p-0 text-slate-900">
        {/* Hospital Brand Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                MedCare Multi-Speciality Hospital
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                NABH Accredited Tertiary Healthcare & Research Institute
              </p>
              <p className="text-[11px] text-slate-400">
                Healthcare Boulevard, Metro City • Emergency: 108 / (011) 2999-4000
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800">
              Discharge Summary
            </span>
            <div className="text-xs font-black text-slate-900 mt-2">
              IPD ID: {admission.admissionId}
            </div>
            <div className="text-[11px] text-slate-500">
              UHID: {admission.patientProfile?.patientId || 'PAT-DEMO'}
            </div>
          </div>
        </div>

        {/* Patient & Admission Demographics Table */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Patient Name</span>
              <strong className="text-sm font-black text-slate-900">{admission.patient?.name}</strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Age / Gender / Blood</span>
              <strong className="text-slate-800">
                {admission.patient?.gender || 'N/A'} • {admission.patientProfile?.bloodGroup || 'Blood: N/A'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Admission Date</span>
              <strong className="text-slate-800">
                {new Date(admission.admissionDate).toLocaleDateString()}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Discharge Date</span>
              <strong className="text-slate-800">
                {dischargeDetails?.dischargeDate
                  ? new Date(dischargeDetails.dischargeDate).toLocaleDateString()
                  : 'N/A'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Attending Consultant</span>
              <strong className="text-slate-900 font-bold">
                {admission.attendingDoctor?.name || 'Physician In-Charge'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Department</span>
              <strong className="text-slate-800">{admission.department}</strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Ward & Bed</span>
              <strong className="text-slate-800">
                {bedAllocation?.roomNumber} - {bedAllocation?.bedNumber} ({bedAllocation?.wardName})
              </strong>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Discharge Status</span>
              <strong className="text-emerald-700 font-black uppercase">
                {dischargeDetails?.conditionAtDischarge || 'Improved'}
              </strong>
            </div>
          </div>
        </div>

        {/* Clinical Summary Sections */}
        <div className="space-y-4 mb-6 text-xs">
          {/* Final Diagnosis */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Final Clinical Diagnosis
            </h3>
            <p className="text-sm font-black text-slate-900">
              {dischargeDetails?.finalDiagnosis || admission.provisionalDiagnosis}
            </p>
            {admission.provisionalDiagnosis && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                (Provisional at admission: {admission.provisionalDiagnosis})
              </p>
            )}
          </div>

          {/* Chief Complaints & History */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Presenting Complaints & History
            </h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
              {admission.chiefComplaints}
            </p>
          </div>

          {/* Hospital Course */}
          {dischargeDetails?.courseInHospital && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Hospital Course, Investigations & Management
              </h3>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                {dischargeDetails.courseInHospital}
              </p>
            </div>
          )}
        </div>

        {/* Take-Home Medications Table */}
        <div className="mb-6">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Discharge Medications (Rx)
          </h3>
          {dischargeDetails?.dischargeMedications?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Medication Name</th>
                    <th className="py-2.5 px-3">Dosage</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dischargeDetails.dischargeMedications.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2.5 px-3 text-slate-800">{m.dosage}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.frequency}</td>
                      <td className="py-2.5 px-3 text-slate-700">{m.duration}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
              No take-home medications documented.
            </p>
          )}
        </div>

        {/* Advice & Follow-up Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Dietary & Activity Advice
            </h3>
            <p className="text-slate-800 leading-relaxed">
              {dischargeDetails?.dietaryAndActivityAdvice || 'Normal light diet. Avoid strenuous activity.'}
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Follow-up Consultation
            </h3>
            <p className="text-slate-800 font-bold">
              Review Date:{' '}
              {dischargeDetails?.followUpAdvice?.recommendedDate
                ? new Date(dischargeDetails.followUpAdvice.recommendedDate).toLocaleDateString()
                : 'As advised'}
            </p>
            <p className="text-slate-600 mt-1">
              {dischargeDetails?.followUpAdvice?.instructions ||
                'Review in OPD clinic with this summary slip and blood test reports.'}
            </p>
          </div>
        </div>

        {/* Hospital Billing Summary Table */}
        <div className="mb-8 border border-slate-200 rounded-2xl p-5 bg-slate-50/70 text-xs">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">
            Hospital Billing & Bed Charges Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Stay</span>
              <strong className="text-sm font-black text-slate-900">{billing.totalDays || 1} Days</strong>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bed Rate</span>
              <strong className="text-sm font-black text-slate-900">
                ₹{billing.bedChargesPerDay?.toLocaleString('en-IN')}/day
              </strong>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bed Total</span>
              <strong className="text-sm font-black text-slate-900">
                ₹{billing.totalBedCharges?.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Nursing & Treatment</span>
              <strong className="text-sm font-black text-slate-900">
                ₹{billing.treatmentAndNursingCharges?.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-sky-700 block">Total Bill</span>
              <strong className="text-base font-black text-sky-950">
                ₹{billing.totalBillAmount?.toLocaleString('en-IN')}
              </strong>
              <div className="text-[10px] font-bold text-emerald-700 uppercase mt-0.5">
                {billing.paymentStatus || 'Settled'}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures & Hospital Stamp Footer */}
        <div className="border-t-2 border-slate-900 pt-8 mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-700">
          <div>
            <div className="h-12 border-b border-dashed border-slate-400 flex items-end pb-1 font-semibold text-slate-500 italic">
              Verified by Nursing Supervisor
            </div>
            <div className="mt-1 font-bold text-[11px] uppercase text-slate-500">
              Staff Nurse / Nursing In-Charge
            </div>
          </div>

          <div>
            <div className="h-12 border-b border-dashed border-slate-400 flex items-end pb-1 font-semibold text-slate-900 font-mono">
              Dr. {admission.attendingDoctor?.name || 'Consultant'}
            </div>
            <div className="mt-1 font-bold text-[11px] uppercase text-slate-500">
              Attending Consultant Signature
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="h-12 flex items-center justify-start sm:justify-end">
              <div className="border-2 border-sky-800 text-sky-800 font-extrabold text-[10px] uppercase px-3 py-1 rounded-lg inline-block transform -rotate-3">
                MedCare Official Medical Clearance
              </div>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Generated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DischargeSummaryView;
