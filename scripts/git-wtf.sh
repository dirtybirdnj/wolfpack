#!/bin/bash

# Git WTF - What's The Fuss?
# Shows clear status of current branch vs remote

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 GIT WTF - Branch Status Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Not a git repository"
    exit 1
fi

echo "📍 Current Branch: $BRANCH"
echo ""

# Branch status
echo "━━━ Branch Status ━━━"
git --no-pager status -sb
echo ""

# Working tree status
echo "━━━ Working Tree ━━━"
if git diff-index --quiet HEAD --; then
    echo "✅ Clean - no uncommitted changes"
else
    echo "⚠️  Uncommitted changes:"
    git --no-pager status -s
fi
echo ""

# Local commits
echo "━━━ Last 5 Local Commits ━━━"
git --no-pager log --oneline --graph -5
echo ""

# Remote commits
REMOTE_BRANCH="origin/$BRANCH"
if git rev-parse --verify "$REMOTE_BRANCH" >/dev/null 2>&1; then
    echo "━━━ Last 5 Remote Commits ($REMOTE_BRANCH) ━━━"
    git --no-pager log --oneline --graph "$REMOTE_BRANCH" -5
    echo ""

    # Divergence check
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    BASE=$(git merge-base @ @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        echo "✅ In sync with remote"
    elif [ "$LOCAL" = "$BASE" ]; then
        echo "⬇️  Behind remote - run: git pull"
    elif [ "$REMOTE" = "$BASE" ]; then
        echo "⬆️  Ahead of remote - run: git push"
    else
        AHEAD=$(git rev-list --count @{u}..HEAD)
        BEHIND=$(git rev-list --count HEAD..@{u})
        echo "🔀 DIVERGED: ahead $AHEAD, behind $BEHIND"
        echo ""
        echo "   To fix this:"
        echo "   • git pull --rebase  (recommended - cleaner history)"
        echo "   • git pull --no-ff   (creates merge commit)"
        echo ""
        echo "   Commits you have that remote doesn't:"
        git --no-pager log --oneline @{u}..HEAD
        echo ""
        echo "   Commits remote has that you don't:"
        git --no-pager log --oneline HEAD..@{u}
    fi
else
    echo "⚠️  No remote branch found for: $BRANCH"
    echo "   Run: git push -u origin $BRANCH"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
