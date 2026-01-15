#!/bin/bash
# Ralph Wiggum Loop - Enhanced Version
# Based on Anthropic's "Effective Harnesses for Long-Running Agents"
# https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs"
FAILURE_LOG="$LOGS_DIR/failures.log"

# Create logs directory
mkdir -p "$LOGS_DIR"

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log_failure() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ITERATION $1: $2" >> "$FAILURE_LOG"
}

cleanup() {
    log "Cleaning up..."
    if [ -f "$PROJECT_ROOT/.dev-server.pid" ]; then
        DEV_PID=$(cat "$PROJECT_ROOT/.dev-server.pid")
        if kill -0 "$DEV_PID" 2>/dev/null; then
            kill "$DEV_PID" 2>/dev/null || true
            log "Stopped dev server (PID: $DEV_PID)"
        fi
        rm -f "$PROJECT_ROOT/.dev-server.pid"
    fi
}
trap cleanup EXIT

# Validate arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <iterations> [--skip-init]"
    echo ""
    echo "Options:"
    echo "  iterations    Number of iterations to run"
    echo "  --skip-init   Skip environment initialization (use if dev server already running)"
    exit 1
fi

ITERATIONS=$1
SKIP_INIT=${2:-""}

# Initialize environment (unless skipped)
if [ "$SKIP_INIT" != "--skip-init" ]; then
    log "Running environment initialization..."
    source "$PROJECT_ROOT/init.sh"
else
    log "Skipping initialization (--skip-init)"
fi

# Verify required files
for file in "plans/prd.json" "progress.txt"; do
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        log "ERROR: Required file missing: $file"
        exit 1
    fi
done

# Main loop
for ((i=1; i<=ITERATIONS; i++)); do
    echo ""
    log "=============================================="
    log "Ralph Iteration $i of $ITERATIONS"
    log "=============================================="
    echo ""

    # --- PRE-ITERATION GIT STATE CHECK ---
    COMMIT_BEFORE=$(git -C "$PROJECT_ROOT" rev-parse HEAD)

    # --- BUILD GIT CONTEXT ---
    recent_commits=$(git -C "$PROJECT_ROOT" log --oneline -5)
    current_branch=$(git -C "$PROJECT_ROOT" branch --show-current)
    git_status=$(git -C "$PROJECT_ROOT" status --short)

    # --- READ STATE FILES ---
    prd_content=$(cat "$PROJECT_ROOT/plans/prd.json")
    progress_content=$(cat "$PROJECT_ROOT/progress.txt")

    # --- CONSTRUCT ENHANCED PROMPT ---
    prompt="## Session Startup Checklist

1. Current working directory: $PROJECT_ROOT
2. Current branch: $current_branch
3. Recent commits:
\`\`\`
$recent_commits
\`\`\`
4. Git status:
\`\`\`
${git_status:-"(clean)"}
\`\`\`

## Product Requirements Document (PRD)

\`\`\`json
$prd_content
\`\`\`

## Progress Log

\`\`\`
$progress_content
\`\`\`

## Instructions

### Startup Verification
Before starting work, verify:
- Run \`pwd\` to confirm working directory
- Review the git log and progress above
- Run a basic verification: \`bun run check-types\`

### Feature Work
1. Select the highest-priority incomplete feature from the PRD (your judgment on priority)
2. Implement ONLY that single feature
3. Verify implementation:
   - Run \`bun run check-types\` - types must pass
   - Run \`bun run build\` - build must succeed
   - If visual component in apps/web: create Storybook story and run \`cd apps/web && bun run build-storybook\`
   - For UI features: run \`cd apps/web && bun run test:e2e\` to verify in browser (if e2e tests exist)

### Completion Requirements
4. Update PRD: set \`passes: true\` for completed feature
5. Append to progress.txt with:
   - Date and feature name
   - Implementation summary
   - Verification results
   - Notes for next iteration
6. Make a descriptive git commit

### Important Notes
- Work on ONLY ONE feature per iteration
- If you encounter errors, document them in progress.txt before attempting fixes
- If implementation fails completely, leave the working tree clean (git checkout . if needed)
- If all PRD items have \`passes: true\`, output: <promise>COMPLETE</promise>"

    # --- EXECUTE CLAUDE ---
    set +e
    result=$(claude --dangerously-skip-permissions -p "$prompt" 2>&1)
    exit_code=$?
    set -e

    echo "$result"

    # Handle Claude failure
    if [ $exit_code -ne 0 ]; then
        log "WARNING: Claude exited with code: $exit_code"
        log_failure "$i" "Claude exited with code $exit_code"

        # Check if working tree is dirty after failure
        if [ -n "$(git -C "$PROJECT_ROOT" status --porcelain)" ]; then
            log "Working tree dirty after failure."
            read -p "Reset working tree? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git -C "$PROJECT_ROOT" checkout .
                log "Working tree reset."
            fi
        fi
        continue
    fi

    # --- POST-ITERATION VERIFICATION ---
    COMMIT_AFTER=$(git -C "$PROJECT_ROOT" rev-parse HEAD)

    # Check if commit was made
    if [ "$COMMIT_BEFORE" = "$COMMIT_AFTER" ]; then
        log "WARNING: No new commit was made in this iteration"
        log_failure "$i" "No commit made"
    else
        log "Commit verified: $(git -C "$PROJECT_ROOT" log --oneline -1)"
    fi

    # --- CHECK FOR COMPLETION ---
    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo ""
        log "=============================================="
        log "PRD complete after $i iterations!"
        log "=============================================="

        # macOS notification (optional)
        which terminal-notifier >/dev/null 2>&1 && \
            terminal-notifier -message "PRD complete after $i iterations" -title "Ralph"

        exit 0
    fi
done

echo ""
log "=============================================="
log "Completed $ITERATIONS iterations"
log "=============================================="
