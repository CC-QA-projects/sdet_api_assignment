import { test, expect } from '@playwright/test';
import { Comment, Post } from '../src/models';
import { assertJsonResponse } from '../src/helpers/assertions';
import { newPostPayload, postPatchPayload } from '../src/data/payloads';

const TOTAL_POSTS = 100;
const MISSING_POST_ID = 99999;
const INVALID_POST_IDS: string[] = ['0', 'abc', '999999'];

test.describe('Invalid ids', () => {
  for (const invalidId of INVALID_POST_IDS) {
    test(`GET /posts/${invalidId} returns 404 with an empty object`, async ({ request }) => {
      const response = await request.get(`/posts/${invalidId}`);
      await assertJsonResponse(response, 404);

      expect(await response.json()).toEqual({});
    });
  }
});

test.describe('Unsupported routes', () => {
  test('GET on an unknown route returns 404', async ({ request }) => {
    const response = await request.get('/does-not-exist');
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });

  test('POST to a single post returns 404', async ({ request }) => {
    const response = await request.post('/posts/1', { data: newPostPayload });
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('Queries with no results', () => {
  test('filtering comments by a post that does not exist returns an empty list', async ({
    request,
  }) => {
    const response = await request.get('/comments', { params: { postId: MISSING_POST_ID } });
    await assertJsonResponse(response, 200);
    const comments: Comment[] = await response.json();

    expect(comments).toEqual([]);
  });

  test('filtering posts by a non-numeric userId returns an empty list', async ({ request }) => {
    const response = await request.get('/posts', { params: { userId: 'abc' } });
    await assertJsonResponse(response, 200);
    const posts: Post[] = await response.json();

    expect(posts).toEqual([]);
  });

  test('comments of a post that does not exist is an empty list', async ({ request }) => {
    const response = await request.get(`/posts/${MISSING_POST_ID}/comments`);
    await assertJsonResponse(response, 200);
    const comments: Comment[] = await response.json();

    expect(comments).toEqual([]);
  });
});

/*
 * Known quirks of the mock API.
 * JSONPlaceholder does no input validation and does not save writes, so some requests behave
 * differently from a real API. These tests pin the actual behaviour, so we notice if it changes.
 * Each test notes what a real API would be expected to return instead.
 */
test.describe('Known quirks of the mock API', () => {
  test('POST /posts with an empty body still creates a post', async ({ request }) => {
    // A real API would return 400 Bad Request for missing required fields.
    const response = await request.post('/posts', { data: {} });
    await assertJsonResponse(response, 201);

    expect(await response.json()).toEqual({ id: TOTAL_POSTS + 1 });
  });

  test('PUT on a post that does not exist returns 500', async ({ request }) => {
    // A real API would return 404 Not Found.
    const response = await request.put(`/posts/${MISSING_POST_ID}`, { data: newPostPayload });

    expect(response.status()).toBe(500);
  });

  test('PATCH on a post that does not exist returns 200 and echoes the body', async ({
    request,
  }) => {
    // A real API would return 404 Not Found.
    const response = await request.patch(`/posts/${MISSING_POST_ID}`, { data: postPatchPayload });
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual(postPatchPayload);
  });

  test('DELETE on a post that does not exist returns 200', async ({ request }) => {
    // A real API would return 404 Not Found.
    const response = await request.delete(`/posts/${MISSING_POST_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });

  test('POST /posts with malformed JSON returns 500', async ({ request }) => {
    // A real API would return 400 Bad Request.
    const response = await request.post('/posts', {
      data: '{ "title": "missing closing brace"',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(500);
  });
});
