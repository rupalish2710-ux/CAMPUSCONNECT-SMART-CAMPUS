import React from 'react';
import { CampusStats, Room, Booking, Announcement, UserProfile, EnrichedRoom } from '../types/campus';
import {
  Building2,
  Users,
  CalendarCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  MapPin,
  CheckCircle2,
  DoorOpen,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface DashboardViewProps {
  stats: CampusStats;
  rooms: EnrichedRoom[];
  todayBookings: Booking[];
  announcements: Announcement[];
  currentUser: UserProfile;
  onNavigateTab: (tab: string, filter?: { building?: string; floor?: string }) => void;
  onOpenBookingModal: (preselectedRoomId?: string) => void;
  onOpenCampusMap: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  rooms,
  todayBookings,
  announcements,
  currentUser,
  onNavigateTab,
  onOpenBookingModal,
  onOpenCampusMap,
}) => {
  // Compute building specific stats
  const ietRooms = rooms.filter((r) => r.building === 'IET');
  const deekshaRooms = rooms.filter((r) => r.building === 'Deeksha Bhawan');

  const ietAvailableCount = ietRooms.filter((r) => !r.isOccupied && !r.isMaintenance).length;
  const deekshaAvailableCount = deekshaRooms.filter((r) => !r.isOccupied && !r.isMaintenance).length;

  // Urgent announcements
  const urgentNotices = announcements.filter((a) => a.priority === 'Urgent' || a.category === 'Room Relocation');

  // Hourly timeline slots (09:00 - 17:00)
  const timeSlots = [
    { label: '09:00 AM', time: '09:00', bookings: todayBookings.filter((b) => b.startTime <= '09:00' && b.endTime > '09:00') },
    { label: '10:30 AM', time: '10:30', bookings: todayBookings.filter((b) => b.startTime <= '10:30' && b.endTime > '10:30') },
    { label: '12:00 PM', time: '12:00', bookings: todayBookings.filter((b) => b.startTime <= '12:00' && b.endTime > '12:00') },
    { label: '01:30 PM', time: '13:30', bookings: todayBookings.filter((b) => b.startTime <= '13:30' && b.endTime > '13:30') },
    { label: '03:00 PM', time: '15:00', bookings: todayBookings.filter((b) => b.startTime <= '15:00' && b.endTime > '15:00') },
    { label: '04:30 PM', time: '16:30', bookings: todayBookings.filter((b) => b.startTime <= '16:30' && b.endTime > '16:30') },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              <span>Campus Facility & Academic Command</span>
              <span>·</span>
              <span className="text-slate-500 font-normal">Gorakhpur, Uttar Pradesh</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {currentUser.designation} — {currentUser.department}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenCampusMap}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Map</span>
            </button>
            <button
              onClick={() => onNavigateTab('ai-recommender')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Recommender</span>
            </button>
            <button
              onClick={() => onNavigateTab('search')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Find Free Room</span>
            </button>
            {currentUser.role !== 'student' && (
              <button
                onClick={() => onOpenBookingModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <span>Instant Room Reservation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Recommender Spotlight Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Feature Highlight</span>
              <span className="text-white/40">·</span>
              <span className="text-xs font-semibold text-white">AI Smart Room Recommender</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Zero-Double-Booking Guarantee</span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Find the perfect classroom for your extra class, exam, or practical by capacity, building proximity, and verified zero conflicts across IET and Deeksha Bhawan.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('ai-recommender')}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <span>Launch AI Recommender</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Urgent Notice Banner (If any Room Relocation or Urgent Notice exists) */}
      {urgentNotices.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>{urgentNotices[0].title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold uppercase">
                  {urgentNotices[0].category}
                </span>
              </div>
              <p className="mt-1 text-slate-700 leading-relaxed">
                {urgentNotices[0].content}
              </p>
              {urgentNotices[0].affectedRoom && urgentNotices[0].newRoom && (
                <div className="mt-2 flex items-center gap-2 font-mono text-xs font-semibold text-slate-900">
                  <span className="line-through text-slate-400">{urgentNotices[0].affectedRoom}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-bold">
                    Relocated to: {urgentNotices[0].newRoom}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigateTab('announcements')}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
            >
              All Notices
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Campus Rooms</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {stats.totalRooms}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span>14 in IET</span>
            <span>·</span>
            <span>12 in Deeksha Bhawan</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Available Right Now</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-700 tabular-nums">
            {stats.availableRoomsNow}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-700 font-medium">Ready for immediate booking</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Occupied in Current Slot</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-blue-700 tabular-nums">
            {stats.occupiedRoomsNow}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Ongoing lectures & lab practicals</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Today's Bookings</span>
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-indigo-700 tabular-nums">
            {stats.todayBookingsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Confirmed official sessions</span>
          </div>
        </div>
      </div>

      {/* Buildings Visual Showcase (IET Building vs Deeksha Bhawan) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Campus Facilities & Building Overview
            </h2>
            <p className="text-xs text-slate-500">
              Select a facility to inspect floor-by-floor room availability and smart overflow routing
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">DDUGU Campus Complex</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* IET Building Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/campus_iet_building_1793954398602.jpg"
                  alt="IET Building Exterior"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Main Engineering Block
                  </div>
                  <div className="text-lg font-bold">
                    Faculty of Engineering & Technology (IET)
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-900 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs">
                  {ietAvailableCount} of {ietRooms.length} Available
                </div>
              </div>

              <div className="p-4.5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  The primary engineering facility housing departmental lecture halls, specialized laboratories, and central administration.
                </p>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-900 w-24 shrink-0">Ground Floor:</span>
                    <span className="text-slate-600 flex-1">
                      Central Library (150 cap), Faculty Cabins, Director & Admin Offices, Placement Cell.
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-900 w-24 shrink-0">1st Floor:</span>
                    <span className="text-slate-600 flex-1">
                      CSE, ME, ECE & IT Labs; Smart Classrooms IET17, IET18, IET19, IET20 (65-70 cap).
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-900 w-24 shrink-0">2nd Floor:</span>
                    <span className="text-slate-600 flex-1">
                      APJ Abdul Kalam Seminar Hall IET32 (approx 200 cap); Classrooms IET24, 25, 28, 29, 30.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Distance: 0m (Core Hub)</span>
              <button
                onClick={() => onNavigateTab('search', { building: 'IET' })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                <span>Browse IET Rooms</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Deeksha Bhawan Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/deeksha_bhawan_hall_1793954398181.jpg"
                  alt="Deeksha Bhawan Lecture Hall"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Academic Overflow Amphitheaters (~100m away)
                  </div>
                  <div className="text-lg font-bold">
                    Deeksha Bhawan (LH01 to LH12)
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-900 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs">
                  {deekshaAvailableCount} of {deekshaRooms.length} Available
                </div>
              </div>

              <div className="p-4.5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dedicated high-capacity tiered lecture halls located just 100 metres from the IET main building. Automatically recommended when IET rooms are occupied.
                </p>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-900 w-24 shrink-0">Halls LH01–04:</span>
                    <span className="text-slate-600 flex-1">
                      Ground Floor tiered amphitheaters (90–120 capacity), equipped with dual projectors.
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-900 w-24 shrink-0">Halls LH05–08:</span>
                    <span className="text-slate-600 flex-1">
                      1st Floor lecture halls (100–120 capacity), central audio amplification and air conditioning.
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-900 w-24 shrink-0">Halls LH09–12:</span>
                    <span className="text-slate-600 flex-1">
                      2nd Floor examination & large elective halls (80–110 capacity). LH12 currently under maintenance.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Distance: ~100m (3-min walk)</span>
              <button
                onClick={() => onNavigateTab('search', { building: 'Deeksha Bhawan' })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                <span>Browse Deeksha Bhawan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Hourly Occupancy Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Today's Schedule & Slot Availability Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Real-time room occupancy and scheduled classes across today's academic windows
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('timetable')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            Full Timetable Grid →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {timeSlots.map((slot) => {
            const hasBooking = slot.bookings.length > 0;
            return (
              <div
                key={slot.time}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  hasBooking
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{slot.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasBooking ? 'bg-blue-600' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {hasBooking ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-blue-900 truncate">
                      {slot.bookings[0].roomCode}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {slot.bookings[0].subject}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {slot.bookings[0].facultyName}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 py-1">
                    <span className="text-[11px] text-emerald-700 font-medium">Slots Available</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Official Bookings & Events Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Today's Scheduled Academic Sessions
            </h2>
            <p className="text-xs text-slate-500">
              Verified classroom reservations and lab sessions for today [DEMO DATA]
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            View All History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Room & Building</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Subject / Course</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4 text-right">Pass Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {todayBookings.length > 0 ? (
                todayBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono text-xs">{bk.roomCode}</div>
                      <div className="text-[11px] text-slate-500">
                        {bk.building} · {bk.floor}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 tabular-nums">
                      {bk.startTime} - {bk.endTime}
                      <span className="text-slate-400 block text-[10px] font-sans">
                        {bk.durationMinutes} mins
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{bk.subject}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{bk.courseCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{bk.facultyName}</div>
                      <div className="text-[11px] text-slate-500">{bk.facultyDept}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {bk.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] font-semibold text-blue-700">
                      {bk.passCode}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No bookings scheduled for today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
