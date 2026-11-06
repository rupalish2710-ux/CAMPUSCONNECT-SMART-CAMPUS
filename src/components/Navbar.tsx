import React from 'react';
import { UserRole, UserProfile } from '../types/campus';
import { 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  PlusCircle, 
  Sparkles,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onOpenBookingModal: () => void;
  onResetDemo: () => void;
}

export const USER_PROFILES: Record<UserRole, UserProfile> = {
  faculty: {
    role: 'faculty',
    name: 'Dr. S. K. Singh',
    designation: 'Associate Professor',
    department: 'Computer Science & Engineering',
    idNumber: 'FAC-DDU-409',
  },
  student: {
    role: 'student',
    name: 'Rahul Sharma',
    designation: 'B.Tech Student (5th Sem)',
    department: 'Computer Science & Engineering',
    idNumber: 'STU-2023-CS-042',
    branch: 'CSE',
    year: 3,
    semester: 5,
    section: 'A',
    enrollmentNo: 'DDU/IET/2023/1042',
  },
  admin: {
    role: 'admin',
    name: 'Prof. R. P. Verma',
    designation: 'Estate & Academic Registrar',
    department: 'Administrative & Faculty Directorate',
    idNumber: 'ADM-DDU-001',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onRoleChange,
  onOpenBookingModal,
  onResetDemo,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Institutional Top Bar Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-6 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">Deen Dayal Upadhyaya Gorakhpur University</span>
          <span className="text-slate-500">·</span>
          <span>Faculty of Engineering & Technology (IET) & Deeksha Bhawan</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-amber-400 font-semibold">[DEMO ENVIRONMENT]</span>
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset to initial seed records"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Action & Role) */}
      <div className="flex items-center justify-between gap-6 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              CampusConnect
            </div>
            <div className="text-xs text-slate-500 font-medium -mt-0.5 whitespace-nowrap">
              Smart Campus Management System
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('ai-recommender')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
              currentTab === 'ai-recommender'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>AI Finder</span>
          </button>
          <button
            onClick={() => onTabChange('student-dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'student-dashboard'
                ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Portal
          </button>
          <button
            onClick={() => onTabChange('search')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'search'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Room Availability
          </button>
          <button
            onClick={() => onTabChange('timetable')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'timetable'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => onTabChange('announcements')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'announcements'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Notices
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'history'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => onTabChange('admin')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'admin'
                ? 'bg-white text-purple-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Console
          </button>
          <button
            onClick={() => onTabChange('tests')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'tests'
                ? 'bg-white text-emerald-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tests
          </button>
        </nav>

        {/* Zone 3: Interactive Role Switcher & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Faculty Quick Book CTA */}
          {currentUser.role !== 'student' ? (
            <button
              onClick={onOpenBookingModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Room</span>
            </button>
          ) : (
            <div className="text-xs text-slate-500 hidden sm:block whitespace-nowrap">
              Student Mode (View Only)
            </div>
          )}

          {/* Role Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
              aria-label="Switch demo role persona"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 border border-slate-200">
                {currentUser.role === 'faculty' && <UserCheck className="w-3.5 h-3.5" />}
                {currentUser.role === 'student' && <GraduationCap className="w-3.5 h-3.5" />}
                {currentUser.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  Role: <span className="font-medium text-blue-600">{currentUser.role}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs"
                onMouseLeave={() => setRoleDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role Persona
                </div>

                <button
                  onClick={() => {
                    onRoleChange('faculty');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'faculty' ? 'bg-blue-50/70 text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Faculty: Dr. S. K. Singh</div>
                    <div className="text-[11px] text-slate-500">Book extra classes, resolve conflicts, reserve labs</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onRoleChange('student');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'student' ? 'bg-blue-50/70 text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Student: Rahul Sharma</div>
                    <div className="text-[11px] text-slate-500">Check class venue updates & live schedule (Read-only)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onRoleChange('admin');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'admin' ? 'bg-blue-50/70 text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Admin: Prof. R. P. Verma</div>
                    <div className="text-[11px] text-slate-500">Maintenance locks, notice broadcasts, overrides</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
