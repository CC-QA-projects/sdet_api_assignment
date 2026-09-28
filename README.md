# JSONPlaceholder API Test Framework

API test automation for [JSONPlaceholder](https://jsonplaceholder.typicode.com), built with Playwright Test, TypeScript and zod.

## Contents

1. [Overview](#1-overview)
   - [Brief description of the solution](#brief-description-of-the-solution)
   - [Assumptions made](#assumptions-made)
   - [Scope of testing completed](#scope-of-testing-completed)
2. [Execution instructions](#2-execution-instructions)
   - [Install dependencies](#install-dependencies)
   - [Build the project](#build-the-project)
   - [Execute the test suite](#execute-the-test-suite)
   - [View test results](#view-test-results)
3. [Coverage summary](#3-coverage-summary)
   - [Routes/resources tested](#routesresources-tested)
   - [Types of validations implemented](#types-of-validations-implemented)
   - [Test scenarios by category](#test-scenarios-by-category)
   - [Areas intentionally omitted due to time constraints](#areas-intentionally-omitted-due-to-time-constraints)
4. [Project structure](#4-project-structure)

## 1. Overview

### Brief description of the solution

A suite of **79 API tests** covering all six JSONPlaceholder resources (posts, comments, albums, photos, todos, users) plus error handling.

- **Playwright Test for API only.** The built-in `request` fixture sends HTTP calls, and no browsers are installed or launched.
- **Two layers per model.** A hand-written TypeScript interface helps while writing code, and a zod `strictObject` schema checks every real response at runtime. Unexpected extra fields fail the check.
- **Two small assertion helpers.** `assertJsonResponse` checks the status and JSON content-type, and prints the URL and body on failure. `assertMatchesSchema` shows readable schema errors, capped at 5 issues.
- **Simple, explicit code.** Basic TypeScript only (no generics, custom fixtures or client wrappers), so every test reads top to bottom: request → status check → parse → assertions.
- **Quality gates in CI.** GitHub Actions runs typecheck → lint → tests and uploads the HTML report.

### Assumptions made

- **Writes aren't saved.** JSONPlaceholder fakes POST/PUT/PATCH/DELETE, so tests check the response of each write and do not read it back afterwards.
- **The dataset is static.** Counts (100 posts, 500 comments, 100 albums, 5000 photos, 200 todos, 10 users) and first/last ids are used as expected values.
- **It is a mock with no validation.** Some invalid requests succeed or return 500. These quirks are pinned with comments that explain what a real API would return.
- **It is a shared public service.** CI retries failed tests twice to absorb network blips.
- **There is no authentication.** The API is open, so auth is not tested.

### Scope of testing completed

| Spec file                |  Tests | What it covers                                                                           |
| ------------------------ | -----: | ---------------------------------------------------------------------------------------- |
| `posts.spec.ts`          |     11 | list, unique ids, userId filter, by id, 404, nested comments, POST/PUT/PATCH/DELETE      |
| `comments.spec.ts`       |     10 | list, unique ids, postId filter (exactly 5), by id, 404, POST/PUT/PATCH/DELETE           |
| `albums.spec.ts`         |     11 | list, unique ids, userId filter, by id, 404, nested photos, POST/PUT/PATCH/DELETE        |
| `photos.spec.ts`         |     10 | list, unique ids, albumId filter (exactly 50), by id, 404, POST/PUT/PATCH/DELETE         |
| `todos.spec.ts`          |     12 | list, unique ids, 3 filter cases, by id, 404, POST/PUT/PATCH/DELETE                      |
| `users.spec.ts`          |     12 | list, unique ids/usernames/emails, by id, 404, 3 nested resources, POST/PUT/PATCH/DELETE |
| `error-handling.spec.ts` |     13 | invalid ids, unsupported routes, empty results, known mock quirks                        |
| **Total**                | **79** |                                                                                          |

## 2. Execution instructions

### Install dependencies

Requires **Node.js 20+**.

```bash
npm ci
```

No browser download is needed because the suite only makes API calls.

### Build the project

There is no compile step: Playwright runs the TypeScript directly. To check code quality:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format:check  # Prettier
```

### Execute the test suite

```bash
npm test                                   # all 79 tests
npm run test:smoke                         # 18 @smoke tests: list + by-id for every resource
npx playwright test tests/posts.spec.ts    # one file
npx playwright test -g "returns 404"       # tests whose title matches a pattern
API_BASE_URL=http://localhost:3000 npm test   # run against another host (e.g. a local json-server)
```

The smoke subset uses Playwright's built-in `tag` option (`test('title', { tag: '@smoke' }, ...)`). It is a quick health check that every resource responds with valid data, useful before running the full suite.

### View test results

- **Terminal:** the list reporter prints each test as it runs, followed by a summary.
- **HTML report:** `npm run report` opens `playwright-report/`. Failed tests include a trace.
- **CI:** each GitHub Actions run uploads the report as the `playwright-report` artifact.

## 3. Coverage summary

### Routes/resources tested

| Resource | GET list | GET by id | POST | PUT | PATCH | DELETE | Filters               | Nested                            |
| -------- | :------: | :-------: | :--: | :-: | :---: | :----: | --------------------- | --------------------------------- |
| posts    |    ✓     |     ✓     |  ✓   |  ✓  |   ✓   |   ✓    | `userId`              | `/posts/:id/comments`             |
| comments |    ✓     |     ✓     |  ✓   |  ✓  |   ✓   |   ✓    | `postId`              |                                   |
| albums   |    ✓     |     ✓     |  ✓   |  ✓  |   ✓   |   ✓    | `userId`              | `/albums/:id/photos`              |
| photos   |    ✓     |     ✓     |  ✓   |  ✓  |   ✓   |   ✓    | `albumId`             |                                   |
| todos    |    ✓     |     ✓     |  ✓   |  ✓  |   ✓   |   ✓    | `userId`, `completed` |                                   |
| users    |    ✓     |     ✓     |  ✓   |  ✓  |   ✓   |   ✓    |                       | `/users/:id/posts\|albums\|todos` |

### Types of validations implemented

| Validation          | How                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Status code         | `assertJsonResponse(response, expectedStatus)` on every request                                                                     |
| Content type        | `content-type` contains `application/json`                                                                                          |
| Schema / data types | zod `strictObject`: positive integer ids, non-empty text, emails, https URLs, booleans, numeric-string coordinates, no extra fields |
| Record counts       | `toHaveLength` against known dataset sizes                                                                                          |
| Uniqueness          | `Set` size equals list length (ids, usernames, emails)                                                                              |
| Filter correctness  | every returned item has the filtered value                                                                                          |
| Data consistency    | nested route equals the matching filtered route                                                                                     |
| Write responses     | exact body match with `toEqual` (payload plus expected id)                                                                          |
| Error bodies        | 404 returns `{}`, and empty queries return `[]`                                                                                     |

### Test scenarios by category

#### Positive test cases

| Scenario                                   | Resources                              |
| ------------------------------------------ | -------------------------------------- |
| List all records                           | all 6                                  |
| Get first and last record by id            | all 6                                  |
| Filter by a field                          | posts, comments, albums, photos, todos |
| Nested route matches filtered route        | posts, albums, users                   |
| Create (POST) returns 201 with new id      | all 6                                  |
| Replace (PUT) returns the full record      | all 6                                  |
| Update (PATCH) merges only the fields sent | all 6                                  |
| Delete returns `{}`                        | all 6                                  |

#### Response validation

| Check                                                              | Where                         |
| ------------------------------------------------------------------ | ----------------------------- |
| Full-list schema match                                             | every "returns all …" test    |
| Single-record schema match                                         | every by-id, POST, PUT, PATCH |
| Unique ids / usernames / emails                                    | every "unique" test           |
| Exact counts per filter (5 comments per post, 50 photos per album) | comments, photos              |

#### Status code verifications

| Status | When                                                              |
| ------ | ----------------------------------------------------------------- |
| 200    | GET, PUT, PATCH, DELETE on existing records; empty filter results |
| 201    | POST creates                                                      |
| 404    | unknown ids, invalid ids, unknown routes, POST to a single record |
| 500    | mock quirks (PUT on missing id, malformed JSON)                   |

#### Parameterized tests

| Data set                   | Values                                               |  Tests |
| -------------------------- | ---------------------------------------------------- | -----: |
| First/last id per resource | `[FIRST_X_ID, LAST_X_ID]` × 6                        |     12 |
| `TODO_FILTER_CASES`        | userId 1; completed true; userId 1 + completed false |      3 |
| `USER_OWNED_RESOURCES`     | posts, albums, todos                                 |      3 |
| `INVALID_POST_IDS`         | `0`, `abc`, `999999`                                 |      3 |
| **Total**                  |                                                      | **21** |

#### Negative scenarios

| Request                                       | Actual (pinned)       | A real API would return |
| --------------------------------------------- | --------------------- | ----------------------- |
| `GET /posts/0`, `/posts/abc`, `/posts/999999` | 404 `{}`              | 404                     |
| `GET /does-not-exist`                         | 404 `{}`              | 404                     |
| `POST /posts/1`                               | 404 `{}`              | 404 or 405              |
| `GET /comments?postId=99999`                  | 200 `[]`              | 200 `[]`                |
| `GET /posts?userId=abc`                       | 200 `[]`              | 400 or 200 `[]`         |
| `GET /posts/99999/comments`                   | 200 `[]`              | 404                     |
| `POST /posts` with `{}`                       | **201 `{ id: 101 }`** | 400                     |
| `PUT /posts/99999`                            | **500**               | 404                     |
| `PATCH /posts/99999`                          | **200, echoes body**  | 404                     |
| `DELETE /posts/99999`                         | **200 `{}`**          | 404                     |
| `POST /posts` with malformed JSON             | **500**               | 400                     |

### Areas intentionally omitted due to time constraints

- json-server query features: pagination (`_page`, `_limit`, `_start`, `_end`), sorting (`_sort`, `_order`), relationships (`_embed`, `_expand`), full-text search (`q=`) and operators (`_like`, `_gte`, `_ne`)
- Dataset-wide distribution checks (e.g. every user has exactly 10 posts)
- Performance, load and response-time testing
- OpenAPI / consumer-driven contract testing
- Authentication, rate limiting, CORS and security headers
- Every possible filter combination
- HTML routes and the `/guide` page

## 4. Project structure

```
.
├── .github/workflows/tests.yml   # CI: typecheck → lint → test → upload report
├── src/
│   ├── models/                   # interfaces + zod schemas, one file per resource
│   │   ├── common.ts             # shared rules: idSchema, nonEmptyTextSchema
│   │   ├── post.ts, comment.ts, album.ts, photo.ts, todo.ts, user.ts
│   │   └── index.ts              # re-exports everything
│   ├── helpers/assertions.ts     # assertJsonResponse, assertMatchesSchema
│   └── data/payloads.ts          # request bodies for POST/PUT/PATCH
├── tests/                        # one spec per resource + error-handling.spec.ts
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── .prettierrc.json
```

### Notes

- TypeScript is pinned to `~6.0` because `typescript-eslint` does not support TypeScript 7 yet.
- The quirk tests pin the mock's current behaviour, checked against the live API on 2026-09-27. If one fails, the API has changed; confirm with `curl` before updating the expected value.
