import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { Album, albumSchema, Photo } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { albumPatchPayload, newAlbumPayload } from '../src/data/payloads';

const TOTAL_ALBUMS = 100;
const FIRST_ALBUM_ID = 1;
const LAST_ALBUM_ID = TOTAL_ALBUMS;
const USER_ID = 2;

test.describe('GET /albums', () => {
  test(
    'returns all 100 albums matching the album schema',
    { tag: '@smoke' },
    async ({ request }) => {
      const response = await request.get('/albums');
      await assertJsonResponse(response, 200);
      const albums: Album[] = await response.json();

      assertMatchesSchema(albums, z.array(albumSchema));
      expect(albums).toHaveLength(TOTAL_ALBUMS);
    },
  );

  test('returns albums with unique ids', async ({ request }) => {
    const response = await request.get('/albums');
    await assertJsonResponse(response, 200);
    const albums: Album[] = await response.json();

    const ids: number[] = albums.map((album) => album.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('returns only the albums of the given user when filtered by userId', async ({ request }) => {
    const response = await request.get('/albums', { params: { userId: USER_ID } });
    await assertJsonResponse(response, 200);
    const albums: Album[] = await response.json();

    expect(albums.length).toBeGreaterThan(0);
    for (const album of albums) {
      expect(album.userId).toBe(USER_ID);
    }
  });
});

test.describe('GET /albums/:id', () => {
  for (const albumId of [FIRST_ALBUM_ID, LAST_ALBUM_ID]) {
    test(`returns the album with id ${albumId}`, { tag: '@smoke' }, async ({ request }) => {
      const response = await request.get(`/albums/${albumId}`);
      await assertJsonResponse(response, 200);
      const album: Album = await response.json();

      assertMatchesSchema(album, albumSchema);
      expect(album.id).toBe(albumId);
    });
  }

  test('returns 404 for an album that does not exist', async ({ request }) => {
    const response = await request.get(`/albums/${LAST_ALBUM_ID + 1}`);
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('GET /albums/:id/photos', () => {
  test('returns the same photos as filtering /photos by albumId', async ({ request }) => {
    const nestedResponse = await request.get(`/albums/${FIRST_ALBUM_ID}/photos`);
    await assertJsonResponse(nestedResponse, 200);
    const nestedPhotos: Photo[] = await nestedResponse.json();

    const filteredResponse = await request.get('/photos', {
      params: { albumId: FIRST_ALBUM_ID },
    });
    await assertJsonResponse(filteredResponse, 200);
    const filteredPhotos: Photo[] = await filteredResponse.json();

    expect(nestedPhotos.length).toBeGreaterThan(0);
    expect(nestedPhotos).toEqual(filteredPhotos);
  });
});

test.describe('POST /albums', () => {
  test('creates an album and returns it with a new id', async ({ request }) => {
    const response = await request.post('/albums', { data: newAlbumPayload });
    await assertJsonResponse(response, 201);
    const createdAlbum: Album = await response.json();

    assertMatchesSchema(createdAlbum, albumSchema);
    expect(createdAlbum).toEqual({ ...newAlbumPayload, id: TOTAL_ALBUMS + 1 });
  });
});

test.describe('PUT /albums/:id', () => {
  test('replaces the whole album', async ({ request }) => {
    const response = await request.put(`/albums/${FIRST_ALBUM_ID}`, { data: newAlbumPayload });
    await assertJsonResponse(response, 200);
    const updatedAlbum: Album = await response.json();

    assertMatchesSchema(updatedAlbum, albumSchema);
    expect(updatedAlbum).toEqual({ ...newAlbumPayload, id: FIRST_ALBUM_ID });
  });
});

test.describe('PATCH /albums/:id', () => {
  test('updates only the fields sent', async ({ request }) => {
    const originalResponse = await request.get(`/albums/${FIRST_ALBUM_ID}`);
    await assertJsonResponse(originalResponse, 200);
    const originalAlbum: Album = await originalResponse.json();

    const response = await request.patch(`/albums/${FIRST_ALBUM_ID}`, {
      data: albumPatchPayload,
    });
    await assertJsonResponse(response, 200);
    const patchedAlbum: Album = await response.json();

    assertMatchesSchema(patchedAlbum, albumSchema);
    expect(patchedAlbum).toEqual({ ...originalAlbum, ...albumPatchPayload });
  });
});

test.describe('DELETE /albums/:id', () => {
  test('returns an empty object', async ({ request }) => {
    const response = await request.delete(`/albums/${FIRST_ALBUM_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });
});
