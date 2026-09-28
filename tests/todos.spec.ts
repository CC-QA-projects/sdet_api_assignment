import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { Todo, todoSchema } from '../src/models';
import { assertJsonResponse, assertMatchesSchema } from '../src/helpers/assertions';
import { newTodoPayload, todoPatchPayload } from '../src/data/payloads';

const TOTAL_TODOS = 200;
const FIRST_TODO_ID = 1;
const LAST_TODO_ID = TOTAL_TODOS;

// One row of the filter table: a readable name and the query params to send.
interface TodoFilterCase {
  description: string;
  filter: { [field: string]: number | boolean };
}

const TODO_FILTER_CASES: TodoFilterCase[] = [
  { description: 'userId 1', filter: { userId: 1 } },
  { description: 'completed true', filter: { completed: true } },
  { description: 'userId 1 and completed false', filter: { userId: 1, completed: false } },
];

test.describe('GET /todos', () => {
  test('returns all 200 todos matching the todo schema', async ({ request }) => {
    const response = await request.get('/todos');
    await assertJsonResponse(response, 200);
    const todos: Todo[] = await response.json();

    assertMatchesSchema(todos, z.array(todoSchema));
    expect(todos).toHaveLength(TOTAL_TODOS);
  });

  test('returns todos with unique ids', async ({ request }) => {
    const response = await request.get('/todos');
    await assertJsonResponse(response, 200);
    const todos: Todo[] = await response.json();

    const ids: number[] = todos.map((todo) => todo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const filterCase of TODO_FILTER_CASES) {
    test(`returns only matching todos when filtered by ${filterCase.description}`, async ({
      request,
    }) => {
      const response = await request.get('/todos', { params: filterCase.filter });
      await assertJsonResponse(response, 200);
      const todos: Todo[] = await response.json();

      expect(todos.length).toBeGreaterThan(0);
      for (const todo of todos) {
        expect(todo).toMatchObject(filterCase.filter);
      }
    });
  }
});

test.describe('GET /todos/:id', () => {
  for (const todoId of [FIRST_TODO_ID, LAST_TODO_ID]) {
    test(`returns the todo with id ${todoId}`, async ({ request }) => {
      const response = await request.get(`/todos/${todoId}`);
      await assertJsonResponse(response, 200);
      const todo: Todo = await response.json();

      assertMatchesSchema(todo, todoSchema);
      expect(todo.id).toBe(todoId);
    });
  }

  test('returns 404 for a todo that does not exist', async ({ request }) => {
    const response = await request.get(`/todos/${LAST_TODO_ID + 1}`);
    await assertJsonResponse(response, 404);

    expect(await response.json()).toEqual({});
  });
});

test.describe('POST /todos', () => {
  test('creates a todo and returns it with a new id', async ({ request }) => {
    const response = await request.post('/todos', { data: newTodoPayload });
    await assertJsonResponse(response, 201);
    const createdTodo: Todo = await response.json();

    assertMatchesSchema(createdTodo, todoSchema);
    expect(createdTodo).toEqual({ ...newTodoPayload, id: TOTAL_TODOS + 1 });
  });
});

test.describe('PUT /todos/:id', () => {
  test('replaces the whole todo', async ({ request }) => {
    const response = await request.put(`/todos/${FIRST_TODO_ID}`, { data: newTodoPayload });
    await assertJsonResponse(response, 200);
    const updatedTodo: Todo = await response.json();

    assertMatchesSchema(updatedTodo, todoSchema);
    expect(updatedTodo).toEqual({ ...newTodoPayload, id: FIRST_TODO_ID });
  });
});

test.describe('PATCH /todos/:id', () => {
  test('updates only the fields sent', async ({ request }) => {
    const originalResponse = await request.get(`/todos/${FIRST_TODO_ID}`);
    await assertJsonResponse(originalResponse, 200);
    const originalTodo: Todo = await originalResponse.json();

    const response = await request.patch(`/todos/${FIRST_TODO_ID}`, { data: todoPatchPayload });
    await assertJsonResponse(response, 200);
    const patchedTodo: Todo = await response.json();

    assertMatchesSchema(patchedTodo, todoSchema);
    expect(patchedTodo).toEqual({ ...originalTodo, ...todoPatchPayload });
  });
});

test.describe('DELETE /todos/:id', () => {
  test('returns an empty object', async ({ request }) => {
    const response = await request.delete(`/todos/${FIRST_TODO_ID}`);
    await assertJsonResponse(response, 200);

    expect(await response.json()).toEqual({});
  });
});
