import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getWardBedMatrix, updateBedStatus } from '../../services/ipdService';
import PageContainer from '../../components/common/PageContainer';
import toast from 'react-hot-toast';
import {
  Bed,
  Building,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  User,
  Plus,
  RefreshCw,
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const WARD_TYPES = ['All', 'General', 'Semi-Private', 'Private', 'ICU', 'Emergency'];

const BedOccupancyMatrix = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [matrixData, setMatrixData] = useState({
    stats: {
      totalBeds: 0,
      availableBeds: 0,
      occupiedBeds: 0,
      cleaningBeds: 0,
      maintenanceBeds: 0,
      occupancyRate: 0,
    },
    wardRooms: [],
  });

  const [selectedWardType, setSelectedWardType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [updatingBed, setUpdatingBed] = useState(null);

  const isStaff = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'doctor';

  const fetchMatrix = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWardBedMatrix({
        wardType: selectedWardType !== 'All' ? selectedWardType : undefined,
      });
      setMatrixData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bed occupancy matrix');
    } finally {
      setLoading(false);
    }
  }, [selectedWardType]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const handleStatusChange = async (roomId, bedNumber, newStatus) => {
    const key = `${roomId}-${bedNumber}`;
    try {
      setUpdatingBed(key);
      await updateBedStatus(roomId, bedNumber, newStatus);
      toast.success(`Bed ${bedNumber} marked as ${newStatus}`);
      await fetchMatrix();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bed status');
    } finally {
      setUpdatingBed(null);
    }
  };

  const { stats, wardRooms } = matrixData;

  return (
    <PageContainer>
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-sm mb-1">
            <Building className="w-4 h-4" />
            <span>Inpatient Department (IPD)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hospital Bed Occupancy Matrix
          </h1>
          <p className="text-sm text-slate-500">
            Real-time visual monitoring of bed status, ward capacity, and infection control sanitization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMatrix}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            title="Refresh bed occupancy grid"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/ipd/admissions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition"
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Active Inpatients</span>
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Beds */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Beds</span>
            <Bed className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalBeds}</div>
          <div className="text-xs text-slate-400 mt-1">Across operational wards</div>
        </div>

        {/* Available Beds */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{stats.availableBeds}</div>
          <div className="text-xs text-emerald-600 mt-1">Ready for admission</div>
        </div>

        {/* Occupied Beds */}
        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Occupied</span>
            <User className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800">{stats.occupiedBeds}</div>
          <div className="text-xs text-rose-600 mt-1">Currently admitted</div>
        </div>

        {/* Cleaning Beds */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cleaning</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{stats.cleaningBeds}</div>
          <div className="text-xs text-amber-600 mt-1">Sanitization in progress</div>
        </div>

        {/* Maintenance Beds */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Maintenance</span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.maintenanceBeds}</div>
          <div className="text-xs text-slate-500 mt-1">Out of order</div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-2xl border border-sky-200 shadow-sm">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Occupancy</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-900">{stats.occupancyRate}%</div>
          <div className="w-full bg-sky-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.occupancyRate > 85 ? 'bg-rose-500' : stats.occupancyRate > 60 ? 'bg-amber-500' : 'bg-sky-600'
              }`}
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ward Filter Tabs & Legend */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto hms-scrollbar pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Ward:</span>
          {WARD_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedWardType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedWardType === type
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-600 inline-block" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 border border-rose-600 inline-block" />
            Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-400 border border-amber-500 inline-block" />
            Cleaning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-400 border border-slate-500 inline-block" />
            Maintenance
          </span>
        </div>
      </div>

      {/* Ward Rooms Matrix Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading hospital ward rooms & bed layout...</p>
        </div>
      ) : wardRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Ward Rooms Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            No rooms match the selected ward filter ({selectedWardType}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wardRooms.map((room) => {
            const occupiedCount = room.beds?.filter((b) => b.status === 'Occupied').length || 0;
            const availableCount = room.beds?.filter((b) => b.status === 'Available').length || 0;

            return (
              <div
                key={room._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition hover:shadow-md"
              >
                {/* Ward Room Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{room.roomNumber}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          room.wardType === 'ICU'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : room.wardType === 'Private'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : room.wardType === 'Semi-Private'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {room.wardType}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-600 mt-0.5 line-clamp-1">
                      {room.wardName}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {room.floor} • ₹{room.dailyRate.toLocaleString('en-IN')}/day
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-700">
                      {availableCount}/{room.beds?.length || 0} Beds Free
                    </span>
                    <div className="text-[11px] text-slate-400">
                      {occupiedCount} Occupied
                    </div>
                  </div>
                </div>

                {/* Beds in Room */}
                <div className="p-4 flex-1 space-y-3">
                  {room.beds?.map((bed) => {
                    const isOccupied = bed.status === 'Occupied';
                    const isAvailable = bed.status === 'Available';
                    const isCleaning = bed.status === 'Cleaning';
                    const isMaintenance = bed.status === 'Maintenance';
                    const isUpdating = updatingBed === `${room._id}-${bed.bedNumber}`;

                    return (
                      <div
                        key={bed._id || bed.bedNumber}
                        className={`p-3 rounded-xl border transition ${
                          isOccupied
                            ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                            : isAvailable
                            ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                            : isCleaning
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Bed Info & Status */}
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                isOccupied
                                  ? 'bg-rose-100 text-rose-700'
                                  : isAvailable
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isCleaning
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              <Bed className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900">{bed.bedNumber}</h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isOccupied
                                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                                      : isAvailable
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : isCleaning
                                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-slate-200 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {bed.status}
                                </span>
                              </div>

                              {/* Features tag */}
                              {bed.features && bed.features.length > 0 && (
                                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                  {bed.features.join(' • ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Button */}
                          <div className="shrink-0">
                            {isAvailable && isStaff && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/ipd/admit?wardRoomId=${room._id}&bedNumber=${encodeURIComponent(
                                      bed.bedNumber
                                    )}`
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition"
                              >
                                <Plus className="w-3 h-3" />
                                Admit
                              </button>
                            )}

                            {isCleaning && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(room._id, bed.bedNumber, 'Available')}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                                title="Mark Bed Sanitized and Ready for Admission"
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                Sanitized
                              </button>
                            )}

                            {isMaintenance && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(room._id, bed.bedNumber, 'Available')}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                Restore
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Occupied Inpatient Details Card */}
                        {isOccupied && bed.currentAdmission && (
                          <div className="mt-2.5 pt-2.5 border-t border-rose-200/80 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {bed.currentAdmission.patient?.name || 'Admitted Patient'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 pl-5">
                                {bed.currentAdmission.admissionId} • Dr. {bed.currentAdmission.attendingDoctor?.name || 'On Duty'}
                              </div>
                            </div>

                            <Link
                              to={`/ipd/admissions/${bed.currentAdmission._id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg transition shrink-0"
                            >
                              <span>Chart</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default BedOccupancyMatrix;
