import React from 'react';
import { UserRole } from '../types/campus';
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  BellRing,
  History,
  Shield,
  MapPin,
  Building,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  selectedBuildingFilter: string;
  onBuildingFilterChange: (bldg: string) => void;
  onOpenCampusMap: () => void;
  todayBookingsCount: number;
  unreadAnnouncementsCount: number;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  userRole,
  selectedBuildingFilter,
  onBuildingFilterChange,
  onOpenCampusMap,
  todayBookingsCount,
  unreadAnnouncementsCount,
  pendingApprovalsCount = 0,
}) => {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-80px)]">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                <span>Dashboard Overview</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange('ai-recommender')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'ai-recommender'
                  ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600 pl-2.5'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI Smart Recommender</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                AI
              </span>
            </button>

            <button
              onClick={() => onTabChange('student-dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'student-dashboard'
                  ? 'bg-indigo-50 text-indigo-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Student Dashboard</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                Live
              </span>
            </button>

            <button
              onClick={() => onTabChange('search')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'search'
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-500" />
                <span>Room Search & Matrix</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange('timetable')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'timetable'
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>Academic Timetable</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange('announcements')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'announcements'
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4 text-amber-500" />
                <span>Official Announcements</span>
              </div>
              {unreadAnnouncementsCount > 0 && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Booking History</span>
              </div>
              {todayBookingsCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {todayBookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-purple-50 text-purple-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Facility Console</span>
              </div>
              {pendingApprovalsCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('tests')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'tests'
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Conflict Test Suite</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Run
              </span>
            </button>
          </nav>
        </div>

        {/* Building Filter Quick Selector */}
        <div className="pt-2 border-t border-slate-100">
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Campus Complex</span>
            <button 
              onClick={onOpenCampusMap}
              className="text-blue-600 hover:text-blue-800 text-[10px] normal-case flex items-center gap-0.5 cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>Map View</span>
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => onBuildingFilterChange('All')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                selectedBuildingFilter === 'All'
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>All Campus Facilities</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">25+</span>
            </button>

            <button
              onClick={() => onBuildingFilterChange('IET')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                selectedBuildingFilter === 'IET'
                  ? 'bg-blue-50 text-blue-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <div>
                  <div>IET Building</div>
                  <div className="text-[10px] text-slate-400 font-normal">Ground, 1st & 2nd Fl.</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-blue-700 font-medium">14</span>
            </button>

            <button
              onClick={() => onBuildingFilterChange('Deeksha Bhawan')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                selectedBuildingFilter === 'Deeksha Bhawan'
                  ? 'bg-purple-50 text-purple-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-purple-600" />
                <div>
                  <div>Deeksha Bhawan</div>
                  <div className="text-[10px] text-slate-400 font-normal">LH01 to LH12 (~100m)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-purple-700 font-medium">12</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proximity & Overflow Architecture Callout */}
      <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-slate-600 leading-snug">
            <span className="font-semibold text-slate-900 block mb-0.5">Automated Alternative Routing</span>
            When IET lecture rooms are occupied, CampusConnect instantly matches free amphitheaters in Deeksha Bhawan.
          </div>
        </div>
      </div>
    </aside>
  );
};
