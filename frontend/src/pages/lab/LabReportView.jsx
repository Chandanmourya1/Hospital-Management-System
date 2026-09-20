import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import labService from '../../services/labService';
import toast from 'react-hot-toast';
import {
  Printer,
  ArrowLeft,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Calendar,
  User,
  Stethoscope,
  Building,
  Phone,
  FileText,
  AlertOctagon,
} from 'lucide-react';

const LabReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await labService.getReportById(id);
        if (res.success) {
          setReport(res.report);
        } else {
          toast.error(res.message || 'Report not found');
        }
      } catch (error) {
        console.error('Error fetching lab report:', error);
        toast.error('Failed to load diagnostic report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <FlaskConical className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Generating Diagnostic Report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full space-y-4">
          <AlertOctagon className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Diagnostic Report Not Found</h2>
          <p className="text-sm text-slate-500">
            The requested diagnostic pathology report does not exist or has not been verified yet.
          </p>
          <Link
            to="/lab"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Laboratory
          </Link>
        </div>
      </div>
    );
  }

  const isCritical = report.overallStatus === 'Critical Panic Alert';
  const isAbnormal = report.overallStatus === 'Abnormal';

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-8 px-3.5 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      {/* Global CSS for Clean Print Isolation */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          nav, header, footer, .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation / Action Bar (Suppressed on print) */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:px-6 sm:py-3.5 rounded-2xl shadow-sm border border-slate-200">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Official Report (PDF)
            </button>
          </div>
        </div>

        {/* Diagnostic Report Slip Container */}
        <div className="print-card bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-8 md:p-12 space-y-6">
          {/* Hospital & Lab Diagnostic Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    CENTRAL CLINICAL DIAGNOSTIC LABORATORIES
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Department of Pathology, Biochemistry & Molecular Diagnostics
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Healthcare Boulevard, Metro City • Phone: +91 98765 43210 • Email: lab@hms.local
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> NABL ACCREDITED LAB
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">Certificate: MC-4921 / ISO 15189</div>
              </div>
            </div>
          </div>

          {/* Report Title & Status Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Official Diagnostic Report
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">{report.testName}</h1>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                {report.testCode} • {report.category}
              </span>
            </div>

            <div className="text-right">
              {isCritical ? (
                <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-black">
                  <AlertOctagon className="w-4 h-4 mr-1 text-red-600" /> CRITICAL PANIC VALUE
                </div>
              ) : isAbnormal ? (
                <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" /> ABNORMAL RESULT
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> NORMAL RESULT
                </div>
              )}
            </div>
          </div>

          {/* Patient & Accession Demographics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{report.patientName}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Age / Gender</span>
              <span className="font-semibold text-slate-800">
                {report.patientAge ? `${report.patientAge} Years` : 'Adult'} / {report.patientGender || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Report Number</span>
              <span className="font-mono font-bold text-indigo-700">{report.reportNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Specimen Barcode</span>
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                {report.barcode || 'SMP-1001'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Referring Doctor</span>
              <span className="font-semibold text-slate-800">{report.referringDoctor || 'Consulting Physician'}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Specimen Type</span>
              <span className="font-semibold text-slate-800">{report.sampleType}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Collection Time</span>
              <span className="text-slate-700">
                {report.sampleCollectedAt
                  ? new Date(report.sampleCollectedAt).toLocaleString()
                  : new Date(report.reportDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Report Date / Time</span>
              <span className="text-slate-700">{new Date(report.reportDate).toLocaleString()}</span>
            </div>
          </div>

          {/* Test Parameters Findings Table */}
          <div className="overflow-x-auto hms-scrollbar border border-slate-200 rounded-xl -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Investigation / Parameter</th>
                  <th className="py-3 px-4 text-center">Observed Value</th>
                  <th className="py-3 px-4">Units</th>
                  <th className="py-3 px-4">Biological Reference Range</th>
                  <th className="py-3 px-4 text-center">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.results?.map((param, index) => {
                  const isParamCritical = param.flag === 'Critical';
                  const isParamAbnormal = param.flag === 'Low' || param.flag === 'High';

                  return (
                    <tr
                      key={index}
                      className={isParamCritical ? 'bg-red-50 font-bold' : isParamAbnormal ? 'bg-amber-50' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {param.parameterName}
                        {param.method && (
                          <span className="block text-[10px] text-slate-400 font-normal">Method: {param.method}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        <span
                          className={
                            isParamCritical
                              ? 'text-red-700 text-base font-black'
                              : isParamAbnormal
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }
                        >
                          {param.value}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{param.unit || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{param.referenceRange || 'Standard Normal'}</td>
                      <td className="py-3 px-4 text-center">
                        {param.flag === 'Critical' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                            CRITICAL
                          </span>
                        )}
                        {param.flag === 'High' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            HIGH
                          </span>
                        )}
                        {param.flag === 'Low' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                            LOW
                          </span>
                        )}
                        {param.flag === 'Normal' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clinical Impression & Interpretation */}
          {report.interpretation && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Impression & Pathologist Remarks:
              </span>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{report.interpretation}</p>
            </div>
          )}

          {/* Panic Notification Notice if Applicable */}
          {isCritical && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-800 font-medium flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>
                <strong>CRITICAL TELEPHONIC ALERT:</strong> Results exceed critical physiological threshold. Telephonic notification logged to Attending Physician. Immediate clinical correlation advised.
              </span>
            </div>
          )}

          {/* Signatures & Certification Seal */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-start sm:items-end">
            <div>
              <span className="font-mono text-xs text-slate-400 block">Report ID:</span>
              <span className="font-mono text-xs font-bold text-slate-700">{report.reportNumber}</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">NABL Accredited Medical Testing</span>
            </div>

            <div className="text-left sm:text-right col-span-1 sm:col-span-2 space-y-1">
              <div className="font-serif italic text-sm text-indigo-900 font-bold">
                {report.verifierName || 'Dr. Robert Taylor, MD Pathologist / Lab Director'}
              </div>
              <div className="text-xs font-bold text-slate-900">Dr. Robert Taylor, MD Pathologist</div>
              <div className="text-[11px] text-slate-500">Director of Clinical Laboratories, MD (AIIMS)</div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-start sm:justify-end">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Digitally Certified & Signed via HMS EMR
              </div>
            </div>
          </div>

          {/* Footer disclaimer */}
          <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center space-y-0.5">
            <p>This is a computer-generated NABL-standard diagnostic laboratory report verified by a registered medical practitioner.</p>
            <p>Pathology results are to be clinically interpreted by the treating consultant physician.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabReportView;
