#!/usr/bin/env bash

# Release Tag Manager with Automatic Changelog Updates
# Creates and manages semantic versioning tags for releases
# Automatically updates CHANGELOG.md with new release entries
# Works on Windows (Git Bash), Linux, and macOS

# Initialize variables
INCREMENT=""
NAME=""
SET_TAG=""
SHOW_CURRENT=false
FORCE=false
SKIP_CHANGELOG=false

# Show help function
show_help() {
  echo "Usage: $0 [OPTIONS]"
  echo "Manage release tags with semantic versioning and automatic changelog updates"
  echo ""
  echo "Options:"
  echo "  --major           Increment major version (vX.0.0)"
  echo "  --minor           Increment minor version (v0.X.0)"
  echo "  --patch           Increment patch version (v0.0.X) (default)"
  echo "  --name NAME       Append custom name to version (e.g., beta)"
  echo "  --set-tag TAG     Set specific tag (must be vX.Y.Z format)"
  echo "  --current         Show current release tag"
  echo "  --force           Force tag creation even if commit is tagged"
  echo "  --skip-changelog  Skip automatic changelog update"
  echo "  --help            Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --current"
  echo "  $0 --minor"
  echo "  $0 --major --name beta"
  echo "  $0 --set-tag v1.2.3"
  exit 0
}

# Function to get current date in YYYY-MM-DD format
get_current_date() {
  date +%Y-%m-%d
}

# Function to generate changelog entry
generate_changelog_entry() {
  local version=$1
  local date=$2
  local name=$3
  
  # Determine release type and emoji
  local release_type=""
  local emoji=""
  
  if [[ "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Regular version
    if [[ "$version" =~ ^v[0-9]+\.0\.0$ ]]; then
      release_type="Major Release"
      emoji="🚀"
    elif [[ "$version" =~ ^v[0-9]+\.[0-9]+\.0$ ]]; then
      release_type="Minor Release"
      emoji="✨"
    else
      release_type="Patch Release"
      emoji="🐛"
    fi
  else
    # Pre-release version
    release_type="Pre-release"
    emoji="🔧"
  fi
  
  # Generate changelog entry
  cat << EOF

## [$version] - $date

### $emoji $release_type
EOF
  
  if [[ -n "$name" ]]; then
    echo "**Release Name:** $name"
    echo ""
  fi
  
  echo "### ✨ Added"
  echo "- [ ] New features and enhancements"
  echo ""
  echo "### 🔧 Changed"
  echo "- [ ] Modified functionality"
  echo ""
  echo "### 🐛 Fixed"
  echo "- [ ] Bug fixes and improvements"
  echo ""
  echo "### 🗑️ Removed"
  echo "- [ ] Deprecated features and cleanup"
  echo ""
  echo "### 📚 Documentation"
  echo "- [ ] Documentation updates"
  echo ""
  echo "### 🛡️ Security"
  echo "- [ ] Security improvements"
  echo ""
  echo "### 🚀 Performance"
  echo "- [ ] Performance optimizations"
  echo ""
  echo "---"
}

# Function to update changelog
update_changelog() {
  local version=$1
  local date=$2
  local name=$3
  
  local changelog_file="CHANGELOG.md"
  
  if [[ ! -f "$changelog_file" ]]; then
    echo "Warning: CHANGELOG.md not found. Creating new changelog file."
    cat > "$changelog_file" << EOF
# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

EOF
  fi
  
  # Generate the new changelog entry
  local new_entry=$(generate_changelog_entry "$version" "$date" "$name")
  
  # Insert the new entry after the header (after the first "---" line)
  if [[ -f "$changelog_file" ]]; then
    # Create temporary file
    local temp_file=$(mktemp)
    
    # Copy header and insert new entry
    local header_end=$(grep -n "^---$" "$changelog_file" | head -1 | cut -d: -f1)
    
    if [[ -n "$header_end" ]]; then
      # Insert after the first "---" line
      head -n "$header_end" "$changelog_file" > "$temp_file"
      echo "$new_entry" >> "$temp_file"
      tail -n +$((header_end + 1)) "$changelog_file" >> "$temp_file"
    else
      # No "---" found, append to end
      cat "$changelog_file" > "$temp_file"
      echo "$new_entry" >> "$temp_file"
    fi
    
    # Replace original file
    mv "$temp_file" "$changelog_file"
    
    echo "✅ Updated CHANGELOG.md with new release entry"
  fi
}

# Function to commit changelog changes
commit_changelog() {
  local version=$1
  
  if [[ -n "$(git status --porcelain CHANGELOG.md)" ]]; then
    echo "Committing changelog changes..."
    git add CHANGELOG.md
    git commit -m "📝 Update changelog for $version" --no-verify
    
    if [[ $? -eq 0 ]]; then
      echo "✅ Committed changelog changes"
      return 0
    else
      echo "⚠️  Warning: Failed to commit changelog changes"
      return 1
    fi
  else
    echo "ℹ️  No changelog changes to commit"
    return 0
  fi
}

# Parse long arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --major)
      if [[ -n "$INCREMENT" ]]; then
        echo "Error: Cannot use multiple version flags together (--major, --minor, --patch, --set-tag)"
        exit 1
      fi
      INCREMENT="major"
      shift
      ;;
    --minor)
      if [[ -n "$INCREMENT" ]]; then
        echo "Error: Cannot use multiple version flags together (--major, --minor, --patch, --set-tag)"
        exit 1
      fi
      INCREMENT="minor"
      shift
      ;;
    --patch)
      if [[ -n "$INCREMENT" ]]; then
        echo "Error: Cannot use multiple version flags together (--major, --minor, --patch, --set-tag)"
        exit 1
      fi
      INCREMENT="patch"
      shift
      ;;
    --name)
      if [[ "$SHOW_CURRENT" == true ]]; then
        echo "Error: Cannot use --name with --current"
        exit 1
      fi
      NAME="$2"
      shift 2
      ;;
    --set-tag)
      if [[ -n "$INCREMENT" ]]; then
        echo "Error: Cannot use multiple version flags together (--major, --minor, --patch, --set-tag)"
        exit 1
      fi
      SET_TAG="$2"
      # Validate tag format
      if [[ ! "$SET_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9-]+)?$ ]]; then
        echo "Error: Tag must be in format vX.Y.Z or vX.Y.Z-NAME (e.g., v1.2.3 or v1.2.3-beta)"
        exit 1
      fi
      INCREMENT="set"
      shift 2
      ;;
    --current)
      if [[ -n "$INCREMENT" || -n "$NAME" || "$FORCE" == true ]]; then
        echo "Error: Cannot combine --current with other options"
        exit 1
      fi
      SHOW_CURRENT=true
      shift
      ;;
    --force)
      if [[ "$SHOW_CURRENT" == true ]]; then
        echo "Error: Cannot use --force with --current"
        exit 1
      fi
      FORCE=true
      shift
      ;;
    --skip-changelog)
      SKIP_CHANGELOG=true
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo "Error: Unknown option $1"
      show_help
      exit 1
      ;;
  esac
done

# Default to patch if no version option specified
if [[ -z "$INCREMENT" && "$SHOW_CURRENT" == false ]]; then
  INCREMENT="patch"
fi

# Always sync with remote tags first
echo "Syncing with remote tags..."
git fetch --tags --force >/dev/null 2>&1

# Get current commit hash
CURRENT_COMMIT=$(git rev-parse HEAD)

# Get latest tag from remote
LATEST_TAG=$(git ls-remote --tags --refs --sort=-v:refname origin | head -n 1 | sed 's/.*\///')

# Show current tag if requested
if [[ "$SHOW_CURRENT" == true ]]; then
  if [[ -z "$LATEST_TAG" ]]; then
    echo "No releases found"
    exit 0
  fi
  
  TAG_COMMIT=$(git ls-remote origin refs/tags/"$LATEST_TAG" | cut -f 1)
  echo "Latest release tag: $LATEST_TAG"
  echo "Tag points to commit: $TAG_COMMIT"
  echo "Current commit: $CURRENT_COMMIT"
  
  if [[ "$TAG_COMMIT" == "$CURRENT_COMMIT" ]]; then
    echo "Status: Current commit is tagged"
  else
    echo "Status: Current commit is not tagged"
  fi
  exit 0
fi

# Handle set-tag mode
if [[ "$INCREMENT" == "set" ]]; then
  NEW_TAG="$SET_TAG"
  echo "Setting tag directly to: $NEW_TAG"
else
  # Set default version if no tags exist
  if [[ -z "$LATEST_TAG" ]]; then
    LATEST_TAG="v0.0.0"
    echo "No existing tags found. Starting from v0.0.0"
  else
    echo "Current release tag: $LATEST_TAG"
  fi

  # Extract version numbers
  CLEAN_TAG=${LATEST_TAG#v}
  MAJOR=$(echo "$CLEAN_TAG" | cut -d. -f1)
  MINOR=$(echo "$CLEAN_TAG" | cut -d. -f2)
  PATCH=$(echo "$CLEAN_TAG" | cut -d. -f3 | sed 's/-.*//') # Remove any suffixes

  # Increment version based on selection
  case $INCREMENT in
    major)
      MAJOR=$((MAJOR + 1))
      MINOR=0
      PATCH=0
      ;;
    minor)
      MINOR=$((MINOR + 1))
      PATCH=0
      ;;
    patch)
      PATCH=$((PATCH + 1))
      ;;
  esac

  # Construct new tag
  NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"

  # Append custom name if provided
  if [[ -n "$NAME" ]]; then
    SANITIZED_NAME=$(echo "$NAME" | tr -cd '[:alnum:]-' | tr ' ' '-')
    NEW_TAG="${NEW_TAG}-${SANITIZED_NAME}"
  fi
fi

# Check if tag already exists locally or remotely
echo "Checking for existing tags..."
EXISTING_REMOTE=$(git ls-remote origin "refs/tags/${NEW_TAG}")
EXISTING_LOCAL=$(git tag -l "$NEW_TAG")

# Delete existing tags if found
if [[ -n "$EXISTING_REMOTE" || -n "$EXISTING_LOCAL" ]]; then
  echo "Tag $NEW_TAG already exists - deleting old version"
  
  # Delete remote tag
  if [[ -n "$EXISTING_REMOTE" ]]; then
    echo "Deleting remote tag: $NEW_TAG"
    git push --delete origin "$NEW_TAG" >/dev/null 2>&1 || true
  fi
  
  # Delete local tag
  if [[ -n "$EXISTING_LOCAL" ]]; then
    echo "Deleting local tag: $NEW_TAG"
    git tag -d "$NEW_TAG" >/dev/null 2>&1 || true
  fi
fi

# Check if current commit is already tagged
if [[ -n "$LATEST_TAG" ]]; then
  TAG_COMMIT=$(git ls-remote origin refs/tags/"$LATEST_TAG" | cut -f 1)
  if [[ "$TAG_COMMIT" == "$CURRENT_COMMIT" && "$FORCE" == false ]]; then
    echo "Error: Current commit is already tagged as $LATEST_TAG"
    echo "Use --force to create a new tag on this commit"
    exit 1
  fi
fi

# Update changelog if not skipped
if [[ "$SKIP_CHANGELOG" == false ]]; then
  echo "Updating changelog..."
  CURRENT_DATE=$(get_current_date)
  update_changelog "$NEW_TAG" "$CURRENT_DATE" "$NAME"
else
  echo "Skipping changelog update (--skip-changelog flag used)"
fi

# Create and push new tag
echo "Creating new tag: $NEW_TAG"
git tag "$NEW_TAG"

if [[ $? -eq 0 ]]; then
  echo "✅ Successfully created release tag: $NEW_TAG"
  
  # Commit changelog changes if any
  if [[ "$SKIP_CHANGELOG" == false ]]; then
    commit_changelog "$NEW_TAG"
  fi
  
  # Push tag and any commits
  echo "Pushing tag and changes to remote..."
  git push origin "$NEW_TAG"
  git push origin HEAD:main 2>/dev/null || git push origin HEAD:master 2>/dev/null || echo "Note: Could not push to main/master branch"
  
  echo "🎉 Release $NEW_TAG successfully created and pushed!"
  echo "Tag URL: https://github.com/$(git remote get-url origin | sed -E 's/.*[:/]([^/]+\/[^/]+)\.git.*/\1/')/releases/tag/$NEW_TAG"
  
  if [[ "$SKIP_CHANGELOG" == false ]]; then
    echo ""
    echo "📝 Next steps:"
    echo "1. Review the generated changelog entry in CHANGELOG.md"
    echo "2. Update the changelog with actual changes made in this release"
    echo "3. Commit and push the updated changelog"
    echo "4. Create a GitHub release with the changelog content"
  fi
else
  echo "Error: Failed to create tag"
  exit 1
fi