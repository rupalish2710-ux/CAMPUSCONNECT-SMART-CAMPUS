/**
 * CampusConnect Types & Schema Definitions
 * Covers DDUGU IET (Faculty of Engineering & Technology) and Deeksha Bhawan
 */

export type Building = 'IET' | 'Deeksha Bhawan';

export type Floor = 'Ground Floor' | '1st Floor' | '2nd Floor';

export type RoomType = 'Classroom' | 'Lab' | 'Seminar Hall' | 'Facility' | 'Office' | 'Library';

export type RoomAvailabilityStatus = 'Available' | 'Booked' | 'Occupied' | 'Maintenance';

export interface Room {
  id: string;
  code: string; // e.g., 'IET17', 'IET32', 'LH01'
  name: string; // e.g., 'CSE Department Lecture Room'
  building: Building;
  floor: Floor;
  capacity: number;
  type: RoomType;
  amenities: string[];
  description: string;
  isMaintenance: boolean;
  maintenanceReason?: string;
  distanceFromIETMeters?: number; // 0 for IET, ~100 for Deeksha Bhawan
}

export interface EnrichedRoom extends Room {
  status: RoomAvailabilityStatus;
  isOccupied: boolean;
  currentBooking: Booking | null; // Booking overlapping the query slot
  activeNowBooking: Booking | null; // Booking running actively right now
}

export type BookingPurpose = 
  | 'Regular Class'
  | 'Extra Class'
  | 'Mid-Term Exam'
  | 'Lab Practical'
  | 'Seminar/Workshop'
  | 'Department Meeting';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  building: Building;
  floor: Floor;
  facultyName: string;
  facultyDept: string;
  facultyEmail: string;
  courseCode: string;
  subject: string;
  purpose: BookingPurpose;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24-hr format, e.g. "10:00")
  endTime: string; // HH:MM (24-hr format, e.g. "11:30")
  durationMinutes: number;
  expectedStudents: number;
  status: BookingStatus;
  notes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  approvalNote?: string;
  createdAt: string;
  passCode: string; // Unique printable receipt pass code e.g. CC-2026-8941
}

export type AnnouncementCategory = 
  | 'Room Relocation'
  | 'Exam Notice'
  | 'Lab Schedule'
  | 'General Notice';

export type AnnouncementPriority = 'Normal' | 'Important' | 'Urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetAudience: 'All' | 'Students' | 'Faculty';
  createdAt: string;
  affectedRoom?: string;
  newRoom?: string;
}

export interface ScheduleChange {
  id: string;
  courseCode: string;
  subject: string;
  originalRoom: string;
  newRoom: string;
  date: string;
  timeSlot: string;
  reason: string;
  facultyName: string;
  updatedAt: string;
}

export type UserRole = 'faculty' | 'student' | 'admin';

export interface UserProfile {
  role: UserRole;
  name: string;
  designation: string;
  department: string;
  idNumber: string;
  branch?: 'CSE' | 'ME' | 'ECE' | 'IT';
  year?: number; // 1, 2, 3, 4
  semester?: number; // 1-8
  section?: string;
  enrollmentNo?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  message: string;
  availableAlternatives?: Room[];
}

export interface CampusStats {
  totalRooms: number;
  availableRoomsNow: number;
  occupiedRoomsNow: number;
  todayBookingsCount: number;
  maintenanceRooms: number;
  ietOccupancyRate: number;
  deekshaOccupancyRate: number;
  activeAnnouncementsCount: number;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  branch: 'CSE' | 'ME' | 'ECE' | 'IT';
  semester: number; // 1-8
  subject: string;
  courseCode: string;
  facultyName: string;
  roomId: string;
  roomCode: string;
  building: Building;
  type: 'Lecture' | 'Lab' | 'Tutorial';
}

export interface SmartRoomRecommendation {
  room: Room;
  suitabilityScore: number; // 0 to 100
  matchTier: 'Top Match' | 'Great Alternative' | 'Backup Option';
  reasons: string[];
  aiInsights?: string;
  capacityFitRatio: number; // percentage match
  walkingDistanceMeters: number;
  isAiEnhanced: boolean;
}

export interface RecommendationRequest {
  capacity: number;
  buildingPreference: 'All' | 'IET' | 'Deeksha Bhawan';
  date: string;
  startTime: string;
  endTime: string;
  purpose: BookingPurpose;
  preferredRoomId?: string;
}

export interface RecommendationResponse {
  query: RecommendationRequest;
  preferredRoomStatus?: {
    isAvailable: boolean;
    room?: Room;
    conflictReason?: string;
  };
  recommendedRooms: SmartRoomRecommendation[];
  source: 'ai_gemini' | 'rule_engine';
  totalAnalyzed: number;
  conflictFreeCount: number;
}

