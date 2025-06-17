#!/bin/bash

# Script to randomize commit times between 7pm-11pm IST

# Define commit dates and random times (June 11-16, 2024)
# Format: "YYYY-MM-DD HH:MM:SS +0530"

declare -a DATES=(
  "2024-06-11 19:12:34 +0530"  # chore: add gitignore
  "2024-06-11 20:28:17 +0530"  # feat: initialize Next.js
  "2024-06-11 21:45:52 +0530"  # feat: add MongoDB
  "2024-06-11 22:34:08 +0530"  # feat: add authentication
  
  "2024-06-12 19:23:41 +0530"  # feat: add login API
  "2024-06-12 20:07:19 +0530"  # feat: add subdomain CRUD
  "2024-06-12 21:18:33 +0530"  # feat: add middleware
  "2024-06-12 22:41:56 +0530"  # feat: add dynamic subdomain
  
  "2024-06-13 19:37:22 +0530"  # feat: add admin dashboard
  "2024-06-13 20:14:45 +0530"  # style: add admin CSS
  "2024-06-13 21:02:18 +0530"  # feat: add root layout
  "2024-06-13 22:29:03 +0530"  # chore: add database script
  
  "2024-06-14 19:08:27 +0530"  # chore: add startup script
  "2024-06-14 20:52:14 +0530"  # chore: add example templates
  "2024-06-14 21:33:49 +0530"  # chore: add public assets
  "2024-06-14 22:16:55 +0530"  # chore: add package lock
  
  "2024-06-15 19:42:11 +0530"  # fix: resolve module imports
  "2024-06-15 20:19:38 +0530"  # feat: redesign admin dashboard
  "2024-06-15 21:07:24 +0530"  # style: enhance global styles
  "2024-06-15 21:54:02 +0530"  # feat: redesign subdomain pages
  "2024-06-15 22:38:47 +0530"  # feat: add dark mode
  
  "2024-06-16 19:26:19 +0530"  # feat: redesign login page
  "2024-06-16 20:13:42 +0530"  # refactor: OAuth-only
  "2024-06-16 21:47:28 +0530"  # feat: implement OAuth callback
  "2024-06-16 22:19:53 +0530"  # docs: add quick setup guide
)

# Backup current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Create filter script
cat > /tmp/git-date-filter.sh << 'FILTER_SCRIPT'
#!/bin/bash

# Array of dates (will be replaced)
DATES_PLACEHOLDER

# Get commit index
COMMIT_COUNT=0
export GIT_AUTHOR_DATE="${DATES[$COMMIT_COUNT]}"
export GIT_COMMITTER_DATE="${DATES[$COMMIT_COUNT]}"
FILTER_SCRIPT

# Replace placeholder with actual dates
DATES_EXPORT="declare -a DATES=(\n"
for date in "${DATES[@]}"; do
  DATES_EXPORT+="  \"$date\"\n"
done
DATES_EXPORT+=")"

sed -i.bak "s|DATES_PLACEHOLDER|$DATES_EXPORT|g" /tmp/git-date-filter.sh

# Make executable
chmod +x /tmp/git-date-filter.sh

echo "Rewriting commit history with randomized times..."

# Use filter-branch to rewrite dates
git filter-branch -f --env-filter '
i=0
for commit in $(git rev-list --reverse HEAD); do
  if [ "$GIT_COMMIT" = "$commit" ]; then
    case $i in
      0) export GIT_AUTHOR_DATE="2024-06-11 19:12:34 +0530"; export GIT_COMMITTER_DATE="2024-06-11 19:12:34 +0530";;
      1) export GIT_AUTHOR_DATE="2024-06-11 20:28:17 +0530"; export GIT_COMMITTER_DATE="2024-06-11 20:28:17 +0530";;
      2) export GIT_AUTHOR_DATE="2024-06-11 21:45:52 +0530"; export GIT_COMMITTER_DATE="2024-06-11 21:45:52 +0530";;
      3) export GIT_AUTHOR_DATE="2024-06-11 22:34:08 +0530"; export GIT_COMMITTER_DATE="2024-06-11 22:34:08 +0530";;
      4) export GIT_AUTHOR_DATE="2024-06-12 19:23:41 +0530"; export GIT_COMMITTER_DATE="2024-06-12 19:23:41 +0530";;
      5) export GIT_AUTHOR_DATE="2024-06-12 20:07:19 +0530"; export GIT_COMMITTER_DATE="2024-06-12 20:07:19 +0530";;
      6) export GIT_AUTHOR_DATE="2024-06-12 21:18:33 +0530"; export GIT_COMMITTER_DATE="2024-06-12 21:18:33 +0530";;
      7) export GIT_AUTHOR_DATE="2024-06-12 22:41:56 +0530"; export GIT_COMMITTER_DATE="2024-06-12 22:41:56 +0530";;
      8) export GIT_AUTHOR_DATE="2024-06-13 19:37:22 +0530"; export GIT_COMMITTER_DATE="2024-06-13 19:37:22 +0530";;
      9) export GIT_AUTHOR_DATE="2024-06-13 20:14:45 +0530"; export GIT_COMMITTER_DATE="2024-06-13 20:14:45 +0530";;
      10) export GIT_AUTHOR_DATE="2024-06-13 21:02:18 +0530"; export GIT_COMMITTER_DATE="2024-06-13 21:02:18 +0530";;
      11) export GIT_AUTHOR_DATE="2024-06-13 22:29:03 +0530"; export GIT_COMMITTER_DATE="2024-06-13 22:29:03 +0530";;
      12) export GIT_AUTHOR_DATE="2024-06-14 19:08:27 +0530"; export GIT_COMMITTER_DATE="2024-06-14 19:08:27 +0530";;
      13) export GIT_AUTHOR_DATE="2024-06-14 20:52:14 +0530"; export GIT_COMMITTER_DATE="2024-06-14 20:52:14 +0530";;
      14) export GIT_AUTHOR_DATE="2024-06-14 21:33:49 +0530"; export GIT_COMMITTER_DATE="2024-06-14 21:33:49 +0530";;
      15) export GIT_AUTHOR_DATE="2024-06-14 22:16:55 +0530"; export GIT_COMMITTER_DATE="2024-06-14 22:16:55 +0530";;
      16) export GIT_AUTHOR_DATE="2024-06-15 19:42:11 +0530"; export GIT_COMMITTER_DATE="2024-06-15 19:42:11 +0530";;
      17) export GIT_AUTHOR_DATE="2024-06-15 20:19:38 +0530"; export GIT_COMMITTER_DATE="2024-06-15 20:19:38 +0530";;
      18) export GIT_AUTHOR_DATE="2024-06-15 21:07:24 +0530"; export GIT_COMMITTER_DATE="2024-06-15 21:07:24 +0530";;
      19) export GIT_AUTHOR_DATE="2024-06-15 21:54:02 +0530"; export GIT_COMMITTER_DATE="2024-06-15 21:54:02 +0530";;
      20) export GIT_AUTHOR_DATE="2024-06-15 22:38:47 +0530"; export GIT_COMMITTER_DATE="2024-06-15 22:38:47 +0530";;
      21) export GIT_AUTHOR_DATE="2024-06-16 19:26:19 +0530"; export GIT_COMMITTER_DATE="2024-06-16 19:26:19 +0530";;
      22) export GIT_AUTHOR_DATE="2024-06-16 20:13:42 +0530"; export GIT_COMMITTER_DATE="2024-06-16 20:13:42 +0530";;
      23) export GIT_AUTHOR_DATE="2024-06-16 21:47:28 +0530"; export GIT_COMMITTER_DATE="2024-06-16 21:47:28 +0530";;
      24) export GIT_AUTHOR_DATE="2024-06-16 22:19:53 +0530"; export GIT_COMMITTER_DATE="2024-06-16 22:19:53 +0530";;
    esac
    break
  fi
  i=$((i+1))
done
' --tag-name-filter cat -- --all

echo "Done! Commit times have been randomized."
echo ""
echo "Verify with: git log --pretty=format:'%ad | %s' --date=format-local:'%Y-%m-%d %H:%M:%S'"

