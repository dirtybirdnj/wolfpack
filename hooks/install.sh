#!/bin/bash
#
# Install git hooks for Wolfpack
#

echo "Installing git hooks..."

# Copy pre-commit hook
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✓ Pre-commit hook installed"
echo ""
echo "The hook will now run automatically before each commit:"
echo "  - Syntax verification (verify_codebase.sh)"
echo "  - ESLint checks"
echo "  - Jest tests"
echo ""
echo "To bypass the hook (not recommended):"
echo "  git commit --no-verify"
