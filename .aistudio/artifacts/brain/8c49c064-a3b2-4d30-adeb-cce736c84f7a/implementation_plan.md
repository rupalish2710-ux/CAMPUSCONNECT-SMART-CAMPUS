# CampusConnect – Room Availability & Classroom Booking Module Upgrade

This plan upgrades the existing CampusConnect system with a dedicated, fully functional **Room Availability & Classroom Booking Module**. It preserves the existing dashboard, navigation, role switcher, visual theme, and campus layout, while introducing enhanced multi-factor filtering, explicit 3-state room status tracking (**Available**, **Booked**, and **Occupied**), strict overlap conflict prevention, instant alternative room recommendations, and an integrated booking test suite.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Preservation Guarantee & Confirmed Feature Blueprint**
> 
> - **Preserve Existing Structure**: The university dashboard, navigation bar, role selector (Faculty, Student, Admin), theme, and existing views remain 100% intact.
> - **Tri-State Status Logic**:
>   - **Available**: No active or conflicting reservation for the selected date & time window.
>   - **Occupied**: Active class/session currently taking place right now.
>   - **Booked**: Reserved for the queried time slot on the selected date.
> - **Strict Overlap Conflict Prevention**: Simultaneous booking of the same room during overlapping times `!(newEnd <= existingStart || newStart >= existingEnd)` is blocked on both client and server API layers.
> - **Proximity-Aware Alternative Suggestions**: When a room is booked/occupied, the system automatically computes available alternatives ranked by same floor, other floor in IET, or tiered lecture halls in Deeksha Bhawan (~100m away) with 1-click room switching.
> - **Integrated Automated Test Suite**: Built-in verification component to run and log automated test cases proving instant booking, conflict rejection, and alternative suggestions.

---

## 1. Overview & Core Concept

### Target Rooms Covered
- **IET Building**:
  - **Ground Floor**: Central Library and Administrative Offices (Director Office, Admin Cell, Placement Cell, Faculty Cabins).
  - **First Floor**: Smart Classrooms **IET17**, **IET18**, **IET19**, **IET20** and Four Engineering Labs (CSE Lab, ME CAD/CAM Lab, ECE Lab, IT Lab).
  - **Second Floor**: Seminar Hall **IET32** (~200 capacity) and Classrooms **IET24**, **IET25**, **IET28**, **IET29**, **IET30**.
- **Deeksha Bhawan (~100m from IET)**:
  - Lecture amphitheaters **LH01 to LH12** (90–120 capacity), serving as prime overflow facilities for IET.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Interactive Room Availability Matrix**:
   - Filter by **Building** (All, IET, Deeksha Bhawan), **Floor** (Ground, 1st, 2nd), **Date**, **Time Range** (Start & End Time), and **Minimum Student Capacity**.
   - Room cards display building, floor, room code, capacity, and live status badge:
     - `Available` (Emerald tag)
     - `Booked` (Blue tag with scheduled slot and instructor)
     - `Occupied` (Purple/Indigo tag indicating live class in progress)
2. **Faculty Classroom Booking**:
   - Click "Book Room" on any available card or top bar CTA.
   - Form fields: Room selector, Date, Start Time, End Time, Purpose (Regular Class, Extra Class, Mid-Term Exam, Lab Practical, Seminar/Workshop), Expected Student Count, Subject, and Special Notes.
   - Real-time conflict validation runs on keystroke/change:
     - If conflict detected: Red alert with exact colliding booking details + Smart Alternative recommendations with 1-click "Switch & Select".
     - If valid: Confirmation button enables with total duration calculation.
3. **Confirmation & Digital Door Slip**:
   - Detailed confirmation pass modal displaying unique pass reference (`CC-DDU-XXXX`), door slip print trigger, and direct entry into Booking History.
4. **Booking History & Cancellation**:
   - Searchable history table with filter by status (Confirmed, Completed, Cancelled).
   - Cancellation with optional administrative/faculty reason input, instantly freeing the slot.

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CampusConnect Application Shell                      │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar (Role Persona Switcher · Live Time · Quick Book)              │
├───────────────────┬────────────────────────────────────────────────────┤
│  Sidebar          │  Main Content Canvas                               │
│  - Dashboard      │  ┌───────────────────────────────────────────────┐ │
│  - Room Search    │  │ Enhanced Room Availability & Booking View     │ │
│  - Timetable      │  │ • Multi-filter bar (Building/Floor/Time/Cap)  │ │
│  - Notices        │  │ • Tri-state badges (Available/Booked/Occupied)│ │
│  - History        │  │ • One-click "Book This Room" CTA              │ │
│  - Admin Console  │  └───────────────────────────────────────────────┘ │
│  - Conflict Tests │  ┌───────────────────────────────────────────────┐ │
│                   │  │ Interactive Booking Modal + Conflict Engine   │ │
│                   │  │ • Overlap prevention & Alternative Recommender│ │
│                   │  └───────────────────────────────────────────────┘ │
└───────────────────┴────────────────────────────────────────────────────┘
                                   │
                           HTTP REST Fetch
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│         Full-Stack API Server (server.ts) & Client Fallback            │
│  - GET  /api/rooms (Enriched with Available / Booked / Occupied state) │
│  - POST /api/bookings/check-conflict (Strict interval collision check) │
│  - POST /api/bookings (Atomic creation with 409 rejection on conflict) │
│  - DELETE /api/bookings/:id (Cancellation with reason)                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Verification & Testing Plan

1. **Room Inventory Audit**: Verify all IET Ground, 1st, 2nd floor rooms and Deeksha Bhawan LH01–LH12 are present with accurate capacities.
2. **Availability Filtering Test**: Test filtering by date, time window, building, floor, and minimum capacity.
3. **Double-Booking Prevention Test**: Attempt booking room `IET17` during an already reserved window (e.g., today 09:00 - 10:30) and confirm that conflict is blocked and alternatives are recommended.
4. **Alternative Recommendation Test**: Select an alternative from Deeksha Bhawan or IET 2nd floor with 1-click and confirm slot validity.
5. **Cancellation Test**: Cancel a booking from Booking History and verify the room status immediately turns from Booked back to Available.
6. **Code Compilation & Linting**: Co-run `compile_applet` and `lint_applet` to confirm zero TypeScript and syntax errors.
