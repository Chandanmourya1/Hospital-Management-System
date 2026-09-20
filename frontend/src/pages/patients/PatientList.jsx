import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPatients } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import AddPatientModal from '../../components/patients/AddPatientModal';
import {
  Search,
  UserPlus,
  Filter,
  User,
  Phone,
  Droplet,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/common/PageContainer';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const PatientList = () => {
  const { role } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch patients with search and filters
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
      };
      if (search.trim()) params.search = search.trim();
      if (bloodGroup) params.bloodGroup = bloodGroup;
      if (gender) params.gender = gender;

      const data = await getPatients(params);
      setPatients(data.patients);
      setTotalPages(data.pages);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patient directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, bloodGroup, gender]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handlePatientAdded = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const canAddPatient = role === 'admin' || role === 'receptionist';

  return (
    <PageContainer className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100 mb-2">
            <User className="w-3.5 h-3.5" /> Clinical Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, review clinical histories, allergy alerts, and insurance coverage across all hospital patients.
          </p>
        </div>

        {canAddPatient && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-sky-600/20 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Register New Patient
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Patient ID (e.g. PAT-1001), Phone, or Email..."
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Blood Group Filter */}
          <div className="w-full md:w-44">
            <select
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Blood Groups</option>
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

          {/* Gender Filter */}
          <div className="w-full md:w-40">
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
          <span>
            Showing <strong className="text-slate-800">{patients.length}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> registered patients
          </span>
          {(search || bloodGroup || gender) && (
            <button
              onClick={() => {
                setSearch('');
                setBloodGroup('');
                setGender('');
                setPage(1);
              }}
              className="text-sky-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500">Querying hospital registry...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Patients Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No patient records match the current search query or filter criteria.
            </p>
          </div>
        ) : (
          <ResponsiveTable showScrollHint>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Patient ID</th>
                  <th className="py-3.5 px-6">Patient Name</th>
                  <th className="py-3.5 px-6">Age / Gender</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Emergency Contact</th>
                  <th className="py-3.5 px-6">Insurance</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-xs text-sky-700">
                      <span className="px-2 py-1 rounded-md bg-sky-50 border border-sky-200">
                        {p.patientId || 'PAT-NEW'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{p.user?.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{p.user?.email}</span>
                        {p.user?.phone && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {p.user?.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {calculateAge(p.user?.dateOfBirth)} yrs &bull;{' '}
                      <span className="capitalize">{p.user?.gender || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        <Droplet className="w-3 h-3" /> {p.bloodGroup || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {p.emergencyContact?.name ? (
                        <div>
                          <p className="font-semibold text-slate-800">
                            {p.emergencyContact.name} ({p.emergencyContact.relationship || 'Contact'})
                          </p>
                          <p className="text-slate-400">{p.emergencyContact.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {p.insurance?.provider ? (
                        <div>
                          <p className="font-semibold text-slate-800">{p.insurance.provider}</p>
                          <p className="text-slate-400 font-mono text-[11px]">
                            {p.insurance.policyNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Self-Pay / None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/patients/${p._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white group-hover:bg-sky-600 group-hover:text-white border border-slate-200 group-hover:border-sky-600 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
                      >
                        Profile <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Page <strong className="text-slate-900">{page}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Walk-in Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />
    </PageContainer>
  );
};

export default PatientList;
