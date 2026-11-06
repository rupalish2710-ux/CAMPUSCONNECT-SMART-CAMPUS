import React, { useState } from 'react';
import { Booking, UserProfile } from '../types/campus';
import { campusApi } from '../services/api';
import {
  History,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Trash2,
  Printer,
  Copy,
  Check,
  X
} from 'lucide-react';

interface BookingHistoryViewProps {
  bookings: Booking[];
  currentUser: UserProfile;
  onRefresh: () => void;
}

export const BookingHistoryView: React.FC<BookingHistoryViewProps> = ({
  bookings,
  currentUser,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPassBooking, setViewingPassBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchRoom = b.roomCode.toLowerCase().includes(q);
      const matchFaculty = b.facultyName.toLowerCase().includes(q);
      const matchSubject = b.subject.toLowerCase().includes(q);
      const matchPass = b.passCode.toLowerCase().includes(q);
      if (!matchRoom && !matchFaculty && !matchSubject && !matchPass) return false;
    }
    return true;
  });

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    try {
      await campusApi.cancelBooking(cancellingBookingId, cancelReason || 'Rescheduled by faculty/admin');
      setCancellingBookingId(null);
      setCancelReason('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const copyPassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              <span>Audit Trail & Records</span>
              <span>·</span>
              <span className="text-slate-500 font-normal">DDUGU Campus Central Registry</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Campus Booking History & Official Door Slips
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review room reservation records, verified time slots, and status verification
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
            Total Logged: <strong className="text-slate-900">{bookings.length}</strong>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by room code, subject, instructor, or pass code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['All', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Pass Ref</th>
                <th className="py-3 px-4">Room & Building</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Subject & Purpose</th>
                <th className="py-3 px-4">Faculty In-Charge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-700">
                    {b.passCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono text-xs">{b.roomCode}</div>
                    <div className="text-[11px] text-slate-500">{b.building} · {b.floor}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-900 font-medium tabular-nums">{b.date}</div>
                    <div className="font-mono text-slate-500 text-[11px] tabular-nums">
                      {b.startTime} - {b.endTime} ({b.durationMinutes}m)
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{b.subject}</div>
                    <div className="text-[11px] text-slate-500">
                      {b.purpose} · {b.expectedStudents} students
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{b.facultyName}</div>
                    <div className="text-[11px] text-slate-500">{b.facultyDept}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.cancellationReason && (
                      <div className="text-[10px] text-red-700 mt-0.5 italic max-w-[140px] truncate" title={b.cancellationReason}>
                        {b.cancellationReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingPassBooking(b)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                        title="View Official Door Slip"
                      >
                        Door Slip
                      </button>

                      {b.status === 'Confirmed' && currentUser.role !== 'student' && (
                        <button
                          onClick={() => setCancellingBookingId(b.id)}
                          className="px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Cancel this booking"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No bookings found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Door Slip Modal */}
      {viewingPassBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-700">
                  DDUGU Campus Central Facility Allotment Pass
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Official Classroom Allotment Slip
                </h3>
              </div>
              <button
                onClick={() => setViewingPassBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-mono">Room Number</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{viewingPassBooking.roomCode}</span>
                  <span className="text-slate-600 block text-[11px]">{viewingPassBooking.roomName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase block font-mono">Pass Token</span>
                  <span className="text-sm font-bold font-mono text-blue-700">{viewingPassBooking.passCode}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Facility:</span>
                  <strong className="text-slate-900">{viewingPassBooking.building} ({viewingPassBooking.floor})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Scheduled Window:</span>
                  <strong className="text-slate-900 font-mono">
                    {viewingPassBooking.date} ({viewingPassBooking.startTime} - {viewingPassBooking.endTime})
                  </strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Course & Subject:</span>
                  <strong className="text-slate-900">{viewingPassBooking.subject}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Faculty In-Charge:</span>
                  <strong className="text-slate-900">{viewingPassBooking.facultyName}</strong>
                </div>
              </div>

              {viewingPassBooking.notes && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-500 block">Special Requirements:</span>
                  <span className="text-slate-700 italic">{viewingPassBooking.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => copyPassCode(viewingPassBooking.passCode)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Token'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Door Pass</span>
                </button>
                <button
                  onClick={() => setViewingPassBooking(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Reservation Cancellation
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this booking? The slot will immediately become available for other faculty members to reserve.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Class rescheduled, faculty meeting"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingBookingId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
