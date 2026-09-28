import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { Comment, Post, postSchema } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { newPostPayload, postPatchPayload } from '../src/data/payloads';

const TOTAL_POSTS = 100;
const FIRST_POST_ID = 1;
const LAST_POST_ID = TOTAL_POSTS;
const USER_ID = 1;

test.describe('GET /posts', () => {
  test('returns all 100 posts matching the post schema', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.get('/posts');
    await assertJsonResponse(response, 200);
    const posts: Post[] = await response.json();

    assertMatchesSchema(posts, z.array(postSchema));
    expect(posts).toHaveLength(TOTAL_POSTS);
  });

  test('returns posts with unique ids', async ({ request }) => {
    const response = await request.get('/posts');
    await assertJsonResponse(response, 200);
    const posts: Post[] = await response.json();

    const ids: number[] = posts.map((post) => post.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('returns only the posts of the given user when filtered by userId', async ({ request }) => {
    const response = await request.get('/posts', { params: { userId: USER_ID } });
    await assertJsonResponse(response, 200);
    const posts: Post[] = await response.json();

    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.userId).toBe(USER_ID);
    }
  });
});

test.describe('GET /posts/:id', () => {
  for (const postId of [FIRST_POST_ID, LAST_POST_ID]) {
    test(`returns the post with id ${postId}`, { tag: '@smoke' }, async ({ request }) => {
      const response = await request.get(`/posts/${postId}`);
      await assertJsonResponse(response, 200);
      const post: Post = await response.json();

      assertMatchesSchema(post, postSchema);
      expect(post.id).toBe(postId);
    });
  }

  test('returns 404 for a post that does not exist', async ({ request }) => {
    const response = await request.get(`/posts/${LAST_POST_ID + 1}`);
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('GET /posts/:id/comments', () => {
  test('returns the same comments as filtering /comments by postId', async ({ request }) => {
    const nestedResponse = await request.get(`/posts/${FIRST_POST_ID}/comments`);
    await assertJsonResponse(nestedResponse, 200);
    const nestedComments: Comment[] = await nestedResponse.json();

    const filteredResponse = await request.get('/comments', {
      params: { postId: FIRST_POST_ID },
    });
    await assertJsonResponse(filteredResponse, 200);
    const filteredComments: Comment[] = await filteredResponse.json();

    expect(nestedComments.length).toBeGreaterThan(0);
    expect(nestedComments).toEqual(filteredComments);
  });
});

test.describe('POST /posts', () => {
  test('creates a post and returns it with a new id', async ({ request }) => {
    const response = await request.post('/posts', { data: newPostPayload });
    await assertJsonResponse(response, 201);
    const createdPost: Post = await response.json();

    assertMatchesSchema(createdPost, postSchema);
    expect(createdPost).toEqual({ ...newPostPayload, id: TOTAL_POSTS + 1 });
  });
});

test.describe('PUT /posts/:id', () => {
  test('replaces the whole post', async ({ request }) => {
    const response = await request.put(`/posts/${FIRST_POST_ID}`, { data: newPostPayload });
    await assertJsonResponse(response, 200);
    const updatedPost: Post = await response.json();

    assertMatchesSchema(updatedPost, postSchema);
    expect(updatedPost).toEqual({ ...newPostPayload, id: FIRST_POST_ID });
  });
});

test.describe('PATCH /posts/:id', () => {
  test('updates only the fields sent', async ({ request }) => {
    const originalResponse = await request.get(`/posts/${FIRST_POST_ID}`);
    await assertJsonResponse(originalResponse, 200);
    const originalPost: Post = await originalResponse.json();

    const response = await request.patch(`/posts/${FIRST_POST_ID}`, { data: postPatchPayload });
    await assertJsonResponse(response, 200);
    const patchedPost: Post = await response.json();

    assertMatchesSchema(patchedPost, postSchema);
    expect(patchedPost).toEqual({ ...originalPost, ...postPatchPayload });
  });
});

test.describe('DELETE /posts/:id', () => {
  test('returns an empty object', async ({ request }) => {
    const response = await request.delete(`/posts/${FIRST_POST_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });
});
