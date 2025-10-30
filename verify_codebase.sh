#!/bin/bash

# Comprehensive JavaScript Verification System
# Catches syntax errors, duplicates, truncations, and broken references

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "================================================================"
echo "COMPREHENSIVE JAVASCRIPT VERIFICATION"
echo "================================================================"
echo ""

# Test 1: Basic Syntax Validation
echo -e "${BLUE}[1/8] Basic Syntax Validation...${NC}"
SYNTAX_ERRORS=0
for file in $(find src -name "*.js" -type f); do
    if ! node -c "$file" 2>/dev/null; then
        echo -e "${RED}  ❌ SYNTAX ERROR: $file${NC}"
        node -c "$file" 2>&1 | head -3
        SYNTAX_ERRORS=$((SYNTAX_ERRORS+1))
    fi
done
if [ $SYNTAX_ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✅ All files have valid syntax${NC}"
else
    echo -e "${RED}  ❌ $SYNTAX_ERRORS files with syntax errors${NC}"
    ERRORS=$((ERRORS+SYNTAX_ERRORS))
fi
echo ""

# Test 2: Duplicate Variable Declarations
echo -e "${BLUE}[2/8] Checking for duplicate const/let/var declarations...${NC}"
DUP_FOUND=0
for file in $(find src -name "*.js" -type f); do
    # Check for duplicate const declarations within the same scope
    DUPS=$(grep -n "^\s*const\s\+\w\+\s*=" "$file" 2>/dev/null | awk '{print $2}' | sort | uniq -d)
    if [ ! -z "$DUPS" ]; then
        echo -e "${YELLOW}  ⚠️  Potential duplicates in $file:${NC}"
        echo "$DUPS" | while read dup; do
            VAR=$(echo $dup | cut -d'=' -f1)
            echo "     - $VAR"
            grep -n "const $VAR" "$file" | head -5
        done
        DUP_FOUND=$((DUP_FOUND+1))
        WARNINGS=$((WARNINGS+1))
    fi
done
if [ $DUP_FOUND -eq 0 ]; then
    echo -e "${GREEN}  ✅ No obvious duplicate declarations found${NC}"
else
    echo -e "${YELLOW}  ⚠️  $DUP_FOUND files may have duplicate declarations${NC}"
fi
echo ""

# Test 3: Orphaned else/else-if statements
echo -e "${BLUE}[3/8] Checking for orphaned else/else-if statements...${NC}"
ORPHAN_FOUND=0
for file in $(find src -name "*.js" -type f); do
    # Look for } else if without a preceding if or } else if
    if grep -n "^\s*}\s*else\s*if\s*(" "$file" 2>/dev/null | head -1 | grep -q .; then
        # Check if the line before is just a closing brace or comment
        ORPHANS=$(grep -B1 "^\s*}\s*else\s*if\s*(" "$file" | grep -A1 "^\s*let\s\|^\s*const\s" | grep "} else if" || true)
        if [ ! -z "$ORPHANS" ]; then
            echo -e "${YELLOW}  ⚠️  Possible orphaned else-if in $file${NC}"
            grep -n "} else if" "$file" | head -3
            ORPHAN_FOUND=$((ORPHAN_FOUND+1))
            WARNINGS=$((WARNINGS+1))
        fi
    fi
done
if [ $ORPHAN_FOUND -eq 0 ]; then
    echo -e "${GREEN}  ✅ No orphaned else statements found${NC}"
else
    echo -e "${YELLOW}  ⚠️  $ORPHAN_FOUND files may have orphaned statements${NC}"
fi
echo ""

# Test 4: Missing closing braces
echo -e "${BLUE}[4/8] Checking for balanced braces...${NC}"
BRACE_ERRORS=0
for file in $(find src -name "*.js" -type f); do
    OPEN=$(grep -o "{" "$file" | wc -l)
    CLOSE=$(grep -o "}" "$file" | wc -l)
    if [ "$OPEN" -ne "$CLOSE" ]; then
        echo -e "${RED}  ❌ Unbalanced braces in $file (open: $OPEN, close: $CLOSE)${NC}"
        BRACE_ERRORS=$((BRACE_ERRORS+1))
        ERRORS=$((ERRORS+1))
    fi
done
if [ $BRACE_ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✅ All braces are balanced${NC}"
else
    echo -e "${RED}  ❌ $BRACE_ERRORS files have unbalanced braces${NC}"
fi
echo ""

# Test 5: Deleted references (boatManager, NavigationScene, etc)
echo -e "${BLUE}[5/8] Checking for references to deleted code...${NC}"
DELETED_REFS=0
DELETED_REFS_COUNT=$(grep -rn "\.boatManager\|new BoatManager\|new NavigationScene\|getBathymetricData" src --include="*.js" 2>/dev/null | wc -l)
if [ "$DELETED_REFS_COUNT" -gt 0 ]; then
    echo -e "${RED}  ❌ Found $DELETED_REFS_COUNT references to deleted code:${NC}"
    grep -rn "\.boatManager\|new BoatManager\|new NavigationScene\|getBathymetricData" src --include="*.js" 2>/dev/null | head -10
    DELETED_REFS=1
    ERRORS=$((ERRORS+1))
fi
if [ $DELETED_REFS -eq 0 ]; then
    echo -e "${GREEN}  ✅ No references to deleted code${NC}"
fi
echo ""

# Test 6: Deleted constants
echo -e "${BLUE}[6/8] Checking for references to deleted constants...${NC}"
DELETED_CONST=0
DELETED_CONST_COUNT=$(grep -rn "FISHING_TYPE_KAYAK\|FISHING_TYPE_MOTORBOAT\|GameConfig\.KAYAK_\|GameConfig\.MOTORBOAT_" src --include="*.js" 2>/dev/null | grep -v "^src/config/GameConfig.js" | wc -l)
if [ "$DELETED_CONST_COUNT" -gt 0 ]; then
    echo -e "${RED}  ❌ Found $DELETED_CONST_COUNT references to deleted constants:${NC}"
    grep -rn "FISHING_TYPE_KAYAK\|FISHING_TYPE_MOTORBOAT\|GameConfig\.KAYAK_\|GameConfig\.MOTORBOAT_" src --include="*.js" 2>/dev/null | grep -v "^src/config/GameConfig.js" | head -5
    DELETED_CONST=1
    ERRORS=$((ERRORS+1))
fi
if [ $DELETED_CONST -eq 0 ]; then
    echo -e "${GREEN}  ✅ No references to deleted constants${NC}"
fi
echo ""

# Test 7: Files that are too short (possible truncation)
echo -e "${BLUE}[7/8] Checking for suspiciously short files...${NC}"
SHORT_FILES=0
for file in src/entities/*.js src/models/*.js; do
    if [ -f "$file" ]; then
        LINES=$(wc -l < "$file")
        BASENAME=$(basename "$file")
        # Entity and model files should typically be > 50 lines
        if [ "$LINES" -lt 50 ]; then
            echo -e "${YELLOW}  ⚠️  $BASENAME is only $LINES lines (might be truncated)${NC}"
            SHORT_FILES=$((SHORT_FILES+1))
            WARNINGS=$((WARNINGS+1))
        fi
    fi
done
if [ $SHORT_FILES -eq 0 ]; then
    echo -e "${GREEN}  ✅ All entity/model files have reasonable length${NC}"
else
    echo -e "${YELLOW}  ⚠️  $SHORT_FILES files might be truncated${NC}"
fi
echo ""

# Test 8: Missing export statements
echo -e "${BLUE}[8/8] Checking for missing export statements...${NC}"
NO_EXPORT=0
for file in $(find src -name "*.js" -type f); do
    if ! grep -q "^export\|^module.exports" "$file" 2>/dev/null; then
        # Exception: index.js doesn't need to export
        if [[ ! "$file" =~ "index.js" ]]; then
            echo -e "${YELLOW}  ⚠️  No export found in $file${NC}"
            NO_EXPORT=$((NO_EXPORT+1))
            WARNINGS=$((WARNINGS+1))
        fi
    fi
done
if [ $NO_EXPORT -eq 0 ]; then
    echo -e "${GREEN}  ✅ All files have export statements${NC}"
else
    echo -e "${YELLOW}  ⚠️  $NO_EXPORT files missing exports${NC}"
fi
echo ""

# Summary
echo "================================================================"
echo "VERIFICATION SUMMARY"
echo "================================================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "Total files checked: $(find src -name '*.js' | wc -l)"
    echo "Errors: 0"
    echo "Warnings: 0"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Total files checked: $(find src -name '*.js' | wc -l)"
    echo "Errors: 0"
    echo "Warnings: $WARNINGS"
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo ""
    echo "Total files checked: $(find src -name '*.js' | wc -l)"
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix errors before continuing."
    exit 1
fi
