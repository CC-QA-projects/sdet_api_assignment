import { z } from 'zod';
import { idSchema, nonEmptyTextSchema } from './common';

// A post we send when creating one (no id yet).
export interface NewPost {
  userId: number;
  title: string;
  body: string;
}

// A post returned by the API (same fields plus an id).
export interface Post extends NewPost {
  id: number;
}

// Checks a real response at runtime. strictObject: extra fields fail the check.
export const postSchema = z.strictObject({
  id: idSchema,
  userId: idSchema,
  title: nonEmptyTextSchema,
  body: nonEmptyTextSchema,
});
