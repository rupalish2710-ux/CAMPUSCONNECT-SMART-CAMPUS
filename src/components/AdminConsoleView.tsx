import React, { useState } from 'react';
import { Room, Booking, Announcement, CampusStats, UserProfile, Building, Floor, RoomType, EnrichedRoom } from '../types/campus';
import { campusApi } from '../services/api';
import {
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Trash2,
  RotateCcw,
  Sliders,
  Power,
  Layers,
  Sparkles,
  PlusCircle,
  XCircle,
  Clock,
  Check,
  X,
  Search,
  BellRing,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  FileText
} from 'lucide-react';

interface AdminConsoleViewProps {
  rooms: EnrichedRoom[];
  bookings: Booking[];
  announcements: Announcement[];
  stats: CampusStats;
  currentUser: UserProfile;
  onRefresh: () => void;
  onResetDemo: () => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  rooms,
  bookings,
  announcements,
  stats,
  currentUser,
  onRefresh,
  onResetDemo,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'rooms' | 'approvals' | 'bookings' | 'announcements' | 'stats'>('approvals');
  const [selectedBuildingTab, setSelectedBuildingTab] = useState<'All' | 'IET' | 'Deeksha Bhawan'>('All');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Maintenance Toggle state
  const [editingMaintenanceRoomId, setEditingMaintenanceRoomId] = useState<string | null>(null);
  const [maintenanceReasonInput, setMaintenanceReasonInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add Room Modal state
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomBuilding, setNewRoomBuilding] = useState<Building>('IET');
  const [newRoomFloor, setNewRoomFloor] = useState<Floor>('1st Floor');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(70);
  const [newRoomType, setNewRoomType] = useState<RoomType>('Classroom');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [addRoomError, setAddRoomError] = useState<string | null>(null);

  // Create Announcement form state
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<Announcement['category']>('Room Relocation');
  const [noticePriority, setNoticePriority] = useState<Announcement['priority']>('Important');
  const [noticeAudience, setNoticeAudience] = useState<Announcement['targetAudience']>('All');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAffectedRoom, setNoticeAffectedRoom] = useState('');
  const [noticeNewRoom, setNoticeNewRoom] = useState('');
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedBuildingTab !== 'All' && r.building !== selectedBuildingTab) return false;
    if (roomSearchQuery.trim()) {
      const q = roomSearchQuery.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Pending bookings queue
  const pendingBookings = bookings.filter((b) => b.status === 'Pending');

  // Toggle Maintenance
  const handleToggleMaintenance = async (room: Room) => {
    const nextState = !room.isMaintenance;
    const reason = nextState
      ? maintenanceReasonInput || 'Facility maintenance & electrical inspection'
      : undefined;

    setIsUpdating(true);
    try {
      await campusApi.toggleMaintenance(room.id, nextState, reason);
      setEditingMaintenanceRoomId(null);
      setMaintenanceReasonInput('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Add Room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCode || !newRoomName || newRoomCapacity <= 0) {
      setAddRoomError('Please provide valid room code, name, and capacity.');
      return;
    }

    setIsAddingRoom(true);
    setAddRoomError(null);

    try {
      await campusApi.addRoom({
        code: newRoomCode.trim().toUpperCase(),
        name: newRoomName.trim(),
        building: newRoomBuilding,
        floor: newRoomFloor,
        capacity: Number(newRoomCapacity),
        type: newRoomType,
        amenities: ['Projector', 'Air Conditioned', 'Whiteboard'],
        description: newRoomDescription.trim() || 'Academic classroom facility',
      });

      setIsAddRoomOpen(false);
      setNewRoomCode('');
      setNewRoomName('');
      setNewRoomDescription('');
      onRefresh();
    } catch (err: any) {
      setAddRoomError(err.message || 'Failed to add room.');
    } finally {
      setIsAddingRoom(false);
    }
  };

  // Approve Booking
  const handleApproveBooking = async (bookingId: string) => {
    const note = prompt('Optional approval note for faculty member:', 'Approved by Estate & Academic Registrar');
    try {
      await campusApi.updateBookingApproval(bookingId, 'approve', note || undefined);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve booking.');
    }
  };

  // Reject Booking
  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt('State reason for rejection:', 'Slot reserved for scheduled University Examination');
    if (reason !== null) {
      try {
        await campusApi.updateBookingApproval(bookingId, 'reject', reason);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to reject booking.');
      }
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    const reason = prompt('Please enter cancellation reason:', 'Administrative override cancellation');
    if (reason !== null) {
      await campusApi.cancelBooking(bookingId, reason);
      onRefresh();
    }
  };

  // Publish Announcement
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    setIsPublishingNotice(true);
    try {
      await campusApi.createAnnouncement({
        title: noticeTitle,
        content: noticeContent,
        author: currentUser.name,
        authorRole: currentUser.designation,
        category: noticeCategory,
        priority: noticePriority,
        targetAudience: noticeAudience,
        affectedRoom: noticeAffectedRoom || undefined,
        newRoom: noticeNewRoom || undefined,
      });

      setIsCreatingNotice(false);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeAffectedRoom('');
      setNoticeNewRoom('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishingNotice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
              <span>Super-User Administration Portal</span>
              <span>·</span>
              <span className="text-slate-500 font-normal">DDUGU Central Directorate</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Campus Facility Command & Booking Administration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Approve or reject booking requests, manage room inventory across both buildings, cancel reservations, and broadcast circulars
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddRoomOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Room</span>
            </button>
            <button
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Reset all database records"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Reset Records</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="mt-5 flex items-center gap-1 border-t border-slate-100 pt-3 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('approvals')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'approvals'
                ? 'bg-purple-100 text-purple-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Approval Queue</span>
            {pendingBookings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white font-mono text-[10px]">
                {pendingBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('rooms')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'rooms'
                ? 'bg-purple-100 text-purple-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Manage All Classrooms</span>
            <span className="font-mono text-slate-400 text-[11px]">({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('bookings')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'bookings'
                ? 'bg-purple-100 text-purple-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Bookings & Overrides</span>
            <span className="font-mono text-slate-400 text-[11px]">({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('announcements')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'announcements'
                ? 'bg-purple-100 text-purple-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Broadcast Circulars</span>
            <span className="font-mono text-slate-400 text-[11px]">({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('stats')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'stats'
                ? 'bg-purple-100 text-purple-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Utilization Statistics</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: APPROVAL QUEUE (Approve or Reject Requests) */}
      {activeAdminTab === 'approvals' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4.5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Faculty Booking Approval Queue</span>
                {pendingBookings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                    {pendingBookings.length} Requests Pending
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Review classroom reservation requests from faculty and authorize or reject with notes
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {pendingBookings.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Pass Ref</th>
                    <th className="py-3 px-4">Requested Room</th>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Subject & Purpose</th>
                    <th className="py-3 px-4">Faculty In-Charge</th>
                    <th className="py-3 px-4">Expected Students</th>
                    <th className="py-3 px-4 text-right">Administrative Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {pendingBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700 text-xs">
                        {b.passCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono text-xs">{b.roomCode}</div>
                        <div className="text-[11px] text-slate-500">{b.building} · {b.floor}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800 tabular-nums">
                        {b.date}
                        <span className="block text-slate-500 text-[11px]">{b.startTime} - {b.endTime}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{b.subject}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.courseCode} · {b.purpose}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{b.facultyName}</div>
                        <div className="text-[11px] text-slate-500">{b.facultyDept}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {b.expectedStudents} students
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveBooking(b.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectBooking(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-900">All booking requests are processed!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no pending classroom reservations awaiting administrative decision.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: MANAGE CLASSROOMS (Both Buildings) */}
      {activeAdminTab === 'rooms' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Classroom & Laboratory Inventory (IET & Deeksha Bhawan)
              </h2>
              <p className="text-xs text-slate-500">
                Manage operational states, set maintenance locks, and inspect capacities across all facilities
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter room code..."
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                {(['All', 'IET', 'Deeksha Bhawan'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedBuildingTab(tab)}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      selectedBuildingTab === tab
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Room Code</th>
                  <th className="py-3 px-4">Classroom Name</th>
                  <th className="py-3 px-4">Building & Level</th>
                  <th className="py-3 px-4">Student Capacity</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4 text-right">Maintenance Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredRooms.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                      {r.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-500">{r.type}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{r.building}</div>
                      <div className="text-[11px] text-slate-500">{r.floor}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {r.capacity} seats
                    </td>
                    <td className="py-3 px-4">
                      {r.isMaintenance ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Wrench className="w-3 h-3" />
                            <span>Maintenance Lock</span>
                          </span>
                          {r.maintenanceReason && (
                            <div className="text-[10px] text-amber-900 italic mt-0.5 max-w-xs">
                              {r.maintenanceReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active / Bookable</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingMaintenanceRoomId === r.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="text"
                            placeholder="Reason for maintenance..."
                            value={maintenanceReasonInput}
                            onChange={(e) => setMaintenanceReasonInput(e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-300 rounded bg-white w-48"
                          />
                          <button
                            onClick={() => handleToggleMaintenance(r)}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded cursor-pointer"
                          >
                            Lock Room
                          </button>
                          <button
                            onClick={() => setEditingMaintenanceRoomId(null)}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (r.isMaintenance) {
                              handleToggleMaintenance(r);
                            } else {
                              setEditingMaintenanceRoomId(r.id);
                              setMaintenanceReasonInput('Routine electrical servicing and equipment audit');
                            }
                          }}
                          className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                            r.isMaintenance
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          }`}
                        >
                          {r.isMaintenance ? 'Unlock Room' : 'Set Maintenance'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: ALL BOOKINGS & CANCELLATIONS */}
      {activeAdminTab === 'bookings' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4.5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Master Booking Allotments & Administrative Override
              </h2>
              <p className="text-xs text-slate-500">
                Cancel reservations in emergency reallocations or override conflicts
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total Logged: <strong>{bookings.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Room & Building</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Subject & Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs">
                      {b.passCode}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.roomCode}
                      <span className="block font-sans text-[11px] text-slate-500 font-normal">
                        {b.building}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 tabular-nums">
                      {b.date}
                      <span className="block text-[11px] text-slate-500 font-sans">
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {b.facultyName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{b.subject}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.courseCode} · {b.purpose}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : b.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: CREATE & PUBLISH ANNOUNCEMENTS */}
      {activeAdminTab === 'announcements' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Publish Official Campus Circular
              </h2>
              <p className="text-xs text-slate-500">
                Broadcast announcements, exam seating schedules, and room relocations to all students and faculty
              </p>
            </div>
            <button
              onClick={() => setIsCreatingNotice(!isCreatingNotice)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              {isCreatingNotice ? 'Hide Form' : 'New Circular'}
            </button>
          </div>

          {isCreatingNotice && (
            <form onSubmit={handlePublishNotice} className="bg-slate-50 border border-blue-200 rounded-xl p-4.5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Announcement Headline *
                  </label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Room Reallocation: Operating Systems Relocated to Deeksha Bhawan LH04"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Category
                  </label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as Announcement['category'])}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Room Relocation">Room Relocation</option>
                    <option value="Exam Notice">Exam Notice</option>
                    <option value="Lab Schedule">Lab Schedule</option>
                    <option value="General Notice">General Notice</option>
                  </select>
                </div>
              </div>

              {noticeCategory === 'Room Relocation' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                      Original Classroom
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IET17"
                      value={noticeAffectedRoom}
                      onChange={(e) => setNoticeAffectedRoom(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                      New Relocated Classroom
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Deeksha Bhawan LH04"
                      value={noticeNewRoom}
                      onChange={(e) => setNoticeNewRoom(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as Announcement['priority'])}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audience Group
                  </label>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value as Announcement['targetAudience'])}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="All">All Campus</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions & Details *
                </label>
                <textarea
                  rows={3}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="State complete details, timing, batches affected..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNotice(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingNotice}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                >
                  {isPublishingNotice ? 'Publishing...' : 'Broadcast to Portal'}
                </button>
              </div>
            </form>
          )}

          {/* Existing Circulars */}
          <div className="space-y-3 pt-2">
            {announcements.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: UTILIZATION STATISTICS */}
      {activeAdminTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
              <div className="text-xs text-slate-500 mb-1">Total Academic Rooms</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{stats.totalRooms}</div>
              <div className="text-[11px] text-slate-500 mt-1">14 IET Wing + 12 Deeksha Bhawan</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
              <div className="text-xs text-slate-500 mb-1">IET Building Occupancy</div>
              <div className="text-2xl font-bold font-mono text-blue-700">{stats.ietOccupancyRate}%</div>
              <div className="text-[11px] text-slate-500 mt-1">Core engineering lectures</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
              <div className="text-xs text-slate-500 mb-1">Deeksha Bhawan Occupancy</div>
              <div className="text-2xl font-bold font-mono text-purple-700">{stats.deekshaOccupancyRate}%</div>
              <div className="text-[11px] text-slate-500 mt-1">Overflow lecture halls</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
              <div className="text-xs text-slate-500 mb-1">Maintenance Locks</div>
              <div className="text-2xl font-bold font-mono text-amber-700">{stats.maintenanceRooms}</div>
              <div className="text-[11px] text-slate-500 mt-1">Scheduled for inspection</div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-700">
                  Campus Facilities Management
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New Classroom or Laboratory
                </h3>
              </div>
              <button
                onClick={() => setIsAddRoomOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. IET31 or LH13"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Capacity *</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced AI & Autonomous Systems Lab"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Building Complex *</label>
                  <select
                    value={newRoomBuilding}
                    onChange={(e) => setNewRoomBuilding(e.target.value as Building)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="IET">IET Building</option>
                    <option value="Deeksha Bhawan">Deeksha Bhawan (~100m)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor Level *</label>
                  <select
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value as Floor)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room Classification</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Lab">Computer / Engineering Lab</option>
                  <option value="Seminar Hall">Seminar Hall / Auditorium</option>
                  <option value="Facility">Placement / Conference Cell</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Tiered desks, ceiling laser projector..."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              {addRoomError && (
                <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                  {addRoomError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingRoom}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                >
                  {isAddingRoom ? 'Registering...' : 'Save Facility Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
