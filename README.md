
# Exam Platform

A modern online exam system built with React, TypeScript, and Supabase. This platform allows teachers to create, manage, and grade exams, while students can take exams and view their results.

## Key Features

- User authentication with role-based access (Student, Teacher, Admin)
- Secure teacher registration with verification code: `TEACH2025`
- Comprehensive exam creation and management
- Real-time exam taking with auto-saving
- Detailed results and analytics
- Mobile-responsive design

## Project Structure

### Core Components

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication-related components
│   ├── layout/       # Layout components (Header, etc.)
│   ├── ui/           # UI components from shadcn/ui
│   ├── question/     # Question-related components
│   ├── student/      # Student-specific components
│   └── review/       # Review and feedback components
├── context/          # React Context for state management
│   └── AuthContext.tsx  # Handles user authentication state
├── hooks/            # Custom React hooks
├── integrations/     # External integrations
│   └── supabase/     # Supabase client configuration
├── lib/              # Utility libraries
├── pages/            # Page components for routing
│   ├── admin/        # Admin dashboard pages
│   ├── student/      # Student pages
│   └── teacher/      # Teacher pages
└── utils/            # Utility functions
    ├── examTypes.ts  # Type definitions for exam-related data
    └── supabaseStorage.ts # Database operations
```

## Database Schema

### profiles
Stores user profile information:
- `id` (UUID): References auth.users
- `name` (TEXT): Full name of the user
- `email` (TEXT): Email address
- `phone` (TEXT, optional): Phone number
- `role` (TEXT): 'student', 'teacher', or 'admin'
- `created_at` (TIMESTAMP): When the profile was created

### questions
Stores exam questions:
- `id` (UUID): Primary key
- `question_text` (TEXT): The question itself
- `options` (JSONB): Array of answer options
- `correct_answers` (TEXT[]): Array of correct answer IDs
- `marks` (INTEGER): Points for correct answer
- `chapter_name` (TEXT): Associated chapter
- `co_number` (TEXT): Course outcome number
- `image` (TEXT, optional): URL to question image
- `created_by` (UUID): User who created the question
- `created_at` (TIMESTAMP): When the question was created

### exams
Stores exam information:
- `id` (UUID): Primary key
- `title` (TEXT): Exam title
- `description` (TEXT): Exam description
- `secret_code` (TEXT): Code students use to access the exam
- `duration` (INTEGER): Exam duration in minutes
- `total_marks` (INTEGER): Total possible points
- `is_active` (BOOLEAN): Whether the exam is currently active
- `created_by` (UUID): Teacher who created the exam
- `created_at` (TIMESTAMP): When the exam was created
- `leaderboard_released` (BOOLEAN): Whether leaderboard is public

### exam_questions
Join table linking exams to questions:
- `id` (UUID): Primary key
- `exam_id` (UUID): References exams.id
- `question_id` (UUID): References questions.id

### exam_results
Stores student exam submissions:
- `id` (UUID): Primary key
- `exam_id` (UUID): References exams.id
- `student_id` (UUID): References users.id
- `student_name` (TEXT): Student's name
- `answers` (JSONB): Student's answers
- `score` (INTEGER): Points earned
- `total_marks` (INTEGER): Total possible points
- `end_time` (TIMESTAMP): When the exam was completed
- `released` (BOOLEAN): Whether results are released to student
- `feedback` (TEXT): Teacher feedback
- `created_at` (TIMESTAMP): When the submission was created

### leaderboard
Stores exam leaderboard entries:
- `id` (UUID): Primary key
- `exam_id` (UUID): References exams.id
- `user_id` (UUID): References users.id
- `student_name` (TEXT): Student's name
- `score` (INTEGER): Points earned
- `created_at` (TIMESTAMP): When the entry was created

## Setup Instructions

1. **Create a Supabase Project**
   - Sign up at [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Environment**
   - Update Supabase URL and API key in `src/integrations/supabase/client.ts`

3. **Set Up Database Schema**
   - Run the following SQL in your Supabase SQL Editor:

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  secret_code TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  total_marks INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leaderboard_released BOOLEAN DEFAULT FALSE
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

-- Fix for RLS Recursion Issue
-- Create a helper function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT raw_user_meta_data->>'role'
  FROM auth.users
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

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

4. **Configure Authentication**
   - In Supabase dashboard, go to Authentication → Settings
   - For testing, you may want to disable "Confirm email"
   - Set up Site URL and Redirect URLs for email verification

## Troubleshooting

### Common Authentication Issues

1. **Email Verification Errors**
   - Temporarily disable email confirmation in Supabase Auth settings for testing
   - Make sure to set Site URL and Redirect URLs correctly

2. **Row Level Security Issues**
   - Check role permissions in `get_current_user_role()` function
   - Ensure user metadata is properly set during sign-up

3. **Data Visibility Problems**
   - Make sure RLS policies are correctly set up
   - Verify user roles are properly assigned

### Database Issues

1. **Infinite Recursion in RLS Policies**
   - This is fixed by using the `get_current_user_role()` function
   - Check for correct implementation of security definer functions

2. **Missing Tables/Columns**
   - Run the complete SQL setup script
   - Check for any errors during table creation

## Deployment

1. Set up environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. For production, enable strict email verification in Supabase.
