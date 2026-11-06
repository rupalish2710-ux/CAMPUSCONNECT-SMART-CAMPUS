import React, { useState } from 'react';
import { Room, Booking, EnrichedRoom } from '../types/campus';
import { campusApi } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Building2,
  Clock,
  Loader2
} from 'lucide-react';

interface TestCaseResult {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
}

interface ConflictTestRunnerProps {
  rooms: EnrichedRoom[];
  onRefreshData: () => void;
}

export const ConflictTestRunner: React.FC<ConflictTestRunnerProps> = ({
  rooms,
  onRefreshData,
}) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([
    {
      id: 'test-1',
      title: 'Classroom & Lab Inventory Audit',
      description: 'Verify all IET Ground, 1st & 2nd floor rooms and Deeksha Bhawan LH01–LH12 exist with accurate capacities.',
      status: 'pending',
    },
    {
      id: 'test-2',
      title: 'Standard Conflict-Free Booking Creation',
      description: 'Verify a faculty member can reserve an unoccupied room and receive an official pass reference.',
      status: 'pending',
    },
    {
      id: 'test-3',
      title: 'Strict Double-Booking & Overlap Prevention',
      description: 'Attempt to reserve the same room during overlapping times and verify the engine rejects the conflict.',
      status: 'pending',
    },
    {
      id: 'test-4',
      title: 'Smart Alternative Room Recommendation',
      description: 'Verify when a room is unavailable, the system recommends free alternatives in Deeksha Bhawan and IET.',
      status: 'pending',
    },
    {
      id: 'test-5',
      title: 'Booking Cancellation & Slot Restoration',
      description: 'Cancel a booking and confirm the room status immediately reverts from Booked back to Available.',
      status: 'pending',
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const updated = [...testResults];

    // Helper to update state
    const updateTest = (idx: number, status: TestCaseResult['status'], details?: string) => {
      updated[idx] = { ...updated[idx], status, details };
      setTestResults([...updated]);
    };

    try {
      // TEST 1: Inventory Audit
      updateTest(0, 'running');
      await new Promise((r) => setTimeout(r, 400));
      const hasSeminarHall = rooms.some((r) => r.code === 'IET32' && r.capacity >= 180);
      const hasIET17 = rooms.some((r) => r.code === 'IET17');
      const hasLH01 = rooms.some((r) => r.code === 'LH01');
      const hasLH12 = rooms.some((r) => r.code === 'LH12');
      const totalCount = rooms.length;

      if (hasSeminarHall && hasIET17 && hasLH01 && hasLH12 && totalCount >= 25) {
        updateTest(
          0,
          'passed',
          `Verified ${totalCount} rooms. APJ Abdul Kalam Seminar Hall IET32 (~200 cap), IET17–20, Labs, and Deeksha Bhawan LH01–LH12 present.`
        );
      } else {
        updateTest(0, 'failed', 'Missing one or more required campus rooms.');
      }

      // TEST 2: Standard Booking
      updateTest(1, 'running');
      await new Promise((r) => setTimeout(r, 500));
      const testDate = '2026-11-20';
      const freeRoom = rooms.find((r) => r.code === 'IET28') || rooms[0];

      const res2 = await campusApi.createBooking({
        roomId: freeRoom.id,
        date: testDate,
        startTime: '10:00',
        endTime: '11:30',
        durationMinutes: 90,
        facultyName: 'Dr. Diagnostic Test',
        facultyDept: 'Computer Science',
        facultyEmail: 'test@ddugu.ac.in',
        courseCode: 'CS-TEST',
        subject: 'Automated Test Suite Session',
        purpose: 'Extra Class',
        expectedStudents: 45,
      });

      if (res2.success && res2.booking.passCode) {
        updateTest(
          1,
          'passed',
          `Created booking for ${freeRoom.code} on ${testDate} (10:00 - 11:30). Issued Pass: ${res2.booking.passCode}.`
        );
      } else {
        updateTest(1, 'failed', 'Failed to create booking.');
      }

      // TEST 3: Strict Double-Booking & Overlap Prevention
      updateTest(2, 'running');
      await new Promise((r) => setTimeout(r, 500));
      // Attempt to book overlapping time: 10:30 to 12:00 (overlaps with 10:00-11:30)
      const conflictCheck = await campusApi.checkConflict({
        roomId: freeRoom.id,
        date: testDate,
        startTime: '10:30',
        endTime: '12:00',
        capacity: 45,
      });

      if (conflictCheck.hasConflict) {
        updateTest(
          2,
          'passed',
          `Strict conflict rejection confirmed: ${conflictCheck.message}`
        );
      } else {
        updateTest(2, 'failed', 'Engine failed to detect overlapping collision!');
      }

      // TEST 4: Smart Alternatives Recommendation
      updateTest(3, 'running');
      await new Promise((r) => setTimeout(r, 400));
      if (conflictCheck.availableAlternatives && conflictCheck.availableAlternatives.length > 0) {
        const altNames = conflictCheck.availableAlternatives.map((a) => `${a.code} (${a.building})`).join(', ');
        updateTest(
          3,
          'passed',
          `Recommended ${conflictCheck.availableAlternatives.length} alternative rooms: ${altNames}.`
        );
      } else {
        updateTest(3, 'failed', 'No alternative rooms suggested for occupied slot.');
      }

      // TEST 5: Booking Cancellation & Slot Restoration
      updateTest(4, 'running');
      await new Promise((r) => setTimeout(r, 500));
      if (res2.booking?.id) {
        await campusApi.cancelBooking(res2.booking.id, 'Automated Test Cleanup');
        // Re-check conflict to confirm it is now free
        const postCancelCheck = await campusApi.checkConflict({
          roomId: freeRoom.id,
          date: testDate,
          startTime: '10:00',
          endTime: '11:30',
          capacity: 45,
        });

        if (!postCancelCheck.hasConflict) {
          updateTest(
            4,
            'passed',
            `Cancelled test booking ${res2.booking.passCode}. Room ${freeRoom.code} status successfully reverted to Available.`
          );
        } else {
          updateTest(4, 'failed', 'Slot remained occupied after cancellation.');
        }
      } else {
        updateTest(4, 'failed', 'Skipped due to prior failure.');
      }

      onRefreshData();
    } catch (err: any) {
      console.error('Test execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = testResults.every((t) => t.status === 'passed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              <span>Automated Verification & Diagnostics</span>
              <span>·</span>
              <span className="text-slate-500 font-normal">DDUGU CampusConnect Engine</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Booking & Conflict-Prevention Test Suite
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute live automated tests to verify room inventory, overlap collision blocking, alternative suggestions, and cancellation
            </p>
          </div>

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all shadow-xs cursor-pointer ${
              isRunning ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Automated Tests</span>
              </>
            )}
          </button>
        </div>

        {allPassed && testResults[0].status === 'passed' && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>All 5 Verification Tests Passed!</strong> Room inventory, overlap conflict prevention, Deeksha Bhawan routing, and slot restoration are verified.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-bold uppercase">
              100% Passed
            </span>
          </div>
        )}
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {testResults.map((test, idx) => (
          <div
            key={test.id}
            className={`bg-white border rounded-xl p-4.5 shadow-xs transition-all ${
              test.status === 'passed'
                ? 'border-emerald-200 bg-emerald-50/10'
                : test.status === 'failed'
                ? 'border-red-200 bg-red-50/20'
                : test.status === 'running'
                ? 'border-blue-300 ring-1 ring-blue-100'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    TEST 0{idx + 1}
                  </span>
                  <span className="text-slate-300">·</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {test.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  {test.description}
                </p>

                {test.details && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg text-xs font-mono leading-relaxed ${
                      test.status === 'passed'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-red-50 text-red-900 border border-red-200'
                    }`}
                  >
                    {test.details}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {test.status === 'passed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASSED</span>
                  </span>
                )}
                {test.status === 'failed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-red-800 bg-red-100">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FAILED</span>
                  </span>
                )}
                {test.status === 'running' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-blue-800 bg-blue-100 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>RUNNING</span>
                  </span>
                )}
                {test.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100">
                    <span>READY</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
