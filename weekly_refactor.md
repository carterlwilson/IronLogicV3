# Weekly Schedule UI Refactor Plan

## Current Problems

1. **Confusing Single-Timeslot UI**: The current interface suggests only one timeslot per day can be added
2. **Poor Visual Organization**: Timeslots are displayed in a flat table format that doesn't clearly show the weekly calendar structure
3. **Difficult Multiple Timeslot Management**: No clear way to add multiple timeslots to the same day
4. **Lack of Day-Based Grouping**: Timeslots aren't visually grouped by day of the week

## Proposed Solution: Calendar-Grid Layout

### Template Tab Redesign

#### **Visual Layout Structure**
```
┌─────────────────────────────────────────────────────────────┐
│ Schedule Template: "Morning Classes"                        │
│ ├ Assigned Coach: John Smith                               │
│ ├ Description: Primary morning schedule                    │
│ └ [Set as Default] [Save Template] [Delete]               │
├─────────────────────────────────────────────────────────────┤
│                    WEEKLY CALENDAR GRID                    │
├─────────────────────────────────────────────────────────────┤
│  MON    │  TUE    │  WED    │  THU    │  FRI    │  SAT    │ SUN │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│ [+ Add] │ [+ Add] │ [+ Add] │ [+ Add] │ [+ Add] │ [+ Add] │[+ Add]│
│         │         │         │         │         │         │     │
│ 9:00-   │ 8:00-   │ 9:00-   │ 8:00-   │ 9:00-   │ 10:00-  │     │
│ 10:00   │ 9:00    │ 10:00   │ 9:00    │ 10:00   │ 11:00   │     │
│ Strength│ HIIT    │ Strength│ HIIT    │ Strength│ Open    │     │
│ Gym A   │ Gym B   │ Gym A   │ Gym B   │ Gym A   │ Gym A   │     │
│ Max: 15 │ Max: 12 │ Max: 15 │ Max: 12 │ Max: 15 │ Max: 20 │     │
│ [Edit]  │ [Edit]  │ [Edit]  │ [Edit]  │ [Edit]  │ [Edit]  │     │
│         │         │         │         │         │         │     │
│ 6:00-   │ 6:00-   │ 6:00-   │ 6:00-   │ 6:00-   │ 2:00-   │     │
│ 7:00    │ 7:00    │ 7:00    │ 7:00    │ 7:00    │ 3:00    │     │
│ Evening │ Evening │ Evening │ Evening │ Evening │ Mobility│     │
│ Gym A   │ Gym B   │ Gym A   │ Gym B   │ Gym A   │ Gym A   │     │
│ Max: 18 │ Max: 15 │ Max: 18 │ Max: 15 │ Max: 18 │ Max: 10 │     │
│ [Edit]  │ [Edit]  │ [Edit]  │ [Edit]  │ [Edit]  │ [Edit]  │     │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
```

#### **Day Column Structure**
Each day column contains:
- **Header**: Day name (MON, TUE, etc.)
- **Add Button**: Prominent "+ Add Timeslot" button at top
- **Timeslot Cards**: Stacked vertically in chronological order
- **Empty State**: "No timeslots" with large add button when empty

#### **Timeslot Card Design**
Each timeslot displayed as a compact card:
```
┌─────────────────┐
│ 9:00 - 10:00    │ ← Time range (large text)
│ Morning Strength│ ← Class name
│ Location: Gym A │ ← Location
│ Capacity: 15    │ ← Max capacity
│ [Edit] [Delete] │ ← Actions
└─────────────────┘
```

#### **Responsive Behavior**
- **Desktop**: Full 7-column grid
- **Tablet**: 4-3 split (Mon-Thu top row, Fri-Sun bottom row)
- **Mobile**: Single column, days as collapsible sections

### Weekly Schedule Tab Redesign

#### **Similar Calendar Grid + Enrollment Data**
```
┌─────────────────────────────────────────────────────────────┐
│ Week of March 18, 2024                                     │
│ ├ Template: "Morning Classes"                              │
│ ├ Status: Published                                        │
│ ├ Assigned Coach: John Smith                               │
│ └ [Publish] [Copy to Next Week] [Archive]                 │
├─────────────────────────────────────────────────────────────┤
│                    WEEKLY CALENDAR GRID                    │
├─────────────────────────────────────────────────────────────┤
│  MON    │  TUE    │  WED    │  THU    │  FRI    │  SAT    │ SUN │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│ 9:00-   │ 8:00-   │ 9:00-   │ 8:00-   │ 9:00-   │ 10:00-  │     │
│ 10:00   │ 9:00    │ 10:00   │ 9:00    │ 10:00   │ 11:00   │     │
│ Strength│ HIIT    │ Strength│ HIIT    │ Strength│ Open    │     │
│ Gym A   │ Gym B   │ Gym A   │ Gym B   │ Gym A   │ Gym A   │     │
│ 12/15   │ 8/12    │ 14/15   │ 11/12   │ 13/15   │ 5/20    │     │
│ enrolled│ enrolled│ enrolled│ enrolled│ enrolled│ enrolled│     │
│ [View]  │ [View]  │ [View]  │ [View]  │ [View]  │ [View]  │     │
│         │         │         │         │         │         │     │
│ 6:00-   │ 6:00-   │ 6:00-   │ 6:00-   │ 6:00-   │ 2:00-   │     │
│ 7:00    │ 7:00    │ 7:00    │ 7:00    │ 7:00    │ 3:00    │     │
│ Evening │ Evening │ Evening │ Evening │ Evening │ Mobility│     │
│ Gym A   │ Gym B   │ Gym A   │ Gym B   │ Gym A   │ Gym A   │     │
│ 15/18   │ 12/15   │ 16/18   │ 13/15   │ 14/18   │ 8/10    │     │
│ enrolled│ enrolled│ enrolled│ enrolled│ enrolled│ enrolled│     │
│ [View]  │ [View]  │ [View]  │ [View]  │ [View]  │ [View]  │     │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
```

#### **Enhanced Timeslot Cards for Weekly View**
```
┌─────────────────┐
│ 9:00 - 10:00    │ ← Time range
│ Morning Strength│ ← Class name
│ Location: Gym A │ ← Location
│ 12/15 enrolled  │ ← Enrollment status (colored based on %)
│ [View Details]  │ ← Opens enrollment modal
└─────────────────┘
```

## Detailed Component Structure

### 1. ScheduleTemplateCalendarView Component
```typescript
interface ScheduleTemplateCalendarViewProps {
  template: ScheduleTemplate;
  onAddTimeslot: (dayOfWeek: number) => void;
  onEditTimeslot: (timeslot: TemplateTimeslot) => void;
  onDeleteTimeslot: (timeslotId: string) => void;
  loading?: boolean;
}
```

**Responsibilities:**
- Render 7-day grid layout
- Group timeslots by day of week
- Sort timeslots by time within each day
- Handle add/edit/delete actions
- Show conflict warnings
- Responsive grid behavior

### 2. TimeslotCard Component
```typescript
interface TimeslotCardProps {
  timeslot: TemplateTimeslot | WeeklyTimeslot;
  mode: 'template' | 'schedule';
  enrollmentData?: { enrolled: number; capacity: number };
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}
```

**Responsibilities:**
- Display timeslot information compactly
- Show different actions based on mode
- Display enrollment status for weekly schedules
- Color coding for capacity status
- Responsive text sizing

### 3. DayColumn Component
```typescript
interface DayColumnProps {
  dayOfWeek: number;
  timeslots: (TemplateTimeslot | WeeklyTimeslot)[];
  mode: 'template' | 'schedule';
  onAddTimeslot?: () => void;
  onTimeslotAction: (action: string, timeslot: any) => void;
}
```

**Responsibilities:**
- Render single day column
- Sort and display timeslots chronologically
- Handle add timeslot button
- Show empty state when no timeslots
- Handle day-specific actions

### 4. WeeklyScheduleCalendarView Component
```typescript
interface WeeklyScheduleCalendarViewProps {
  schedule: WeeklySchedule;
  onViewTimeslot: (timeslot: WeeklyTimeslot) => void;
  onEditSchedule: () => void;
  loading?: boolean;
}
```

**Responsibilities:**
- Similar to template view but read-only
- Show enrollment data
- Handle timeslot detail viewing
- Week navigation
- Schedule status management

## User Interaction Flows

### Adding Multiple Timeslots to a Day
1. User clicks "+ Add Timeslot" on Monday column
2. TimeslotModal opens with dayOfWeek pre-filled to 1 (Monday)
3. User fills in time, location, capacity, class name
4. User saves → new timeslot card appears in Monday column
5. User can immediately click "+ Add Timeslot" again for another Monday class
6. Timeslots automatically sort by start time within the day

### Editing Existing Timeslots
1. User clicks "Edit" on any timeslot card
2. TimeslotModal opens pre-populated with current data
3. User makes changes and saves
4. Card updates in place with new information
5. If time changes, card re-sorts within the day column

### Managing Conflicts
1. System detects location conflicts in real-time
2. Conflicting timeslot cards show orange warning border
3. Conflict details shown in expandable alert above calendar
4. User must resolve conflicts before saving template

### Weekly Schedule Creation
1. Select base template from dropdown
2. Choose week start date (Monday)
3. System creates weekly schedule with all timeslots from template
4. Calendar view shows all timeslots with 0/X enrollment initially
5. Coach can modify individual timeslots if needed

## Visual Design Specifications

### Colors and States
- **Normal Timeslot**: White background, gray border
- **High Enrollment** (80%+): Light green background
- **Full Enrollment**: Light red background
- **Conflict Warning**: Orange border, yellow background
- **Empty Day**: Dashed border, light gray background

### Typography
- **Time Range**: Bold, 16px
- **Class Name**: Medium, 14px
- **Details**: Regular, 12px
- **Day Headers**: Bold, 18px

### Spacing
- **Card Padding**: 12px
- **Card Margins**: 8px vertical, 4px horizontal
- **Column Width**: Flexible, minimum 160px
- **Column Gaps**: 16px

### Responsive Breakpoints
- **Desktop**: 1200px+ (7 columns)
- **Tablet**: 768-1199px (stacked rows)
- **Mobile**: <768px (accordion style)

## Implementation Benefits

1. **Intuitive Mental Model**: Calendar grid matches how people think about weekly schedules
2. **Clear Multiple Timeslot Support**: Obviously supports multiple timeslots per day
3. **Visual Conflict Detection**: Conflicts immediately visible in grid layout
4. **Efficient Space Usage**: More information density than table format
5. **Mobile Friendly**: Responsive design works on all devices
6. **Scalable**: Easy to add features like drag-and-drop, copy timeslots, etc.

## Migration Considerations

### Data Model Changes
- No changes needed to existing database schema
- All current APIs remain compatible
- Existing templates and schedules work as-is

### Component Replacement Strategy
1. Build new calendar components alongside existing table view
2. Add feature flag to toggle between old/new UI
3. Test thoroughly with existing data
4. Replace old components once new ones are proven
5. Remove legacy table view code

### User Transition
- New UI should feel familiar to anyone who uses calendar apps
- Provide brief onboarding tooltip tour for first-time users
- Maintain all existing functionality in new interface
- Consider showing "old view" link temporarily during transition