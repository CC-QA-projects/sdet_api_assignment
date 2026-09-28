import { expect, APIResponse } from '@playwright/test';
import { z } from 'zod';

const MAX_BODY_PREVIEW_LENGTH = 500;
const MAX_SCHEMA_ISSUES_SHOWN = 5;

// Checks the status code and that the body is JSON.
// On a wrong status, the message shows the URL and the start of the body to help debugging.
export const assertJsonResponse = async (
  response: APIResponse,
  expectedStatus: number,
): Promise<void> => {
  const body: string = await response.text();
  const bodyPreview: string = body.slice(0, MAX_BODY_PREVIEW_LENGTH);

  expect(
    response.status(),
    `unexpected status for ${response.url()}\nresponse body: ${bodyPreview}`,
  ).toBe(expectedStatus);
  expect(response.headers()['content-type'], 'content-type should be JSON').toContain(
    'application/json',
  );
};

// Turns schema errors into readable text, showing only the first few issues.
const formatSchemaIssues = (error: z.ZodError): string => {
  const shownIssues = error.issues.slice(0, MAX_SCHEMA_ISSUES_SHOWN);
  let message: string = z.prettifyError(new z.ZodError(shownIssues));

  const hiddenIssueCount: number = error.issues.length - shownIssues.length;
  if (hiddenIssueCount > 0) {
    message += `\n…and ${hiddenIssueCount} more issues`;
  }
  return message;
};

// Checks the data against a zod schema. On failure the test shows which fields are wrong.
export const assertMatchesSchema = (data: unknown, schema: z.ZodType): void => {
  const result = schema.safeParse(data);
  if (!result.success) {
    expect(formatSchemaIssues(result.error), 'response body should match the schema').toBe('');
  }
};
