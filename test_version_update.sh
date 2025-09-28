bash release.sh#!/bin/bash

# Test script to verify version update functions work correctly

# Function to update version in package.json
update_package_json() {
  local version=$1
  local package_file="package.json"
  
  if [[ ! -f "$package_file" ]]; then
    echo "⚠️  Warning: package.json not found"
    return 1
  fi
  
  # Extract version number without 'v' prefix
  local version_number=${version#v}
  
  # Update version in package.json using sed
  if command -v sed &> /dev/null; then
    # For GNU sed (Linux) and BSD sed (macOS)
    if sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$version_number\"/" "$package_file" 2>/dev/null; then
      rm -f "${package_file}.bak" 2>/dev/null
      echo "✅ Updated version in package.json to $version_number"
      return 0
    else
      echo "⚠️  Warning: Failed to update package.json"
      return 1
    fi
  else
    echo "⚠️  Warning: sed command not found, cannot update package.json"
    return 1
  fi
}

# Function to update version in README.md
update_readme() {
  local version=$1
  local readme_file="README.md"
  
  if [[ ! -f "$readme_file" ]]; then
    echo "⚠️  Warning: README.md not found"
    return 1
  fi
  
  # Extract version number without 'v' prefix
  local version_number=${version#v}
  
  # Update version badge in README.md using sed
  if command -v sed &> /dev/null; then
    # Update the version badge pattern
    if sed -i.bak "s/\[!\[Version\](https:\/\/img\.shields\.io\/badge\/version-[^-]*-brightgreen\.svg\?style=for-the-badge)\](CHANGELOG\.md)/[![Version](https:\/\/img\.shields\.io\/badge\/version-$version_number-brightgreen.svg?style=for-the-badge)](CHANGELOG.md)/" "$readme_file" 2>/dev/null; then
      rm -f "${readme_file}.bak" 2>/dev/null
      echo "✅ Updated version badge in README.md to $version_number"
      return 0
    else
      echo "⚠️  Warning: Failed to update README.md version badge"
      return 1
    fi
  else
    echo "⚠️  Warning: sed command not found, cannot update README.md"
    return 1
  fi
}

# Test the functions
echo "Testing version update functions..."
echo "Current package.json version:"
grep '"version"' package.json

echo ""
echo "Current README.md version badge:"
grep 'version-' README.md

echo ""
echo "Testing update to v1.2.3..."
update_package_json "v1.2.3"
update_readme "v1.2.3"

echo ""
echo "Updated package.json version:"
grep '"version"' package.json

echo ""
echo "Updated README.md version badge:"
grep 'version-' README.md

echo ""
echo "Reverting back to original versions..."
update_package_json "v0.8.0"
update_readme "v0.2.0"

echo ""
echo "Reverted package.json version:"
grep '"version"' package.json

echo ""
echo "Reverted README.md version badge:"
grep 'version-' README.md
