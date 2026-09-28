import { z } from 'zod';

// Rules shared by every resource.
export const idSchema = z.number().int().positive();
export const nonEmptyTextSchema = z.string().min(1);
