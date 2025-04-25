
# Exam Platform - Supabase Integration Guide

This document provides a comprehensive guide for integrating Supabase with the Exam Platform application. Supabase provides a powerful backend solution with authentication, database, storage, and real-time capabilities.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up Supabase](#setting-up-supabase)
3. [Database Schema](#database-schema)
4. [Authentication Setup](#authentication-setup)
5. [Storage Setup](#storage-setup)
6. [API Integration](#api-integration)
7. [Deployment Considerations](#deployment-considerations)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account (https://supabase.com)

## Setting Up Supabase

1. Create a new Supabase project from the dashboard at https://app.supabase.com
2. Make note of your project URL and public anon key (found in Project Settings > API)
3. Install the Supabase client in your project:

```bash
npm install @supabase/supabase-js
```

4. Create a Supabase client instance:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Database Schema

Create the following tables in your Supabase project using the SQL Editor:

### Users (Extended Profile)

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Teachers and admins can view all profiles" 
  ON user_profiles FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));
```

### Questions

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answers JSONB NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  chapter_name TEXT,
  co_number TEXT,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policies for questions
CREATE POLICY "Teachers can create questions" 
  ON questions FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  ));

CREATE POLICY "Teachers and admins can select questions" 
  ON questions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

CREATE POLICY "Students can view questions in exams they're taking" 
  ON questions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM exams e
    JOIN exam_questions eq ON e.id = eq.exam_id
    JOIN exam_registrations er ON e.id = er.exam_id
    WHERE eq.question_id = questions.id
    AND er.student_id = auth.uid()
    AND e.is_active = true
  ));
```

### Exams

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  leaderboard_released BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Policies for exams
CREATE POLICY "Teachers can create exams" 
  ON exams FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  ));

CREATE POLICY "Teachers can update their own exams" 
  ON exams FOR UPDATE 
  USING (created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view all exams" 
  ON exams FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  ));

CREATE POLICY "Students can view active exams" 
  ON exams FOR SELECT 
  USING (
    is_active = true 
    OR EXISTS (
      SELECT 1 FROM exam_registrations 
      WHERE exam_id = exams.id AND student_id = auth.uid()
    )
  );
```

### Exam Questions (Junction Table)

```sql
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  question_order INTEGER NOT NULL,
  UNIQUE(exam_id, question_id)
);

-- Enable RLS
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

-- Policies for exam_questions
CREATE POLICY "Teachers can manage exam questions" 
  ON exam_questions 
  USING (EXISTS (
    SELECT 1 FROM exams 
    WHERE id = exam_id AND created_by = auth.uid()
  ));

CREATE POLICY "Students can view exam questions" 
  ON exam_questions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM exam_registrations 
    WHERE exam_id = exam_questions.exam_id AND student_id = auth.uid()
  ));
```

### Exam Registrations

```sql
CREATE TABLE exam_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(exam_id, student_id)
);

-- Enable RLS
ALTER TABLE exam_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for exam_registrations
CREATE POLICY "Students can register for exams" 
  ON exam_registrations FOR INSERT 
  WITH CHECK (
    student_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can view their registrations" 
  ON exam_registrations FOR SELECT 
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view all registrations" 
  ON exam_registrations FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  ));
```

### Exam Submissions

```sql
CREATE TABLE exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  released BOOLEAN DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(exam_id, student_id)
);

-- Enable RLS
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for exam_submissions
CREATE POLICY "Students can submit their exams" 
  ON exam_submissions FOR INSERT 
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their submissions" 
  ON exam_submissions FOR SELECT 
  USING (student_id = auth.uid() AND (released = true OR score IS NULL));

CREATE POLICY "Teachers can view and update submissions" 
  ON exam_submissions 
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  ));
```

## Authentication Setup

1. Configure Authentication providers in Supabase dashboard:
   - Enable Email/Password sign-in
   - Configure OAuth providers if needed

2. Implement authentication in your application:

```typescript
// User Sign Up
async function signUp(email: string, password: string, name: string, role: 'student' | 'teacher') {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('User data is null');

    // Add user profile information
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        name,
        role,
      });

    if (profileError) throw profileError;
    return authData;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

// User Sign In
async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Sign Out
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
```

## Storage Setup

1. Create buckets for question images and other assets:

```typescript
// Initialize storage buckets programmatically or through the Supabase dashboard
async function setupStorage() {
  // Create bucket for question images
  const { error: questionImagesError } = await supabase
    .storage
    .createBucket('question-images', {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']
    });

  if (questionImagesError) {
    console.error('Error creating question-images bucket:', questionImagesError);
  }
}

// Upload a question image
async function uploadQuestionImage(file: File, questionId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${questionId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('question-images')
    .upload(fileName, file, {
      upsert: true,
    });

  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('question-images')
    .getPublicUrl(fileName);
    
  return publicUrl;
}
```

## API Integration

Implement API calls to interact with your Supabase database:

```typescript
// Question Management
export async function createQuestion(questionData: Omit<Question, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

// Exam Management
export async function createExam(examData: Omit<Exam, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('exams')
    .insert(examData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function addQuestionsToExam(examId: string, questionIds: string[]) {
  const examQuestions = questionIds.map((qId, index) => ({
    exam_id: examId,
    question_id: qId,
    question_order: index + 1
  }));
  
  const { data, error } = await supabase
    .from('exam_questions')
    .insert(examQuestions);
    
  if (error) throw error;
  return data;
}

// Submission Management
export async function submitExam(submissionData: ExamSubmission) {
  const { data, error } = await supabase
    .from('exam_submissions')
    .insert(submissionData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getStudentSubmissions(studentId: string) {
  const { data, error } = await supabase
    .from('exam_submissions')
    .select(`
      *,
      exams (id, title, total_marks)
    `)
    .eq('student_id', studentId);
    
  if (error) throw error;
  return data;
}

export async function getExamSubmissions(examId: string) {
  const { data, error } = await supabase
    .from('exam_submissions')
    .select(`
      *,
      user_profiles (id, name)
    `)
    .eq('exam_id', examId);
    
  if (error) throw error;
  return data;
}

export async function updateSubmissionStatus(submissionId: string, released: boolean) {
  const { data, error } = await supabase
    .from('exam_submissions')
    .update({ released })
    .eq('id', submissionId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

## Deployment Considerations

1. **Environment Variables**: Ensure your Supabase URL and anon key are properly set as environment variables in your production environment.

2. **Row Level Security (RLS)**: Double-check all RLS policies before deploying to production to ensure data security.

3. **Database Indexes**: Add appropriate indexes for frequently queried columns:

```sql
-- Add indexes for performance
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_submissions_exam_id ON exam_submissions(exam_id);
CREATE INDEX idx_exam_submissions_student_id ON exam_submissions(student_id);
```

4. **Rate Limiting**: Consider implementing rate limiting for sensitive operations.

5. **Backup Strategy**: Set up regular database backups through the Supabase dashboard.

6. **Monitoring**: Implement logging and monitoring for your application to identify issues.

By following this integration guide, you'll have a fully functional Exam Platform connected to Supabase for authentication, database, and storage capabilities.
