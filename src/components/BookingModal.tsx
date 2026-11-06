import React, { useState, useEffect } from 'react';
import { Room, Booking, UserProfile, ConflictCheckResult } from '../types/campus';
import { campusApi } from '../services/api';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Printer,
  Copy,
  Check,
  Building,
  Info
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  currentUser: UserProfile;
  preselectedRoomId?: string;
  prefillDetails?: {
    date: string;
    startTime: string;
    endTime: string;
    purpose?: Booking['purpose'];
    expectedStudents?: number;
  };
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  currentUser,
  preselectedRoomId,
  prefillDetails,
  onBookingSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [roomId, setRoomId] = useState<string>(preselectedRoomId || rooms[0]?.id || '');
  const [date, setDate] = useState<string>(prefillDetails?.date || todayStr);
  const [startTime, setStartTime] = useState<string>(prefillDetails?.startTime || '11:00');
  const [endTime, setEndTime] = useState<string>(prefillDetails?.endTime || '12:30');
  const [courseCode, setCourseCode] = useState<string>('CS-302');
  const [subject, setSubject] = useState<string>('Operating Systems Extra Lecture');
  const [purpose, setPurpose] = useState<Booking['purpose']>('Extra Class');
  const [expectedStudents, setExpectedStudents] = useState<number>(65);
  const [notes, setNotes] = useState<string>('Projector and smart interactive display required.');

  // Conflict state
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Pass Receipt
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Calculate duration in minutes
  const calculateDuration = (start: string, end: string): number => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const startM = h1 * 60 + m1;
    const endM = h2 * 60 + m2;
    return Math.max(0, endM - startM);
  };

  const durationMinutes = calculateDuration(startTime, endTime);

  // Update preselected room when prop changes
  useEffect(() => {
    if (preselectedRoomId) {
      setRoomId(preselectedRoomId);
    }
  }, [preselectedRoomId]);

  // Update prefill details if provided
  useEffect(() => {
    if (prefillDetails) {
      if (prefillDetails.date) setDate(prefillDetails.date);
      if (prefillDetails.startTime) setStartTime(prefillDetails.startTime);
      if (prefillDetails.endTime) setEndTime(prefillDetails.endTime);
      if (prefillDetails.purpose) setPurpose(prefillDetails.purpose);
      if (prefillDetails.expectedStudents) setExpectedStudents(prefillDetails.expectedStudents);
    }
  }, [prefillDetails]);

  const selectedRoom = rooms.find((r) => r.id === roomId);

  // Validate times & conflict check
  useEffect(() => {
    if (!isOpen || !roomId) return;

    if (startTime >= endTime) {
      setValidationError('Start time must be strictly earlier than end time.');
      setConflictResult(null);
      return;
    }

    if (durationMinutes < 15) {
      setValidationError('Booking duration must be at least 15 minutes.');
      setConflictResult(null);
      return;
    }

    if (selectedRoom && expectedStudents > selectedRoom.capacity) {
      setValidationError(`Expected students (${expectedStudents}) exceeds room capacity (${selectedRoom.capacity} seats).`);
      setConflictResult(null);
      return;
    }

    setValidationError(null);
    let active = true;
    setIsCheckingConflict(true);

    campusApi
      .checkConflict({
        roomId,
        date,
        startTime,
        endTime,
        capacity: expectedStudents,
      })
      .then((res) => {
        if (active) {
          setConflictResult(res);
          setIsCheckingConflict(false);
        }
      })
      .catch(() => {
        if (active) setIsCheckingConflict(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, roomId, date, startTime, endTime, expectedStudents, selectedRoom, durationMinutes]);

  if (!isOpen) return null;

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationError) return;

    if (conflictResult?.hasConflict) {
      setValidationError('Double booking prevented: Choose an alternative room or adjust the time slot.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const res = await campusApi.createBooking({
        roomId,
        date,
        startTime,
        endTime,
        durationMinutes,
        facultyName: currentUser.name,
        facultyDept: currentUser.department,
        facultyEmail: `${currentUser.name.toLowerCase().replace(/[^a-z]/g, '')}@ddugu.ac.in`,
        courseCode,
        subject,
        purpose,
        expectedStudents: Number(expectedStudents),
        notes,
      });

      setCreatedBooking(res.booking);
      onBookingSuccess(res.booking);
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred during booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPass = () => {
    if (createdBooking?.passCode) {
      navigator.clipboard.writeText(createdBooking.passCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
              <span>Faculty Facility Allotment Form</span>
              <span>·</span>
              <span className="text-slate-400 font-mono">DDUGU IET & Deeksha Bhawan</span>
            </div>
            <h2 className="text-lg font-bold">
              {createdBooking ? 'Official Booking Confirmation Pass' : 'Reserve Classroom / Lecture Hall'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If successfully booked, render printable pass slip */}
        {createdBooking ? (
          <div className="p-6 space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-emerald-950">
                Classroom Allotment Confirmed!
              </h3>
              <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                No overlapping schedule collision detected. This reservation has been logged into the central campus database and the room marked as Booked.
              </p>

              {/* Booking Pass Token */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-200 inline-flex items-center gap-3 shadow-2xs">
                <div className="text-left">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                    Official Door Pass Reference
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900 tracking-wider">
                    {createdBooking.passCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyPass}
                  className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Copy pass reference"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-500 block">Classroom Allocated:</span>
                  <strong className="text-slate-900 font-mono text-sm">{createdBooking.roomCode}</strong>
                  <span className="text-slate-600 block text-[11px]">{createdBooking.roomName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Building & Floor:</span>
                  <strong className="text-slate-900">{createdBooking.building} ({createdBooking.floor})</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-500 block">Date & Time Slot:</span>
                  <strong className="text-slate-900 font-mono">
                    {createdBooking.date} ({createdBooking.startTime} – {createdBooking.endTime})
                  </strong>
                  <span className="text-slate-500 block text-[11px]">Duration: {createdBooking.durationMinutes} mins</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Course & Subject:</span>
                  <strong className="text-slate-900">{createdBooking.subject}</strong>
                  <span className="text-slate-500 font-mono block text-[11px]">{createdBooking.courseCode} · {createdBooking.purpose}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Faculty In-Charge:</span>
                  <strong className="text-slate-900">{createdBooking.facultyName}</strong>
                  <span className="text-slate-500 block text-[11px]">{createdBooking.facultyDept}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Attendance:</span>
                  <strong className="text-slate-900 font-mono">{createdBooking.expectedStudents} Students</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Door Slip</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
            {/* Target Room Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Classroom / Lecture Amphitheater *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <optgroup label="IET Building (Ground Floor)">
                  {rooms
                    .filter((r) => r.building === 'IET' && r.floor === 'Ground Floor')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} – {r.name} ({r.capacity} seats)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="IET Building (1st Floor - Labs & Classrooms)">
                  {rooms
                    .filter((r) => r.building === 'IET' && r.floor === '1st Floor')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} – {r.name} ({r.capacity} seats)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="IET Building (2nd Floor - Seminar Hall & Rooms)">
                  {rooms
                    .filter((r) => r.building === 'IET' && r.floor === '2nd Floor')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} – {r.name} ({r.capacity} seats)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Deeksha Bhawan (~100m - LH01 to LH12)">
                  {rooms
                    .filter((r) => r.building === 'Deeksha Bhawan')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} – {r.name} ({r.capacity} seats)
                      </option>
                    ))}
                </optgroup>
              </select>

              {selectedRoom && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Capacity: {selectedRoom.capacity} seats · Type: {selectedRoom.type}</span>
                  <span>{selectedRoom.building === 'IET' ? 'Inside IET Wing' : '~100m walk (Deeksha)'}</span>
                </div>
              )}
            </div>

            {/* Date, Start Time & End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Booking Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            {/* Duration & Slot Display */}
            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs flex items-center justify-between text-slate-600 font-mono">
              <span>Duration Calculated:</span>
              <strong className="text-slate-900">
                {startTime} to {endTime} ({durationMinutes} minutes)
              </strong>
            </div>

            {/* Purpose, Expected Students, Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Booking Purpose *
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as Booking['purpose'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Extra Class">Extra Class / Remedial</option>
                  <option value="Regular Class">Regular Departmental Class</option>
                  <option value="Mid-Term Exam">Mid-Term / Sessional Exam</option>
                  <option value="Lab Practical">Laboratory Practical Session</option>
                  <option value="Seminar/Workshop">Seminar / Expert Guest Lecture</option>
                  <option value="Department Meeting">Department Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Student Count *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedRoom?.capacity || 250}
                  value={expectedStudents}
                  onChange={(e) => setExpectedStudents(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Topic Description *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems Remedial Lecture"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS-302"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Equipment Requirements / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Projector audio needed, student attendance registers"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* CONFLICT PREVENTION WARNING & ALTERNATIVE RECOMMENDATIONS */}
            {conflictResult && conflictResult.hasConflict && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-950 font-bold block text-sm">
                      Double Booking Prevented!
                    </strong>
                    <p className="text-red-800 mt-0.5 leading-relaxed">
                      {conflictResult.message}
                    </p>
                    <p className="text-red-700 text-[11px] font-medium mt-1">
                      System policy: Two bookings cannot occupy the same room in overlapping time slots.
                    </p>
                  </div>
                </div>

                {/* SUGGEST OTHER SUITABLE AVAILABLE ROOMS */}
                {conflictResult.availableAlternatives && conflictResult.availableAlternatives.length > 0 && (
                  <div className="bg-white/95 border border-red-200 rounded-lg p-3 space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Suggested Suitable Available Rooms:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {conflictResult.availableAlternatives.map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => setRoomId(alt.id)}
                          className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-slate-900 group-hover:text-purple-900">
                              {alt.code}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {alt.building} · {alt.floor} ({alt.capacity} seats)
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                            Switch to {alt.code} →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {conflictResult && !conflictResult.hasConflict && !validationError && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex items-center gap-2 text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Room is completely free with zero overlapping bookings. Ready to confirm.</span>
              </div>
            )}

            {validationError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs font-medium">
                {validationError}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || conflictResult?.hasConflict || isCheckingConflict || !!validationError}
                className={`px-5 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-xs cursor-pointer ${
                  conflictResult?.hasConflict || isCheckingConflict || !!validationError
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting
                  ? 'Confirming Booking...'
                  : isCheckingConflict
                  ? 'Checking Conflicts...'
                  : 'Confirm Official Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
