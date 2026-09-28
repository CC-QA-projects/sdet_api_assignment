import { z } from 'zod';
import { idSchema, nonEmptyTextSchema } from './common';

// An album we send when creating one (no id yet).
export interface NewAlbum {
  userId: number;
  title: string;
}

// An album returned by the API (same fields plus an id).
export interface Album extends NewAlbum {
  id: number;
}

// Checks a real response at runtime. strictObject: extra fields fail the check.
export const albumSchema = z.strictObject({
  id: idSchema,
  userId: idSchema,
  title: nonEmptyTextSchema,
});
