import { z } from 'zod';
import { idSchema, nonEmptyTextSchema } from './common';

export interface Geo {
  lat: string;
  lng: string;
}

export interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: Geo;
}

export interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}

// A user we send when creating one (no id yet).
export interface NewUser {
  name: string;
  username: string;
  email: string;
  address: Address;
  phone: string;
  website: string;
  company: Company;
}

// A user returned by the API (same fields plus an id).
export interface User extends NewUser {
  id: number;
}

// Latitude and longitude arrive as text, e.g. "-37.3159".
const coordinateSchema = z.string().regex(/^-?\d+(\.\d+)?$/);

const geoSchema = z.strictObject({
  lat: coordinateSchema,
  lng: coordinateSchema,
});

const addressSchema = z.strictObject({
  street: nonEmptyTextSchema,
  suite: nonEmptyTextSchema,
  city: nonEmptyTextSchema,
  zipcode: nonEmptyTextSchema,
  geo: geoSchema,
});

const companySchema = z.strictObject({
  name: nonEmptyTextSchema,
  catchPhrase: nonEmptyTextSchema,
  bs: nonEmptyTextSchema,
});

// Checks a real response at runtime. strictObject: extra fields fail the check.
export const userSchema = z.strictObject({
  id: idSchema,
  name: nonEmptyTextSchema,
  username: nonEmptyTextSchema,
  email: z.email(),
  address: addressSchema,
  phone: nonEmptyTextSchema,
  website: nonEmptyTextSchema,
  company: companySchema,
});
