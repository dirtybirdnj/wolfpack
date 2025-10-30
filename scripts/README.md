# Wolfpack Ticket Generator

Automated GitHub issue creation tool for the Wolfpack project. This script reads pending work items from a JSON file and creates GitHub issues via the GitHub API, avoiding duplicates and providing detailed logging.

## Features

- Creates GitHub issues programmatically via the Octokit REST API
- Prevents duplicate issues by checking existing issue titles
- Supports multiple categories and priorities with automatic labeling
- Provides detailed execution metrics including timestamp, duration, and API call counts
- Safe and simple - no custom DSL, just straightforward GitHub API calls

## Prerequisites

- Node.js >= 20.0.0 (LTS)
- GitHub Personal Access Token with repo scope
- npm (for installing dependencies)

## Setup

### 1. Install Dependencies

From the project root directory:

```bash
npm install
```

This will install the required dependencies:
- `@octokit/rest` - GitHub REST API client
- `dotenv` - Environment variable management

### 2. Generate a GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens/new)
2. Click "Generate new token" (classic)
3. Give your token a descriptive name (e.g., "Wolfpack Ticket Generator")
4. Set an expiration date (recommended: 90 days or custom)
5. Select the following scopes:
   - `repo` - Full control of private repositories (includes public repositories)
6. Click "Generate token" at the bottom
7. **Important:** Copy the token immediately - you won't be able to see it again!

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp scripts/.env.example scripts/.env
   ```

2. Edit `scripts/.env` and fill in your values:
   ```bash
   GITHUB_TOKEN=ghp_your_actual_token_here
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=wolfpack
   ```

3. **Security Note:** The `.env` file is already in `.gitignore` - never commit it to version control!

### 4. Create Your Pending Work File

Create `scripts/pending-work.json` with your work items (see format below).

## Usage

Run the ticket generator from the project root:

```bash
node scripts/ticket-generator.js
```

### What It Does

1. Loads environment variables from `scripts/.env`
2. Reads work items from `scripts/pending-work.json`
3. Fetches all existing issues from your GitHub repository
4. For each work item:
   - Checks if an issue with the same title already exists
   - If it exists: Skips and logs it
   - If it's new: Creates the issue with appropriate labels
5. Outputs a detailed summary with metrics

### Execution Metrics

Each run outputs a summary that includes:
- **Timestamp**: ISO format timestamp of execution
- **Duration**: Total execution time in seconds
- **API Calls Made**: Number of GitHub API requests performed
- **Total Items**: Number of work items in pending-work.json
- **Issues Created**: Count and list of newly created issues with URLs
- **Issues Skipped**: Count and list of skipped issues with reasons

Example output:
```
============================================================
📊 EXECUTION SUMMARY
============================================================
Timestamp:        2025-10-30T15:23:45.678Z
Duration:         3.45 seconds
API Calls Made:   12
Total Items:      10
Issues Created:   7
Issues Skipped:   3
============================================================
```

## pending-work.json Format

The script expects a JSON file with an array of work items:

```json
[
  {
    "title": "Add fish schooling behavior AI",
    "description": "Implement flocking algorithm for realistic fish movement patterns in schools",
    "category": ["ai", "gameplay"],
    "priority": "high"
  },
  {
    "title": "Fix sonar rendering glitch",
    "description": "Sonar display shows artifacts when depth exceeds 100 feet",
    "category": "bugfix",
    "priority": "medium"
  },
  {
    "title": "Investigate performance optimization for particle effects",
    "description": "Research and document approaches to improve particle system performance",
    "category": ["graphics", "logic"],
    "priority": "low"
  }
]
```

### Field Descriptions

- **title** (required): The issue title. Must be unique to avoid duplicates.
- **description** (optional): The issue body/description. Defaults to "No description provided."
- **category** (optional): Single string or array of category labels. Valid values:
  - `ui` - User Interface
  - `graphics` - Graphics/Rendering
  - `ai` - Artificial Intelligence
  - `logic` - Game Logic
  - `gameplay` - Gameplay Mechanics
  - `bugfix` - Bug Fix
  - `enhancement` - Enhancement/Feature
- **priority** (optional): Priority level (will create a `priority:X` label):
  - `high`
  - `medium`
  - `low`

## GitHub Issue Templates

The project includes three GitHub issue templates in `.github/ISSUE_TEMPLATE/`:

- **feature.md** - For new features and enhancements
- **bugfix.md** - For bug reports
- **research.md** - For investigation and exploration tasks

Each template includes checkboxes for categories: UI, Graphics, AI, Logic, Gameplay

## Troubleshooting

### "Missing required environment variables"
- Ensure `scripts/.env` exists and contains all three variables
- Check that your token doesn't have extra spaces or quotes

### "Error fetching existing issues"
- Verify your GitHub token has `repo` scope
- Check that GITHUB_OWNER and GITHUB_REPO are correct
- Ensure the repository exists and you have access to it

### "Error reading pending-work.json"
- Verify the file exists at `scripts/pending-work.json`
- Check that it's valid JSON (use a JSON validator)
- Ensure the file contains an array of objects

### Issues are being skipped
- Check the reason in the summary output
- "already exists" means an issue with that exact title already exists
- Consider making titles more unique or closing old issues

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` by default
2. **Use token expiration** - Set reasonable expiration dates on your tokens
3. **Limit token scope** - Only grant necessary permissions (`repo` scope)
4. **Rotate tokens regularly** - Refresh your token every 90 days
5. **Keep logs clean** - The script never logs your token

## Example Workflow

```bash
# 1. Create your work items
cat > scripts/pending-work.json << 'EOF'
[
  {
    "title": "Add winter weather effects",
    "description": "Implement snow and ice visual effects",
    "category": ["graphics", "gameplay"],
    "priority": "medium"
  }
]
EOF

# 2. Run the generator
node scripts/ticket-generator.js

# 3. Check the output and verify issues were created
# Visit the URLs shown in the summary

# 4. Update pending-work.json for next run
# Remove completed items or add new ones
```

## Contributing

When adding new work items to pending-work.json:
- Use clear, descriptive titles
- Include detailed descriptions
- Tag with appropriate categories
- Set realistic priorities
- Run the script to verify JSON syntax

## License

MIT - See project root LICENSE file
