import React, { useState } from 'react';
import { Room, Booking, UserProfile, Building, Floor, EnrichedRoom, RoomAvailabilityStatus } from '../types/campus';
import {
  Search,
  SlidersHorizontal,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  MapPin,
  PlusCircle,
  AlertCircle,
  Radio
} from 'lucide-react';

interface RoomSearchViewProps {
  rooms: EnrichedRoom[];
  currentUser: UserProfile;
  initialBuildingFilter?: string;
  onOpenBookingModal: (preselectedRoomId?: string, prefillDetails?: { date: string; startTime: string; endTime: string }) => void;
  onOpenCampusMap: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const RoomSearchView: React.FC<RoomSearchViewProps> = ({
  rooms,
  currentUser,
  initialBuildingFilter,
  onOpenBookingModal,
  onOpenCampusMap,
  onNavigateTab,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>(initialBuildingFilter || 'All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('10:30');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Handle start time change and ensure end time is later
  const handleStartTimeChange = (newStart: string) => {
    setSelectedStartTime(newStart);
    if (newStart >= selectedEndTime) {
      const [h, m] = newStart.split(':').map(Number);
      const endH = (h + 1) % 24;
      setSelectedEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedBuilding !== 'All' && room.building.toLowerCase() !== selectedBuilding.toLowerCase()) {
      return false;
    }
    if (selectedFloor !== 'All' && room.floor.toLowerCase() !== selectedFloor.toLowerCase()) {
      return false;
    }
    if (selectedType !== 'All' && room.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    if (minCapacity > 0 && room.capacity < minCapacity) {
      return false;
    }
    if (statusFilter !== 'All' && room.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = room.code.toLowerCase().includes(q);
      const matchName = room.name.toLowerCase().includes(q);
      const matchFloor = room.floor.toLowerCase().includes(q);
      const matchBuilding = room.building.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchFloor && !matchBuilding) return false;
    }
    return true;
  });

  const availableCount = filteredRooms.filter((r) => r.status === 'Available').length;
  const bookedCount = filteredRooms.filter((r) => r.status === 'Booked').length;
  const occupiedCount = filteredRooms.filter((r) => r.status === 'Occupied').length;
  const maintenanceCount = filteredRooms.filter((r) => r.status === 'Maintenance').length;

  // Find alternative rooms for an occupied/booked room
  const getSuggestedAlternatives = (targetRoom: EnrichedRoom): EnrichedRoom[] => {
    return rooms
      .filter((r) => {
        if (r.id === targetRoom.id) return false;
        if (r.status !== 'Available') return false;
        if (r.type === 'Office' || r.type === 'Library') return false;
        if (r.capacity < targetRoom.capacity * 0.8) return false;
        return true;
      })
      .sort((a, b) => {
        // Prefer same building first
        const aSameBldg = a.building === targetRoom.building ? 1 : 0;
        const bSameBldg = b.building === targetRoom.building ? 1 : 0;
        if (aSameBldg !== bSameBldg) return bSameBldg - aSameBldg;
        // Then capacity delta
        return Math.abs(a.capacity - targetRoom.capacity) - Math.abs(b.capacity - targetRoom.capacity);
      })
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              <span>Facility Availability & Reservation Engine</span>
              <span>·</span>
              <span className="text-slate-500 font-normal">DDUGU IET & Deeksha Bhawan</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Classroom Availability & Room Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect real-time classroom status (Available, Booked, Occupied) and reserve slots with conflict prevention
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('ai-recommender')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Recommender</span>
              </button>
            )}
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
              [DEMO DATA]
            </span>
            <button
              onClick={onOpenCampusMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Map</span>
            </button>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search room code (e.g. IET17, IET32, LH01, IET-LAB-CSE) or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Primary Multi-Filter Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Building */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Building
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Buildings</option>
              <option value="IET">IET Building</option>
              <option value="Deeksha Bhawan">Deeksha Bhawan (~100m)</option>
            </select>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Floor
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Floors</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="1st Floor">1st Floor</option>
              <option value="2nd Floor">2nd Floor</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Start Time
            </label>
            <select
              value={selectedStartTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="08:00">08:00 AM</option>
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="13:00">01:00 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:00">03:00 PM</option>
              <option value="16:00">04:00 PM</option>
              <option value="17:00">05:00 PM</option>
            </select>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              End Time
            </label>
            <select
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="09:30">09:30 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="12:30">12:30 PM</option>
              <option value="13:30">01:30 PM</option>
              <option value="14:30">02:30 PM</option>
              <option value="15:30">03:30 PM</option>
              <option value="16:30">04:30 PM</option>
              <option value="17:30">05:30 PM</option>
              <option value="18:00">06:00 PM</option>
            </select>
          </div>

          {/* Student Capacity */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Min Students Capacity
            </label>
            <input
              type="number"
              min={0}
              max={250}
              step={10}
              placeholder="e.g. 60"
              value={minCapacity === 0 ? '' : minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Secondary Status Filters & Quick Capacity Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          {/* Status Badges Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              Room Status:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['All', 'Available', 'Booked', 'Occupied'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Capacity Pills */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Quick Seats:</span>
            {[0, 50, 70, 100, 150, 200].map((cap) => (
              <button
                key={cap}
                onClick={() => setMinCapacity(cap)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  minCapacity === cap
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cap === 0 ? 'Any' : `${cap}+`}
              </button>
            ))}
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            Slot: <strong className="text-slate-900">{selectedStartTime} – {selectedEndTime}</strong> ({selectedDate})
          </div>
        </div>
      </div>

      {/* Filter Status Summary & Overflow Recommendation Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-slate-600">
          Showing <span className="font-bold text-slate-900 font-mono">{filteredRooms.length}</span> facilities
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-emerald-700 font-semibold">{availableCount} Available</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-blue-700 font-semibold">{bookedCount} Booked</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-purple-700 font-semibold">{occupiedCount} Occupied Now</span>
          {maintenanceCount > 0 && (
            <>
              <span className="mx-1 text-slate-300">·</span>
              <span className="text-amber-700 font-semibold">{maintenanceCount} Maintenance</span>
            </>
          )}
        </div>

        {selectedBuilding === 'IET' && availableCount < 3 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 font-medium">
            <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>IET rooms are heavily booked! Deeksha Bhawan (~100m) halls are free.</span>
            <button
              onClick={() => setSelectedBuilding('Deeksha Bhawan')}
              className="text-purple-700 font-bold underline hover:text-purple-950 ml-1 cursor-pointer"
            >
              Switch to Deeksha
            </button>
          </div>
        )}
      </div>

      {/* Room Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const isAvailable = room.status === 'Available';
          const isBooked = room.status === 'Booked';
          const isOccupied = room.status === 'Occupied';
          const isMaintenance = room.status === 'Maintenance';

          const suggestedAlts = !isAvailable ? getSuggestedAlternatives(room) : [];

          return (
            <div
              key={room.id}
              className={`bg-white border rounded-xl p-4.5 shadow-xs flex flex-col justify-between transition-all ${
                isMaintenance
                  ? 'border-amber-200 bg-amber-50/20'
                  : isOccupied
                  ? 'border-purple-200 bg-purple-50/20'
                  : isBooked
                  ? 'border-blue-200 bg-blue-50/15'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div>
                {/* Header: Room Code, Type, and Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {room.code}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {room.type}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 line-clamp-1 mt-0.5">
                      {room.name}
                    </div>
                  </div>

                  {/* Explicit Tri-State Status Badge */}
                  <div>
                    {isAvailable && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Available</span>
                      </span>
                    )}

                    {isBooked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Booked</span>
                      </span>
                    )}

                    {isOccupied && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                        <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
                        <span>Occupied Now</span>
                      </span>
                    )}

                    {isMaintenance && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Wrench className="w-3 h-3 text-amber-600" />
                        <span>Maintenance</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Building, Floor, and Capacity Details */}
                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span>Building & Floor:</span>
                    <span className="font-medium text-slate-800">
                      {room.building} · {room.floor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Capacity:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {room.capacity} Students
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Location Proximity:</span>
                    <span className="text-slate-600">
                      {room.building === 'IET' ? 'Core IET Wing' : '~100m from IET (3m walk)'}
                    </span>
                  </div>
                </div>

                {/* Current Active or Scheduled Booking Information */}
                {room.currentBooking && (
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs mb-3 space-y-0.5">
                    <div className="text-[11px] font-semibold text-blue-900 flex items-center justify-between">
                      <span>Reserved by {room.currentBooking.facultyName}</span>
                      <span className="font-mono text-[10px]">
                        {room.currentBooking.startTime} – {room.currentBooking.endTime}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 truncate font-medium">
                      {room.currentBooking.subject}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {room.currentBooking.courseCode} · {room.currentBooking.purpose}
                    </div>
                  </div>
                )}

                {/* Maintenance Details */}
                {isMaintenance && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs mb-3 text-amber-900 text-[11px]">
                    <strong>Maintenance Notice:</strong> {room.maintenanceReason || 'Facility servicing in progress'}
                  </div>
                )}

                {/* Alternative Room Suggestions when room is unavailable */}
                {!isAvailable && suggestedAlts.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 text-xs mb-3 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-purple-900">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Suggested Alternatives (Free in this slot):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedAlts.map((alt) => (
                        <button
                          key={alt.id}
                          onClick={() =>
                            onOpenBookingModal(alt.id, {
                              date: selectedDate,
                              startTime: selectedStartTime,
                              endTime: selectedEndTime,
                            })
                          }
                          className="px-2 py-1 rounded bg-white border border-purple-200 text-purple-800 text-[10px] font-mono font-semibold hover:bg-purple-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{alt.code} ({alt.capacity} seats)</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities Badges */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {room.amenities.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                  {room.amenities.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{room.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100">
                {currentUser.role !== 'student' ? (
                  isAvailable ? (
                    <button
                      onClick={() =>
                        onOpenBookingModal(room.id, {
                          date: selectedDate,
                          startTime: selectedStartTime,
                          endTime: selectedEndTime,
                        })
                      }
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Book for {selectedStartTime} - {selectedEndTime}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        onOpenBookingModal(room.id, {
                          date: selectedDate,
                          startTime: selectedStartTime,
                          endTime: selectedEndTime,
                        })
                      }
                      className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Check Slot / View Alternatives</span>
                    </button>
                  )
                ) : (
                  <div className="text-center text-[11px] text-slate-500 py-1 font-mono">
                    {isAvailable ? 'Free for quiet study' : isOccupied ? 'Lecture in session' : 'Reserved'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No matching classrooms found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Try adjusting your capacity threshold, building selection, or status filters to view other available campus halls.
          </p>
          <button
            onClick={() => {
              setSelectedBuilding('All');
              setSelectedFloor('All');
              setSelectedType('All');
              setMinCapacity(0);
              setStatusFilter('All');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
