#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
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
const PORT = process.env.API_PORT || 3000;

// Validate environment variables
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please ensure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are set in scripts/.env');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large base64 images

// Initialize Octokit
const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Wolfpack Screenshot API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Create a GitHub issue with screenshot
 * POST /api/issues/create
 * Body: { title, description, imageData, labels }
 */
app.post('/api/issues/create', async (req, res) => {
  try {
    const { title, description, imageData, labels = [] } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    console.log(`📸 Creating issue: "${title}"`);

    // First, check if an issue with this title already exists
    const existingIssues = await octokit.rest.issues.listForRepo({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      state: 'all',
      per_page: 100,
    });

    const duplicate = existingIssues.data.find(issue => issue.title === title);
    if (duplicate) {
      console.log(`⏭️  Issue already exists: #${duplicate.number}`);
      return res.status(409).json({
        success: false,
        error: 'An issue with this title already exists',
        existingIssue: {
          number: duplicate.number,
          url: duplicate.html_url
        }
      });
    }

    // Create issue body with description
    let issueBody = `## Description\n\n${description}\n\n`;

    // If we have screenshot data, we need to upload it as an asset
    // For now, we'll include instructions to attach it manually
    // In a production system, you'd upload to an image host or GitHub's asset system
    if (imageData) {
      issueBody += `## Screenshot\n\n`;
      issueBody += `A screenshot was captured with this issue report.\n\n`;
      issueBody += `> **Note:** Screenshot data is available in localStorage. `;
      issueBody += `To attach the screenshot, please upload it manually from your saved data.\n\n`;
    }

    // Add metadata
    issueBody += `---\n\n`;
    issueBody += `**Created by:** Screenshot Feature\n`;
    issueBody += `**Timestamp:** ${new Date().toISOString()}\n`;

    // Create the issue
    const issue = await octokit.rest.issues.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title,
      body: issueBody,
      labels: ['screenshot', ...labels],
    });

    console.log(`✅ Issue created: #${issue.data.number} - ${issue.data.html_url}`);

    // Return success response
    res.json({
      success: true,
      issue: {
        number: issue.data.number,
        url: issue.data.html_url,
        title: issue.data.title
      }
    });

  } catch (error) {
    console.error('❌ Error creating issue:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get repository information
 * GET /api/repo/info
 */
app.get('/api/repo/info', async (req, res) => {
  try {
    const repo = await octokit.rest.repos.get({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    });

    res.json({
      success: true,
      repo: {
        name: repo.data.name,
        fullName: repo.data.full_name,
        url: repo.data.html_url,
        openIssues: repo.data.open_issues_count
      }
    });
  } catch (error) {
    console.error('❌ Error fetching repo info:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Wolfpack Screenshot API Server');
  console.log('='.repeat(50));
  console.log(`Port:       ${PORT}`);
  console.log(`Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
  console.log(`Health:     http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
  console.log('✅ Server is running and ready to accept requests\n');
});
