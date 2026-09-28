import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { Comment, commentSchema } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { commentPatchPayload, newCommentPayload } from '../src/data/payloads';

const TOTAL_COMMENTS = 500;
const FIRST_COMMENT_ID = 1;
const LAST_COMMENT_ID = TOTAL_COMMENTS;
const POST_ID = 1;
const COMMENTS_PER_POST = 5;

test.describe('GET /comments', () => {
  test('returns all 500 comments matching the comment schema', async ({ request }) => {
    const response = await request.get('/comments');
    await assertJsonResponse(response, 200);
    const comments: Comment[] = await response.json();

    assertMatchesSchema(comments, z.array(commentSchema));
    expect(comments).toHaveLength(TOTAL_COMMENTS);
  });

  test('returns comments with unique ids', async ({ request }) => {
    const response = await request.get('/comments');
    await assertJsonResponse(response, 200);
    const comments: Comment[] = await response.json();

    const ids: number[] = comments.map((comment) => comment.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('returns only the comments of the given post when filtered by postId', async ({
    request,
  }) => {
    const response = await request.get('/comments', { params: { postId: POST_ID } });
    await assertJsonResponse(response, 200);
    const comments: Comment[] = await response.json();

    expect(comments).toHaveLength(COMMENTS_PER_POST);
    for (const comment of comments) {
      expect(comment.postId).toBe(POST_ID);
    }
  });
});

test.describe('GET /comments/:id', () => {
  for (const commentId of [FIRST_COMMENT_ID, LAST_COMMENT_ID]) {
    test(`returns the comment with id ${commentId}`, async ({ request }) => {
      const response = await request.get(`/comments/${commentId}`);
      await assertJsonResponse(response, 200);
      const comment: Comment = await response.json();

      assertMatchesSchema(comment, commentSchema);
      expect(comment.id).toBe(commentId);
    });
  }

  test('returns 404 for a comment that does not exist', async ({ request }) => {
    const response = await request.get(`/comments/${LAST_COMMENT_ID + 1}`);
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('POST /comments', () => {
  test('creates a comment and returns it with a new id', async ({ request }) => {
    const response = await request.post('/comments', { data: newCommentPayload });
    await assertJsonResponse(response, 201);
    const createdComment: Comment = await response.json();

    assertMatchesSchema(createdComment, commentSchema);
    expect(createdComment).toEqual({ ...newCommentPayload, id: TOTAL_COMMENTS + 1 });
  });
});

test.describe('PUT /comments/:id', () => {
  test('replaces the whole comment', async ({ request }) => {
    const response = await request.put(`/comments/${FIRST_COMMENT_ID}`, {
      data: newCommentPayload,
    });
    await assertJsonResponse(response, 200);
    const updatedComment: Comment = await response.json();

    assertMatchesSchema(updatedComment, commentSchema);
    expect(updatedComment).toEqual({ ...newCommentPayload, id: FIRST_COMMENT_ID });
  });
});

test.describe('PATCH /comments/:id', () => {
  test('updates only the fields sent', async ({ request }) => {
    const originalResponse = await request.get(`/comments/${FIRST_COMMENT_ID}`);
    await assertJsonResponse(originalResponse, 200);
    const originalComment: Comment = await originalResponse.json();

    const response = await request.patch(`/comments/${FIRST_COMMENT_ID}`, {
      data: commentPatchPayload,
    });
    await assertJsonResponse(response, 200);
    const patchedComment: Comment = await response.json();

    assertMatchesSchema(patchedComment, commentSchema);
    expect(patchedComment).toEqual({ ...originalComment, ...commentPatchPayload });
  });
});

test.describe('DELETE /comments/:id', () => {
  test('returns an empty object', async ({ request }) => {
    const response = await request.delete(`/comments/${FIRST_COMMENT_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });
});
