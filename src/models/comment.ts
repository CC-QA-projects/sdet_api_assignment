import { z } from 'zod';
import { idSchema, nonEmptyTextSchema } from './common';

// A comment we send when creating one (no id yet).
export interface NewComment {
  postId: number;
  name: string;
  email: string;
  body: string;
}

// A comment returned by the API (same fields plus an id).
export interface Comment extends NewComment {
  id: number;
}

// Checks a real response at runtime. strictObject: extra fields fail the check.
export const commentSchema = z.strictObject({
  id: idSchema,
  postId: idSchema,
  name: nonEmptyTextSchema,
  email: z.email(),
  body: nonEmptyTextSchema,
});
