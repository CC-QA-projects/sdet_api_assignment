import { z } from 'zod';
import { idSchema, nonEmptyTextSchema } from './common';

// A todo we send when creating one (no id yet).
export interface NewTodo {
  userId: number;
  title: string;
  completed: boolean;
}

// A todo returned by the API (same fields plus an id).
export interface Todo extends NewTodo {
  id: number;
}

// Checks a real response at runtime. strictObject: extra fields fail the check.
export const todoSchema = z.strictObject({
  id: idSchema,
  userId: idSchema,
  title: nonEmptyTextSchema,
  completed: z.boolean(),
});
