import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { Photo, photoSchema } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { newPhotoPayload, photoPatchPayload } from '../src/data/payloads';

const TOTAL_PHOTOS = 5000;
const FIRST_PHOTO_ID = 1;
const LAST_PHOTO_ID = TOTAL_PHOTOS;
const ALBUM_ID = 3;
const PHOTOS_PER_ALBUM = 50;

test.describe('GET /photos', () => {
  test(
    'returns all 5000 photos matching the photo schema',
    { tag: '@smoke' },
    async ({ request }) => {
      const response = await request.get('/photos');
      await assertJsonResponse(response, 200);
      const photos: Photo[] = await response.json();

      assertMatchesSchema(photos, z.array(photoSchema));
      expect(photos).toHaveLength(TOTAL_PHOTOS);
    },
  );

  test('returns photos with unique ids', async ({ request }) => {
    const response = await request.get('/photos');
    await assertJsonResponse(response, 200);
    const photos: Photo[] = await response.json();

    const ids: number[] = photos.map((photo) => photo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('returns only the photos of the given album when filtered by albumId', async ({
    request,
  }) => {
    const response = await request.get('/photos', { params: { albumId: ALBUM_ID } });
    await assertJsonResponse(response, 200);
    const photos: Photo[] = await response.json();

    expect(photos).toHaveLength(PHOTOS_PER_ALBUM);
    for (const photo of photos) {
      expect(photo.albumId).toBe(ALBUM_ID);
    }
  });
});

test.describe('GET /photos/:id', () => {
  for (const photoId of [FIRST_PHOTO_ID, LAST_PHOTO_ID]) {
    test(`returns the photo with id ${photoId}`, { tag: '@smoke' }, async ({ request }) => {
      const response = await request.get(`/photos/${photoId}`);
      await assertJsonResponse(response, 200);
      const photo: Photo = await response.json();

      assertMatchesSchema(photo, photoSchema);
      expect(photo.id).toBe(photoId);
    });
  }

  test('returns 404 for a photo that does not exist', async ({ request }) => {
    const response = await request.get(`/photos/${LAST_PHOTO_ID + 1}`);
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('POST /photos', () => {
  test('creates a photo and returns it with a new id', async ({ request }) => {
    const response = await request.post('/photos', { data: newPhotoPayload });
    await assertJsonResponse(response, 201);
    const createdPhoto: Photo = await response.json();

    assertMatchesSchema(createdPhoto, photoSchema);
    expect(createdPhoto).toEqual({ ...newPhotoPayload, id: TOTAL_PHOTOS + 1 });
  });
});

test.describe('PUT /photos/:id', () => {
  test('replaces the whole photo', async ({ request }) => {
    const response = await request.put(`/photos/${FIRST_PHOTO_ID}`, { data: newPhotoPayload });
    await assertJsonResponse(response, 200);
    const updatedPhoto: Photo = await response.json();

    assertMatchesSchema(updatedPhoto, photoSchema);
    expect(updatedPhoto).toEqual({ ...newPhotoPayload, id: FIRST_PHOTO_ID });
  });
});

test.describe('PATCH /photos/:id', () => {
  test('updates only the fields sent', async ({ request }) => {
    const originalResponse = await request.get(`/photos/${FIRST_PHOTO_ID}`);
    await assertJsonResponse(originalResponse, 200);
    const originalPhoto: Photo = await originalResponse.json();

    const response = await request.patch(`/photos/${FIRST_PHOTO_ID}`, {
      data: photoPatchPayload,
    });
    await assertJsonResponse(response, 200);
    const patchedPhoto: Photo = await response.json();

    assertMatchesSchema(patchedPhoto, photoSchema);
    expect(patchedPhoto).toEqual({ ...originalPhoto, ...photoPatchPayload });
  });
});

test.describe('DELETE /photos/:id', () => {
  test('returns an empty object', async ({ request }) => {
    const response = await request.delete(`/photos/${FIRST_PHOTO_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });
});
