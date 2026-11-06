import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, UserProfile, Room, Booking, Announcement, TimetableSlot, CampusStats, EnrichedRoom, ScheduleChange } from './types/campus';
import { campusApi } from './services/api';
import { Navbar, USER_PROFILES } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RoomSearchView } from './components/RoomSearchView';
import { StudentTimetableView } from './components/StudentTimetableView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { SmartRoomRecommenderView } from './components/SmartRoomRecommenderView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { BookingHistoryView } from './components/BookingHistoryView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { BookingModal } from './components/BookingModal';
import { CampusMapModal } from './components/CampusMapModal';
import { ConflictTestRunner } from './components/ConflictTestRunner';
import { Loader2, RefreshCw, Shield } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('faculty');
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES.faculty);
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('All');

  // Core Data States
  const [rooms, setRooms] = useState<EnrichedRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([]);
  const [stats, setStats] = useState<CampusStats>({
    totalRooms: 26,
    availableRoomsNow: 22,
    occupiedRoomsNow: 3,
    todayBookingsCount: 5,
    maintenanceRooms: 1,
    ietOccupancyRate: 40,
    deekshaOccupancyRate: 30,
    activeAnnouncementsCount: 4,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCampusMapModalOpen, setIsCampusMapModalOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);
  const [prefillBookingDetails, setPrefillBookingDetails] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    purpose?: Booking['purpose'];
    expectedStudents?: number;
  } | undefined>(undefined);

  // Fetch all core datasets
  const loadData = useCallback(async () => {
    try {
      const [roomsData, bookingsData, ancData, ttData, statsData, scData] = await Promise.all([
        campusApi.getRooms(),
        campusApi.getBookings(),
        campusApi.getAnnouncements(),
        campusApi.getTimetable(),
        campusApi.getStats(),
        campusApi.getScheduleChanges(),
      ]);

      setRooms(roomsData);
      setBookings(bookingsData);
      setAnnouncements(ancData);
      setTimetable(ttData);
      setStats(statsData);
      setScheduleChanges(scData);
    } catch (err) {
      console.error('Failed to load campus records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle role persona change
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    setCurrentUser(USER_PROFILES[newRole]);

    if (newRole === 'student') {
      setCurrentTab('student-dashboard');
    } else if (newRole === 'admin') {
      setCurrentTab('admin');
    } else if (newRole === 'faculty') {
      if (currentTab === 'admin' || currentTab === 'student-dashboard') {
        setCurrentTab('dashboard');
      }
    }
  };

  // Open booking modal
  const handleOpenBookingModal = (
    roomId?: string,
    prefill?: { date: string; startTime: string; endTime: string; purpose?: Booking['purpose']; expectedStudents?: number }
  ) => {
    if (currentUser.role === 'student') {
      alert('Students have view-only access. Room booking is restricted to faculty & administration.');
      return;
    }
    setPreselectedRoomId(roomId);
    setPrefillBookingDetails(prefill);
    setIsBookingModalOpen(true);
  };

  // On successful booking
  const handleBookingSuccess = (newBooking: Booking) => {
    loadData();
  };

  // Reset demo records
  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo bookings, notices, and room states to original factory state?')) {
      setIsLoading(true);
      await campusApi.resetDemo();
      await loadData();
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.date === todayStr && b.status === 'Confirmed');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenBookingModal={() => handleOpenBookingModal()}
        onResetDemo={handleResetDemo}
      />

      {/* Main Layout Canvas: Sidebar + Dynamic Main Viewport */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          userRole={userRole}
          selectedBuildingFilter={selectedBuildingFilter}
          onBuildingFilterChange={(bldg) => {
            setSelectedBuildingFilter(bldg);
            if (currentTab !== 'search' && currentTab !== 'dashboard') {
              setCurrentTab('search');
            }
          }}
          onOpenCampusMap={() => setIsCampusMapModalOpen(true)}
          todayBookingsCount={todayBookings.length}
          unreadAnnouncementsCount={announcements.length}
          pendingApprovalsCount={bookings.filter((b) => b.status === 'Pending').length}
        />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Connecting to Campus Central Registry...
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  rooms={rooms}
                  todayBookings={todayBookings}
                  announcements={announcements}
                  currentUser={currentUser}
                  onNavigateTab={(tab, filter) => {
                    setCurrentTab(tab);
                    if (filter?.building) setSelectedBuildingFilter(filter.building);
                  }}
                  onOpenBookingModal={handleOpenBookingModal}
                  onOpenCampusMap={() => setIsCampusMapModalOpen(true)}
                />
              )}

              {currentTab === 'ai-recommender' && (
                <SmartRoomRecommenderView
                  rooms={rooms}
                  currentUser={currentUser}
                  onOpenBookingModal={handleOpenBookingModal}
                  onOpenCampusMap={() => setIsCampusMapModalOpen(true)}
                />
              )}

              {currentTab === 'student-dashboard' && (
                <StudentDashboardView
                  currentUser={currentUser}
                  timetable={timetable}
                  announcements={announcements}
                  scheduleChanges={scheduleChanges}
                  rooms={rooms}
                  onOpenCampusMap={() => setIsCampusMapModalOpen(true)}
                  onNavigateTab={setCurrentTab}
                />
              )}

              {currentTab === 'search' && (
                <RoomSearchView
                  rooms={rooms}
                  currentUser={currentUser}
                  initialBuildingFilter={selectedBuildingFilter}
                  onOpenBookingModal={handleOpenBookingModal}
                  onOpenCampusMap={() => setIsCampusMapModalOpen(true)}
                  onNavigateTab={setCurrentTab}
                />
              )}

              {currentTab === 'timetable' && (
                <StudentTimetableView
                  timetable={timetable}
                  announcements={announcements}
                  currentUser={currentUser}
                  onOpenCampusMap={() => setIsCampusMapModalOpen(true)}
                  onNavigateTab={setCurrentTab}
                />
              )}

              {currentTab === 'announcements' && (
                <AnnouncementsView
                  announcements={announcements}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'history' && (
                <BookingHistoryView
                  bookings={bookings}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'admin' && (
                currentUser.role === 'admin' ? (
                  <AdminConsoleView
                    rooms={rooms}
                    bookings={bookings}
                    announcements={announcements}
                    stats={stats}
                    currentUser={currentUser}
                    onRefresh={loadData}
                    onResetDemo={handleResetDemo}
                  />
                ) : (
                  <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-8 text-center max-w-xl mx-auto my-12 shadow-xs">
                    <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-purple-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Administrative Privileges Required</h3>
                    <p className="text-xs text-slate-600 mb-5 max-w-md mx-auto leading-relaxed">
                      You are currently browsing with the <span className="font-semibold capitalize text-slate-900">{currentUser.role}</span> persona. Switch to the Administrator role to access room inventory records, approve booking queues, add facilities, and publish official circulars.
                    </p>
                    <button
                      onClick={() => handleRoleChange('admin')}
                      className="px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 active:bg-purple-900 transition-colors shadow-xs cursor-pointer"
                    >
                      Switch to Administrator Persona (Prof. R. P. Verma)
                    </button>
                  </div>
                )
              )}

              {currentTab === 'tests' && (
                <ConflictTestRunner
                  rooms={rooms}
                  onRefreshData={loadData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Booking Dialog */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPreselectedRoomId(undefined);
          setPrefillBookingDetails(undefined);
        }}
        rooms={rooms}
        currentUser={currentUser}
        preselectedRoomId={preselectedRoomId}
        prefillDetails={prefillBookingDetails}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Global Campus Map Dialog */}
      <CampusMapModal
        isOpen={isCampusMapModalOpen}
        onClose={() => setIsCampusMapModalOpen(false)}
        rooms={rooms}
        onSelectRoom={(roomId) => {
          handleOpenBookingModal(roomId);
        }}
      />

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">CampusConnect</span>
            <span>·</span>
            <span>Faculty of Engineering & Technology (IET) and Deeksha Bhawan</span>
            <span>·</span>
            <span>Deen Dayal Upadhyaya Gorakhpur University</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>[DEMO DATA ENVIRONMENT]</span>
            <span>·</span>
            <span>Zero-Conflict Engine v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
