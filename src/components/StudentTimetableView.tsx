import React, { useState } from 'react';
import { TimetableSlot, UserProfile, Announcement } from '../types/campus';
import {
  CalendarDays,
  Clock,
  Building2,
  GraduationCap,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  MapPin,
  Layers
} from 'lucide-react';

interface StudentTimetableViewProps {
  timetable: TimetableSlot[];
  announcements: Announcement[];
  currentUser: UserProfile;
  onOpenCampusMap: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({
  timetable,
  announcements,
  currentUser,
  onOpenCampusMap,
  onNavigateTab,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<'CSE' | 'ME' | 'ECE' | 'IT'>('CSE');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [selectedDay, setSelectedDay] = useState<string>('All');

  // Filter slots
  const filteredSlots = timetable.filter((slot) => {
    if (slot.branch !== selectedBranch) return false;
    if (slot.semester !== selectedSemester) return false;
    if (selectedDay !== 'All' && slot.day !== selectedDay) return false;
    return true;
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Header with Student Permissions Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
              <span>Academic Curriculum & Lecture Venue Guide</span>
              <span>·</span>
              <span className="text-slate-500 font-normal">DDUGU B.Tech Program</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Departmental Class Schedules & Room Allotments
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified classroom and laboratory assignments for all engineering disciplines
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenCampusMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Map</span>
            </button>
            <button
              onClick={() => onNavigateTab('announcements')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Room Relocation Notices</span>
            </button>
          </div>
        </div>

        {/* Student Policy Notice */}
        <div className="mt-4 p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs flex items-center justify-between text-indigo-900">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>
              <strong>Student Notice:</strong> Timetables and classroom allocations are view-only. Room reservations and slot modifications require verified faculty credentials.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-900 font-semibold uppercase shrink-0">
            View-Only Access
          </span>
        </div>
      </div>

      {/* Filter Selector Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Branch Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Engineering Branch
            </label>
            <div className="flex items-center gap-1.5">
              {(['CSE', 'ME', 'ECE', 'IT'] as const).map((branch) => (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(branch)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBranch === branch
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          {/* Semester Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Academic Semester
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Day of Week
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Weekdays</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Visual Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">
              Timetable: B.Tech {selectedBranch} (Semester {selectedSemester})
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">
              {filteredSlots.length} Scheduled Slots
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">[DEMO DATASET]</span>
        </div>

        {filteredSlots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Day & Time</th>
                  <th className="py-3 px-4">Course & Subject</th>
                  <th className="py-3 px-4">Allocated Room</th>
                  <th className="py-3 px-4">Building & Distance</th>
                  <th className="py-3 px-4">Faculty Instructor</th>
                  <th className="py-3 px-4">Session Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{slot.day}</div>
                      <div className="font-mono text-slate-600 text-[11px] tabular-nums">
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{slot.subject}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{slot.courseCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 inline-block">
                        {slot.roomCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{slot.building}</div>
                      <div className="text-[11px] text-slate-500">
                        {slot.building === 'IET' ? 'Main Building' : '~100m from IET (3m walk)'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{slot.facultyName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          slot.type === 'Lab'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {slot.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">
              No classes scheduled for {selectedBranch} Semester {selectedSemester} on {selectedDay}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Select another branch, semester, or weekday from the filter controls above to view standard departmental schedules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
