import { test, expect } from '@playwright/test';
import { NewPost, Post, postSchema } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { newPostPayload } from '../src/data/payloads';

const TOTAL_POSTS = 100;
const FIRST_POST_ID = 1;
const LONG_TEXT_LENGTH = 10000;

// Ids that look almost valid. None of them should match a post.
interface UnusualIdCase {
  description: string;
  id: string;
}

const UNUSUAL_POST_IDS: UnusualIdCase[] = [
  { description: 'a leading zero', id: '01' },
  { description: 'a decimal', id: '1.5' },
  { description: 'a negative number', id: '-1' },
  { description: 'a number too large to store exactly', id: '9007199254740993' },
];

// Write methods that need an id. Sending them to the whole collection should be refused.
const COLLECTION_WRITE_METHODS: string[] = ['PUT', 'PATCH', 'DELETE'];

test.describe('GET /posts/:id with unusual ids', () => {
  for (const unusualId of UNUSUAL_POST_IDS) {
    test(`returns 404 for an id with ${unusualId.description}`, async ({ request }) => {
      const response = await request.get(`/posts/${unusualId.id}`);
      await assertJsonResponse(response, 404);

      expect(await response.json()).toEqual({});
    });
  }

  test('returns the post for a URL-encoded id', async ({ request }) => {
    // %31 is the URL encoding of "1", so the server should decode it and find post 1.
    const response = await request.get('/posts/%31');
    await assertJsonResponse(response, 200);
    const post: Post = await response.json();

    assertMatchesSchema(post, postSchema);
    expect(post.id).toBe(FIRST_POST_ID);
  });
});

test.describe('Write methods on the whole collection', () => {
  for (const method of COLLECTION_WRITE_METHODS) {
    test(`${method} /posts without an id returns 404`, async ({ request }) => {
      // A real API would usually return 405 Method Not Allowed; the mock returns 404.
      const response = await request.fetch('/posts', { method, data: newPostPayload });
      await assertJsonResponse(response, 404);

      expect(await response.json()).toEqual({});
    });
  }
});

test.describe('POST /posts with awkward text values', () => {
  test('keeps unicode and emoji unchanged', async ({ request }) => {
    const unicodePayload: NewPost = {
      userId: 1,
      title: 'Café ☕ 日本語 🚀',
      body: 'naïve “curly quotes” and émojis 🎉',
    };

    const response = await request.post('/posts', { data: unicodePayload });
    await assertJsonResponse(response, 201);
    const createdPost: Post = await response.json();

    assertMatchesSchema(createdPost, postSchema);
    expect(createdPost).toEqual({ ...unicodePayload, id: TOTAL_POSTS + 1 });
  });

  test('accepts a very long title and returns it in full', async ({ request }) => {
    const longPayload: NewPost = {
      userId: 1,
      title: 'a'.repeat(LONG_TEXT_LENGTH),
      body: 'A post with a very long title.',
    };

    const response = await request.post('/posts', { data: longPayload });
    await assertJsonResponse(response, 201);
    const createdPost: Post = await response.json();

    expect(createdPost.title).toHaveLength(LONG_TEXT_LENGTH);
    expect(createdPost).toEqual({ ...longPayload, id: TOTAL_POSTS + 1 });
  });

  /*
   * Known quirks: the mock does no validation, so it accepts values a real API should reject.
   * The responses below would fail postSchema, which is why they are compared with toEqual.
   */
  test('accepts empty strings (known quirk)', async ({ request }) => {
    // A real API would return 400 Bad Request because title and body are required.
    const emptyTextPayload: NewPost = { userId: 1, title: '', body: '' };

    const response = await request.post('/posts', { data: emptyTextPayload });
    await assertJsonResponse(response, 201);

    expect(await response.json()).toEqual({ ...emptyTextPayload, id: TOTAL_POSTS + 1 });
  });

  test('accepts null values (known quirk)', async ({ request }) => {
    // A real API would return 400 Bad Request because the fields can't be null.
    const nullPayload = { userId: null, title: null, body: null };

    const response = await request.post('/posts', { data: nullPayload });
    await assertJsonResponse(response, 201);

    expect(await response.json()).toEqual({ ...nullPayload, id: TOTAL_POSTS + 1 });
  });
});
