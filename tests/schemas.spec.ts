import { test, expect } from '@playwright/test';
import { z } from 'zod';
import {
  albumSchema,
  commentSchema,
  photoSchema,
  postSchema,
  todoSchema,
  userSchema,
} from '../src/models';

/*
 * These tests check the schemas themselves, with no API calls.
 * The API tests only prove that real data passes. These prove the schemas would catch bad data,
 * so a schema that accepts anything can't go unnoticed.
 */

const validPost = { id: 1, userId: 1, title: 'A title', body: 'A body' };
const validComment = { id: 1, postId: 1, name: 'A name', email: 'a@example.com', body: 'A body' };
const validAlbum = { id: 1, userId: 1, title: 'A title' };
const validPhoto = {
  id: 1,
  albumId: 1,
  title: 'A title',
  url: 'https://example.com/600',
  thumbnailUrl: 'https://example.com/150',
};
const validTodo = { id: 1, userId: 1, title: 'A title', completed: false };
const validUser = {
  id: 1,
  name: 'A name',
  username: 'a.user',
  email: 'a@example.com',
  address: {
    street: 'A street',
    suite: 'Apt. 1',
    city: 'A city',
    zipcode: '12345',
    geo: { lat: '-37.3159', lng: '81.1496' },
  },
  phone: '555-0100',
  website: 'example.com',
  company: { name: 'A company', catchPhrase: 'A phrase', bs: 'some bs' },
};

interface ValidRecordCase {
  description: string;
  schema: z.ZodType;
  data: unknown;
}

// Each invalid record is a valid one with a single thing broken.
// expectedPath is the field the schema should report; [] means the object itself.
interface InvalidRecordCase {
  description: string;
  schema: z.ZodType;
  data: unknown;
  expectedPath: (string | number)[];
}

const VALID_RECORD_CASES: ValidRecordCase[] = [
  { description: 'post', schema: postSchema, data: validPost },
  { description: 'comment', schema: commentSchema, data: validComment },
  { description: 'album', schema: albumSchema, data: validAlbum },
  { description: 'photo', schema: photoSchema, data: validPhoto },
  { description: 'todo', schema: todoSchema, data: validTodo },
  { description: 'user', schema: userSchema, data: validUser },
];

const INVALID_RECORD_CASES: InvalidRecordCase[] = [
  {
    description: 'a post whose title is a number',
    schema: postSchema,
    data: { ...validPost, title: 123 },
    expectedPath: ['title'],
  },
  {
    description: 'a post with no body',
    schema: postSchema,
    data: { id: 1, userId: 1, title: 'A title' },
    expectedPath: ['body'],
  },
  {
    description: 'a post with an extra field',
    schema: postSchema,
    data: { ...validPost, extra: 'not allowed' },
    expectedPath: [],
  },
  {
    description: 'a post with an empty title',
    schema: postSchema,
    data: { ...validPost, title: '' },
    expectedPath: ['title'],
  },
  {
    description: 'a post whose id is 0',
    schema: postSchema,
    data: { ...validPost, id: 0 },
    expectedPath: ['id'],
  },
  {
    description: 'a comment with an invalid email',
    schema: commentSchema,
    data: { ...validComment, email: 'not-an-email' },
    expectedPath: ['email'],
  },
  {
    description: 'a photo with an http url',
    schema: photoSchema,
    data: { ...validPhoto, url: 'http://example.com/600' },
    expectedPath: ['url'],
  },
  {
    description: 'a todo whose completed is the text "true"',
    schema: todoSchema,
    data: { ...validTodo, completed: 'true' },
    expectedPath: ['completed'],
  },
  {
    description: 'a user whose latitude is not a number',
    schema: userSchema,
    data: {
      ...validUser,
      address: { ...validUser.address, geo: { lat: 'north', lng: '81.1496' } },
    },
    expectedPath: ['address', 'geo', 'lat'],
  },
];

test.describe('Schemas accept valid records', () => {
  for (const validCase of VALID_RECORD_CASES) {
    test(`accepts a valid ${validCase.description}`, () => {
      const result = validCase.schema.safeParse(validCase.data);

      expect(result.success).toBe(true);
    });
  }
});

test.describe('Schemas reject invalid records', () => {
  for (const invalidCase of INVALID_RECORD_CASES) {
    test(`rejects ${invalidCase.description}`, () => {
      const result = invalidCase.schema.safeParse(invalidCase.data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(invalidCase.expectedPath);
    });
  }
});
