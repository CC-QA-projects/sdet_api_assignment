import { z } from 'zod';
import { idSchema, nonEmptyTextSchema } from './common';

// A photo we send when creating one (no id yet).
export interface NewPhoto {
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

// A photo returned by the API (same fields plus an id).
export interface Photo extends NewPhoto {
  id: number;
}

// Checks a real response at runtime. strictObject: extra fields fail the check.
export const photoSchema = z.strictObject({
  id: idSchema,
  albumId: idSchema,
  title: nonEmptyTextSchema,
  url: z.url({ protocol: /^https$/ }),
  thumbnailUrl: z.url({ protocol: /^https$/ }),
});
