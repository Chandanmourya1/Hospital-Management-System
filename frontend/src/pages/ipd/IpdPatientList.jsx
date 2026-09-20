import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllAdmissions } from '../../services/ipdService';
import PageContainer from '../../components/common/PageContainer';
import ResponsiveTable from '../../components/common/ResponsiveTable';
import toast from 'react-hot-toast';
import {
  Building,
  User,
  Bed,
  Stethoscope,
  Activity,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  FileText,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const STATUS_TABS = ['Active Inpatients', 'All Admissions', 'Discharged'];

const STATUS_BADGES = {
  Admitted: 'bg-blue-100 text-blue-800 border-blue-200',
  'Under Treatment': 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse',
  Discharged: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Transferred: 'bg-purple-100 text-purple-800 border-purple-200',
  LAMA: 'bg-rose-100 text-rose-800 border-rose-200',
};

const IpdPatientList = () => {
  const { user } = useAuth();

  const [admissions, setAdmissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTab, setSelectedTab] = useState('Active Inpatients');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isStaff = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'doctor';

  const fetchAdmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
        department: departmentFilter !== 'All' ? departmentFilter : undefined,
      };

      if (selectedTab === 'Active Inpatients') {
        params.status = 'Under Treatment'; // or backend handles Admitted / Under Treatment
      } else if (selectedTab === 'Discharged') {
        params.status = 'Discharged';
      }

      const res = await getAllAdmissions(params);
      let list = res.admissions || [];

      // If 'Active Inpatients' tab selected, filter out Discharged
      if (selectedTab === 'Active Inpatients') {
        list = list.filter((a) => a.status === 'Admitted' || a.status === 'Under Treatment');
      }

      setAdmissions(list);
      setTotalCount(res.total || list.length);
      setTotalPages(res.pages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inpatient admissions');
    } finally {
      setLoading(false);
    }
  }, [page, selectedTab, searchTerm, departmentFilter]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  // Calculate length of stay (days)
  const getLengthOfStay = (admDate, disDate) => {
    const start = new Date(admDate).getTime();
    const end = disDate ? new Date(disDate).getTime() : Date.now();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <PageContainer>
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-sm mb-1">
            <Building className="w-4 h-4" />
            <span>Inpatient Department (IPD)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inpatient Admissions Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Track active inpatients, doctor rounds, nursing care charts, bed assignments, and discharge clearance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ipd/beds"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <Bed className="w-4 h-4 text-sky-600" />
            <span>Bed Occupancy Matrix</span>
          </Link>

          {isStaff && (
            <Link
              to="/ipd/admit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md shadow-sky-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Admit Patient</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto hms-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedTab === tab
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Department filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient Name, IPD ID, Room or Bed..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdmissions}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Admissions Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading inpatient records...</p>
        </div>
      ) : admissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Inpatient Admissions Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm
              ? `No records match "${searchTerm}".`
              : 'There are currently no patients in this category.'}
          </p>
          {isStaff && (
            <Link
              to="/ipd/admit"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Admit New Patient</span>
            </Link>
          )}
        </div>
      ) : (
        <ResponsiveTable showScrollHint>
          <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Admission ID</th>
                  <th className="py-3.5 px-4">Patient Information</th>
                  <th className="py-3.5 px-4">Allocated Bed & Ward</th>
                  <th className="py-3.5 px-4">Attending Doctor</th>
                  <th className="py-3.5 px-4">Admission Date & Stay</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {admissions.map((adm) => {
                  const isDischarged = adm.status === 'Discharged';

                  return (
                    <tr key={adm._id} className="hover:bg-slate-50/70 transition">
                      {/* Admission ID & Type */}
                      <td className="py-4 px-4 align-top">
                        <span className="font-black text-slate-900">{adm.admissionId}</span>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {adm.admissionType}
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900">
                          {adm.patient?.name || 'Unnamed Patient'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {adm.patient?.gender || 'N/A'} • {adm.patientProfile?.bloodGroup || 'Blood: N/A'}
                        </div>
                        <div className="text-xs text-slate-600 italic mt-1 line-clamp-1">
                          "{adm.provisionalDiagnosis}"
                        </div>
                      </td>

                      {/* Bed & Ward */}
                      <td className="py-4 px-4 align-top">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-xs text-slate-800">
                          <Bed className="w-3.5 h-3.5 text-sky-600" />
                          <span>
                            {adm.bedAllocation?.roomNumber} - {adm.bedAllocation?.bedNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {adm.bedAllocation?.wardName}
                        </div>
                      </td>

                      {/* Attending Doctor */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{adm.attendingDoctor?.name || 'Assigned Doctor'}</span>
                        </div>
                        <div className="text-xs text-slate-500 pl-5">{adm.department}</div>
                      </td>

                      {/* Date & Stay */}
                      <td className="py-4 px-4 align-top text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(adm.admissionDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Stay: {getLengthOfStay(adm.admissionDate, adm.dischargeDetails?.dischargeDate)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            STATUS_BADGES[adm.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {adm.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/ipd/admissions/${adm._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 transition shadow-sm"
                          >
                            <span>Clinical Chart</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          {isDischarged && (
                            <Link
                              to={`/ipd/admissions/${adm._id}/discharge-summary`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                              title="Print Discharge Summary Slip"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
    </PageContainer>
  );
};

export default IpdPatientList;
