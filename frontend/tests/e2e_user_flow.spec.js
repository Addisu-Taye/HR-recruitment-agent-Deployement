// e2e_user_flow.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';

// --- Configuration ---
// Use the deployed frontend URL
const FRONTEND_URL = 'https://hr-recruitment-frontend.onrender.com';
const TEST_RESUME_PATH = path.join(__dirname, '../assets/test_resume.pdf'); // Adjust path as needed

test('Full user flow: Create Job, Upload Resume, View AI Score', async ({ page }) => {
  // 1. Navigate to the frontend application
  await page.goto(FRONTEND_URL);
  await expect(page).toHaveTitle(/HR Recruitment Agent/); // Check your actual page title

  console.log('Step 1: Successfully loaded frontend.');

  // 2. Create a new Job Posting (assuming a simple form)
  await page.click('text=New Job'); // Adjust selector
  await page.fill('input[name="title"]', 'E2E Test Analyst');
  await page.fill('textarea[name="description"]', 'Automation testing and deployment required.');
  await page.click('button[type="submit"]');

  // Wait for success message or navigation back to list
  await expect(page.locator('text=Job Test Analyst')).toBeVisible();
  console.log('Step 2: Successfully created a job posting.');

  // 3. Navigate to the Candidate Upload section for the new job
  // Assuming the user flow involves clicking a link associated with the new job
  await page.click('text=View Candidates for E2E Test Analyst'); 

  // 4. Upload the test resume file
  await page.setInputFiles('input[type="file"]', TEST_RESUME_PATH);
  await page.click('button:has-text("Upload Resume")');

  console.log('Step 4: Resume uploaded. Waiting for AI processing...');
  
  // 5. Trigger the AI Screening and wait for the result
  // This simulates clicking the 'Screen' button and waiting for the API response to update the UI.
  await page.click('button:has-text("Run AI Screen")');

  // Wait for an element that displays the AI score.
  // The AI call is the longest step (can take 10-30 seconds), so use a generous timeout.
  await expect(page.locator('text=Compatibility Score:')).toBeVisible({ timeout: 45000 });
  
  // 6. Verify the AI result is displayed (e.g., check for a number/text)
  const scoreText = await page.locator('text=Compatibility Score:').textContent();
  expect(scoreText).toMatch(/Compatibility Score: \d+/);
  
  console.log(`Step 6: Verified AI result displayed: ${scoreText}`);
});