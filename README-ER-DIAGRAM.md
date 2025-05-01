
# Exam Platform - Entity-Relationship Diagram

This document provides a visual and detailed description of the database entities and their relationships in the Exam Platform system.

## Entity-Relationship Diagram

```
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│               │         │               │         │               │
│    profiles   │◄────────┤     exams     │◄────────┤exam_questions │
│               │         │               │         │               │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        │                         │                         │
        │                         │                         │
        │                         │                         │
┌───────┴───────┐         ┌───────┴───────┐         ┌───────┴───────┐
│               │         │               │         │               │
│  leaderboard  │         │ exam_results  │         │   questions   │
│               │         │               │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
```

## Entity Descriptions

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
- `subject` (TEXT): Subject the question belongs to
- `difficulty` (TEXT, optional): Question difficulty level

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
- `enable_email_notifications` (BOOLEAN): Whether to send email notifications

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
- `student_roll_number` (TEXT): Student's roll number
- `student_phone` (TEXT): Student's phone number
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

## Relationships

1. **profiles to exams**: One-to-many relationship. A teacher (profile) can create multiple exams.

2. **profiles to questions**: One-to-many relationship. A teacher can create multiple questions.

3. **exams to exam_questions**: One-to-many relationship. An exam can contain multiple questions.

4. **questions to exam_questions**: One-to-many relationship. A question can be used in multiple exams.

5. **exams to exam_results**: One-to-many relationship. An exam can have multiple submissions.

6. **profiles to exam_results**: One-to-many relationship. A student can submit multiple exams.

7. **exams to leaderboard**: One-to-many relationship. An exam can have multiple leaderboard entries.

8. **profiles to leaderboard**: One-to-many relationship. A student can have entries in multiple leaderboards.
