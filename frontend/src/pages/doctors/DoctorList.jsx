import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDoctors, getDepartments } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import AddDoctorModal from '../../components/doctors/AddDoctorModal';
import {
  Search,
  Stethoscope,
  Filter,
  DollarSign,
  Award,
  Calendar,
  Clock,
  Building,
  UserPlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/common/PageContainer';

const DoctorList = () => {
  const { role } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDay, setSelectedDay] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDept && selectedDept !== 'All') params.department = selectedDept;
      if (selectedDay) params.availableDay = selectedDay;

      const [docsData, deptsData] = await Promise.all([
        getDoctors(params),
        getDepartments(),
      ]);

      setDoctors(docsData.doctors);
      setDepartments(deptsData.departments);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      toast.error('Failed to load doctor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [selectedDept, selectedDay]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctorData();
  };

  const handleDoctorAdded = (newDoc) => {
    setDoctors((prev) => [newDoc, ...prev]);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Available
          </span>
        );
      case 'In Consultation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            In Consultation
          </span>
        );
      case 'On Leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            On Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Offline
          </span>
        );
    }
  };

  const isAdmin = role === 'admin';

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 mb-2">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Specialist Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Our Medical Specialists
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse certified clinicians, departments, availability shifts, and consultation schedules.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Onboard New Doctor
          </button>
        )}
      </div>

      {/* Department Quick Filter Carousel / Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hms-scrollbar">
        <button
          onClick={() => setSelectedDept('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
            selectedDept === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Departments
        </button>
        {departments.map((dept) => (
          <button
            key={dept.department}
            onClick={() => setSelectedDept(dept.department)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedDept === dept.department
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{dept.department}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedDept === dept.department
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {dept.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Doctor Name, Specialization (e.g. Cardiologist), or Doctor ID (e.g. DOC-1001)..."
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full text-sm py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Any Available Day</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Filter
          </button>
        </form>

        {(search || selectedDept !== 'All' || selectedDay) && (
          <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
            <span>Filtering active directory</span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedDept('All');
                setSelectedDay('');
              }}
              className="text-emerald-600 hover:underline font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Querying specialist directory...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3 p-8">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Specialists Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No doctors match the selected department or query criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-5"
            >
              {/* Doctor Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-600/20">
                      {doc.user?.name?.replace('Dr. ', '').charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {doc.user?.name}
                      </h3>
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {doc.doctorId || 'DOC-SPECIALIST'}
                      </span>
                    </div>
                  </div>

                  {getStatusBadge(doc.availabilityStatus)}
                </div>

                {/* Specialization & Department */}
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {doc.department}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {doc.specialization}
                  </p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.experienceYears} yrs experience</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>${doc.consultationFee} consultation</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-500 truncate">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{doc.roomNumber || 'Outpatient Clinic'}</span>
                  </div>
                </div>

                {/* Available Days Badges */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Available Days:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {doc.availableDays?.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                      >
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  to={`/doctors/${doc._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all text-center"
                >
                  Profile
                </Link>
                <Link
                  to={`/appointments/book?doctorId=${doc._id}&department=${doc.department}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-all text-center shadow-xs"
                >
                  Book Slot
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDoctorAdded={handleDoctorAdded}
      />
    </PageContainer>
  );
};

export default DoctorList;
