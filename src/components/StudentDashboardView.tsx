import React, { useState } from 'react';
import { TimetableSlot, UserProfile, Announcement, Room, ScheduleChange, EnrichedRoom } from '../types/campus';
import {
  GraduationCap,
  CalendarDays,
  Clock,
  Building2,
  MapPin,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BellRing,
  Sparkles,
  Info,
  CheckCircle2,
  Search,
  ExternalLink,
  User,
  ShieldCheck,
  ChevronRight,
  Layers,
  X
} from 'lucide-react';

interface StudentDashboardViewProps {
  currentUser: UserProfile;
  timetable: TimetableSlot[];
  announcements: Announcement[];
  scheduleChanges: ScheduleChange[];
  rooms: EnrichedRoom[];
  onOpenCampusMap: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  currentUser,
  timetable,
  announcements,
  scheduleChanges,
  rooms,
  onOpenCampusMap,
  onNavigateTab,
}) => {
  // Student Profile Branch & Year state
  const [selectedBranch, setSelectedBranch] = useState<'CSE' | 'ME' | 'ECE' | 'IT'>(
    currentUser.branch || 'CSE'
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentUser.year || 3);
  const [selectedSemester, setSelectedSemester] = useState<number>(
    currentUser.semester || (selectedYear === 1 ? 1 : selectedYear === 2 ? 3 : selectedYear === 3 ? 5 : 7)
  );
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Classroom Detail Modal state
  const [inspectedRoom, setInspectedRoom] = useState<EnrichedRoom | null>(null);

  // When year changes, update semester
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const defaultSem = year === 1 ? 1 : year === 2 ? 3 : year === 3 ? 5 : 7;
    setSelectedSemester(defaultSem);
  };

  // Filter timetable
  const studentTimetable = timetable.filter(
    (slot) => slot.branch === selectedBranch && slot.semester === selectedSemester
  );

  const daySlots = studentTimetable.filter((slot) => slot.day === selectedDay);

  // Student specific announcements
  const studentAnnouncements = announcements.filter(
    (a) => a.targetAudience === 'All' || a.targetAudience === 'Students'
  );

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Handle inspecting room
  const handleInspectRoomByCode = (roomCode: string) => {
    const found = rooms.find((r) => r.code.toLowerCase() === roomCode.toLowerCase());
    if (found) {
      setInspectedRoom(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Profile & Branch/Year Selector Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Profile Details */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentUser.idNumber || 'STU-2023-CS-042'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Enrollment
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Bachelor of Technology (B.Tech) · Faculty of Engineering & Technology (IET)
              </p>
            </div>
          </div>

          {/* Interactive Branch & Academic Year Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
            {/* Branch Selector */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Branch
              </span>
              <div className="flex items-center gap-1">
                {(['CSE', 'ME', 'ECE', 'IT'] as const).map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      selectedBranch === branch
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Year Selector */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Academic Year
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      selectedYear === year
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Yr {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Semester Selector */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Semester
              </span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value={selectedYear * 2 - 1}>Sem {selectedYear * 2 - 1} (Odd)</option>
                <option value={selectedYear * 2}>Sem {selectedYear * 2} (Even)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Changes & Room Reallocations Hub */}
      {scheduleChanges.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950">
                  Live Classroom Reallocations & Venue Changes
                </h2>
                <p className="text-xs text-amber-800">
                  Verify lecture venues before class to avoid commuting to the wrong building
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold uppercase shrink-0">
              {scheduleChanges.length} Relocations Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scheduleChanges.map((change) => (
              <div
                key={change.id}
                className="bg-white border border-amber-200 rounded-lg p-3.5 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-900">{change.courseCode}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{change.date}</span>
                </div>

                <div className="font-semibold text-slate-900 line-clamp-1">
                  {change.subject}
                </div>

                {/* Before / After Venue Badge */}
                <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between gap-2">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Original</span>
                    <span className="font-mono line-through text-slate-500 text-[11px] font-medium">
                      {change.originalRoom}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="text-right">
                    <span className="text-[10px] text-blue-600 block uppercase font-mono font-bold">New Room</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {change.newRoom}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 leading-snug">
                  <strong>Reason:</strong> {change.reason}
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Slot: {change.timeSlot}</span>
                  <span>{change.facultyName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Timetable Viewport & Day Selector */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Class Timetable: B.Tech {selectedBranch} (Semester {selectedSemester})
            </h2>
            <p className="text-xs text-slate-500">
              Click on any classroom code to inspect facilities, floor level, and directions
            </p>
          </div>

          {/* Weekday Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Classes Table */}
        <div className="overflow-x-auto">
          {daySlots.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Subject & Course</th>
                  <th className="py-3 px-4">Assigned Room</th>
                  <th className="py-3 px-4">Facility & Proximity</th>
                  <th className="py-3 px-4">Faculty In-Charge</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {daySlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 tabular-nums">
                      {slot.startTime} – {slot.endTime}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        {slot.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{slot.subject}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{slot.courseCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleInspectRoomByCode(slot.roomCode)}
                        className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Click to view classroom specifications"
                      >
                        <span>{slot.roomCode}</span>
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{slot.building}</div>
                      <div className="text-[11px] text-slate-500">
                        {slot.building === 'IET' ? 'Main Engineering Block' : '~100m Walk (Deeksha)'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{slot.facultyName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectRoomByCode(slot.roomCode)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                      >
                        Room Info →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">
                No classes scheduled for {selectedDay}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Enjoy your academic rest day or use the free classrooms in IET Library and Deeksha Bhawan for quiet self-study.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Important Announcements for Students */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Official University Circulars for Students
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('announcements')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            All Campus Notices →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {studentAnnouncements.slice(0, 3).map((item) => (
            <div key={item.id} className="p-4.5 hover:bg-slate-50/50 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    item.priority === 'Urgent'
                      ? 'bg-amber-100 text-amber-900'
                      : item.priority === 'Important'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.priority} · {item.category}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Details Drawer / Modal */}
      {inspectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-700">
                  DDUGU Campus Facility Specification
                </div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{inspectedRoom.code}</span>
                  <span className="text-xs font-normal text-slate-500 font-sans">
                    — {inspectedRoom.name}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setInspectedRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Building</span>
                    <strong className="text-slate-900">{inspectedRoom.building}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Floor Level</span>
                    <strong className="text-slate-900">{inspectedRoom.floor}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Student Capacity</span>
                    <strong className="text-slate-900 font-mono text-sm">{inspectedRoom.capacity} Seats</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Facility Type</span>
                    <strong className="text-slate-900">{inspectedRoom.type}</strong>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Installed Amenities & Teaching Equipment:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedRoom.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-900 border border-blue-200 font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-slate-700">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-700" />
                  <span>Walking Directions for Students</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {inspectedRoom.building === 'IET'
                    ? `Located inside the main IET Engineering Block on the ${inspectedRoom.floor}. Use the central staircase or elevator.`
                    : `Located in Deeksha Bhawan (~100m from IET). Walk across the East Porch lawn through the paved student walkway.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setInspectedRoom(null);
                  onOpenCampusMap();
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                View on Campus Map
              </button>
              <button
                onClick={() => setInspectedRoom(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
