import { z } from 'zod';

export const SignupSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(25, 'Username cannot exceed 25 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  username: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
  phone: z.string().trim().optional(),
  weightUnit: z.enum(['KG', 'LBS']).optional(),
  defaultRestSeconds: z.number().int().min(15).max(600).optional(),
});

export const CreateExerciseSchema = z.object({
  name: z.string().trim().min(2, 'Exercise name is required'),
  primaryMuscle: z.enum([
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'QUADS',
    'HAMSTRINGS',
    'GLUTES',
    'CALVES',
    'CORE',
    'FOREARMS',
    'FULL_BODY',
    'CARDIO',
  ]),
  category: z.enum(['BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'OTHER']),
  instructions: z.string().optional(),
  defaultRestSeconds: z.number().int().min(15).max(600).default(90),
});

export const WorkoutSetSchema = z.object({
  setNumber: z.number().int().min(1),
  setType: z.enum(['NORMAL', 'WARMUP', 'DROP', 'FAILURE']).default('NORMAL'),
  weightKg: z.number().min(0).default(0),
  reps: z.number().int().min(0).default(0),
  rpe: z.number().min(1).max(10).optional().nullable(),
  isCompleted: z.boolean().default(false),
  previousWeightKg: z.number().optional().nullable(),
  previousReps: z.number().optional().nullable(),
});

export const WorkoutExerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().default(0),
  notes: z.string().optional().nullable(),
  sets: z.array(WorkoutSetSchema),
});

export const SaveWorkoutSchema = z.object({
  title: z.string().trim().min(1, 'Workout title is required'),
  routineId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  durationSeconds: z.number().int().min(0).default(0),
  totalVolumeKg: z.number().min(0).default(0),
  totalSets: z.number().int().min(0).default(0),
  exercises: z.array(WorkoutExerciseSchema),
});

export const RoutineExerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().default(0),
  targetSets: z.number().int().min(1).default(3),
  targetReps: z.number().int().min(1).optional().nullable(),
  restSeconds: z.number().int().min(15).max(600).default(90),
  notes: z.string().optional().nullable(),
});

export const CreateRoutineSchema = z.object({
  title: z.string().trim().min(1, 'Routine title is required'),
  description: z.string().optional().nullable(),
  folder: z.string().optional().nullable(),
  exercises: z.array(RoutineExerciseSchema),
});
