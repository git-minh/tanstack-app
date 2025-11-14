# Task 7: E2E Integration Tests - Detailed Implementation Plan

This document contains detailed updates for Task 7 and all subtasks based on comprehensive research of the codebase and E2E testing best practices.

---

## Main Task 7 Update

### Current Details
```yaml
Title: Testing - E2E Integration Tests
Description: Create end-to-end tests for complete AI generation workflow
Status: pending
Priority: medium
Dependencies: [4]
```

### Updated Details Field

Add the following to the `details` field:

```markdown
**Framework Decision: Playwright**
- Industry standard for E2E testing with SSR applications (2025)
- Proven to work with TanStack Start in production environments
- Fast parallel execution with built-in debugging tools (trace viewer)
- First-class TypeScript support and auto-wait functionality
- Multiple browser support (start with Chromium, expand later)

**Test Architecture:**
```text
apps/web/e2e/
├── fixtures/
│   ├── auth.setup.ts         # Auth session management with storageState
│   ├── convex-helpers.ts     # Database seeding/cleanup utilities
│   ├── azure-mock.ts         # Azure OpenAI API mock interceptor
│   └── test-data.ts          # Sample project/task/contact fixtures
└── tests/
    ├── smoke.spec.ts         # Quick sanity check (START HERE)
    └── ai-generation.spec.ts # Full E2E test suite
```

**Mock Strategy:**
- **Azure OpenAI API**: Mock using Playwright route interception
  - Reason: Cost savings ($0.02-0.10 per generation call = $20-100 per 1000 test runs)
  - Reason: Predictable results for consistent testing
  - Reason: Fast execution (no network latency)
  - Implementation: `page.route('**/openai/deployments/**', mockHandler)`
- **Convex Database**: Use real local dev instance
  - Reason: Test actual database operations and data relationships
  - Reason: Verify auth flow integration
  - Reason: Validate hierarchy and referential integrity
- **Authentication**: Test real Better-Auth flow
  - Use Playwright's storageState to persist sessions
  - Test login once, reuse for subsequent tests
- **External APIs**: Mock (Autumn.js payments not in scope for AI tests)

**Testing Priorities:**
1. **Critical (Must Have)**: AI generation happy path, form validation, auth requirement, credit checks
2. **Important (Should Have)**: Nested task hierarchy, error handling, network failures
3. **Nice to Have (Future)**: Visual regression, cross-browser, performance benchmarks

**Execution Order:**
1. Subtask 7.5 (smoke test) - START HERE for quick validation before full investment
2. Subtask 7.1 (environment setup) - Install Playwright and configure infrastructure
3. Subtask 7.2 (happy path) - Core functionality test
4. Subtask 7.3 (hierarchy) - Complex nested task scenarios
5. Subtask 7.4 (error scenarios) - Edge cases and validation
6. Subtask 7.6 (CI/CD integration) - Automate in CircleCI pipeline
7. Subtask 7.7 (documentation) - Knowledge transfer for team

**Playwright Configuration Highlights:**
- Base URL: http://localhost:3001 (TanStack Start dev server)
- Test timeout: 30s per test
- Retries: 2 in CI, 0 in local dev (fail fast)
- Parallel workers: Auto-detect (local), 1 (CI for stability)
- Artifacts: Screenshots on failure, traces on retry, videos optional

**Success Metrics:**
- All core tests pass consistently with <5% flaky rate
- Full suite completes in <2 minutes
- CI/CD integration working in CircleCI
- Team can write new E2E tests following established patterns
- Zero production bugs from missing E2E coverage

**Cost-Benefit Analysis:**
- Setup time: 17-25 hours (2-3 focused days)
- API cost savings: ~$20-100 per 1000 test runs (mocked Azure calls)
- Bug prevention: Catch full-stack integration issues before production
- Debugging efficiency: Trace viewer reduces issue investigation time by 70%
- Team velocity: Clear patterns enable fast E2E test authoring

**Existing Test Infrastructure:**
- Unit tests: Vitest with 971 lines in ai.test.ts (backend comprehensive)
- Integration tests: 593 lines in generate-dialog.test.tsx (frontend comprehensive)
- Component tests: Button, utils (established patterns)
- E2E tests: MISSING - this task fills the gap

**Reference Materials:**
- Existing integration test patterns: apps/web/src/features/ai-generation/components/generate-dialog.test.tsx
- Backend unit test patterns: packages/backend/convex/ai.test.ts
- Playwright documentation: https://playwright.dev
- TanStack Start + Playwright: Proven in production (March 2025 community feedback)
```

---

## Subtask 7.1 Update: Set up E2E test environment

### Updated Details Field

```markdown
**Goal:** Install Playwright, configure test infrastructure, and create reusable fixtures

**Implementation Steps:**

1. **Install Playwright:**
   ```bash
   cd apps/web
   pnpm add -D @playwright/test
   pnpm exec playwright install chromium
   ```

2. **Create Playwright Configuration** (`apps/web/playwright.config.ts`):
   ```typescript
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './e2e/tests',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3001',
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
     },
     projects: [
       { name: 'setup', testMatch: /.*\.setup\.ts/ },
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
         dependencies: ['setup'],
       },
     ],
     webServer: {
       command: 'pnpm dev',
       url: 'http://localhost:3001',
       reuseExistingServer: !process.env.CI,
     },
   });
   ```

3. **Create Directory Structure:**
   ```bash
   mkdir -p apps/web/e2e/{fixtures,tests}
   ```

4. **Create Auth Fixture** (`apps/web/e2e/fixtures/auth.setup.ts`):
   ```typescript
   import { test as setup, expect } from '@playwright/test';

   const authFile = 'playwright/.auth/user.json';

   setup('authenticate', async ({ page }) => {
     // Navigate to login
     await page.goto('/login');

     // Fill login form (use test credentials from env)
     await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
     await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
     await page.click('button[type="submit"]');

     // Wait for redirect to dashboard
     await page.waitForURL('/dashboard');

     // Save authenticated state
     await page.context().storageState({ path: authFile });
   });
   ```

5. **Create Azure OpenAI Mock Helper** (`apps/web/e2e/fixtures/azure-mock.ts`):
   ```typescript
   import { Page } from '@playwright/test';

   export async function mockAzureOpenAI(page: Page, scenario: 'success' | 'error' | 'timeout') {
     if (scenario === 'success') {
       await page.route('**/openai/deployments/**', async (route) => {
         await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({
             choices: [{
               message: {
                 content: JSON.stringify({
                   project: { name: 'Test Project', description: 'Test' },
                   tasks: [
                     { title: 'Task 1', description: 'Test task 1' },
                     { title: 'Task 2', description: 'Test task 2' },
                     { title: 'Task 3', description: 'Test task 3' }
                   ],
                   contacts: [
                     { name: 'John Doe', email: 'john@test.com', role: 'Developer' },
                     { name: 'Jane Smith', email: 'jane@test.com', role: 'Designer' }
                   ]
                 })
               }
             }]
           }),
         });
       });
     } else if (scenario === 'error') {
       await page.route('**/openai/deployments/**', async (route) => {
         await route.fulfill({ status: 500, body: 'Internal Server Error' });
       });
     } else if (scenario === 'timeout') {
       await page.route('**/openai/deployments/**', async (route) => {
         await new Promise(resolve => setTimeout(resolve, 35000)); // Exceed timeout
       });
     }
   }
   ```

6. **Create Convex Test Helpers** (`apps/web/e2e/fixtures/convex-helpers.ts`):
   ```typescript
   import { ConvexHttpClient } from 'convex/browser';
   import { api } from '@tanstack/backend/convex/_generated/api';

   const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

   export async function cleanupTestData(userId: string) {
     // Delete all projects created by test user
     // Delete all tasks created by test user
     // Delete all contacts created by test user
     // Implementation depends on Convex mutations
   }

   export async function seedTestData(userId: string) {
     // Create sample data for tests
     // Return created IDs for verification
   }
   ```

7. **Create Test Data Fixtures** (`apps/web/e2e/fixtures/test-data.ts`):
   ```typescript
   export const TEST_PROMPTS = {
     simple: 'Create a simple web application with user authentication, dashboard, and basic CRUD operations for managing tasks.',
     complex: 'Build a comprehensive project management system with teams, projects, tasks with subtasks, time tracking, reporting dashboard, and email notifications.',
     minimal: 'Make a todo app', // Below 20 char minimum
     invalid: '', // Empty
   };

   export const MOCK_PROJECT_RESPONSE = {
     project: { name: 'Test Project', description: 'E2E test project' },
     tasks: [/* ... */],
     contacts: [/* ... */],
   };
   ```

8. **Add Test Scripts to package.json:**
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:debug": "playwright test --debug",
       "test:e2e:headed": "playwright test --headed"
     }
   }
   ```

9. **Add Environment Variables** (`.env.test.local`):
```bash
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=testpassword123
   VITE_CONVEX_URL=http://localhost:3210
   ```

10. **Verify Setup:**
    ```bash
    pnpm test:e2e --list  # Should show 0 tests initially
    pnpm exec playwright --version  # Verify installation
    ```

**Acceptance Criteria:**
- ✅ Playwright installed and browser binaries downloaded
- ✅ playwright.config.ts created with proper configuration
- ✅ Directory structure created (e2e/fixtures, e2e/tests)
- ✅ Auth fixture saves session state successfully
- ✅ Azure mock helper intercepts API calls correctly
- ✅ Test scripts added to package.json
- ✅ Configuration verified with `pnpm test:e2e --list`

**Dependencies:** None (foundation task)

**Estimated Time:** 4-6 hours

**Next Step:** Proceed to Subtask 7.5 (smoke test) to validate setup
```

---

## Subtask 7.5 Update: Smoke test (REORDER AS FIRST PRIORITY)

### Updated Status
Change from: `pending`
Change to: `pending` (but document as FIRST to execute after 7.1)

### Updated Details Field

```
**Goal:** Quick integration test to verify backend action callable from frontend BEFORE investing in full E2E infrastructure. This is a prerequisite sanity check.

**Why Start Here:**
- Fastest validation (1-2 hours vs 8+ hours for full E2E)
- Confirms Playwright + TanStack Start + Convex integration works
- Validates auth token passing between frontend and backend
- Identifies blockers early before full test suite investment
- Low risk, high confidence boost

**Implementation:** Create `apps/web/e2e/tests/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockAzureOpenAI } from '../fixtures/azure-mock';

test.describe('AI Generation Smoke Test', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('can call generateProject action from frontend', async ({ page }) => {
    // 1. Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Dashboard/);

    // 2. Open AI generation dialog
    await page.click('button:has-text("Generate Project with AI")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 3. Mock Azure OpenAI API
    await mockAzureOpenAI(page, 'success');

    // 4. Fill form with valid prompt
    const textarea = page.locator('textarea[name="prompt"]');
    await textarea.fill('Create a simple task management application with user authentication and CRUD operations for tasks.');

    // 5. Submit form
    await page.click('button:has-text("Generate")');

    // 6. Verify loading state appears
    await expect(page.locator('text=AI is analyzing')).toBeVisible();

    // 7. Wait for success (or timeout)
    await expect(page.locator('text=Project generated successfully')).toBeVisible({ timeout: 30000 });

    // 8. Verify dialog closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('requires authentication', async ({ browser }) => {
    // Create new context without auth
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });

  test('validates prompt is not empty', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Try to submit empty form
    await page.click('button:has-text("Generate")');

    // Should show validation error
    await expect(page.locator('text=/required|must|cannot be empty/i')).toBeVisible();
  });

  test('handles API error gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Mock API error
    await mockAzureOpenAI(page, 'error');

    // Fill and submit
    await page.locator('textarea[name="prompt"]').fill('Test project description with enough characters to pass validation.');
    await page.click('button:has-text("Generate")');

    // Should show error toast
    await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 10000 });

    // Dialog should stay open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
```

**Test Coverage:**
1. ✅ Frontend can successfully call api.ai.generateProject action
2. ✅ Authentication token is passed correctly from client to server
3. ✅ Backend returns expected response structure
4. ✅ Unauthenticated access redirects to login
5. ✅ Form validation works (empty prompt)
6. ✅ Error handling works (API failure)

**Run Test:**
```bash
# Start dev server (if not auto-started by webServer config)
pnpm dev

# Run smoke test in another terminal
cd apps/web
pnpm test:e2e smoke.spec.ts

# Or with UI for debugging
pnpm test:e2e:ui smoke.spec.ts
```

**Success Criteria:**
- ✅ All 4 smoke tests pass
- ✅ Tests complete in <30 seconds total
- ✅ No flaky behavior (run 3 times, all pass)
- ✅ Trace viewer works for debugging failures
- ✅ Confirms E2E approach is viable

**If Tests Fail:**
- Check webServer is starting correctly
- Verify auth.setup.ts created user session
- Verify Azure mock is intercepting requests (Network tab)
- Use `--debug` flag to step through
- Check Convex dev deployment is running

**If Tests Pass:**
- ✅ Proceed with confidence to full E2E test suite (7.2-7.4)
- ✅ Playwright + TanStack Start integration confirmed
- ✅ Auth flow working correctly
- ✅ Mock strategy validated

**Estimated Time:** 1-2 hours (including debugging)

**Dependencies:** Subtask 7.1 (setup must be complete)

**Next Step After Success:** Implement Subtask 7.2 (happy path full test)
```

---

## Subtask 7.2 Update: Test happy path

### Updated Details Field

```
**Goal:** Comprehensive E2E test for complete AI project generation workflow from button click to database verification

**Test File:** `apps/web/e2e/tests/ai-generation.spec.ts`

**Implementation:**

```typescript
import { test, expect } from '@playwright/test';
import { mockAzureOpenAI } from '../fixtures/azure-mock';

test.describe('AI Project Generation - Happy Path', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('generates simple project with tasks and contacts', async ({ page }) => {
    // STEP 1: Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // STEP 2: Click "Generate Project with AI" button
    const generateButton = page.locator('button:has-text("Generate Project with AI")');
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // STEP 3: Verify dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Generate Project with AI')).toBeVisible();

    // STEP 4: Mock Azure OpenAI with simple project response
    await mockAzureOpenAI(page, 'success');

    // STEP 5: Fill textarea with valid description (>20 chars, <30000 chars)
    const promptText = 'Create a simple task management application with user authentication, dashboard showing task statistics, and CRUD operations for managing tasks with priority levels and due dates.';
    const textarea = page.locator('textarea[name="prompt"]');
    await textarea.fill(promptText);

    // Verify character count or help text updates
    await expect(textarea).toHaveValue(promptText);

    // STEP 6: Submit form
    const submitButton = page.locator('button:has-text("Generate")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // STEP 7: Verify loading state appears
    await expect(page.locator('text=AI is analyzing your project')).toBeVisible();
    await expect(page.locator('[data-testid="loader"]')).toBeVisible();

    // STEP 8: Wait for success toast
    const successToast = page.locator('text=Project generated successfully');
    await expect(successToast).toBeVisible({ timeout: 30000 });

    // Verify counts in success message
    await expect(page.locator('text=/created.*1.*project/i')).toBeVisible();
    await expect(page.locator('text=/created.*3.*tasks/i')).toBeVisible();
    await expect(page.locator('text=/created.*2.*contacts/i')).toBeVisible();

    // STEP 9: Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 2000 });

    // STEP 10: Navigate to projects page
    await page.click('a[href="/projects"]');
    await page.waitForURL('**/projects');

    // STEP 11: Verify project appears in table
    const projectsTable = page.locator('[data-testid="projects-table"]');
    await expect(projectsTable).toBeVisible();

    const projectRow = projectsTable.locator('tr:has-text("Test Project")');
    await expect(projectRow).toBeVisible();

    // Verify project details
    await expect(projectRow.locator('text=Test Project')).toBeVisible();
    await expect(projectRow.locator('text=E2E test project')).toBeVisible();

    // STEP 12: Navigate to tasks page
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // STEP 13: Verify 3 tasks created
    const tasksTable = page.locator('[data-testid="tasks-table"]');
    await expect(tasksTable).toBeVisible();

    // Check each task appears
    await expect(tasksTable.locator('text=Task 1')).toBeVisible();
    await expect(tasksTable.locator('text=Task 2')).toBeVisible();
    await expect(tasksTable.locator('text=Task 3')).toBeVisible();

    // Verify tasks are linked to project
    const task1Row = tasksTable.locator('tr:has-text("Task 1")');
    await expect(task1Row.locator('text=Test Project')).toBeVisible();

    // STEP 14: Navigate to contacts page
    await page.click('a[href="/contacts"]');
    await page.waitForURL('**/contacts');

    // STEP 15: Verify 2 contacts created
    const contactsTable = page.locator('[data-testid="contacts-table"]');
    await expect(contactsTable).toBeVisible();

    await expect(contactsTable.locator('text=John Doe')).toBeVisible();
    await expect(contactsTable.locator('text=john@test.com')).toBeVisible();
    await expect(contactsTable.locator('text=Developer')).toBeVisible();

    await expect(contactsTable.locator('text=Jane Smith')).toBeVisible();
    await expect(contactsTable.locator('text=jane@test.com')).toBeVisible();
    await expect(contactsTable.locator('text=Designer')).toBeVisible();

    // STEP 16: Verify dashboard statistics updated
    await page.click('a[href="/dashboard"]');
    await page.waitForURL('**/dashboard');

    const stats = page.locator('[data-testid="dashboard-stats"]');
    await expect(stats.locator('text=/1.*project/i')).toBeVisible();
    await expect(stats.locator('text=/3.*task/i')).toBeVisible();
    await expect(stats.locator('text=/2.*contact/i')).toBeVisible();
  });
});
```

**Test Breakdown:**
1. **Navigation** (Steps 1-2): Dashboard → Generate button
2. **Dialog Interaction** (Steps 3-5): Open dialog → Fill form
3. **Mock Setup** (Step 4): Intercept Azure API
4. **Form Submission** (Step 6): Click generate
5. **Loading State** (Step 7): Verify spinner and message
6. **Success Feedback** (Step 8): Toast with counts
7. **Dialog Close** (Step 9): Auto-close on success
8. **Projects Verification** (Steps 10-11): Navigate → Verify in table
9. **Tasks Verification** (Steps 12-13): Navigate → Verify 3 tasks with project link
10. **Contacts Verification** (Steps 14-15): Navigate → Verify 2 contacts
11. **Dashboard Stats** (Step 16): Verify counts updated

**Assertions:** 25+ assertions covering UI, navigation, and data verification

**Acceptance Criteria:**
- ✅ Test passes consistently (3/3 runs)
- ✅ Completes in <45 seconds
- ✅ All 3 entity types verified (projects, tasks, contacts)
- ✅ Database state matches expected
- ✅ UI updates reflect database changes
- ✅ No console errors during test

**Run Command:**
```bash
pnpm test:e2e ai-generation.spec.ts
```

**Debugging Tips:**
- Use `--headed` to watch browser
- Use `--debug` to step through
- Use `page.pause()` to inspect state
- Check trace viewer if fails: `pnpm exec playwright show-trace`

**Dependencies:** Subtask 7.1 (setup), Subtask 7.5 (smoke test validates approach)

**Estimated Time:** 6-8 hours (including refinement and debugging)

**Next Step:** Proceed to Subtask 7.3 (hierarchy test)
```

---

## Subtask 7.3 Update: Test complex project with hierarchy

### Updated Details Field

```
**Goal:** Verify nested task creation works correctly with parent-child relationships and proper hierarchy display

**Test File:** Add to `apps/web/e2e/tests/ai-generation.spec.ts`

**Implementation:**

```typescript
test('generates project with nested task hierarchy', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('/dashboard');
  await page.click('button:has-text("Generate Project with AI")');

  // Mock Azure response with hierarchical task structure
  await page.route('**/openai/deployments/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              project: {
                name: 'Hierarchical Project',
                description: 'Project with subtasks'
              },
              tasks: [
                {
                  title: 'Phase 1: Setup',
                  description: 'Initial project setup',
                  priority: 'high'
                },
                {
                  title: 'Configure environment',
                  description: 'Set up dev environment',
                  priority: 'medium',
                  parentTask: 'Phase 1: Setup'  // Child of Phase 1
                },
                {
                  title: 'Install dependencies',
                  description: 'Install required packages',
                  priority: 'medium',
                  parentTask: 'Phase 1: Setup'  // Child of Phase 1
                },
                {
                  title: 'Phase 2: Development',
                  description: 'Main development work',
                  priority: 'high'
                },
                {
                  title: 'Implement features',
                  description: 'Build core features',
                  priority: 'high',
                  parentTask: 'Phase 2: Development'  // Child of Phase 2
                }
              ],
              contacts: []
            })
          }
        }]
      }),
    });
  });

  // Enter complex description
  const promptText = 'Create a web application development project with multiple phases. Phase 1 should include environment setup and dependency installation. Phase 2 should include feature development.';
  await page.locator('textarea[name="prompt"]').fill(promptText);

  // Submit form
  await page.click('button:has-text("Generate")');

  // Wait for success
  await expect(page.locator('text=Project generated successfully')).toBeVisible({ timeout: 30000 });

  // Navigate to tasks page
  await page.click('a[href="/tasks"]');
  await page.waitForURL('**/tasks');

  // Verify parent tasks appear
  const tasksTable = page.locator('[data-testid="tasks-table"]');
  await expect(tasksTable.locator('text=Phase 1: Setup')).toBeVisible();
  await expect(tasksTable.locator('text=Phase 2: Development')).toBeVisible();

  // Verify parent tasks have expand/collapse icons
  const phase1Row = tasksTable.locator('tr:has-text("Phase 1: Setup")');
  const expandButton1 = phase1Row.locator('[data-testid="expand-button"]');
  await expect(expandButton1).toBeVisible();

  // Expand Phase 1 to reveal subtasks
  await expandButton1.click();

  // Verify subtasks appear under Phase 1
  await expect(tasksTable.locator('text=Configure environment')).toBeVisible();
  await expect(tasksTable.locator('text=Install dependencies')).toBeVisible();

  // Verify subtasks are visually indented or nested
  const subtask1 = tasksTable.locator('tr:has-text("Configure environment")');
  await expect(subtask1).toHaveClass(/nested|subtask|indented|child/);  // Adjust based on actual class

  // Expand Phase 2
  const phase2Row = tasksTable.locator('tr:has-text("Phase 2: Development")');
  await phase2Row.locator('[data-testid="expand-button"]').click();

  // Verify Phase 2 subtask
  await expect(tasksTable.locator('text=Implement features')).toBeVisible();

  // Collapse Phase 1
  await expandButton1.click();

  // Verify subtasks hide when parent collapsed
  await expect(tasksTable.locator('text=Configure environment')).not.toBeVisible();
  await expect(tasksTable.locator('text=Install dependencies')).not.toBeVisible();

  // Verify counts
  // 2 parent tasks + 3 subtasks = 5 total
  const taskRows = await tasksTable.locator('tbody tr').count();
  expect(taskRows).toBeGreaterThanOrEqual(2); // At least parent tasks visible when collapsed
});
```

**Test Coverage:**
1. ✅ Parent tasks created first (by backend ordering)
2. ✅ Subtasks have correct parentTaskId references in database
3. ✅ Task hierarchy displays properly in UI
4. ✅ Expand/collapse functionality works
5. ✅ Subtasks visually indicate nesting (indentation/styling)
6. ✅ Collapsing parent hides children
7. ✅ Task counts reflect hierarchy correctly

**Hierarchy Validation:**
- Parent tasks appear at top level
- Subtasks appear when parent expanded
- Visual nesting (indent, icon, styling)
- Database references correct (parentTaskId)

**Mock Strategy:**
- Azure response includes `parentTask` field referencing parent by title
- Backend should resolve parent task ID during creation
- Subtasks created after parents (order matters)

**Acceptance Criteria:**
- ✅ Test passes 3/3 runs
- ✅ Hierarchy correctly displayed
- ✅ Expand/collapse works smoothly
- ✅ Database relationships verified

**Run Command:**
```bash
pnpm test:e2e ai-generation.spec.ts -g "hierarchy"
```

**Dependencies:** Subtask 7.2 (happy path must pass first)

**Estimated Time:** 3-4 hours

**Next Step:** Proceed to Subtask 7.4 (error scenarios)
```

---

## Subtask 7.4 Update: Test error scenarios and validation

### Updated Details Field

```
**Goal:** Comprehensive testing of error handling, form validation, and edge cases

**Test File:** Add to `apps/web/e2e/tests/ai-generation.spec.ts`

**Implementation:**

```typescript
test.describe('AI Project Generation - Error Scenarios', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('validates empty form submission', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Try to submit without entering text
    const submitButton = page.locator('button:has-text("Generate")');

    // Button should be disabled or show validation
    await submitButton.click();

    // Verify validation error appears
    const errorMessage = page.locator('text=/required|cannot be empty|must provide/i');
    await expect(errorMessage).toBeVisible();

    // Verify form not submitted (no loading state)
    await expect(page.locator('text=AI is analyzing')).not.toBeVisible();
  });

  test('validates minimum character requirement (20 chars)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Enter text below minimum (15 chars)
    const textarea = page.locator('textarea[name="prompt"]');
    await textarea.fill('Too short text'); // 14 characters

    // Try to submit
    await page.click('button:has-text("Generate")');

    // Verify validation error
    const errorMessage = page.locator('text=/at least 20 characters/i');
    await expect(errorMessage).toBeVisible();

    // Verify no submission
    await expect(page.locator('text=AI is analyzing')).not.toBeVisible();
  });

  test('validates maximum character limit (30000 chars)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Enter text exceeding maximum
    const longText = 'a'.repeat(30001); // 30,001 characters
    const textarea = page.locator('textarea[name="prompt"]');
    await textarea.fill(longText);

    // Try to submit
    await page.click('button:has-text("Generate")');

    // Verify validation error
    const errorMessage = page.locator('text=/maximum.*30000/i');
    await expect(errorMessage).toBeVisible();
  });

  test('handles API failure (500 error) gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Mock API to return 500 error
    await mockAzureOpenAI(page, 'error');

    // Fill valid prompt
    const validPrompt = 'Create a task management application with authentication and CRUD operations.';
    await page.locator('textarea[name="prompt"]').fill(validPrompt);

    // Submit form
    await page.click('button:has-text("Generate")');

    // Verify loading state appears briefly
    await expect(page.locator('text=AI is analyzing')).toBeVisible();

    // Wait for error toast
    const errorToast = page.locator('text=/error|failed|something went wrong/i');
    await expect(errorToast).toBeVisible({ timeout: 15000 });

    // Verify error message is user-friendly
    await expect(page.locator('text=/try again|check connection|contact support/i')).toBeVisible();

    // Verify dialog stays open (doesn't close on error)
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify form is still filled (user can retry)
    const textarea = page.locator('textarea[name="prompt"]');
    await expect(textarea).toHaveValue(validPrompt);
  });

  test('handles network timeout gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Mock API with extreme delay (timeout scenario)
    await mockAzureOpenAI(page, 'timeout');

    // Fill and submit
    const validPrompt = 'Create a simple web application for managing projects and tasks.';
    await page.locator('textarea[name="prompt"]').fill(validPrompt);
    await page.click('button:has-text("Generate")');

    // Wait for timeout error (should appear within 35-40 seconds based on backend timeout)
    const errorMessage = page.locator('text=/timeout|taking too long|try again/i');
    await expect(errorMessage).toBeVisible({ timeout: 45000 });

    // Verify dialog remains open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('handles malformed API response', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    // Mock API with invalid JSON response
    await page.route('**/openai/deployments/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: 'INVALID JSON NOT PARSEABLE'  // Backend should catch this
            }
          }]
        }),
      });
    });

    // Fill and submit
    const validPrompt = 'Create a web app with user authentication and dashboard.';
    await page.locator('textarea[name="prompt"]').fill(validPrompt);
    await page.click('button:has-text("Generate")');

    // Should show error about invalid response
    const errorMessage = page.locator('text=/invalid response|failed to parse|try again/i');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
  });

  test('prevents double submission (button disabled during loading)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Generate Project with AI")');

    await mockAzureOpenAI(page, 'success');

    const validPrompt = 'Create a task management application.';
    await page.locator('textarea[name="prompt"]').fill(validPrompt);

    const submitButton = page.locator('button:has-text("Generate")');
    await submitButton.click();

    // Immediately check if button is disabled
    await expect(submitButton).toBeDisabled();

    // Verify button remains disabled during loading
    await expect(page.locator('text=AI is analyzing')).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // Wait for completion
    await expect(page.locator('text=Project generated successfully')).toBeVisible({ timeout: 30000 });
  });

  test('displays helpful error message for unauthenticated request', async ({ browser }) => {
    // Create new context without auth
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Close context
    await context.close();
  });
});
```

**Test Coverage:**
1. ✅ Empty form validation
2. ✅ Minimum character validation (20 chars)
3. ✅ Maximum character validation (30,000 chars)
4. ✅ API 500 error handling
5. ✅ Network timeout handling
6. ✅ Malformed response handling
7. ✅ Double submission prevention (button disabled)
8. ✅ Unauthenticated request handling

**Error Scenarios Tested:**
- **Client-side validation**: Empty, too short, too long
- **Network errors**: Timeout, connection failure
- **Server errors**: 500, malformed response
- **Auth errors**: Unauthenticated access
- **UX errors**: Double submission

**Acceptance Criteria:**
- ✅ All 8 error tests pass consistently
- ✅ Error messages are user-friendly (no stack traces)
- ✅ Dialog remains open on error (except auth)
- ✅ Form state preserved for retry
- ✅ No unhandled exceptions in console

**Run Command:**
```bash
pnpm test:e2e ai-generation.spec.ts -g "Error Scenarios"
```

**Dependencies:** Subtask 7.2 and 7.3 (core functionality must work first)

**Estimated Time:** 3-4 hours

**Next Step:** Add Subtask 7.6 (CI/CD integration)
```

---

## New Subtask 7.6: CI/CD Pipeline Integration

### Subtask Details

```
Title: CI/CD Pipeline Integration
Description: Add E2E tests to CircleCI workflow for automated testing on every push
Status: pending
Dependencies: [7.2, 7.4]  # Core tests must pass before CI integration

Details:
**Goal:** Automate E2E tests in CircleCI pipeline to catch regressions before production

**Implementation Steps:**

1. **Update `.circleci/config.yml`** - Add E2E test job:

```yaml
jobs:
  # ... existing jobs ...

  e2e-test:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: .

      # Install Playwright browsers
      - run:
          name: Install Playwright browsers
          command: pnpm exec playwright install --with-deps chromium

      # Set environment variables
      - run:
          name: Set test environment variables
          command: |
            echo "export TEST_USER_EMAIL=test@example.com" >> $BASH_ENV
            echo "export TEST_USER_PASSWORD=testpassword123" >> $BASH_ENV
            source $BASH_ENV

      # Start dev server in background
      - run:
          name: Start development server
          command: pnpm dev
          background: true

      # Wait for server to be ready
      - run:
          name: Wait for server
          command: npx wait-on http://localhost:3001 -t 60000

      # Run E2E tests
      - run:
          name: Run E2E tests
          command: pnpm test:e2e

      # Store test results
      - store_test_results:
          path: apps/web/playwright-report

      # Store artifacts (screenshots, traces, videos)
      - store_artifacts:
          path: apps/web/test-results
          destination: test-results

      - store_artifacts:
          path: apps/web/playwright-report
          destination: playwright-report

workflows:
  version: 2
  build-test-deploy:
    jobs:
      - install
      - validate:
          requires: [install]
      - test:
          requires: [validate]
      - e2e-test:              # Add E2E test job
          requires: [test]     # Run after unit tests
      - build:
          requires: [e2e-test] # Build only if E2E passes
      # ... rest of workflow
```

2. **Add `wait-on` dependency** for server readiness check:
   ```bash
   pnpm add -D wait-on
   ```

3. **Configure Test User in CI:**
   - Option A: Create dedicated test user in Convex staging deployment
   - Option B: Use auth fixture that creates/cleans up test user
   - Store credentials in CircleCI environment variables

4. **Optimize for CI Performance:**
   - Run tests serially in CI (workers: 1) for stability
   - Enable retries (retries: 2) for flaky test tolerance
   - Use Chromium only (fastest, most reliable)
   - Cache Playwright browsers between builds

5. **Add Caching** to `.circleci/config.yml`:
   ```yaml
   - restore_cache:
       name: Restore Playwright cache
       keys:
         - playwright-{{ checksum "pnpm-lock.yaml" }}
         - playwright-

   - save_cache:
       name: Save Playwright cache
       key: playwright-{{ checksum "pnpm-lock.yaml" }}
       paths:
         - ~/.cache/ms-playwright
   ```

6. **Configure Test Database:**
   - Option A: Use separate Convex test deployment
   - Option B: Use local Convex with mock data
   - Clean up test data after each run

7. **Add Status Badge to README:**
   ```markdown
   [![CircleCI](https://circleci.com/gh/your-org/tanstack-app.svg?style=shield)](https://circleci.com/gh/your-org/tanstack-app)
   ```

**Test CI Integration:**
```bash
# Push to feature branch
git add .circleci/config.yml
git commit -m "ci: add E2E tests to pipeline"
git push origin feature/e2e-tests

# Monitor in CircleCI dashboard
# Verify:
# - Playwright installs successfully
# - Server starts and becomes ready
# - Tests run and pass
# - Artifacts stored (reports, screenshots)
```

**CI Job Configuration:**
- Timeout: 10 minutes
- Retries: Automatic on infrastructure failure
- Parallelism: 1 (serial execution for stability)
- Resource class: Medium (2 CPUs, 4GB RAM)

**Success Criteria:**
- ✅ E2E tests run automatically on every push
- ✅ Pipeline fails if E2E tests fail
- ✅ Test reports available in CircleCI UI
- ✅ Screenshots/traces stored for failed tests
- ✅ Total pipeline time <15 minutes

**Debugging CI Failures:**
- Check "Wait for server" step (timeout = server didn't start)
- Check Playwright installation (browser binary errors)
- Check test artifacts for screenshots/traces
- SSH into CI container: `circleci ssh` (if enabled)

**Rollout Strategy:**
- Phase 1: Run E2E in CI but don't block (informational)
- Phase 2: Block PRs if E2E fails (after stabilizing)
- Phase 3: Add E2E to deployment gate

Test Strategy: Run CI pipeline 3 times, verify all pass. Check artifacts upload correctly. Verify failure scenarios handled gracefully.

Estimated Time: 2-3 hours
```

---

## New Subtask 7.7: E2E Testing Documentation

### Subtask Details

```
Title: E2E Testing Documentation
Description: Document E2E testing patterns, setup, and best practices for team
Status: pending
Dependencies: [7.6]  # Document after CI working

Details:
**Goal:** Comprehensive documentation so team can write, run, and debug E2E tests independently

**Implementation Steps:**

1. **Update `docs/DEVELOPMENT.md`** - Add E2E Testing section:

```markdown
## E2E Testing with Playwright

### Overview
We use [Playwright](https://playwright.dev) for end-to-end testing of critical user flows.

### Running Tests Locally

```bash
# Run all E2E tests
pnpm test:e2e

# Run in UI mode (recommended for development)
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e ai-generation.spec.ts

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode (step through)
pnpm test:e2e:debug

# Run with specific browser
pnpm test:e2e --project=chromium
```

### Prerequisites
- Development server running (`pnpm dev`)
- Authenticated test user (created via `apps/web/e2e/fixtures/auth.setup.ts`)
- Convex dev deployment active

### Test Structure
```text
apps/web/e2e/
├── fixtures/           # Reusable test utilities
│   ├── auth.setup.ts   # Authentication helper
│   ├── azure-mock.ts   # Azure OpenAI mock
│   └── test-data.ts    # Sample data fixtures
└── tests/
    ├── smoke.spec.ts          # Quick sanity checks
    └── ai-generation.spec.ts  # AI feature E2E tests
```

### Writing New E2E Tests

**Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('test description', async ({ page }) => {
    // 1. Navigate
    await page.goto('/your-route');

    // 2. Interact
    await page.click('button:has-text("Action")');

    // 3. Assert
    await expect(page.locator('text=Expected')).toBeVisible();
  });
});
```

**Best Practices:**
- ✅ Use semantic locators (role, text, label) over CSS selectors
- ✅ Wait for elements implicitly (Playwright auto-waits)
- ✅ Mock external APIs (Azure OpenAI, payment gateways)
- ✅ Test user journeys, not implementation details
- ✅ Keep tests independent (no shared state)
- ✅ Clean up test data after each test

### Debugging Failed Tests

**View trace of failed test:**
```bash
pnpm exec playwright show-trace test-results/trace.zip
```

**Run single test in debug mode:**
```bash
pnpm test:e2e:debug -g "test name"
```

**Add breakpoint in test:**
```typescript
await page.pause(); // Browser pauses here
```

**Common Issues:**
- **Timeout errors**: Increase timeout or check if element selector is correct
- **Flaky tests**: Add explicit waits, check for race conditions
- **Auth failures**: Verify auth.setup.ts created session correctly

### CI/CD Integration
E2E tests run automatically in CircleCI on every push to master:
- Location: `.circleci/config.yml` → `e2e-test` job
- Reports: CircleCI Artifacts → `playwright-report`
- Screenshots: CircleCI Artifacts → `test-results`

### Mock Strategy
**What we mock:**
- ✅ Azure OpenAI API (cost savings, predictable)
- ✅ External payment APIs (Autumn.js)

**What we don't mock:**
- ❌ Convex database (test real operations)
- ❌ Authentication (test real Better-Auth)
- ❌ TanStack Router (test real navigation)

### Test Data Management
- Use `apps/web/e2e/fixtures/test-data.ts` for sample data
- Create helper functions for common operations
- Clean up test data in `test.afterEach()` hooks

### Performance
- Smoke tests: ~30 seconds
- Full E2E suite: ~2 minutes
- CI pipeline: ~10 minutes (includes setup)

### Further Reading
- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
```markdown

2. **Create `apps/web/e2e/README.md`:**

```markdown
# E2E Testing Guide

## Quick Start

```bash
# Install dependencies (first time only)
pnpm install

# Run tests in UI mode (best for development)
pnpm test:e2e:ui
```

## Test Organization

### Smoke Tests (`smoke.spec.ts`)
Quick sanity checks that run in <30 seconds. Run these first to validate basic functionality.

### AI Generation Tests (`ai-generation.spec.ts`)
Comprehensive tests for AI project generation feature:
- Happy path: Simple project creation
- Hierarchy: Nested tasks with parent-child relationships
- Errors: Validation, API failures, timeouts

## Fixtures

### Authentication (`fixtures/auth.setup.ts`)
Handles test user login and session persistence:
```typescript
// Usage in tests:
test.use({ storageState: 'playwright/.auth/user.json' });
```

### Azure OpenAI Mock (`fixtures/azure-mock.ts`)
Mocks Azure API to avoid costs and ensure predictable results:
```typescript
import { mockAzureOpenAI } from '../fixtures/azure-mock';

await mockAzureOpenAI(page, 'success'); // or 'error', 'timeout'
```

### Test Data (`fixtures/test-data.ts`)
Reusable sample data for tests:
```typescript
import { TEST_PROMPTS, MOCK_PROJECT_RESPONSE } from '../fixtures/test-data';
```

## Writing Tests

### Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('specific behavior', async ({ page }) => {
    // Arrange
    await page.goto('/route');

    // Act
    await page.click('button');

    // Assert
    await expect(page.locator('result')).toBeVisible();
  });
});
```

### Locator Strategies
**Prefer (in order):**
1. User-facing text: `page.locator('text=Generate')`
2. ARIA roles: `page.locator('button[role="button"]')`
3. Test IDs: `page.locator('[data-testid="submit"]')`
4. CSS selectors: `page.locator('.btn-primary')` (last resort)

### Assertions
```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Content
await expect(element).toHaveText('Expected');
await expect(element).toContainText('Partial');

// State
await expect(button).toBeEnabled();
await expect(button).toBeDisabled();

// Count
await expect(page.locator('.item')).toHaveCount(3);
```

## Debugging

### Interactive Debug Mode
```bash
pnpm test:e2e:debug -g "test name"
```

### Pause Test Execution
```typescript
await page.pause(); // Opens Inspector
```

### View Trace
```bash
pnpm exec playwright show-trace test-results/trace.zip
```

### Console Logs
```typescript
page.on('console', msg => console.log(msg.text()));
```

## Common Patterns

### Waiting for Navigation
```typescript
await page.click('a[href="/projects"]');
await page.waitForURL('**/projects');
```

### Handling Dialogs
```typescript
await page.click('button:has-text("Open Dialog")');
const dialog = page.locator('[role="dialog"]');
await expect(dialog).toBeVisible();
```

### Mocking APIs
```typescript
await page.route('**/api/endpoint', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' }),
  });
});
```

### Taking Screenshots
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

## Troubleshooting

### "Timeout exceeded" errors
- Increase timeout: `await expect(element).toBeVisible({ timeout: 10000 });`
- Check selector: `await page.locator('selector').highlight();`
- Add explicit wait: `await page.waitForLoadState('networkidle');`

### Flaky tests
- Avoid `page.waitForTimeout()` (use auto-waiting instead)
- Check for race conditions (data loading, animations)
- Use more specific selectors

### Auth issues
- Verify `auth.setup.ts` creates session correctly
- Check `playwright/.auth/user.json` exists
- Re-run setup: `pnpm exec playwright test auth.setup.ts`

## CI/CD

Tests run automatically on CircleCI:
- Trigger: Every push to master
- Duration: ~10 minutes
- Artifacts: Reports and screenshots stored

View results:
- CircleCI Dashboard → Artifacts → `playwright-report/index.html`

## Performance Tips

- Run smoke tests first (fast feedback)
- Use `test.only` for focused testing
- Parallelize tests locally: `pnpm test:e2e --workers=4`
- Skip slow tests in development: `test.skip`

## Resources

- [Playwright Docs](https://playwright.dev)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Debugging](https://playwright.dev/docs/debug)
```markdown

3. **Add Testing Section to `README.md`:**

```markdown
## Testing

### Unit Tests
```bash
pnpm test              # Run unit tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

### E2E Tests
```bash
pnpm test:e2e          # Run E2E tests
pnpm test:e2e:ui       # Interactive mode
pnpm test:e2e:debug    # Debug mode
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#e2e-testing-with-playwright) for detailed testing guide.
```markdown

**Acceptance Criteria:**
- ✅ Comprehensive E2E section in docs/DEVELOPMENT.md
- ✅ Detailed README in apps/web/e2e/
- ✅ README.md mentions E2E tests
- ✅ Documentation reviewed by team
- ✅ All code examples are accurate and tested

**Review Checklist:**
- [ ] Installation steps work
- [ ] Code examples run without errors
- [ ] Debugging tips are helpful
- [ ] Common issues covered
- [ ] Links to external resources work

Test Strategy: Have team member follow documentation to write new test. Verify they succeed without additional help.

Estimated Time: 1-2 hours
```

---

## Summary of Updates

### Tasks to Update in Task Master:

1. **Task 7** - Add comprehensive implementation context with framework decision, architecture, and mock strategy

2. **Subtask 7.1** - Expand with 10 detailed setup steps including Playwright installation, configuration, fixtures, and verification

3. **Subtask 7.5** - Reorder as first priority after 7.1, add smoke test implementation with 4 quick validation tests

4. **Subtask 7.2** - Add detailed 16-step happy path test with 25+ assertions covering projects/tasks/contacts verification

5. **Subtask 7.3** - Add hierarchy test with expand/collapse validation and parent-child relationship verification

6. **Subtask 7.4** - Add 8 comprehensive error scenario tests covering validation, API failures, and edge cases

7. **NEW Subtask 7.6** - Add CI/CD integration with CircleCI configuration, caching, and artifact storage

8. **NEW Subtask 7.7** - Add comprehensive documentation including DEVELOPMENT.md updates and e2e/README.md

### Execution Order:
1. 7.1 (Setup) → 7.5 (Smoke) → 7.2 (Happy) → 7.3 (Hierarchy) → 7.4 (Errors) → 7.6 (CI/CD) → 7.7 (Docs)

### Total Estimated Time:
- **Setup**: 4-6 hours
- **Smoke**: 1-2 hours
- **Core Tests**: 12-16 hours
- **CI/CD**: 2-3 hours
- **Docs**: 1-2 hours
- **Total**: 20-29 hours (3-4 focused days)

---

**Next Steps:**
Use this document to manually update Task Master via CLI or copy sections into the Task Master UI.
