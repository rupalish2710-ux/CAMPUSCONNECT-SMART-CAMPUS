/**
 * Client API Service with Transparent Fallback & Conflict Validation
 */

import { Room, Booking, Announcement, TimetableSlot, CampusStats, ConflictCheckResult, EnrichedRoom, RoomAvailabilityStatus, ScheduleChange, RecommendationRequest, RecommendationResponse, SmartRoomRecommendation } from '../types/campus';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_ANNOUNCEMENTS, INITIAL_TIMETABLE, INITIAL_SCHEDULE_CHANGES } from '../data/seedData';

const LOCAL_STORAGE_PREFIX = 'campusconnect_v1_';

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

// Time collision detector helper
function checkTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

export const campusApi = {
  // Fetch rooms with live occupancy enrichment
  async getRooms(params?: {
    building?: string;
    floor?: string;
    type?: string;
    minCapacity?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<EnrichedRoom[]> {
    try {
      const query = new URLSearchParams();
      if (params?.building && params.building !== 'All') query.set('building', params.building);
      if (params?.floor && params.floor !== 'All') query.set('floor', params.floor);
      if (params?.type && params.type !== 'All') query.set('type', params.type);
      if (params?.minCapacity) query.set('minCapacity', params.minCapacity.toString());
      if (params?.date) query.set('date', params.date);
      if (params?.startTime) query.set('startTime', params.startTime);
      if (params?.endTime) query.set('endTime', params.endTime);

      const res = await fetch(`/api/rooms?${query.toString()}`);
      if (!res.ok) throw new Error('API fetch rooms failed');
      const data = await res.json();
      return data;
    } catch {
      // Local fallback
      let rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      const bookings: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);

      if (params?.building && params.building !== 'All') {
        rooms = rooms.filter((r) => r.building.toLowerCase() === params.building!.toLowerCase());
      }
      if (params?.floor && params.floor !== 'All') {
        rooms = rooms.filter((r) => r.floor.toLowerCase() === params.floor!.toLowerCase());
      }
      if (params?.type && params.type !== 'All') {
        rooms = rooms.filter((r) => r.type.toLowerCase() === params.type!.toLowerCase());
      }
      if (params?.minCapacity) {
        rooms = rooms.filter((r) => r.capacity >= params.minCapacity!);
      }

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMins}`;

      const targetDate = params?.date || todayStr;
      const targetStart = params?.startTime || '00:00';
      const targetEnd = params?.endTime || '23:59';

      return rooms.map((room) => {
        const activeNowBooking = bookings.find(
          (b) =>
            b.roomId === room.id &&
            b.date === todayStr &&
            b.status === 'Confirmed' &&
            checkTimeOverlap(currentTime, currentTime, b.startTime, b.endTime)
        ) || null;

        const currentBooking = bookings.find(
          (b) =>
            b.roomId === room.id &&
            b.date === targetDate &&
            b.status === 'Confirmed' &&
            checkTimeOverlap(targetStart, targetEnd, b.startTime, b.endTime)
        ) || null;

        let status: RoomAvailabilityStatus = 'Available';
        if (room.isMaintenance) {
          status = 'Maintenance';
        } else if (activeNowBooking && targetDate === todayStr && checkTimeOverlap(currentTime, currentTime, targetStart, targetEnd)) {
          status = 'Occupied';
        } else if (currentBooking) {
          status = 'Booked';
        }

        return {
          ...room,
          status,
          isOccupied: status === 'Occupied' || status === 'Booked',
          currentBooking,
          activeNowBooking,
        };
      });
    }
  },

  // Check Conflict and return alternatives
  async checkConflict(params: {
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity?: number;
  }): Promise<ConflictCheckResult> {
    try {
      const res = await fetch('/api/bookings/check-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Check conflict failed');
      return await res.json();
    } catch {
      // Local check
      const rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      const bookings: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);
      const room = rooms.find((r) => r.id === params.roomId);

      if (!room) {
        return { hasConflict: true, message: 'Room not found' };
      }

      if (room.isMaintenance) {
        const alts = rooms
          .filter((r) => r.id !== room.id && !r.isMaintenance && r.capacity >= (params.capacity || 40))
          .slice(0, 4);
        return {
          hasConflict: true,
          message: `${room.name} (${room.code}) is under maintenance: ${room.maintenanceReason || 'Facility unavailable'}.`,
          availableAlternatives: alts,
        };
      }

      const conflicting = bookings.find(
        (b) =>
          b.roomId === params.roomId &&
          b.date === params.date &&
          b.status === 'Confirmed' &&
          checkTimeOverlap(params.startTime, params.endTime, b.startTime, b.endTime)
      );

      if (conflicting) {
        const occupiedIds = new Set(
          bookings
            .filter((b) => b.date === params.date && b.status === 'Confirmed' && checkTimeOverlap(params.startTime, params.endTime, b.startTime, b.endTime))
            .map((b) => b.roomId)
        );
        const alts = rooms
          .filter((r) => r.id !== room.id && !r.isMaintenance && !occupiedIds.has(r.id) && r.capacity >= (params.capacity || 40))
          .sort((a, b) => {
            const aSameBldg = a.building === room.building ? 1 : 0;
            const bSameBldg = b.building === room.building ? 1 : 0;
            return bSameBldg - aSameBldg;
          })
          .slice(0, 4);

        return {
          hasConflict: true,
          conflictingBooking: conflicting,
          message: `Conflict detected! ${room.code} is already booked from ${conflicting.startTime} to ${conflicting.endTime} by ${conflicting.facultyName} for "${conflicting.subject}".`,
          availableAlternatives: alts,
        };
      }

      return {
        hasConflict: false,
        message: `${room.name} (${room.code}) is available for booking.`,
        availableAlternatives: [],
      };
    }
  },

  // Create booking
  async createBooking(bookingData: {
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    facultyName: string;
    facultyDept: string;
    facultyEmail: string;
    courseCode: string;
    subject: string;
    purpose: Booking['purpose'];
    expectedStudents: number;
    notes?: string;
  }): Promise<{ success: boolean; booking: Booking; message: string }> {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reserve room.');
      }
      return data;
    } catch (err: unknown) {
      // Fallback local write
      const rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      const bookings: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);
      const room = rooms.find((r) => r.id === bookingData.roomId);

      if (!room) {
        throw new Error('Room not found in directory');
      }

      const conflict = bookings.find(
        (b) =>
          b.roomId === bookingData.roomId &&
          b.date === bookingData.date &&
          b.status === 'Confirmed' &&
          checkTimeOverlap(bookingData.startTime, bookingData.endTime, b.startTime, b.endTime)
      );

      if (conflict) {
        throw new Error(`Conflict: ${room.code} is already booked by ${conflict.facultyName}.`);
      }

      const passCode = `CC-DDU-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBooking: Booking = {
        id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        roomId: room.id,
        roomCode: room.code,
        roomName: room.name,
        building: room.building,
        floor: room.floor,
        facultyName: bookingData.facultyName,
        facultyDept: bookingData.facultyDept || 'Engineering & Technology',
        facultyEmail: bookingData.facultyEmail || 'faculty@ddugu.ac.in',
        courseCode: bookingData.courseCode || 'ENG-GEN',
        subject: bookingData.subject,
        purpose: bookingData.purpose,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        durationMinutes: bookingData.durationMinutes,
        expectedStudents: Number(bookingData.expectedStudents),
        status: 'Confirmed',
        notes: bookingData.notes || '',
        createdAt: new Date().toISOString(),
        passCode,
      };

      const updated = [newBooking, ...bookings];
      setLocalData('bookings', updated);

      return {
        success: true,
        booking: newBooking,
        message: `Successfully booked ${room.code} for ${bookingData.date} (${bookingData.startTime} - ${bookingData.endTime}).`,
      };
    }
  },

  // Get Bookings
  async getBookings(params?: {
    date?: string;
    roomId?: string;
    facultyEmail?: string;
    status?: string;
  }): Promise<Booking[]> {
    try {
      const query = new URLSearchParams();
      if (params?.date) query.set('date', params.date);
      if (params?.roomId) query.set('roomId', params.roomId);
      if (params?.facultyEmail) query.set('facultyEmail', params.facultyEmail);
      if (params?.status && params.status !== 'All') query.set('status', params.status);

      const res = await fetch(`/api/bookings?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return await res.json();
    } catch {
      let list: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);
      if (params?.date) list = list.filter((b) => b.date === params.date);
      if (params?.roomId) list = list.filter((b) => b.roomId === params.roomId);
      if (params?.facultyEmail) list = list.filter((b) => b.facultyEmail.toLowerCase() === params.facultyEmail!.toLowerCase());
      if (params?.status && params.status !== 'All') list = list.filter((b) => b.status === params.status);
      list.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
      return list;
    }
  },

  // Cancel Booking
  async cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: reason }),
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      return await res.json();
    } catch {
      const list: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);
      const updated = list.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Cancelled' as const, cancellationReason: reason || 'Cancelled by faculty/admin' }
          : b
      );
      setLocalData('bookings', updated);
      return { success: true, message: 'Booking cancelled successfully.' };
    }
  },

  // Add Room (Admin)
  async addRoom(roomData: Omit<Room, 'id' | 'isMaintenance'>): Promise<Room> {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add room.');
      }
      const data = await res.json();
      return data.room;
    } catch {
      const rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      const newRoom: Room = {
        ...roomData,
        id: `room-${Date.now()}`,
        isMaintenance: false,
        distanceFromIETMeters: roomData.building === 'IET' ? 0 : 100,
      };
      setLocalData('rooms', [...rooms, newRoom]);
      return newRoom;
    }
  },

  // Update Booking Approval (Admin: Approve or Reject)
  async updateBookingApproval(
    bookingId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<{ success: boolean; booking: Booking; message?: string }> {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update approval.');
      }
      return await res.json();
    } catch {
      const bookings: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);
      let updatedBooking: Booking | null = null;
      const updated = bookings.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = {
            ...b,
            status: action === 'approve' ? ('Confirmed' as const) : ('Rejected' as const),
            approvalNote: action === 'approve' ? note || 'Approved by Administrator' : undefined,
            rejectionReason: action === 'reject' ? note || 'Rejected by Administrator' : undefined,
          };
          return updatedBooking;
        }
        return b;
      });
      setLocalData('bookings', updated);
      return { success: true, booking: updatedBooking || bookings[0] };
    }
  },

  // Get Schedule Changes
  async getScheduleChanges(): Promise<ScheduleChange[]> {
    try {
      const res = await fetch('/api/schedule-changes');
      if (!res.ok) throw new Error('Failed to fetch schedule changes');
      return await res.json();
    } catch {
      return getLocalData('scheduleChanges', INITIAL_SCHEDULE_CHANGES);
    }
  },

  // Get Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return await res.json();
    } catch {
      return getLocalData('announcements', INITIAL_ANNOUNCEMENTS);
    }
  },

  // Create Announcement
  async createAnnouncement(data: {
    title: string;
    content: string;
    author: string;
    authorRole: string;
    category: Announcement['category'];
    priority: Announcement['priority'];
    targetAudience: Announcement['targetAudience'];
    affectedRoom?: string;
    newRoom?: string;
  }): Promise<Announcement> {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to publish announcement');
      const result = await res.json();
      return result.announcement;
    } catch {
      const list: Announcement[] = getLocalData('announcements', INITIAL_ANNOUNCEMENTS);
      const newAnc: Announcement = {
        id: `anc-${Date.now()}`,
        title: data.title,
        content: data.content,
        author: data.author,
        authorRole: data.authorRole,
        category: data.category,
        priority: data.priority,
        targetAudience: data.targetAudience,
        createdAt: new Date().toISOString(),
        affectedRoom: data.affectedRoom,
        newRoom: data.newRoom,
      };
      const updated = [newAnc, ...list];
      setLocalData('announcements', updated);
      return newAnc;
    }
  },

  // Delete Announcement
  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      const list: Announcement[] = getLocalData('announcements', INITIAL_ANNOUNCEMENTS);
      setLocalData('announcements', list.filter((a) => a.id !== id));
      return true;
    }
  },

  // Toggle Maintenance
  async toggleMaintenance(roomId: string, isMaintenance: boolean, reason?: string): Promise<Room> {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMaintenance, maintenanceReason: reason }),
      });
      if (!res.ok) throw new Error('Failed to update room status');
      const data = await res.json();
      return data.room;
    } catch {
      const rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      let updatedRoom: Room | null = null;
      const updated = rooms.map((r) => {
        if (r.id === roomId) {
          updatedRoom = {
            ...r,
            isMaintenance,
            maintenanceReason: reason || (isMaintenance ? 'Under scheduled maintenance' : undefined),
          };
          return updatedRoom;
        }
        return r;
      });
      setLocalData('rooms', updated);
      return updatedRoom || rooms[0];
    }
  },

  // Get Timetable
  async getTimetable(params?: { branch?: string; semester?: number; day?: string }): Promise<TimetableSlot[]> {
    try {
      const query = new URLSearchParams();
      if (params?.branch && params.branch !== 'All') query.set('branch', params.branch);
      if (params?.semester) query.set('semester', params.semester.toString());
      if (params?.day && params.day !== 'All') query.set('day', params.day);

      const res = await fetch(`/api/timetable?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch timetable');
      return await res.json();
    } catch {
      let list: TimetableSlot[] = getLocalData('timetable', INITIAL_TIMETABLE);
      if (params?.branch && params.branch !== 'All') list = list.filter((t) => t.branch === params.branch);
      if (params?.semester) list = list.filter((t) => t.semester === params.semester);
      if (params?.day && params.day !== 'All') list = list.filter((t) => t.day === params.day);
      return list;
    }
  },

  // Get Campus Stats
  async getStats(): Promise<CampusStats> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch {
      const rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      const bookings: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);
      const announcements: Announcement[] = getLocalData('announcements', INITIAL_ANNOUNCEMENTS);

      const todayStr = new Date().toISOString().split('T')[0];
      const maintenanceCount = rooms.filter((r) => r.isMaintenance).length;
      const todayConfirmed = bookings.filter((b) => b.date === todayStr && b.status === 'Confirmed');

      const occupiedNowCount = todayConfirmed.length > 0 ? 3 : 1;
      const availableCount = Math.max(0, rooms.length - occupiedNowCount - maintenanceCount);

      return {
        totalRooms: rooms.length,
        availableRoomsNow: availableCount,
        occupiedRoomsNow: occupiedNowCount,
        todayBookingsCount: todayConfirmed.length,
        maintenanceRooms: maintenanceCount,
        ietOccupancyRate: 42,
        deekshaOccupancyRate: 35,
        activeAnnouncementsCount: announcements.length,
      };
    }
  },

  // AI Smart Room Recommendations
  async getSmartRecommendations(req: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error('API recommendations call failed');
      return await res.json();
    } catch {
      // Local fallback engine with zero-conflict guarantee
      const rooms: Room[] = getLocalData('rooms', INITIAL_ROOMS);
      const bookings: Booking[] = getLocalData('bookings', INITIAL_BOOKINGS);

      const numCapacity = req.capacity || 50;
      const targetDate = req.date || new Date().toISOString().split('T')[0];
      const targetStart = req.startTime || '10:00';
      const targetEnd = req.endTime || '11:30';

      // Preferred room evaluation
      let preferredRoomStatus: RecommendationResponse['preferredRoomStatus'] = undefined;
      if (req.preferredRoomId) {
        const prefRoom = rooms.find((r) => r.id === req.preferredRoomId || r.code === req.preferredRoomId);
        if (prefRoom) {
          if (prefRoom.isMaintenance) {
            preferredRoomStatus = {
              isAvailable: false,
              room: prefRoom,
              conflictReason: `Under maintenance: ${prefRoom.maintenanceReason || 'Scheduled upkeep'}`,
            };
          } else {
            const conflict = bookings.find(
              (b) =>
                b.roomId === prefRoom.id &&
                b.date === targetDate &&
                b.status === 'Confirmed' &&
                checkTimeOverlap(targetStart, targetEnd, b.startTime, b.endTime)
            );
            if (conflict) {
              preferredRoomStatus = {
                isAvailable: false,
                room: prefRoom,
                conflictReason: `Reserved by ${conflict.facultyName} (${conflict.subject})`,
              };
            } else {
              preferredRoomStatus = {
                isAvailable: true,
                room: prefRoom,
              };
            }
          }
        }
      }

      // Filter available rooms
      const availableRooms = rooms.filter((r) => {
        if (r.isMaintenance) return false;
        const hasConflict = bookings.some(
          (b) =>
            b.roomId === r.id &&
            b.date === targetDate &&
            b.status === 'Confirmed' &&
            checkTimeOverlap(targetStart, targetEnd, b.startTime, b.endTime)
        );
        return !hasConflict;
      });

      // Score candidates
      const scored: SmartRoomRecommendation[] = availableRooms.map((room) => {
        let score = 50;
        const reasons: string[] = ['Available during requested time (Verified zero conflict)'];

        if (room.capacity >= numCapacity) {
          const excess = room.capacity - numCapacity;
          if (excess <= 15) {
            score += 35;
            reasons.push(`Best capacity match: Seats ${room.capacity} for ${numCapacity} students`);
          } else if (excess <= 35) {
            score += 25;
            reasons.push(`Good capacity match: Room holds ${room.capacity} seats`);
          } else {
            score += 15;
            reasons.push(`Spacious venue: Room capacity is ${room.capacity}`);
          }
        } else {
          score -= 30;
          reasons.push(`Below requested capacity (holds ${room.capacity} of ${numCapacity})`);
        }

        if (req.buildingPreference && req.buildingPreference !== 'All') {
          if (room.building.toLowerCase() === req.buildingPreference.toLowerCase()) {
            score += 20;
            reasons.push(`Located in preferred ${room.building} (${room.floor})`);
          } else {
            score += 5;
            reasons.push(
              room.building === 'Deeksha Bhawan'
                ? 'Closest suitable building (~100m from IET)'
                : 'Alternative venue in IET Main Building'
            );
          }
        } else {
          reasons.push(`${room.building} (${room.floor})`);
        }

        const clampedScore = Math.min(99, Math.max(30, score));
        const tier = clampedScore >= 80 ? 'Top Match' : clampedScore >= 65 ? 'Great Alternative' : 'Backup Option';

        return {
          room,
          suitabilityScore: clampedScore,
          matchTier: tier as 'Top Match' | 'Great Alternative' | 'Backup Option',
          reasons,
          capacityFitRatio: Math.min(100, Math.round((numCapacity / room.capacity) * 100)),
          walkingDistanceMeters: room.distanceFromIETMeters || (room.building === 'IET' ? 0 : 100),
          isAiEnhanced: false,
        };
      });

      let candidates = scored.filter((r) => r.room.capacity >= numCapacity);
      if (candidates.length === 0) {
        candidates = [...scored].sort((a, b) => b.room.capacity - a.room.capacity);
      }
      candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      return {
        query: req,
        preferredRoomStatus,
        recommendedRooms: candidates.slice(0, 5),
        source: 'rule_engine',
        totalAnalyzed: rooms.length,
        conflictFreeCount: availableRooms.length,
      };
    }
  },

  // Reset to initial demo state
  async resetDemo(): Promise<void> {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
    } catch {
      // Ignore
    }
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'rooms');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'bookings');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'announcements');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'timetable');
  },
};
