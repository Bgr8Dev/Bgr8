#!/usr/bin/env python3
"""
Fix Release Links Script for Bgr8 Platform
Finds all missing releases and adds them to the changelog release links section
"""

import re
import subprocess
import sys
import os
from typing import List, Set

def run_git_command(command: List[str]) -> str:
    """Run a git command and return the output"""
    try:
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            errors='replace'
        )
        return result.stdout.strip() if result.stdout else ""
    except Exception as e:
        print(f"Error running git command: {e}")
        return ""

def get_all_releases() -> List[str]:
    """Get all releases from git tags"""
    try:
        # Get all tags, sorted by version
        tags_output = run_git_command(['git', 'tag', '--sort=-version:refname'])
        if not tags_output:
            return []
        
        # Filter for version-like tags
        tags = []
        for tag in tags_output.split('\n'):
            tag = tag.strip()
            if tag and (tag.startswith('v') or re.match(r'^[0-9]+\.[0-9]+', tag)):
                tags.append(tag)
        
        return tags
    except Exception as e:
        print(f"Error getting releases: {e}")
        return []

def get_repository_info() -> tuple:
    """Get repository owner and name from git remote"""
    try:
        remote_url = run_git_command(['git', 'remote', 'get-url', 'origin'])
        if not remote_url:
            return "Hum2a", "Bgr8"  # Default fallback
        
        # Extract owner and repo from URL
        if 'github.com' in remote_url:
            match = re.search(r'github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$', remote_url)
            if match:
                owner, repo = match.groups()
                return owner, repo
        
        return "Hum2a", "Bgr8"  # Default fallback
    except Exception as e:
        print(f"Warning: Could not determine repository info: {e}")
        return "Hum2a", "Bgr8"  # Default fallback

def get_existing_release_links(changelog_file: str) -> Set[str]:
    """Get all existing release links from the changelog"""
    existing_links = set()
    
    try:
        with open(changelog_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all release link patterns
        link_pattern = r'\[([^\]]+)\]:\s*https://github\.com/[^/]+/[^/]+/releases/tag/\1'
        matches = re.findall(link_pattern, content)
        existing_links = set(matches)
        
        print(f"📋 Found {len(existing_links)} existing release links")
        return existing_links
        
    except Exception as e:
        print(f"Error reading changelog: {e}")
        return set()

def create_release_links_section(all_releases: List[str], existing_links: Set[str], owner: str, repo: str) -> str:
    """Create a complete release links section"""
    
    # Find missing releases
    missing_releases = []
    for release in all_releases:
        if release not in existing_links:
            missing_releases.append(release)
    
    print(f"🔍 Found {len(missing_releases)} missing releases:")
    for release in missing_releases:
        print(f"  - {release}")
    
    # Create all release links (existing + missing)
    all_release_links = []
    
    # Add existing links first
    for release in all_releases:
        if release in existing_links:
            all_release_links.append(f"[{release}]: https://github.com/{owner}/{repo}/releases/tag/{release}")
    
    # Add missing links
    for release in missing_releases:
        all_release_links.append(f"[{release}]: https://github.com/{owner}/{repo}/releases/tag/{release}")
    
    # Create the complete section
    section = "## 📋 Release Links\n\n"
    section += "\n".join(all_release_links)
    section += "\n\n[![Releases](https://img.shields.io/github/v/release/Hum2a/Bgr8)](https://github.com/Hum2a/Bgr8/releases)\n"
    section += "[![Commits](https://img.shields.io/github/commit-activity/m/Hum2a/Bgr8)](https://github.com/Hum2a/Bgr8/commits)"
    
    return section

def update_changelog_release_links(changelog_file: str, new_section: str) -> bool:
    """Update the changelog with the new release links section"""
    try:
        with open(changelog_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the release links section
        if "## 📋 Release Links" in content:
            # Replace the entire section
            pattern = r'## 📋 Release Links.*?(?=\n## |\Z)'
            new_content = re.sub(pattern, new_section, content, flags=re.DOTALL)
        else:
            # Add the section at the end
            new_content = content.rstrip() + "\n\n" + new_section + "\n"
        
        # Write back to file
        with open(changelog_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
        
    except Exception as e:
        print(f"Error updating changelog: {e}")
        return False

def main():
    """Main function"""
    print("🔧 Fixing Release Links in CHANGELOG.md")
    print("=" * 50)
    
    # Get repository info
    owner, repo = get_repository_info()
    print(f"📁 Repository: {owner}/{repo}")
    
    # Get all releases from git tags
    print("\n🔍 Fetching all releases from git tags...")
    all_releases = get_all_releases()
    print(f"📦 Found {len(all_releases)} total releases")
    
    if not all_releases:
        print("❌ No releases found!")
        return
    
    # Show all releases
    print("\n📋 All releases found:")
    for i, release in enumerate(all_releases, 1):
        print(f"  {i:2d}. {release}")
    
    # Get existing release links
    changelog_file = "CHANGELOG.md"
    existing_links = get_existing_release_links(changelog_file)
    
    # Create new release links section
    print(f"\n🔗 Creating complete release links section...")
    new_section = create_release_links_section(all_releases, existing_links, owner, repo)
    
    # Update the changelog
    print(f"\n📝 Updating {changelog_file}...")
    if update_changelog_release_links(changelog_file, new_section):
        print("✅ Successfully updated release links!")
        print(f"📊 Total releases now linked: {len(all_releases)}")
    else:
        print("❌ Failed to update changelog")
        return
    
    print("\n🎉 Release links fix completed!")
    print("\n💡 Next steps:")
    print("1. Review the updated CHANGELOG.md")
    print("2. Commit the changes: git add CHANGELOG.md && git commit -m '📝 Fix release links'")
    print("3. Push the changes: git push")

if __name__ == "__main__":
    main()
