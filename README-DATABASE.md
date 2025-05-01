
# Exam Platform - Database Configuration

This document provides detailed information about the database configuration for the Exam Platform.

## Database Provider

The Exam Platform uses [Supabase](https://supabase.com/) as its backend database provider. Supabase is an open-source Firebase alternative that provides a PostgreSQL database with authentication, real-time subscriptions, and storage.

## Connection Setup

The connection to Supabase is configured in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});

export default supabase;
```

## Environment Variables

The following environment variables are required:
- `VITE_SUPABASE_URL`: URL of your Supabase project
- `VITE_SUPABASE_ANON_KEY`: Anonymous (public) API key for your Supabase project

## Database Schema

### Tables

The database consists of the following tables:

1. **profiles**: User profile information
2. **questions**: Exam questions with options and correct answers
3. **exams**: Exam metadata and configuration
4. **exam_questions**: Junction table linking exams to questions
5. **exam_results**: Student exam submissions and scores
6. **leaderboard**: Leaderboard entries for exams

### Table Creation SQL

Here's the SQL script used to create the tables:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answers TEXT[] NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  chapter_name TEXT,
  co_number TEXT,
  image TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subject TEXT,
  difficulty TEXT
);

-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  secret_code TEXT NOT NULL,
  duration INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leaderboard_released BOOLEAN DEFAULT FALSE,
  enable_email_notifications BOOLEAN DEFAULT FALSE
);

-- Create exam_questions join table
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE
);

-- Create exam results table
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  student_roll_number TEXT,
  student_phone TEXT,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  released BOOLEAN DEFAULT FALSE,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row-Level Security (RLS) Policies

Supabase enables Row-Level Security (RLS) to control access to data at the row level. The following helper function is used to get the current user's role:

```sql
-- Fix for RLS Recursion Issue
-- Create a helper function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT raw_user_meta_data->>'role'
  FROM auth.users
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Teachers and admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create policies for questions
CREATE POLICY "Teachers can create questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "Everyone can view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

-- Create policies for exams
CREATE POLICY "Teachers can create exams"
ON public.exams
FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "Everyone can view exams"
ON public.exams
FOR SELECT
TO authenticated
USING (true);
```

## Database Triggers

```sql
-- Create a function to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Database Indexes

For optimized query performance, consider adding indexes to frequently queried columns:

```sql
-- Add indexes for performance
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX idx_exam_results_student_id ON exam_results(student_id);
```

## Storage Configuration

Supabase Storage is used for storing question images. Bucket configuration:

```typescript
// Create bucket for question images
const { error: questionImagesError } = await supabase
  .storage
  .createBucket('question-images', {
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']
  });
```

## Database Type Definitions

The TypeScript type definitions for the database schema are defined in `src/integrations/supabase/types.ts`, ensuring type safety when interacting with the database.
