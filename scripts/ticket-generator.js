#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Tracking metrics
const startTime = Date.now();
let totalTokensUsed = 0; // GitHub API doesn't directly expose token usage, we'll track API calls instead
let apiCallCount = 0;

// Validate environment variables
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please ensure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are set in scripts/.env');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Fetch all existing issues from the repository
 */
async function getExistingIssues() {
  try {
    apiCallCount++;
    const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      state: 'all',
      per_page: 100,
    });
    return issues;
  } catch (error) {
    console.error('❌ Error fetching existing issues:', error.message);
    throw error;
  }
}

/**
 * Check if an issue with the same title already exists
 */
function issueExists(title, existingIssues) {
  return existingIssues.some(issue => issue.title === title);
}

/**
 * Map category to GitHub label
 */
function mapCategoryToLabel(category) {
  const categoryMap = {
    ui: 'ui',
    graphics: 'graphics',
    ai: 'ai',
    logic: 'logic',
    gameplay: 'gameplay',
    bugfix: 'bugfix',
    enhancement: 'enhancement',
  };
  return categoryMap[category.toLowerCase()] || category.toLowerCase();
}

/**
 * Create a GitHub issue
 */
async function createIssue(workItem) {
  const { title, description, category, priority } = workItem;

  // Prepare labels
  const labels = [];
  if (category) {
    if (Array.isArray(category)) {
      labels.push(...category.map(mapCategoryToLabel));
    } else {
      labels.push(mapCategoryToLabel(category));
    }
  }

  // Add priority label if specified
  if (priority) {
    labels.push(`priority:${priority.toLowerCase()}`);
  }

  try {
    apiCallCount++;
    const response = await octokit.rest.issues.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title,
      body: description || 'No description provided.',
      labels,
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Error creating issue "${title}":`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Wolfpack Ticket Generator\n');
  console.log(`Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Read pending work JSON file
  let pendingWork;
  const pendingWorkPath = join(__dirname, 'pending-work.json');

  try {
    const fileContent = readFileSync(pendingWorkPath, 'utf-8');
    pendingWork = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error reading ${pendingWorkPath}:`, error.message);
    console.error('Please ensure scripts/pending-work.json exists and is valid JSON');
    process.exit(1);
  }

  if (!Array.isArray(pendingWork) || pendingWork.length === 0) {
    console.log('⚠️  No pending work items found in pending-work.json');
    process.exit(0);
  }

  console.log(`📋 Found ${pendingWork.length} pending work item(s)\n`);

  // Fetch existing issues
  console.log('🔍 Fetching existing issues...');
  const existingIssues = await getExistingIssues();
  console.log(`   Found ${existingIssues.length} existing issue(s)\n`);

  // Process each work item
  const created = [];
  const skipped = [];

  for (const workItem of pendingWork) {
    const { title } = workItem;

    if (!title) {
      console.log('⚠️  Skipping work item without title:', workItem);
      skipped.push({ title: '(no title)', reason: 'missing title' });
      continue;
    }

    if (issueExists(title, existingIssues)) {
      console.log(`⏭️  Skipped: "${title}" (already exists)`);
      skipped.push({ title, reason: 'already exists' });
      continue;
    }

    try {
      const issue = await createIssue(workItem);
      console.log(`✅ Created: "${title}" (#${issue.number}) - ${issue.html_url}`);
      created.push({ title, number: issue.number, url: issue.html_url });
    } catch (error) {
      console.log(`❌ Failed: "${title}" (${error.message})`);
      skipped.push({ title, reason: error.message });
    }
  }

  // Calculate execution time
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXECUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Timestamp:        ${new Date().toISOString()}`);
  console.log(`Duration:         ${duration} seconds`);
  console.log(`API Calls Made:   ${apiCallCount}`);
  console.log(`Total Items:      ${pendingWork.length}`);
  console.log(`Issues Created:   ${created.length}`);
  console.log(`Issues Skipped:   ${skipped.length}`);
  console.log('='.repeat(60));

  if (created.length > 0) {
    console.log('\n✅ Created Issues:');
    created.forEach(item => {
      console.log(`   - #${item.number}: ${item.title}`);
      console.log(`     ${item.url}`);
    });
  }

  if (skipped.length > 0) {
    console.log('\n⏭️  Skipped Issues:');
    skipped.forEach(item => {
      console.log(`   - ${item.title} (${item.reason})`);
    });
  }

  console.log('\n✨ Ticket generation complete!\n');
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
