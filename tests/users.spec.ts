import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { User, userSchema } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { newUserPayload, userPatchPayload } from '../src/data/payloads';

const TOTAL_USERS = 10;
const FIRST_USER_ID = 1;
const LAST_USER_ID = TOTAL_USERS;

// The fields every user-owned item (post, album, todo) has in common.
interface UserOwnedItem {
  id: number;
  userId: number;
}

const USER_OWNED_RESOURCES: string[] = ['posts', 'albums', 'todos'];

test.describe('GET /users', () => {
  test('returns all 10 users matching the user schema', async ({ request }) => {
    const response = await request.get('/users');
    await assertJsonResponse(response, 200);
    const users: User[] = await response.json();

    assertMatchesSchema(users, z.array(userSchema));
    expect(users).toHaveLength(TOTAL_USERS);
  });

  test('returns users with unique ids, usernames and emails', async ({ request }) => {
    const response = await request.get('/users');
    await assertJsonResponse(response, 200);
    const users: User[] = await response.json();

    const ids: number[] = users.map((user) => user.id);
    const usernames: string[] = users.map((user) => user.username);
    // Emails are case-insensitive, so compare them in lowercase.
    const emails: string[] = users.map((user) => user.email.toLowerCase());

    expect(new Set(ids).size).toBe(users.length);
    expect(new Set(usernames).size).toBe(users.length);
    expect(new Set(emails).size).toBe(users.length);
  });
});

test.describe('GET /users/:id', () => {
  for (const userId of [FIRST_USER_ID, LAST_USER_ID]) {
    test(`returns the user with id ${userId}`, async ({ request }) => {
      const response = await request.get(`/users/${userId}`);
      await assertJsonResponse(response, 200);
      const user: User = await response.json();

      assertMatchesSchema(user, userSchema);
      expect(user.id).toBe(userId);
    });
  }

  test('returns 404 for a user that does not exist', async ({ request }) => {
    const response = await request.get(`/users/${LAST_USER_ID + 1}`);
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('GET /users/:id/<resource>', () => {
  for (const resource of USER_OWNED_RESOURCES) {
    test(`/users/1/${resource} matches /${resource}?userId=1`, async ({ request }) => {
      const nestedResponse = await request.get(`/users/${FIRST_USER_ID}/${resource}`);
      await assertJsonResponse(nestedResponse, 200);
      const nestedItems: UserOwnedItem[] = await nestedResponse.json();

      const filteredResponse = await request.get(`/${resource}`, {
        params: { userId: FIRST_USER_ID },
      });
      await assertJsonResponse(filteredResponse, 200);
      const filteredItems: UserOwnedItem[] = await filteredResponse.json();

      expect(nestedItems.length).toBeGreaterThan(0);
      expect(nestedItems).toEqual(filteredItems);
    });
  }
});

test.describe('POST /users', () => {
  test('creates a user and returns it with a new id', async ({ request }) => {
    const response = await request.post('/users', { data: newUserPayload });
    await assertJsonResponse(response, 201);
    const createdUser: User = await response.json();

    assertMatchesSchema(createdUser, userSchema);
    expect(createdUser).toEqual({ ...newUserPayload, id: TOTAL_USERS + 1 });
  });
});

test.describe('PUT /users/:id', () => {
  test('replaces the whole user', async ({ request }) => {
    const response = await request.put(`/users/${FIRST_USER_ID}`, { data: newUserPayload });
    await assertJsonResponse(response, 200);
    const updatedUser: User = await response.json();

    assertMatchesSchema(updatedUser, userSchema);
    expect(updatedUser).toEqual({ ...newUserPayload, id: FIRST_USER_ID });
  });
});

test.describe('PATCH /users/:id', () => {
  test('updates only the fields sent', async ({ request }) => {
    const originalResponse = await request.get(`/users/${FIRST_USER_ID}`);
    await assertJsonResponse(originalResponse, 200);
    const originalUser: User = await originalResponse.json();

    const response = await request.patch(`/users/${FIRST_USER_ID}`, { data: userPatchPayload });
    await assertJsonResponse(response, 200);
    const patchedUser: User = await response.json();

    assertMatchesSchema(patchedUser, userSchema);
    expect(patchedUser).toEqual({ ...originalUser, ...userPatchPayload });
  });
});

test.describe('DELETE /users/:id', () => {
  test('returns an empty object', async ({ request }) => {
    const response = await request.delete(`/users/${FIRST_USER_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });
});
