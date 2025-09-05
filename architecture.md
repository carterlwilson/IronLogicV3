# IronLogic3 Data Architecture Plan

## Overview
This document outlines the MongoDB-based data architecture for the IronLogic3 gym management system. The architecture supports multiple gym locations, hierarchical workout programming, client management, performance tracking, and flexible scheduling with base templates and active weekly schedules.

## Core Design Principles
1. **Denormalization for Read Performance**: Optimized for frequent read operations with selective denormalization
2. **Hierarchical Flexibility**: Support for complex workout program structures (Block → Week → Day → Activity)
3. **Multi-tenancy**: Gym-based data isolation with cross-gym admin capabilities
4. **Audit Trail**: Historical tracking for benchmarks and program progress
5. **Schedule Flexibility**: Base schedule templates with weekly active schedules for client enrollment
6. **Scalability**: Designed to handle ~1000 simultaneous requests

## MongoDB Collections Design

### 1. Users Collection
Handles authentication and authorization for all user types.

```javascript
// users collection
{
  _id: ObjectId,
  email: String, // unique index
  password: String, // hashed
  name: String,
  userType: String, // enum: "admin", "gym_owner", "coach", "client"
  gymId: ObjectId, // reference to gyms collection (null for admin)
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  lastLogin: Date,
  // Auth-related fields
  refreshToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}
```

### 2. Gyms Collection
Central hub for gym information and multi-location support.

```javascript
// gyms collection
{
  _id: ObjectId,
  name: String,
  ownerId: ObjectId, // reference to users collection
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  locations: [{
    locationId: ObjectId,
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    isActive: Boolean
  }],
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  // Cached counts for dashboard performance
  coachCount: Number,
  clientCount: Number
}
```

### 3. Clients Collection
Extended client data separate from users for flexibility.

```javascript
// clients collection
{
  _id: ObjectId,
  userId: ObjectId, // reference to users collection (1:1 relationship)
  gymId: ObjectId, // reference to gyms collection
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    phone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  membershipInfo: {
    startDate: Date,
    membershipType: String,
    isActive: Boolean
  },
  // Current program tracking
  currentProgram: {
    programId: ObjectId,
    currentBlockIndex: Number,
    currentWeekIndex: Number,
    startDate: Date
  },
  // Performance tracking
  activeBenchmarks: [{
    benchmarkId: ObjectId,
    templateId: ObjectId, // reference to benchmarkTemplates
    value: {
      weight: Number,
      time: Number, // in seconds
      reps: Number
    },
    unit: String, // "lbs", "kg", "seconds", "reps"
    recordedAt: Date,
    recordedBy: ObjectId // userId of who recorded it
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Coaches Collection
Coach information and gym association.

```javascript
// coaches collection
{
  _id: ObjectId,
  userId: ObjectId, // reference to users collection
  gymId: ObjectId, // reference to gyms collection
  personalInfo: {
    firstName: String,
    lastName: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  specializations: [String], // e.g., ["powerlifting", "crossfit", "conditioning"]
  hireDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Activity Templates Collection
Master list of all possible workout activities.

```javascript
// activityTemplates collection
{
  _id: ObjectId,
  name: String, // e.g., "Incline Bench Press"
  gymId: ObjectId, // null for global activities, specific gymId for gym-specific
  activityGroup: String, // e.g., "bench_press", "squat", "deadlift"
  type: String, // enum: "strength", "conditioning", "diagnostic"
  description: String,
  instructions: String,
  tags: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // userId
}
```

### 6. Benchmark Templates Collection
Templates for creating client-specific benchmarks.

```javascript
// benchmarkTemplates collection
{
  _id: ObjectId,
  name: String, // e.g., "1RM Bench Press"
  gymId: ObjectId, // null for global, specific gymId for gym-specific
  type: String, // enum: "weight", "time", "reps"
  unit: String, // "lbs", "kg", "seconds", "reps"
  description: String,
  instructions: String,
  notes: String,
  tags: [String], // for filtering and organization
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // userId
}
```

### 7. Workout Programs Collection
The core hierarchical workout program structure.

```javascript
// workoutPrograms collection
{
  _id: ObjectId,
  name: String,
  gymId: ObjectId, // reference to gyms collection
  description: String,
  // Program structure
  blocks: [{
    blockId: ObjectId,
    name: String,
    description: String,
    orderIndex: Number,
    // Volume targets at block level
    volumeTargets: [{
      activityGroup: String, // e.g., "bench_press"
      targetPercentage: Number // e.g., 50 for 50%
    }],
    weeks: [{
      weekId: ObjectId,
      weekNumber: Number,
      description: String,
      // Volume targets at week level (overrides block level)
      volumeTargets: [{
        activityGroup: String,
        targetPercentage: Number
      }],
      days: [{
        dayId: ObjectId,
        dayOfWeek: Number, // 1-7 (Monday-Sunday)
        name: String, // e.g., "Upper Body Strength"
        activities: [{
          activityId: ObjectId,
          templateId: ObjectId, // reference to activityTemplates
          orderIndex: Number,
          // Activity parameters
          sets: Number,
          reps: Number,
          restPeriod: Number, // in seconds
          intensityPercentage: Number, // percentage of 1RM
          notes: String,
          // For conditioning activities
          duration: Number, // in seconds
          distance: Number, // in meters
          // Activity type specific fields
          type: String // "strength", "conditioning", "diagnostic"
        }]
      }]
    }]
  }],
  // Program metadata
  durationWeeks: Number, // total duration
  difficulty: String, // "beginner", "intermediate", "advanced"
  tags: [String],
  isActive: Boolean,
  isTemplate: Boolean, // true if it's a template program
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId, // userId
  // Version control
  version: Number,
  parentProgramId: ObjectId // for program templates/copies
}
```

### 8. Client Benchmark History Collection
Historical tracking of client benchmark performance.

```javascript
// clientBenchmarkHistory collection
{
  _id: ObjectId,
  clientId: ObjectId, // reference to clients collection
  benchmarkTemplateId: ObjectId, // reference to benchmarkTemplates
  value: {
    weight: Number,
    time: Number,
    reps: Number
  },
  unit: String,
  recordedAt: Date,
  recordedBy: ObjectId, // userId of who recorded it
  notes: String,
  // Context of when this was recorded
  programContext: {
    programId: ObjectId,
    blockIndex: Number,
    weekIndex: Number
  }
}
```

### 9. Schedule Templates Collection
Base schedule templates that serve as starting points for weekly schedules.

```javascript
// scheduleTemplates collection
{
  _id: ObjectId,
  gymId: ObjectId, // reference to gyms collection
  name: String, // e.g., "Standard Weekly Schedule"
  description: String,
  isDefault: Boolean, // default template for new weekly schedules
  timeslots: [{
    timeslotId: ObjectId,
    dayOfWeek: Number, // 1-7 (Monday-Sunday)
    startTime: String, // "09:00"
    endTime: String, // "10:00"
    locationId: ObjectId, // reference to gym location
    coachId: ObjectId, // reference to coaches collection
    programId: ObjectId, // reference to workoutPrograms collection
    maxCapacity: Number,
    className: String,
    notes: String,
    isActive: Boolean
  }],
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // userId
}
```

### 10. Weekly Schedules Collection
Active weekly schedules based on templates, with client enrollments.

```javascript
// weeklySchedules collection
{
  _id: ObjectId,
  gymId: ObjectId, // reference to gyms collection
  weekStartDate: Date, // Monday of the week
  templateId: ObjectId, // reference to scheduleTemplates (nullable)
  status: String, // "draft", "active", "completed"
  timeslots: [{
    timeslotId: ObjectId,
    dayOfWeek: Number, // 1-7
    startTime: String, // "09:00"
    endTime: String, // "10:00"
    locationId: ObjectId, // reference to gym location
    coachId: ObjectId, // reference to coaches collection
    programId: ObjectId, // reference to workoutPrograms collection
    maxCapacity: Number,
    className: String,
    notes: String,
    // Client enrollments for this specific timeslot
    enrolledClients: [{
      clientId: ObjectId,
      enrolledAt: Date,
      status: String, // "enrolled", "checked_in", "completed", "no_show"
      enrolledBy: ObjectId // userId who enrolled them (self or coach/owner)
    }],
    // Availability tracking
    currentEnrollment: Number, // cached count for performance
    isAvailable: Boolean // maxCapacity > currentEnrollment
  }],
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // userId
}
```

## Data Relationships Diagram

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐
│    Users    │────│      Gyms       │────│    Locations     │
│             │    │                 │    │  (embedded in    │
│ - Admin     │    │ - Owner         │    │      Gyms)       │
│ - Gym Owner │    │ - Locations[]   │    │                  │
│ - Coach     │    │ - CoachCount    │    └──────────────────┘
│ - Client    │    │ - ClientCount   │
└──────┬──────┘    └─────────┬───────┘
       │                     │
       └─────────────────────┼─────────────────┐
                             │                 │
              ┌──────────────▼──┐    ┌─────────▼──────────┐
              │    Coaches      │    │     Clients       │
              │                 │    │                   │
              │ - PersonalInfo  │    │ - PersonalInfo    │
              │ - GymId         │    │ - CurrentProgram  │
              └─────────────────┘    │ - Benchmarks[]    │
                     │               └───────────┬───────┘
                     │                           │
    ┌────────────────┼───────────────────────────┼────────────────────┐
    │                │                           │                    │
    │    ┌───────────▼─────────┐    ┌────────────▼─────────┐  ┌───────▼──────────┐
    │    │ ScheduleTemplates   │    │ BenchmarkHistory     │  │ BenchmarkTemplates│
    │    │                     │    │                      │  │                   │
    │    │ - Timeslots[]       │    │ - Value              │  │ - Name            │
    │    │ - IsDefault         │    │ - RecordedAt         │  │ - Type            │
    │    └─────────┬───────────┘    │ - ClientId           │  │ - Tags[]          │
    │              │                └──────────────────────┘  │ - Unit            │
    │    ┌─────────▼─────────┐                                └───────────────────┘
    │    │ WeeklySchedules   │
    │    │                   │
    │    │ - Timeslots[]     │
    │    │ - EnrolledClients │
    │    │ - Status          │
    │    └───────────────────┘
    │
    └─┬─────────────────────────────────────────────────────────────┐
      │                                                             │
┌─────▼──────────┐                                        ┌─────────▼─────────┐
│ WorkoutPrograms│                                        │ ActivityTemplates │
│                │                                        │                   │
│ - Blocks[]     │                                        │ - Name            │
│   - Weeks[]    │                                        │ - ActivityGroup   │
│     - Days[]   │                                        │ - Type            │
│       - Activities                                      │ - Tags[]          │
│ - VolumeTargets│                                        └───────────────────┘
└────────────────┘
```

## Performance Optimization Strategy

### Indexing Strategy

```javascript
// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ gymId: 1 })
db.users.createIndex({ userType: 1 })

// Clients collection indexes
db.clients.createIndex({ userId: 1 }, { unique: true })
db.clients.createIndex({ gymId: 1 })
db.clients.createIndex({ "currentProgram.programId": 1 })
db.clients.createIndex({ "activeBenchmarks.templateId": 1 })

// Workout Programs collection indexes
db.workoutPrograms.createIndex({ gymId: 1 })
db.workoutPrograms.createIndex({ isActive: 1 })
db.workoutPrograms.createIndex({ tags: 1 })
db.workoutPrograms.createIndex({ createdBy: 1 })

// Activity Templates collection indexes
db.activityTemplates.createIndex({ gymId: 1 })
db.activityTemplates.createIndex({ activityGroup: 1 })
db.activityTemplates.createIndex({ tags: 1 })
db.activityTemplates.createIndex({ type: 1 })

// Benchmark Templates collection indexes
db.benchmarkTemplates.createIndex({ gymId: 1 })
db.benchmarkTemplates.createIndex({ tags: 1 })
db.benchmarkTemplates.createIndex({ type: 1 })

// Client Benchmark History collection indexes
db.clientBenchmarkHistory.createIndex({ clientId: 1, recordedAt: -1 })
db.clientBenchmarkHistory.createIndex({ benchmarkTemplateId: 1 })
db.clientBenchmarkHistory.createIndex({ recordedAt: -1 })

// Schedule Templates collection indexes
db.scheduleTemplates.createIndex({ gymId: 1 })
db.scheduleTemplates.createIndex({ isDefault: 1 })
db.scheduleTemplates.createIndex({ "timeslots.coachId": 1 })

// Weekly Schedules collection indexes
db.weeklySchedules.createIndex({ gymId: 1, weekStartDate: -1 })
db.weeklySchedules.createIndex({ status: 1 })
db.weeklySchedules.createIndex({ "timeslots.coachId": 1 })
db.weeklySchedules.createIndex({ "timeslots.enrolledClients.clientId": 1 })
db.weeklySchedules.createIndex({ weekStartDate: 1, "timeslots.dayOfWeek": 1 })
```

### Data Access Patterns

#### Common Query Patterns by User Type

**Admin Queries:**
```javascript
// Dashboard data - aggregated counts across all gyms
db.gyms.aggregate([
  { $match: { isActive: true } },
  { $group: { 
    _id: null, 
    totalGyms: { $sum: 1 },
    totalCoaches: { $sum: "$coachCount" },
    totalClients: { $sum: "$clientCount" }
  }}
])

// All users across gyms with pagination
db.users.find({ userType: { $ne: "admin" } })
  .populate("gymId")
  .sort({ createdAt: -1 })
  .limit(50)
```

**Gym Owner Queries:**
```javascript
// Gym-specific dashboard data
db.clients.countDocuments({ gymId: ObjectId("gymId"), "membershipInfo.isActive": true })
db.coaches.countDocuments({ gymId: ObjectId("gymId"), isActive: true })

// Gym's workout programs
db.workoutPrograms.find({ 
  gymId: ObjectId("gymId"), 
  isActive: true 
}).sort({ updatedAt: -1 })

// Create weekly schedule from template
db.scheduleTemplates.findOne({ gymId: ObjectId("gymId"), isDefault: true })
```

**Coach Queries:**
```javascript
// Coach's upcoming classes for the week
db.weeklySchedules.aggregate([
  { $match: { gymId: ObjectId("gymId"), weekStartDate: currentWeekStart } },
  { $unwind: "$timeslots" },
  { $match: { "timeslots.coachId": ObjectId("coachId") } },
  { $group: { _id: "$_id", timeslots: { $push: "$timeslots" } } }
])
```

**Client Queries (Mobile App):**
```javascript
// Get current workout day
db.clients.findOne({ userId: ObjectId("userId") })
  .populate({
    path: "currentProgram.programId",
    select: "blocks"
  })

// Client's active benchmarks with tag filtering
db.clients.findOne(
  { userId: ObjectId("userId") },
  { "activeBenchmarks": { $elemMatch: { "templateId": { $in: [templateIds] } } } }
)

// Benchmark history for progress tracking
db.clientBenchmarkHistory.find({
  clientId: ObjectId("clientId"),
  benchmarkTemplateId: ObjectId("templateId")
}).sort({ recordedAt: 1 })

// Get current week's schedule for client's gym
db.weeklySchedules.findOne({
  gymId: ObjectId("gymId"),
  weekStartDate: { $lte: currentWeekStart },
  status: "active"
})

// Get available timeslots filtered by coach
db.weeklySchedules.aggregate([
  { $match: { gymId: ObjectId("gymId"), weekStartDate: currentWeekStart, status: "active" } },
  { $unwind: "$timeslots" },
  { $match: { "timeslots.coachId": ObjectId("coachId"), "timeslots.isAvailable": true } },
  { $group: { _id: "$_id", timeslots: { $push: "$timeslots" } } }
])

// Client's current enrollments for the week
db.weeklySchedules.findOne(
  {
    gymId: ObjectId("gymId"),
    weekStartDate: currentWeekStart,
    "timeslots.enrolledClients.clientId": ObjectId("clientId")
  },
  {
    "timeslots.$": 1
  }
)
```

#### Schedule Management Patterns

**Creating Weekly Schedule from Template:**
```javascript
// 1. Get default template
const template = await db.scheduleTemplates.findOne({ 
  gymId: ObjectId("gymId"), 
  isDefault: true 
})

// 2. Create new weekly schedule
const weeklySchedule = {
  gymId: template.gymId,
  weekStartDate: new Date(weekStart),
  templateId: template._id,
  status: "draft",
  timeslots: template.timeslots.map(slot => ({
    ...slot,
    enrolledClients: [],
    currentEnrollment: 0,
    isAvailable: true
  }))
}

await db.weeklySchedules.insertOne(weeklySchedule)
```

**Client Self-Enrollment:**
```javascript
// 1. Check availability
const schedule = await db.weeklySchedules.findOne({
  gymId: ObjectId("gymId"),
  weekStartDate: currentWeekStart,
  "timeslots.timeslotId": ObjectId("timeslotId"),
  "timeslots.isAvailable": true
})

// 2. Enroll client
await db.weeklySchedules.updateOne(
  {
    _id: schedule._id,
    "timeslots.timeslotId": ObjectId("timeslotId")
  },
  {
    $push: {
      "timeslots.$.enrolledClients": {
        clientId: ObjectId("clientId"),
        enrolledAt: new Date(),
        status: "enrolled",
        enrolledBy: ObjectId("clientUserId")
      }
    },
    $inc: { "timeslots.$.currentEnrollment": 1 },
    $set: { 
      "timeslots.$.isAvailable": { 
        $lt: ["$timeslots.$.currentEnrollment", "$timeslots.$.maxCapacity"] 
      }
    }
  }
)
```

#### Optimistic Loading Patterns

For immediate UI updates with optimistic loading:

```javascript
// Example: Client enrolling in a class
// 1. Immediately update UI showing enrollment
// 2. Send request to server
// 3. Handle success/error and sync with server state

// Server-side enrollment with atomic operations
const result = await db.weeklySchedules.findOneAndUpdate(
  {
    gymId: ObjectId("gymId"),
    weekStartDate: currentWeekStart,
    "timeslots.timeslotId": ObjectId("timeslotId"),
    "timeslots.currentEnrollment": { $lt: maxCapacity },
    "timeslots.enrolledClients.clientId": { $ne: ObjectId("clientId") }
  },
  {
    $push: { "timeslots.$.enrolledClients": enrollmentData },
    $inc: { "timeslots.$.currentEnrollment": 1 }
  },
  { returnDocument: "after" }
)
```

## Data Validation Rules

### Schema Validation
```javascript
// Users collection validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "name", "userType"],
      properties: {
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" },
        userType: { enum: ["admin", "gym_owner", "coach", "client"] },
        gymId: { bsonType: ["objectId", "null"] }
      }
    }
  }
})

// Weekly Schedules validation
db.createCollection("weeklySchedules", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["gymId", "weekStartDate", "timeslots"],
      properties: {
        status: { enum: ["draft", "active", "completed"] },
        timeslots: {
          bsonType: "array",
          items: {
            properties: {
              dayOfWeek: { bsonType: "int", minimum: 1, maximum: 7 },
              maxCapacity: { bsonType: "int", minimum: 1 },
              currentEnrollment: { bsonType: "int", minimum: 0 }
            }
          }
        }
      }
    }
  }
})
```

## Security Considerations

### Data Access Control
1. **JWT-based Authentication**: All API requests must include valid JWT tokens
2. **Role-based Authorization**: Middleware to verify user permissions based on userType and gymId
3. **Data Isolation**: Gym-specific data is filtered by gymId for non-admin users
4. **Schedule Enrollment Security**: Prevent double-booking and capacity overflow
5. **Client Self-Management**: Clients can only modify their own schedule enrollments

### Schedule-Specific Security
```javascript
// Middleware for schedule access control
const scheduleAuthMiddleware = (req, res, next) => {
  const { userType, gymId, userId } = req.user
  
  if (userType === 'admin') {
    // Admin can access all schedules
    return next()
  }
  
  if (userType === 'gym_owner' || userType === 'coach') {
    // Filter by gym
    req.query.gymId = gymId
    return next()
  }
  
  if (userType === 'client') {
    // Clients can only view schedules for their gym
    // and only modify their own enrollments
    req.query.gymId = gymId
    if (req.method !== 'GET') {
      req.body.enrolledBy = userId
    }
    return next()
  }
  
  return res.status(403).json({ error: 'Unauthorized' })
}
```

## Scalability Considerations

### Horizontal Scaling Strategy
1. **Sharding by gymId**: Distribute data across shards based on gym affiliation
2. **Read Replicas**: Use read replicas for dashboard queries and reporting
3. **Connection Pooling**: Implement proper connection pooling for ~1000 concurrent requests
4. **Schedule Caching**: Cache active weekly schedules in Redis for fast enrollment checks
5. **Aggregation Optimization**: Pre-compute frequently accessed aggregations

### Performance Monitoring
```javascript
// Key metrics to monitor:
// - Schedule enrollment response time
// - Concurrent enrollment conflicts
// - Query execution time for complex aggregations
// - Index usage efficiency
// - Memory usage patterns

// Slow query logging
db.setProfilingLevel(1, { slowms: 100 })

// Schedule-specific monitoring
db.weeklySchedules.aggregate([
  { $match: { weekStartDate: { $gte: startOfWeek } } },
  { $unwind: "$timeslots" },
  { $group: {
    _id: null,
    totalTimeslots: { $sum: 1 },
    totalEnrollments: { $sum: "$timeslots.currentEnrollment" },
    averageUtilization: { 
      $avg: { $divide: ["$timeslots.currentEnrollment", "$timeslots.maxCapacity"] }
    }
  }}
])
```

## PWA Considerations

### Offline Data Strategy
For the mobile PWA to function offline:

```javascript
// Critical data to cache locally:
// - Current workout program (current block/week)
// - Active benchmarks
// - Current week's schedule
// - Client's enrollments

// IndexedDB schema for offline storage
const offlineSchema = {
  workouts: {
    keyPath: "dayId",
    data: "current week's workout data"
  },
  benchmarks: {
    keyPath: "templateId", 
    data: "user's active benchmarks"
  },
  schedule: {
    keyPath: "weekStartDate",
    data: "current week's schedule with enrollments"
  },
  progress: {
    keyPath: "sessionId",
    data: "local workout progress tracking"
  }
}

// Sync strategy when back online
// - Upload local changes (benchmark updates, schedule changes)
// - Download server updates (schedule changes by others)
// - Resolve conflicts (server wins for schedule capacity conflicts)
```

## Schedule Workflow Examples

### Base Schedule Template Creation
```javascript
// Gym owner creates a recurring weekly template
const scheduleTemplate = {
  gymId: ObjectId("gymId"),
  name: "Standard Weekly Schedule",
  isDefault: true,
  timeslots: [
    {
      timeslotId: new ObjectId(),
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "10:00",
      locationId: ObjectId("locationId"),
      coachId: ObjectId("coachId"),
      programId: ObjectId("programId"),
      maxCapacity: 12,
      className: "Morning Strength",
      isActive: true
    },
    // ... more timeslots for the week
  ]
}
```

### Weekly Schedule Activation
```javascript
// Each week, create active schedule from template
const createWeeklySchedule = async (gymId, weekStartDate) => {
  const template = await db.scheduleTemplates.findOne({ 
    gymId, 
    isDefault: true 
  })
  
  const weeklySchedule = {
    gymId: template.gymId,
    weekStartDate: new Date(weekStartDate),
    templateId: template._id,
    status: "active",
    timeslots: template.timeslots.map(slot => ({
      ...slot,
      enrolledClients: [],
      currentEnrollment: 0,
      isAvailable: true
    }))
  }
  
  return await db.weeklySchedules.insertOne(weeklySchedule)
}
```

This architecture provides a robust foundation for the IronLogic3 gym management system, supporting all specified requirements including the flexible scheduling system with base templates and active weekly schedules, client self-enrollment capabilities, and coach-based filtering for optimal user experience.