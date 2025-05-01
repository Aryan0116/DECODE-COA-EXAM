
# Exam Platform - Data Flow Diagrams

This document provides Data Flow Diagrams (DFD) for the Exam Platform, illustrating how data moves through the system.

## High-Level DFD

```
┌─────────────┐      ┌───────────────┐      ┌────────────────┐
│             │      │               │      │                │
│    User     ├─────►│  Front-end    ├─────►│  Supabase      │
│             │◄─────┤  Application  │◄─────┤  Backend       │
│             │      │               │      │                │
└─────────────┘      └───────────────┘      └────────────────┘
```

## Level 1 DFD - Main System Processes

```
                      ┌───────────────────┐
                      │                   │
                      │  Authentication   │
                      │                   │
                      └─────────┬─────────┘
                                │
                                ▼
┌───────────────┐      ┌───────────────────┐      ┌────────────────┐
│               │      │                   │      │                │
│  Teacher      ├─────►│  Exam Management  │◄─────┤  Question      │
│  Interface    │      │                   │      │  Management    │
│               │      └─────────┬─────────┘      │                │
└───────────────┘                │                └────────────────┘
                                │
                                ▼
┌───────────────┐      ┌───────────────────┐      ┌────────────────┐
│               │      │                   │      │                │
│  Student      │◄────►│  Exam Taking      │◄────►│  Results &     │
│  Interface    │      │                   │      │  Analytics     │
│               │      └───────────────────┘      │                │
└───────────────┘                                 └────────────────┘
```

## User Authentication Flow

```
┌───────┐      ┌───────────┐      ┌───────────────┐      ┌───────────┐
│       │      │           │      │               │      │           │
│ User  ├─────►│  Login/   ├─────►│  Supabase     ├─────►│  User     │
│       │      │  Register │      │  Auth Service │      │  Profile  │
│       │◄─────┤           │◄─────┤               │◄─────┤           │
└───────┘      └───────────┘      └───────────────┘      └───────────┘
```

## Teacher Exam Creation Flow

```
┌───────────┐     ┌─────────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │             │     │           │     │           │     │           │
│ Teacher   ├────►│ Create/Edit ├────►│ Add       ├────►│ Configure ├────►│ Activate  │
│           │     │ Exam        │     │ Questions │     │ Settings  │     │ Exam      │
│           │     │             │     │           │     │           │     │           │
└───────────┘     └─────────────┘     └───────────┘     └───────────┘     └───────────┘
```

## Student Exam Taking Flow

```
┌───────────┐     ┌─────────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │             │     │           │     │           │     │           │
│ Student   ├────►│ Enter Exam  ├────►│ Provide   ├────►│ Take      ├────►│ Submit    │
│           │     │ Secret Code │     │ Details   │     │ Exam      │     │ Exam      │
│           │     │             │     │           │     │           │     │           │
└───────────┘     └─────────────┘     └───────────┘     └───────────┘     └───────────┘
```

## Results and Analytics Flow

```
┌───────────┐     ┌─────────────┐     ┌───────────────┐     ┌───────────┐
│           │     │             │     │               │     │           │
│ Teacher   ├────►│ View Exam   ├────►│ Review        ├────►│ Release   │
│           │     │ Submissions │     │ Performance   │     │ Results   │
│           │     │             │     │               │     │           │
└───────────┘     └─────────────┘     └───────────────┘     └───────────┘
                                            │
                                            ▼
                                     ┌───────────────┐
                                     │               │
                                     │ Generate      │
                                     │ Analytics     │
                                     │               │
                                     └───────────────┘
```

## Data Transformation Processes

1. **User Registration**: User data is collected, validated, and stored in the profiles table with appropriate role assignment.

2. **Question Creation**: Teachers input question data, which is formatted with unique IDs and stored in the questions table.

3. **Exam Creation**: Exams are created with metadata and linked to selected questions through the exam_questions junction table.

4. **Exam Taking**: Student answers are collected, stored temporarily during the exam, and finally submitted to the exam_results table.

5. **Grading Process**: Student answers are compared with correct answers to calculate scores and generate performance metrics.

6. **Analytics Generation**: Raw exam result data is transformed into statistical information for performance analysis.

7. **Leaderboard Generation**: Scores are ranked and formatted for display in the leaderboard.
