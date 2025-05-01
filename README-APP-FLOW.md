
# Exam Platform - Application Data Flow

This document provides a comprehensive overview of how data flows through the Exam Platform, highlighting key functions, components, and their interactions.

## Application Architecture

The Exam Platform follows a client-server architecture with the following key components:

1. **React Frontend**: User interface built with React, TypeScript, and Tailwind CSS
2. **Supabase Backend**: Database, authentication, and storage services
3. **State Management**: Context API for auth state and React Query for server state

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      React Frontend                     │
│                                                         │
│  ┌───────────┐    ┌───────────┐    ┌───────────────┐    │
│  │           │    │           │    │               │    │
│  │   Pages   │    │Components │    │  Hooks/Utils  │    │
│  │           │    │           │    │               │    │
│  └───────────┘    └───────────┘    └───────────────┘    │
│                                                         │
└────────────────────────────┬────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                                                         │
│               Supabase Client Integration               │
│                                                         │
└────────────────────────────┬────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   Supabase Backend                      │
│                                                         │
│  ┌───────────┐    ┌───────────┐    ┌───────────────┐    │
│  │           │    │           │    │               │    │
│  │ Database  │    │   Auth    │    │    Storage    │    │
│  │           │    │           │    │               │    │
│  └───────────┘    └───────────┘    └───────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Key Data Flows

### 1. Authentication Flow

```
User Action → AuthContext → Supabase Auth → Profile Storage → App Redirection
```

**Key Functions:**
- `signIn(email, password)`: Authenticates user with credentials
- `signUp(email, password, name, role)`: Registers new user
- `signOut()`: Logs out current user
- `useAuth()`: Custom hook to access authentication context

**Data Path:**
1. User enters credentials in `Login.tsx` component
2. `AuthContext.tsx` processes authentication request
3. Supabase authentication service verifies credentials
4. User profile is fetched from `profiles` table
5. Auth state is updated in context
6. User is redirected to appropriate dashboard based on role

### 2. Teacher Question Management Flow

```
Question Form → saveQuestion() → Supabase DB → Question List Update
```

**Key Functions:**
- `getQuestions()`: Fetches all questions from database
- `saveQuestion(question)`: Creates or updates a question
- `deleteQuestion(questionId)`: Removes a question

**Data Path:**
1. Teacher creates/edits question in `AddQuestion.tsx`
2. Question data with options is formatted
3. Images are uploaded to Supabase storage if present
4. Question data is saved to `questions` table
5. Question list is refreshed using React Query

### 3. Exam Creation Flow

```
Exam Form → Question Selection → saveExam() → Supabase DB
```

**Key Functions:**
- `getExams()`: Fetches all exams
- `saveExam(exam)`: Creates or updates an exam
- `deleteExam(examId)`: Removes an exam

**Data Path:**
1. Teacher defines exam parameters in `CreateExam.tsx`
2. Teacher selects questions to include
3. Exam metadata is saved to `exams` table
4. Question-exam relationships are saved to `exam_questions` table
5. Exam list is refreshed

### 4. Student Exam Taking Flow

```
Exam Code Entry → Fetch Exam → Student Details Input → Answer Questions → Submit Exam
```

**Key Functions:**
- `getExams()`: Fetches available exams
- `saveExamResult(result)`: Submits student's exam answers
- `calculateScore(answers, questions)`: Calculates score based on answers

**Data Path:**
1. Student enters exam code in `StudentDashboard.tsx`
2. System validates code and retrieves exam from `exams` table
3. Student enters roll number and phone number
4. Student answers questions in `TakeExam.tsx`
5. Answer data is formatted on submission
6. Score is calculated by comparing with correct answers
7. Submission is saved to `exam_results` table

### 5. Results Management Flow

```
Teacher View → Fetch Results → Review/Grade → Release Results
```

**Key Functions:**
- `getExamResults()`: Fetches all exam submissions
- `addFeedbackToResult(submissionId, feedback)`: Adds teacher feedback
- `releaseExamResults(submissionId, released)`: Makes results visible to student

**Data Path:**
1. Teacher views submissions in `ManageResults.tsx`
2. System fetches results from `exam_results` table
3. Teacher reviews answers and provides feedback
4. Teacher updates release status of results
5. Students can view released results in their dashboard

### 6. Analytics Generation Flow

```
Exam Selection → Data Aggregation → Statistical Analysis → Visual Presentation
```

**Key Functions:**
- `calculatePerformanceAnalytics(examId)`: Generates performance metrics
- `getExamPerformanceStats(examId)`: Gets detailed statistics
- `calculateQuestionsWithMostErrors()`: Identifies problematic questions

**Data Path:**
1. Teacher selects exam for analysis in dashboard
2. System fetches all submissions for the exam
3. Raw data is processed into statistical metrics
4. Analytics are displayed in charts and tables
5. Teachers can use insights to improve future exams

## Core Utility Functions

### Database Operations (`supabaseStorage.ts`)

- **User Management**
  - `getUsers()`: Fetches all user profiles
  - `saveUser(user)`: Updates user profile
  - `deleteUser(userId)`: Removes user

- **Question Management**
  - `getQuestions()`: Fetches all questions
  - `saveQuestion(question)`: Creates/updates question
  - `deleteQuestion(questionId)`: Removes question

- **Exam Management**
  - `getExams()`: Fetches all exams with their questions
  - `saveExam(exam)`: Creates/updates exam
  - `deleteExam(examId)`: Removes exam

- **Result Management**
  - `getExamResults()`: Fetches all exam submissions
  - `saveExamResult(result)`: Saves student submission
  - `addFeedbackToResult(submissionId, feedback)`: Adds teacher feedback
  - `releaseExamResults(submissionId, released)`: Controls result visibility

- **Analytics**
  - `calculatePerformanceAnalytics(examId)`: Generates exam analytics
  - `getExamPerformanceStats(examId)`: Fetches detailed stats
  - `calculateQuestionsWithMostErrors()`: Identifies difficult questions
  - `calculateAverageCompletionTime()`: Measures average exam completion time
  - `calculateTopPerformers()`: Lists highest scoring students

### Authentication (`auth.ts`)

- `isUserActive(user)`: Checks if user account is active
- `formatRole(role)`: Formats user role for display

## Data Types and Models (`examTypes.ts`)

Key interfaces defining the data structure:

- `Option`: Question answer choice
- `Question`: Exam question with options and metadata
- `Exam`: Complete exam configuration
- `StudentExamAnswer`: Student's answer to a single question
- `StudentExamSubmission`: Complete student exam submission
- `ChapterPerformance`: Analytics on performance by chapter
- `COPerformance`: Analytics on performance by course outcome
- `StudentPerformanceAnalytics`: Complete performance analytics for a student

## Component Hierarchy and Data Flow

```
App
├── AuthContext (manages user authentication state)
├── QueryClientProvider (manages server state)
│
├── Pages
│   ├── Login/Register (authentication)
│   ├── Teacher Dashboard (exam management)
│   │   ├── AddQuestion (question creation)
│   │   ├── CreateExam (exam creation)
│   │   └── ManageResults (result review)
│   └── Student Dashboard (exam taking)
│       └── TakeExam (answer questions)
│
└── Components
    ├── Layout (navigation & structure)
    ├── Question (question display & management)
    ├── Student (student-specific components)
    └── Review (result review & analytics)
```

## Error Handling Strategy

1. **Client-side Validation**: Form validation using React Hook Form and Zod
2. **API Error Handling**: Try-catch blocks around Supabase calls
3. **User Feedback**: Toast notifications for success/error messages
4. **Authentication Errors**: Specific handling in AuthContext

## Performance Optimization

1. **Query Caching**: React Query for efficient data fetching
2. **Pagination**: Used for displaying large data sets
3. **Throttling/Debouncing**: For search inputs and form submissions
4. **Lazy Loading**: For components and data that aren't immediately needed
5. **Batch Operations**: For handling multiple database operations

## Security Considerations

1. **Row Level Security**: Supabase RLS policies control data access
2. **Role-Based Access**: Different interfaces and permissions for students/teachers
3. **Secret Exam Codes**: Required to access exams
4. **Protected Routes**: Navigation restricted based on user role
5. **Environment Variables**: Sensitive configuration stored in env variables
