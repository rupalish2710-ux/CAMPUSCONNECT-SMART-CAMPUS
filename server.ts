import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_ANNOUNCEMENTS, INITIAL_TIMETABLE, INITIAL_SCHEDULE_CHANGES } from './src/data/seedData';
import { Room, Booking, Announcement, TimetableSlot, ScheduleChange } from './src/types/campus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'campus_db.json');

interface CampusDatabase {
  rooms: Room[];
  bookings: Booking[];
  announcements: Announcement[];
  timetable: TimetableSlot[];
  scheduleChanges: ScheduleChange[];
}

// In-memory cache + persistent file storage
let db: CampusDatabase = {
  rooms: [...INITIAL_ROOMS],
  bookings: [...INITIAL_BOOKINGS],
  announcements: [...INITIAL_ANNOUNCEMENTS],
  timetable: [...INITIAL_TIMETABLE],
  scheduleChanges: [...INITIAL_SCHEDULE_CHANGES],
};

function ensureDbLoaded() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (parsed.rooms && parsed.bookings && parsed.announcements) {
        db = {
          rooms: parsed.rooms,
          bookings: parsed.bookings,
          announcements: parsed.announcements,
          timetable: parsed.timetable || [...INITIAL_TIMETABLE],
          scheduleChanges: (parsed.scheduleChanges && parsed.scheduleChanges.length > 0) ? parsed.scheduleChanges : [...INITIAL_SCHEDULE_CHANGES],
        };
        saveDb();
        return;
      }
    }
    // Initialize default seed
    saveDb();
  } catch (err) {
    console.error('Error loading campus_db.json, using in-memory seed:', err);
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting campus_db.json:', err);
  }
}

ensureDbLoaded();

// Time collision detector: returns true if intervals overlap
function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  // Overlap condition: startA < endB && endA > startB
  return startA < endB && endA > startB;
}

// Helper to find alternatives when a room is unavailable
function findAlternativeRooms(
  requestedRoom: Room,
  date: string,
  startTime: string,
  endTime: string,
  requiredCapacity: number
): Room[] {
  // Find all active bookings on that date overlapping with the requested time
  const occupiedRoomIds = new Set(
    db.bookings
      .filter((b) => b.date === date && b.status === 'Confirmed' && isTimeOverlapping(startTime, endTime, b.startTime, b.endTime))
      .map((b) => b.roomId)
  );

  // Candidate rooms: not the requested room, not in maintenance, capacity >= requiredCapacity, not occupied
  const candidates = db.rooms.filter((r) => {
    if (r.id === requestedRoom.id) return false;
    if (r.isMaintenance) return false;
    if (r.type === 'Office' || r.type === 'Library') return false; // Not standard classrooms for general booking
    if (r.capacity < requiredCapacity) return false;
    if (occupiedRoomIds.has(r.id)) return false;
    return true;
  });

  // Rank alternatives:
  // 1. Same building, same floor
  // 2. Same building, other floor
  // 3. Deeksha Bhawan (~100m away, spacious lecture amphitheaters)
  // 4. Capacity closeness
  candidates.sort((a, b) => {
    const aSameBldg = a.building === requestedRoom.building ? 1 : 0;
    const bSameBldg = b.building === requestedRoom.building ? 1 : 0;
    if (aSameBldg !== bSameBldg) return bSameBldg - aSameBldg;

    const aSameFloor = a.floor === requestedRoom.floor ? 1 : 0;
    const bSameFloor = b.floor === requestedRoom.floor ? 1 : 0;
    if (aSameFloor !== bSameFloor) return bSameFloor - aSameFloor;

    // Proximity to required capacity (least excess capacity waste)
    const aCapDiff = Math.abs(a.capacity - requiredCapacity);
    const bCapDiff = Math.abs(b.capacity - requiredCapacity);
    return aCapDiff - bCapDiff;
  });

  return candidates.slice(0, 5); // Return top 5 best matches
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ==================== REST API ENDPOINTS ====================

  // System Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      institution: 'DDUGU IET & Deeksha Bhawan',
      version: '1.0.0',
      roomsCount: db.rooms.length,
      bookingsCount: db.bookings.length,
      serverTime: new Date().toISOString(),
    });
  });

  // Get all rooms (with optional availability filter by date & time)
  app.get('/api/rooms', (req: Request, res: Response) => {
    const { building, floor, type, minCapacity, date, startTime, endTime } = req.query;

    let filtered = [...db.rooms];

    if (building && typeof building === 'string' && building !== 'All') {
      filtered = filtered.filter((r) => r.building.toLowerCase() === building.toLowerCase());
    }

    if (floor && typeof floor === 'string' && floor !== 'All') {
      filtered = filtered.filter((r) => r.floor.toLowerCase() === floor.toLowerCase());
    }

    if (type && typeof type === 'string' && type !== 'All') {
      filtered = filtered.filter((r) => r.type.toLowerCase() === type.toLowerCase());
    }

    if (minCapacity && typeof minCapacity === 'string') {
      const cap = parseInt(minCapacity, 10);
      if (!isNaN(cap)) {
        filtered = filtered.filter((r) => r.capacity >= cap);
      }
    }

    // Attach occupancy state
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMins}`;

    const targetDate = typeof date === 'string' && date ? date : todayStr;
    const targetStart = typeof startTime === 'string' && startTime ? startTime : '00:00';
    const targetEnd = typeof endTime === 'string' && endTime ? endTime : '23:59';

    const enriched = filtered.map((room) => {
      // Find active booking happening right now in real time
      const activeNowBooking = db.bookings.find(
        (b) =>
          b.roomId === room.id &&
          b.date === todayStr &&
          b.status === 'Confirmed' &&
          isTimeOverlapping(currentTime, currentTime, b.startTime, b.endTime)
      ) || null;

      // Find booking overlapping query window
      const currentBooking = db.bookings.find(
        (b) =>
          b.roomId === room.id &&
          b.date === targetDate &&
          b.status === 'Confirmed' &&
          isTimeOverlapping(targetStart, targetEnd, b.startTime, b.endTime)
      ) || null;

      let status: 'Available' | 'Booked' | 'Occupied' | 'Maintenance' = 'Available';
      if (room.isMaintenance) {
        status = 'Maintenance';
      } else if (activeNowBooking && targetDate === todayStr && isTimeOverlapping(currentTime, currentTime, targetStart, targetEnd)) {
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

    res.json(enriched);
  });

  // Get single room details with full booking history
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomBookings = db.bookings
      .filter((b) => b.roomId === room.id && b.status === 'Confirmed')
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

    res.json({
      room,
      bookings: roomBookings,
    });
  });

  // Admin: Toggle room maintenance status
  app.patch('/api/rooms/:id/status', (req: Request, res: Response) => {
    const { isMaintenance, maintenanceReason } = req.body;
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.isMaintenance = Boolean(isMaintenance);
    room.maintenanceReason = maintenanceReason || (isMaintenance ? 'Under scheduled maintenance' : undefined);
    saveDb();

    res.json({ success: true, room });
  });

  // Admin: Add new room record
  app.post('/api/rooms', (req: Request, res: Response) => {
    const { code, name, building, floor, capacity, type, amenities, description } = req.body;
    if (!code || !name || !building || !floor || !capacity) {
      return res.status(400).json({ error: 'Missing required room fields.' });
    }
    const existing = db.rooms.find((r) => r.code.toLowerCase() === code.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: `Room with code ${code} already exists.` });
    }

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      building,
      floor,
      capacity: Number(capacity),
      type: type || 'Classroom',
      amenities: Array.isArray(amenities) && amenities.length > 0 ? amenities : ['Projector', 'Air Conditioned', 'Whiteboard'],
      description: description || 'Academic classroom facility',
      isMaintenance: false,
      distanceFromIETMeters: building === 'IET' ? 0 : 100,
    };

    db.rooms.push(newRoom);
    saveDb();
    res.status(201).json({ success: true, room: newRoom });
  });

  // Check booking conflict with alternative suggestion engine
  app.post('/api/bookings/check-conflict', (req: Request, res: Response) => {
    const { roomId, date, startTime, endTime, capacity } = req.body;

    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Invalid room selected' });
    }

    if (room.isMaintenance) {
      const alternatives = findAlternativeRooms(room, date, startTime, endTime, capacity || 40);
      return res.json({
        hasConflict: true,
        message: `${room.name} (${room.code}) is currently marked under MAINTENANCE: ${room.maintenanceReason || 'Facility unavailable'}.`,
        availableAlternatives: alternatives,
      });
    }

    const conflicting = db.bookings.find(
      (b) =>
        b.roomId === roomId &&
        b.date === date &&
        b.status === 'Confirmed' &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );

    if (conflicting) {
      const alternatives = findAlternativeRooms(room, date, startTime, endTime, capacity || conflicting.expectedStudents || 40);
      return res.json({
        hasConflict: true,
        conflictingBooking: conflicting,
        message: `Conflict detected! ${room.code} is already booked from ${conflicting.startTime} to ${conflicting.endTime} by ${conflicting.facultyName} for "${conflicting.subject}" (${conflicting.purpose}).`,
        availableAlternatives: alternatives,
      });
    }

    res.json({
      hasConflict: false,
      message: `${room.name} (${room.code}) is completely free and available during this slot.`,
      availableAlternatives: [],
    });
  });

  // Get bookings list
  app.get('/api/bookings', (req: Request, res: Response) => {
    const { date, roomId, facultyEmail, status } = req.query;
    let list = [...db.bookings];

    if (date && typeof date === 'string') {
      list = list.filter((b) => b.date === date);
    }
    if (roomId && typeof roomId === 'string') {
      list = list.filter((b) => b.roomId === roomId);
    }
    if (facultyEmail && typeof facultyEmail === 'string') {
      list = list.filter((b) => b.facultyEmail.toLowerCase() === facultyEmail.toLowerCase());
    }
    if (status && typeof status === 'string' && status !== 'All') {
      list = list.filter((b) => b.status === status);
    }

    // Sort newest date & start time first
    list.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

    res.json(list);
  });

  // Create new booking with strict conflict validation
  app.post('/api/bookings', (req: Request, res: Response) => {
    const {
      roomId,
      date,
      startTime,
      endTime,
      durationMinutes,
      facultyName,
      facultyDept,
      facultyEmail,
      courseCode,
      subject,
      purpose,
      expectedStudents,
      notes,
    } = req.body;

    if (!roomId || !date || !startTime || !endTime || !facultyName || !subject) {
      return res.status(400).json({ error: 'Missing required booking details.' });
    }

    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    if (room.isMaintenance) {
      return res.status(400).json({
        error: `Cannot book ${room.code}: Room is under maintenance.`,
      });
    }

    // Double-check for conflicts
    const conflict = db.bookings.find(
      (b) =>
        b.roomId === roomId &&
        b.date === date &&
        b.status === 'Confirmed' &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );

    if (conflict) {
      const alternatives = findAlternativeRooms(room, date, startTime, endTime, expectedStudents || 50);
      return res.status(409).json({
        error: 'Booking conflict: Slot was just reserved by another faculty.',
        conflictingBooking: conflict,
        availableAlternatives: alternatives,
      });
    }

    const passCode = `CC-DDU-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      building: room.building,
      floor: room.floor,
      facultyName,
      facultyDept: facultyDept || 'Engineering & Technology',
      facultyEmail: facultyEmail || 'faculty@ddugu.ac.in',
      courseCode: courseCode || 'ENG-GEN',
      subject,
      purpose: purpose || 'Extra Class',
      date,
      startTime,
      endTime,
      durationMinutes: durationMinutes || 90,
      expectedStudents: Number(expectedStudents) || 60,
      status: 'Confirmed',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      passCode,
    };

    db.bookings.unshift(newBooking);
    saveDb();

    res.status(201).json({
      success: true,
      message: `Successfully booked ${room.code} for ${date} (${startTime} - ${endTime}).`,
      booking: newBooking,
    });
  });

  // Cancel booking
  app.delete('/api/bookings/:id', (req: Request, res: Response) => {
    const { cancellationReason } = req.body;
    const booking = db.bookings.find((b) => b.id === req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = cancellationReason || 'Cancelled by faculty/admin';
    saveDb();

    res.json({
      success: true,
      message: `Booking for ${booking.roomCode} cancelled.`,
      booking,
    });
  });

  // Admin: Approve or Reject Booking Request
  app.patch('/api/bookings/:id/approval', (req: Request, res: Response) => {
    const { action, note } = req.body; // 'approve' | 'reject'
    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (action === 'approve') {
      // Ensure no conflicting confirmed booking exists
      const conflict = db.bookings.find(
        (b) =>
          b.id !== booking.id &&
          b.roomId === booking.roomId &&
          b.date === booking.date &&
          b.status === 'Confirmed' &&
          isTimeOverlapping(booking.startTime, booking.endTime, b.startTime, b.endTime)
      );

      if (conflict) {
        return res.status(409).json({
          error: `Cannot approve: Slot conflicts with confirmed reservation ${conflict.passCode} (${conflict.facultyName}).`,
        });
      }

      booking.status = 'Confirmed';
      booking.approvalNote = note || 'Approved by Academic Administration';
    } else if (action === 'reject') {
      booking.status = 'Rejected';
      booking.rejectionReason = note || 'Rejected by Academic Administration';
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
    }

    saveDb();
    res.json({ success: true, booking, message: `Booking ${booking.passCode} marked as ${booking.status}.` });
  });

  // Schedule Changes & Reallocations
  app.get('/api/schedule-changes', (_req: Request, res: Response) => {
    res.json(db.scheduleChanges || []);
  });

  // Announcements CRUD
  app.get('/api/announcements', (_req: Request, res: Response) => {
    const sorted = [...db.announcements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/announcements', (req: Request, res: Response) => {
    const { title, content, author, authorRole, category, priority, targetAudience, affectedRoom, newRoom } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'Title, content, and author are required.' });
    }

    const newAnnouncement: Announcement = {
      id: `anc-${Date.now()}`,
      title,
      content,
      author,
      authorRole: authorRole || 'Administration',
      category: category || 'General Notice',
      priority: priority || 'Normal',
      targetAudience: targetAudience || 'All',
      createdAt: new Date().toISOString(),
      affectedRoom,
      newRoom,
    };

    db.announcements.unshift(newAnnouncement);
    saveDb();

    res.status(201).json({
      success: true,
      announcement: newAnnouncement,
    });
  });

  app.delete('/api/announcements/:id', (req: Request, res: Response) => {
    const initialLen = db.announcements.length;
    db.announcements = db.announcements.filter((a) => a.id !== req.params.id);
    if (db.announcements.length === initialLen) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    saveDb();
    res.json({ success: true, message: 'Announcement deleted.' });
  });

  // Timetable
  app.get('/api/timetable', (req: Request, res: Response) => {
    const { branch, semester, day } = req.query;
    let list = [...db.timetable];

    if (branch && typeof branch === 'string' && branch !== 'All') {
      list = list.filter((t) => t.branch.toLowerCase() === branch.toLowerCase());
    }
    if (semester && typeof semester === 'string' && semester !== 'All') {
      const sem = parseInt(semester, 10);
      if (!isNaN(sem)) {
        list = list.filter((t) => t.semester === sem);
      }
    }
    if (day && typeof day === 'string' && day !== 'All') {
      list = list.filter((t) => t.day.toLowerCase() === day.toLowerCase());
    }

    res.json(list);
  });

  // Overall Campus Stats
  app.get('/api/stats', (_req: Request, res: Response) => {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMins}`;

    const totalRooms = db.rooms.length;
    const maintenanceRooms = db.rooms.filter((r) => r.isMaintenance).length;

    // Active occupied right now
    const activeOccupiedIds = new Set(
      db.bookings
        .filter(
          (b) =>
            b.date === todayDate &&
            b.status === 'Confirmed' &&
            isTimeOverlapping(currentTime, currentTime, b.startTime, b.endTime)
        )
        .map((b) => b.roomId)
    );

    const occupiedRoomsNow = activeOccupiedIds.size;
    const availableRoomsNow = totalRooms - occupiedRoomsNow - maintenanceRooms;

    const todayBookingsCount = db.bookings.filter(
      (b) => b.date === todayDate && b.status === 'Confirmed'
    ).length;

    const ietRooms = db.rooms.filter((r) => r.building === 'IET');
    const deekshaRooms = db.rooms.filter((r) => r.building === 'Deeksha Bhawan');

    const ietOccupiedCount = ietRooms.filter((r) => activeOccupiedIds.has(r.id)).length;
    const deekshaOccupiedCount = deekshaRooms.filter((r) => activeOccupiedIds.has(r.id)).length;

    const ietOccupancyRate = ietRooms.length ? Math.round((ietOccupiedCount / ietRooms.length) * 100) : 0;
    const deekshaOccupancyRate = deekshaRooms.length ? Math.round((deekshaOccupiedCount / deekshaRooms.length) * 100) : 0;

    res.json({
      totalRooms,
      availableRoomsNow: Math.max(0, availableRoomsNow),
      occupiedRoomsNow,
      todayBookingsCount,
      maintenanceRooms,
      ietOccupancyRate,
      deekshaOccupancyRate,
      activeAnnouncementsCount: db.announcements.length,
      serverTime: now.toISOString(),
    });
  });

  // ==================== AI SMART ROOM RECOMMENDATION ====================
  app.post('/api/recommendations', async (req: Request, res: Response) => {
    try {
      const {
        capacity = 50,
        buildingPreference = 'All',
        date,
        startTime,
        endTime,
        purpose = 'Extra Class',
        preferredRoomId,
      } = req.body;

      const numCapacity = parseInt(String(capacity), 10) || 50;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const targetStart = startTime || '10:00';
      const targetEnd = endTime || '11:30';

      // 1. Analyze Preferred Room if specified
      let preferredRoomStatus: { isAvailable: boolean; room?: Room; conflictReason?: string } | undefined = undefined;
      if (preferredRoomId) {
        const prefRoom = db.rooms.find((r) => r.id === preferredRoomId || r.code === preferredRoomId);
        if (prefRoom) {
          if (prefRoom.isMaintenance) {
            preferredRoomStatus = {
              isAvailable: false,
              room: prefRoom,
              conflictReason: `Room is currently under maintenance: ${prefRoom.maintenanceReason || 'Scheduled upkeep'}`,
            };
          } else {
            const conflict = db.bookings.find(
              (b) =>
                b.roomId === prefRoom.id &&
                b.date === targetDate &&
                b.status === 'Confirmed' &&
                isTimeOverlapping(targetStart, targetEnd, b.startTime, b.endTime)
            );
            if (conflict) {
              preferredRoomStatus = {
                isAvailable: false,
                room: prefRoom,
                conflictReason: `Booked by ${conflict.facultyName} (${conflict.subject}) from ${conflict.startTime} to ${conflict.endTime}`,
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

      // 2. Filter strictly available rooms with ZERO booking conflicts
      const availableRooms: Room[] = [];
      for (const room of db.rooms) {
        if (room.isMaintenance) continue;

        // Check overlapping confirmed bookings
        const hasConflict = db.bookings.some(
          (b) =>
            b.roomId === room.id &&
            b.date === targetDate &&
            b.status === 'Confirmed' &&
            isTimeOverlapping(targetStart, targetEnd, b.startTime, b.endTime)
        );

        if (!hasConflict) {
          availableRooms.push(room);
        }
      }

      // 3. Rule-based ranking & multi-objective scoring
      const scoredRooms = availableRooms.map((room) => {
        let score = 50; // base score for being available
        const reasons: string[] = ['Available during requested time (Verified zero conflict)'];

        // Capacity scoring:
        if (room.capacity >= numCapacity) {
          const excess = room.capacity - numCapacity;
          if (excess <= 15) {
            score += 35;
            reasons.push(`Best capacity match: Seats ${room.capacity} for ${numCapacity} students (Optimal efficiency)`);
          } else if (excess <= 35) {
            score += 25;
            reasons.push(`Good capacity match: Room holds ${room.capacity} seats with ample spacing`);
          } else {
            score += 15;
            reasons.push(`Spacious venue: Room capacity is ${room.capacity}`);
          }
        } else {
          score -= 30;
          reasons.push(`Below requested capacity (holds ${room.capacity} of ${numCapacity})`);
        }

        // Building preference scoring
        if (buildingPreference !== 'All') {
          if (room.building.toLowerCase() === buildingPreference.toLowerCase()) {
            score += 20;
            reasons.push(`Located in preferred ${room.building} (${room.floor})`);
          } else {
            score += 5;
            if (room.building === 'Deeksha Bhawan') {
              reasons.push(`Closest suitable building (~100m from IET Main Block)`);
            } else {
              reasons.push(`Alternative venue in IET Main Building`);
            }
          }
        } else {
          if (room.building === 'IET') {
            reasons.push(`Central IET Main Building (${room.floor})`);
          } else {
            reasons.push(`Deeksha Bhawan Complex (~100m, high capacity lecture hall)`);
          }
        }

        // Purpose fit
        if (purpose === 'Lab Practical' && room.type === 'Lab') {
          score += 20;
          reasons.push(`Specialized ${room.name} equipped for practical coursework`);
        } else if (purpose === 'Seminar/Workshop' && (room.type === 'Seminar Hall' || room.capacity >= 100)) {
          score += 20;
          reasons.push(`Equipped with seminar stage, acoustic setup, and large audience layout`);
        } else if (purpose === 'Mid-Term Exam' && room.capacity >= numCapacity * 1.25) {
          score += 15;
          reasons.push(`Adequate spacing for exam invigilation`);
        }

        const clampedScore = Math.min(99, Math.max(30, score));
        const tier = clampedScore >= 80 ? 'Top Match' : clampedScore >= 65 ? 'Great Alternative' : 'Backup Option';

        return {
          room,
          suitabilityScore: clampedScore,
          matchTier: tier as 'Top Match' | 'Great Alternative' | 'Backup Option',
          reasons,
          aiInsights: undefined as string | undefined,
          capacityFitRatio: Math.min(100, Math.round((numCapacity / room.capacity) * 100)),
          walkingDistanceMeters: room.distanceFromIETMeters || (room.building === 'IET' ? 0 : 100),
          isAiEnhanced: false,
        };
      });

      // Filter to only those with capacity >= numCapacity (or top by capacity if none reach it)
      let candidates = scoredRooms.filter((r) => r.room.capacity >= numCapacity);
      if (candidates.length === 0) {
        candidates = [...scoredRooms].sort((a, b) => b.room.capacity - a.room.capacity);
      }

      // Sort by suitabilityScore descending
      candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
      const topCandidates = candidates.slice(0, 5);

      // 4. AI Enhancement via Gemini if API Key is configured
      let source: 'ai_gemini' | 'rule_engine' = 'rule_engine';
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10 && topCandidates.length > 0) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are the CampusConnect AI Room Scheduling Assistant for DDUGU IET and Deeksha Bhawan.
Faculty Request:
- Required Capacity: ${numCapacity} students
- Building Preference: ${buildingPreference}
- Date: ${targetDate}
- Time Slot: ${targetStart} to ${targetEnd}
- Event/Class Purpose: ${purpose}
${preferredRoomStatus && !preferredRoomStatus.isAvailable ? `- Preferred Room Conflict: ${preferredRoomStatus.room?.code} is UNAVAILABLE (${preferredRoomStatus.conflictReason})` : ''}

Pre-vetted conflict-free candidate rooms:
${topCandidates.map((c, i) => `${i + 1}. Code: ${c.room.code}, Name: ${c.room.name}, Building: ${c.room.building}, Floor: ${c.room.floor}, Capacity: ${c.room.capacity}, Amenities: ${c.room.amenities.join(', ')}`).join('\n')}

For each candidate room, provide a short, professional 1-2 sentence academic rationale explaining why this room is suitable for the ${purpose} of ${numCapacity} students.
Return a valid JSON object in this format:
{
  "recommendations": [
    {
      "roomCode": "code_string",
      "aiInsights": "concise 1-2 sentence academic rationale"
    }
  ]
}`;

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI inference timeout')), 3500)
          );

          const geminiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const result = await Promise.race([geminiPromise, timeoutPromise]);

          if (result && result.text) {
            const aiData = JSON.parse(result.text);
            if (aiData.recommendations && Array.isArray(aiData.recommendations)) {
              source = 'ai_gemini';
              for (const rec of topCandidates) {
                const match = aiData.recommendations.find(
                  (item: { roomCode: string; aiInsights: string }) =>
                    item.roomCode?.toUpperCase() === rec.room.code.toUpperCase()
                );
                if (match && match.aiInsights) {
                  rec.aiInsights = match.aiInsights;
                  rec.isAiEnhanced = true;
                }
              }
            }
          }
        } catch (aiErr) {
          console.warn('Gemini AI recommendation refinement skipped, using rule engine:', aiErr);
          source = 'rule_engine';
        }
      }

      res.json({
        query: {
          capacity: numCapacity,
          buildingPreference,
          date: targetDate,
          startTime: targetStart,
          endTime: targetEnd,
          purpose,
          preferredRoomId,
        },
        preferredRoomStatus,
        recommendedRooms: topCandidates,
        source,
        totalAnalyzed: db.rooms.length,
        conflictFreeCount: availableRooms.length,
      });
    } catch (err: any) {
      console.error('Error generating room recommendations:', err);
      res.status(500).json({ error: 'Failed to generate recommendations.' });
    }
  });

  // Reset Demo Data
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    db = {
      rooms: [...INITIAL_ROOMS],
      bookings: [...INITIAL_BOOKINGS],
      announcements: [...INITIAL_ANNOUNCEMENTS],
      timetable: [...INITIAL_TIMETABLE],
      scheduleChanges: [...INITIAL_SCHEDULE_CHANGES],
    };
    saveDb();
    res.json({ success: true, message: 'CampusConnect database reset to initial verified DEMO state.' });
  });

  // ==================== VITE SPA INTEGRATION ====================
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusConnect Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting CampusConnect server:', err);
  process.exit(1);
});
