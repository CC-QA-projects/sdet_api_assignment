import { NewAlbum, NewComment, NewPhoto, NewPost, NewTodo, NewUser } from '../models';

// Request bodies used by the POST, PUT and PATCH tests.

export const newPostPayload: NewPost = {
  userId: 1,
  title: 'Automation test post',
  body: 'This post was created by an automated API test.',
};

export const postPatchPayload = {
  title: 'Patched post title',
};

export const newCommentPayload: NewComment = {
  postId: 1,
  name: 'Automation test comment',
  email: 'tester@example.com',
  body: 'This comment was created by an automated API test.',
};

export const commentPatchPayload = {
  body: 'Patched comment body',
};

export const newAlbumPayload: NewAlbum = {
  userId: 1,
  title: 'Automation test album',
};

export const albumPatchPayload = {
  title: 'Patched album title',
};

export const newPhotoPayload: NewPhoto = {
  albumId: 1,
  title: 'Automation test photo',
  url: 'https://via.placeholder.com/600/92c952',
  thumbnailUrl: 'https://via.placeholder.com/150/92c952',
};

export const photoPatchPayload = {
  title: 'Patched photo title',
};

export const newTodoPayload: NewTodo = {
  userId: 1,
  title: 'Automation test todo',
  completed: false,
};

export const todoPatchPayload = {
  completed: true,
};

export const newUserPayload: NewUser = {
  name: 'Test User',
  username: 'test.user',
  email: 'test.user@example.com',
  address: {
    street: 'Main Street',
    suite: 'Apt. 1',
    city: 'Testville',
    zipcode: '12345',
    geo: {
      lat: '51.5074',
      lng: '-0.1278',
    },
  },
  phone: '555-0100',
  website: 'example.com',
  company: {
    name: 'Test Company',
    catchPhrase: 'Testing all the things',
    bs: 'automate quality checks',
  },
};

export const userPatchPayload = {
  email: 'patched.user@example.com',
};
