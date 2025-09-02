#!/usr/bin/env python3
"""
Smart Changelog Generator for bgr8 Platform
Automatically generates meaningful changelog entries from git commits
"""

import subprocess
import re
import sys
import os
from datetime import datetime
from typing import List, Dict, Tuple
from collections import defaultdict

# Commit type patterns and their emojis
COMMIT_TYPES = {
    'feat': ('✨ Added', 'New features and enhancements'),
    'fix': ('🐛 Fixed', 'Bug fixes and improvements'),
    'docs': ('📚 Documentation', 'Documentation updates'),
    'style': ('🎨 Changed', 'Code style and formatting changes'),
    'refactor': ('🔧 Changed', 'Code refactoring and restructuring'),
    'perf': ('🚀 Performance', 'Performance improvements'),
    'test': ('🧪 Testing', 'Test additions and improvements'),
    'chore': ('🔧 Changed', 'Maintenance tasks and chores'),
    'security': ('🛡️ Security', 'Security improvements'),
    'build': ('🔧 Changed', 'Build system changes'),
    'ci': ('🔧 Changed', 'CI/CD pipeline changes'),
    'revert': ('🔄 Changed', 'Reverted changes'),
    'remove': ('🗑️ Removed', 'Removed features and cleanup'),
    'deps': ('📦 Changed', 'Dependency updates'),
}

def run_git_command(command: List[str]) -> str:
    """Run a git command and return the output with proper encoding handling"""
    try:
        # Set environment variables for better encoding handling on Windows
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        # Use text=True and encoding='utf-8' for better cross-platform compatibility
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            env=env,
            errors='replace'  # Replace problematic characters instead of failing
        )
        
        if result.returncode != 0:
            print(f"Warning: Git command returned non-zero exit code: {result.returncode}")
            if result.stderr:
                print(f"Git stderr: {result.stderr}")
            return ""
        
        return result.stdout.strip() if result.stdout else ""
        
    except subprocess.CalledProcessError as e:
        print(f"Error running git command: {e}")
        return ""
    except Exception as e:
        print(f"Unexpected error running git command: {e}")
        return ""

def verify_tag_exists(tag: str) -> bool:
    """Verify that a git tag exists"""
    if tag == "none":
        return True
    
    try:
        result = run_git_command(['git', 'rev-parse', '--verify', f'{tag}^{{commit}}'])
        return bool(result.strip())
    except:
        return False

def get_commits_since_tag(tag: str) -> List[Dict]:
    """Get all commits since the specified tag with detailed information"""
    try:
        # Verify the tag exists if it's not "none"
        if tag != "none" and not verify_tag_exists(tag):
            print(f"⚠️  Warning: Tag '{tag}' does not exist. Using all commits instead.")
            tag = "none"
        
        if tag == "none":
            # Get all commits if no previous tag
            format_str = "%H|%s|%an|%ad|%b"
            commits = run_git_command(['git', 'log', '--pretty=format:' + format_str, '--reverse'])
        else:
            # Use more specific git log command to ensure we only get commits after the tag
            format_str = "%H|%s|%an|%ad|%b"
            # Use --no-merges to exclude merge commits and be more specific about the range
            commits = run_git_command(['git', 'log', '--pretty=format:' + format_str, '--reverse', '--no-merges', f'{tag}..HEAD'])
        
        if not commits:
            print(f"Warning: No git output received for tag range: {tag}")
            return []
        
        commit_list = []
        for commit in commits.split('\n'):
            if commit.strip():
                parts = commit.split('|', 4)
                if len(parts) >= 5:
                    commit_list.append({
                        'hash': parts[0],
                        'message': parts[1],
                        'author': parts[2],
                        'date': parts[3],
                        'body': parts[4] if len(parts) > 4 else ''
                    })
        
        # Additional filtering to remove changelog-related commits that might be duplicates
        filtered_commits = []
        for commit in commit_list:
            message = commit['message'].lower()
            # Skip commits that are just changelog updates or version bumps
            if not any(skip_word in message for skip_word in [
                'update changelog', 'changelog', 'version', 'release', 
                'bump version', 'update version', '📝 update changelog'
            ]):
                filtered_commits.append(commit)
        
        print(f"📊 Filtered {len(commit_list) - len(filtered_commits)} changelog/version commits")
        return filtered_commits
        
    except Exception as e:
        print(f"Error processing commits: {e}")
        return []

def categorize_commit(commit_data: Dict) -> Tuple[str, str, str]:
    """Categorize a commit message and return (type, emoji, description)"""
    message = commit_data['message'].lower()
    
    # Check for conventional commit format
    for commit_type, (emoji, description) in COMMIT_TYPES.items():
        if message.startswith(f'{commit_type}:'):
            return commit_type, emoji, description
    
    # Check for common patterns in the message
    if any(word in message for word in ['add', 'new', 'feature', 'implement', 'create']):
        return 'feat', '✨ Added', 'New features and enhancements'
    elif any(word in message for word in ['fix', 'bug', 'issue', 'error', 'resolve']):
        return 'fix', '🐛 Fixed', 'Bug fixes and improvements'
    elif any(word in message for word in ['doc', 'readme', 'comment', 'changelog']):
        return 'docs', '📚 Documentation', 'Documentation updates'
    elif any(word in message for word in ['style', 'format', 'indent', 'ui', 'ux']):
        return 'style', '🎨 Changed', 'Code style and formatting changes'
    elif any(word in message for word in ['refactor', 'restructure', 'clean', 'optimize']):
        return 'refactor', '🔧 Changed', 'Code refactoring and restructuring'
    elif any(word in message for word in ['perf', 'performance', 'speed', 'optimize']):
        return 'perf', '🚀 Performance', 'Performance improvements'
    elif any(word in message for word in ['test', 'spec', 'coverage']):
        return 'test', '🧪 Testing', 'Test additions and improvements'
    elif any(word in message for word in ['security', 'vulnerability', 'auth', 'protect']):
        return 'security', '🛡️ Security', 'Security improvements'
    elif any(word in message for word in ['remove', 'delete', 'cleanup', 'deprecate', 'drop']):
        return 'remove', '🗑️ Removed', 'Removed features and cleanup'
    elif any(word in message for word in ['deps', 'dependency', 'package', 'npm', 'yarn']):
        return 'deps', '📦 Changed', 'Dependency updates'
    elif any(word in message for word in ['update', 'change', 'modify', 'improve']):
        return 'chore', '🔧 Changed', 'Maintenance tasks and chores'
    else:
        return 'chore', '🔧 Changed', 'Maintenance tasks and chores'

def clean_commit_message(message: str) -> str:
    """Clean up commit message for display"""
    # Remove conventional commit prefixes
    message = re.sub(r'^(feat|fix|docs|style|refactor|perf|test|chore|security|build|ci|revert|remove|deps):\s*', '', message, flags=re.IGNORECASE)
    
    # Capitalize first letter
    if message:
        message = message[0].upper() + message[1:]
    
    return message

def get_repository_info() -> Tuple[str, str]:
    """Get repository owner and name from git remote"""
    try:
        # Get the remote URL
        remote_url = run_git_command(['git', 'remote', 'get-url', 'origin'])
        if not remote_url:
            return "Hum2a", "Bgr8"  # Default fallback
        
        # Extract owner and repo from URL
        # Handle both HTTPS and SSH formats
        if 'github.com' in remote_url:
            # Extract from https://github.com/owner/repo.git or git@github.com:owner/repo.git
            match = re.search(r'github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$', remote_url)
            if match:
                owner, repo = match.groups()
                return owner, repo
        
        return "Hum2a", "Bgr8"  # Default fallback
    except Exception as e:
        print(f"Warning: Could not determine repository info: {e}")
        return "Hum2a", "Bgr8"  # Default fallback

def update_release_links(changelog_file: str, version: str) -> bool:
    """Update the release links section with the new version"""
    try:
        if not os.path.exists(changelog_file):
            print(f"Warning: Changelog file {changelog_file} not found")
            return False
        
        # Read the current changelog
        with open(changelog_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Get repository info
        owner, repo = get_repository_info()
        
        # Create the new release link
        new_link = f"[{version}]: https://github.com/{owner}/{repo}/releases/tag/{version}"
        
        # Check if the release links section exists
        if "## 📋 Release Links" in content:
            # Find the release links section
            lines = content.split('\n')
            release_links_start = -1
            release_links_end = -1
            
            for i, line in enumerate(lines):
                if line.strip() == "## 📋 Release Links":
                    release_links_start = i
                elif release_links_start != -1 and line.strip().startswith("## ") and i > release_links_start:
                    release_links_end = i
                    break
            
            if release_links_start != -1:
                # Find where to insert the new link (should be at the top of the links)
                insert_pos = release_links_start + 2  # After the header and empty line
                
                # Check if this version already exists
                version_exists = False
                for i in range(release_links_start, len(lines)):
                    if f"[{version}]:" in lines[i]:
                        version_exists = True
                        break
                
                if not version_exists:
                    # Insert the new link at the top
                    lines.insert(insert_pos, new_link)
                    
                    # Write back to file
                    with open(changelog_file, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(lines))
                    
                    print(f"✅ Added release link: {new_link}")
                    return True
                else:
                    print(f"ℹ️  Release link for {version} already exists")
                    return True
            else:
                print("Warning: Could not find release links section")
                return False
        else:
            print("Warning: No release links section found in changelog")
            return False
            
    except Exception as e:
        print(f"Error updating release links: {e}")
        return False

def generate_smart_changelog_entry(version: str, release_name: str = "", commits: List[Dict] = None) -> str:
    """Generate a complete changelog entry with actual commit information"""
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    # Determine release type and emoji
    if re.match(r'^v[0-9]+\.[0-9]+\.[0-9]+$', version):
        if re.match(r'^v[0-9]+\.0\.0$', version):
            release_type = 'Major Release'
            emoji = '🚀'
        elif re.match(r'^v[0-9]+\.[0-9]+\.0$', version):
            release_type = 'Minor Release'
            emoji = '✨'
        else:
            release_type = 'Patch Release'
            emoji = '🐛'
    else:
        release_type = 'Pre-release'
        emoji = '🔧'
    
    # Start building the changelog entry
    entry = f"""## [{version}] - {current_date}

### {emoji} {release_type}"""
    
    if release_name:
        entry += f"\n**Release Name:** {release_name}\n"
    
    entry += "\n"
    
    if commits:
        # Categorize commits
        categorized = defaultdict(list)
        for commit in commits:
            commit_type, emoji, description = categorize_commit(commit)
            categorized[commit_type].append(commit)
        
        # Generate sections based on actual commits
        for commit_type, (emoji, description) in COMMIT_TYPES.items():
            if commit_type in categorized:
                entry += f"### {emoji} {description}\n"
                for commit in categorized[commit_type]:
                    clean_msg = clean_commit_message(commit['message'])
                    entry += f"- {clean_msg}\n"
                entry += "\n"
        
        # Add summary
        total_commits = len(commits)
        entry += f"**Total Changes:** {total_commits} commits\n\n"
    else:
        # Fallback template if no commits provided
        for emoji, description in COMMIT_TYPES.values():
            entry += f"### {emoji}\n"
            entry += f"- [ ] {description}\n\n"
    
    entry += "---\n"
    return entry

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python smart-changelog.py <version> [release_name] [previous_tag]")
        print("Example: python smart-changelog.py v0.6.4 'Changelog Automation' v0.4.0-Typhoon")
        sys.exit(1)
    
    version = sys.argv[1]
    release_name = sys.argv[2] if len(sys.argv) > 2 else ""
    previous_tag = sys.argv[3] if len(sys.argv) > 3 else "none"
    
    print(f"Generating smart changelog for version {version}...")
    print(f"🔍 Looking for commits since: {previous_tag if previous_tag != 'none' else 'beginning of repository'}")
    
    # Get commits since the previous tag
    commits = get_commits_since_tag(previous_tag)
    
    if commits:
        print(f"📝 Found {len(commits)} commits since {previous_tag if previous_tag != 'none' else 'beginning'}")
        
        # Show some sample commits
        print("\n📋 Sample commits:")
        for i, commit in enumerate(commits[:5]):
            print(f"  {i+1}. {commit['message']}")
        if len(commits) > 5:
            print(f"  ... and {len(commits) - 5} more")
        
        # Show commit date range
        if len(commits) > 0:
            first_commit_date = commits[0]['date']
            last_commit_date = commits[-1]['date']
            print(f"\n📅 Commit date range: {first_commit_date} to {last_commit_date}")
    else:
        print("⚠️  No commits found")
        print("💡 This might mean:")
        print("   - No new commits since the previous release")
        print("   - The previous tag doesn't exist")
        print("   - All commits were filtered out (changelog/version commits)")
    
    # Generate the changelog entry
    changelog = generate_smart_changelog_entry(version, release_name, commits)
    
    # Write to file
    output_file = f"smart-changelog-{version}.md"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(changelog)
        print(f"\n✅ Smart changelog generated: {output_file}")
    except Exception as e:
        print(f"❌ Error writing to file: {e}")
        sys.exit(1)
    
    # Update release links in the main changelog
    print(f"\n🔗 Updating release links for {version}...")
    changelog_file = "CHANGELOG.md"
    if update_release_links(changelog_file, version):
        print("✅ Release links updated successfully")
    else:
        print("⚠️  Warning: Could not update release links")
    
    # Also print to console
    print("\n" + "="*60)
    print("GENERATED SMART CHANGELOG ENTRY:")
    print("="*60)
    print(changelog)

if __name__ == "__main__":
    main()
