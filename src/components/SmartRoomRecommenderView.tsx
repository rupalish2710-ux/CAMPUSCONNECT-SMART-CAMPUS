import React, { useState, useEffect } from 'react';
import {
  Room,
  BookingPurpose,
  UserProfile,
  RecommendationResponse,
  SmartRoomRecommendation,
  EnrichedRoom
} from '../types/campus';
import { campusApi } from '../services/api';
import {
  Sparkles,
  Search,
  Building2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  ChevronRight,
  MapPin,
  Bot,
  Sliders,
  Check,
  RefreshCw,
  ExternalLink,
  Zap,
  HelpCircle
} from 'lucide-react';

interface SmartRoomRecommenderViewProps {
  rooms: EnrichedRoom[];
  currentUser: UserProfile;
  onOpenBookingModal: (
    roomId?: string,
    prefill?: { date: string; startTime: string; endTime: string; purpose?: BookingPurpose; expectedStudents?: number }
  ) => void;
  onOpenCampusMap: () => void;
}

export const SmartRoomRecommenderView: React.FC<SmartRoomRecommenderViewProps> = ({
  rooms,
  currentUser,
  onOpenBookingModal,
  onOpenCampusMap,
}) => {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // Form Inputs
  const [capacityInput, setCapacityInput] = useState<number>(60);
  const [buildingPref, setBuildingPref] = useState<'All' | 'IET' | 'Deeksha Bhawan'>('All');
  const [dateInput, setDateInput] = useState<string>(todayStr);
  const [startTimeInput, setStartTimeInput] = useState<string>('10:00');
  const [endTimeInput, setEndTimeInput] = useState<string>('11:30');
  const [purposeInput, setPurposeInput] = useState<BookingPurpose>('Extra Class');
  const [preferredRoomInput, setPreferredRoomInput] = useState<string>('');

  // Results & Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResponse | null>(null);
  const [hasRunSearch, setHasRunSearch] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time preset triggers
  const setQuickTimeSlot = (start: string, end: string) => {
    setStartTimeInput(start);
    setEndTimeInput(end);
  };

  // Run AI recommendation query
  const handleGenerateRecommendations = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setHasRunSearch(true);

    try {
      const response = await campusApi.getSmartRecommendations({
        capacity: capacityInput,
        buildingPreference: buildingPref,
        date: dateInput,
        startTime: startTimeInput,
        endTime: endTimeInput,
        purpose: purposeInput,
        preferredRoomId: preferredRoomInput || undefined,
      });

      setRecommendationResult(response);
    } catch (err: any) {
      console.error('Failed to get AI recommendations:', err);
      setErrorMessage(err.message || 'Unable to generate room recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial query on component mount so the page has immediate valuable recommendations
  useEffect(() => {
    handleGenerateRecommendations();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Institutional Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Assisted Academic Resource Optimization</span>
            <span className="text-white/40">·</span>
            <span className="text-emerald-300 font-mono text-[11px]">Strict Zero-Double-Booking Guarantee</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            AI Smart Room Recommender
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Specify student strength, time slot, and pedagogical purpose. CampusConnect cross-references real-time university registries,
            eliminates time collisions across <span className="text-white font-medium">IET Main</span> & <span className="text-white font-medium">Deeksha Bhawan</span>, and suggests the highest-fit classrooms.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Registry: 26+ Classrooms Connected</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-300" />
              <span>Deeksha Bhawan Overflow Routing Active (~100m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left (Col 1) & Results Right (Col 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= COLUMN 1: INTERACTIVE QUERY FORM ================= */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Booking Requirements
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">[FACULTY PORTAL]</span>
          </div>

          {/* Student Capacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Required Student Capacity</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                {capacityInput} Students
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="200"
              step="5"
              value={capacityInput}
              onChange={(e) => setCapacityInput(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            {/* Quick Capacity Presets */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 gap-1 pt-1">
              {[30, 60, 75, 120, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCapacityInput(preset)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors font-mono ${
                    capacityInput === preset
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Building Preference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Building Preference</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['All', 'IET', 'Deeksha Bhawan'] as const).map((bldg) => (
                <button
                  key={bldg}
                  type="button"
                  onClick={() => setBuildingPref(bldg)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    buildingPref === bldg
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {bldg === 'All' ? 'Any Building' : bldg}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Purpose</span>
              </label>
              <select
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value as BookingPurpose)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Extra Class">Extra Class</option>
                <option value="Mid-Term Exam">Mid-Term Exam</option>
                <option value="Lab Practical">Lab Practical</option>
                <option value="Seminar/Workshop">Seminar/Workshop</option>
                <option value="Department Meeting">Department Meeting</option>
                <option value="Regular Class">Regular Class</option>
              </select>
            </div>
          </div>

          {/* Time Slot Inputs & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Time Slot Window</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Start Time</span>
                <input
                  type="time"
                  value={startTimeInput}
                  onChange={(e) => setStartTimeInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">End Time</span>
                <input
                  type="time"
                  value={endTimeInput}
                  onChange={(e) => setEndTimeInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
            </div>

            {/* Quick time slot presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '09:00 - 10:30', start: '09:00', end: '10:30' },
                { label: '10:30 - 12:00', start: '10:30', end: '12:00' },
                { label: '14:00 - 15:30', start: '14:00', end: '15:30' },
                { label: '15:30 - 17:00', start: '15:30', end: '17:00' },
              ].map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => setQuickTimeSlot(slot.start, slot.end)}
                  className={`text-[10px] px-2 py-1 rounded border font-mono transition-colors cursor-pointer ${
                    startTimeInput === slot.start && endTimeInput === slot.end
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Preferred Room (Optional Test for Fallback/Conflict) */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Preferred Room to Check (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">Tests conflict alternatives</span>
            </div>
            <select
              value={preferredRoomInput}
              onChange={(e) => setPreferredRoomInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- No specific preference (Find all best rooms) --</option>
              <optgroup label="IET Building (Ground, 1st & 2nd Floor)">
                {rooms
                  .filter((r) => r.building === 'IET')
                  .map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.code} - {r.name} (Cap: {r.capacity})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Deeksha Bhawan (~100m)">
                {rooms
                  .filter((r) => r.building === 'Deeksha Bhawan')
                  .map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.code} - {r.name} (Cap: {r.capacity})
                    </option>
                  ))}
              </optgroup>
            </select>
            <p className="text-[10px] text-slate-400">
              Tip: Select <span className="font-mono text-slate-600">IET17</span> or <span className="font-mono text-slate-600">IET19</span> to observe automatic detection of busy slots and alternative suggestions.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleGenerateRecommendations}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Availability & Conflicts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Find AI Recommended Classrooms</span>
              </>
            )}
          </button>

          {/* Engine transparency footnote */}
          <div className="pt-2 text-[11px] text-slate-500 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Bot className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-semibold text-slate-700">Dual-Engine Architecture:</span> Combines real-time SQL/JSON zero-conflict logic with Gemini AI pedagogical rationale. If API connectivity is offline, the rule engine runs natively without interruption.
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: RECOMMENDATION RESULTS ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status / Query Summary Banner */}
          {recommendationResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Recommendation Analysis
                  </span>
                  {recommendationResult.source === 'ai_gemini' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Gemini AI Enhanced
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Rule Engine Verified
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-mono">
                  <span>Capacity: {recommendationResult.query.capacity}</span>
                  <span>·</span>
                  <span>{recommendationResult.query.date}</span>
                  <span>·</span>
                  <span>{recommendationResult.query.startTime} - {recommendationResult.query.endTime}</span>
                  <span>·</span>
                  <span>{recommendationResult.query.purpose}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-mono">
                  {recommendationResult.conflictFreeCount} Available
                </span>
                <button
                  onClick={onOpenCampusMap}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Map</span>
                </button>
              </div>
            </div>
          )}

          {/* Preferred Room Conflict / Alternative Notification (Feature 3) */}
          {recommendationResult?.preferredRoomStatus && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                recommendationResult.preferredRoomStatus.isAvailable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              {recommendationResult.preferredRoomStatus.isAvailable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                {recommendationResult.preferredRoomStatus.isAvailable ? (
                  <div>
                    <span className="font-bold">Preferred Room {recommendationResult.preferredRoomStatus.room?.code} is Available!</span>
                    <p className="mt-0.5 text-emerald-800">
                      {recommendationResult.preferredRoomStatus.room?.name} has zero conflicts during {recommendationResult.query.startTime}–{recommendationResult.query.endTime}.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span>Preferred Room {recommendationResult.preferredRoomStatus.room?.code} is UNAVAILABLE</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-normal">
                        Conflict Detected
                      </span>
                    </div>
                    <p className="mt-0.5 text-amber-900 leading-snug">
                      {recommendationResult.preferredRoomStatus.conflictReason}
                    </p>
                    <div className="mt-2 font-semibold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Recommended Alternative Classrooms Ranked Below:</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Running AI Room Recommendation Analysis</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Comparing available seats, proximity between IET and Deeksha Bhawan, and verifying zero overlapping bookings...
              </p>
            </div>
          )}

          {/* Error State */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Results List */}
          {!isLoading && recommendationResult && recommendationResult.recommendedRooms.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Top Recommended Venues ({recommendationResult.recommendedRooms.length})</span>
                <span className="text-slate-400 font-mono normal-case">Sorted by suitability & capacity match</span>
              </div>

              {recommendationResult.recommendedRooms.map((rec, index) => {
                const isTopMatch = index === 0;

                return (
                  <div
                    key={rec.room.id}
                    className={`bg-white rounded-xl border transition-all hover:shadow-md overflow-hidden ${
                      isTopMatch
                        ? 'border-blue-400 ring-2 ring-blue-500/10'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Tier Header Bar */}
                    <div
                      className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
                        isTopMatch
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                          : 'bg-slate-50/70 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isTopMatch
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Rank #{index + 1}
                        </span>
                        <span className="font-bold text-slate-900">{rec.matchTier}</span>
                        {rec.isAiEnhanced && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                            AI Validated
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-xs font-bold text-blue-700">
                          {rec.suitabilityScore}% Match
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Confirmed Zero Conflict
                        </span>
                      </div>
                    </div>

                    {/* Room Info Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Title & Specs */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold font-mono text-slate-900">
                              {rec.room.code}
                            </span>
                            <span className="text-xs text-slate-500">·</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {rec.room.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {rec.room.building}
                            </span>
                            <span>·</span>
                            <span>{rec.room.floor}</span>
                            <span>·</span>
                            <span className="text-slate-600">{rec.room.type}</span>
                            {rec.walkingDistanceMeters > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-purple-700 font-mono text-[11px]">
                                  ~{rec.walkingDistanceMeters}m walk from IET
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Capacity gauge badge */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 px-3 text-right shrink-0">
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            {rec.room.capacity} Total Seats
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {capacityInput} req ({rec.capacityFitRatio}% capacity fit)
                          </div>
                        </div>
                      </div>

                      {/* AI Rationale Paragraph (Feature 4 & 7) */}
                      {rec.aiInsights ? (
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-950 flex items-start gap-2.5">
                          <Bot className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-indigo-900 block mb-0.5">
                              AI Academic Rationale:
                            </span>
                            <p className="leading-relaxed">{rec.aiInsights}</p>
                          </div>
                        </div>
                      ) : null}

                      {/* Recommendation Reasons Badges (Feature 4) */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Why this classroom was selected:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.reasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium"
                            >
                              <Check className="w-3 h-3 text-blue-600" />
                              <span>{reason}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Amenities & Features */}
                      {rec.room.amenities.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-400">Amenities:</span>
                          {rec.room.amenities.map((am) => (
                            <span
                              key={am}
                              className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Bar: Book This Room Button (Feature 6) */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Immediate confirmation with official printable pass code</span>
                        </div>

                        <button
                          onClick={() => {
                            onOpenBookingModal(rec.room.id, {
                              date: dateInput,
                              startTime: startTimeInput,
                              endTime: endTimeInput,
                              purpose: purposeInput,
                              expectedStudents: capacityInput,
                            });
                          }}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                            isTopMatch
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Book {rec.room.code} Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State when no rooms match */}
          {!isLoading && hasRunSearch && recommendationResult && recommendationResult.recommendedRooms.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Direct Matches Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All classrooms with capacity &ge; {capacityInput} are currently booked or under maintenance during {startTimeInput}–{endTimeInput} on {dateInput}.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCapacityInput(Math.max(20, capacityInput - 20))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Reduce Capacity Requirement
                </button>
                <button
                  onClick={() => setBuildingPref('All')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Search Both Buildings
                </button>
                <button
                  onClick={() => setQuickTimeSlot('14:00', '15:30')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Try Afternoon Slot
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
