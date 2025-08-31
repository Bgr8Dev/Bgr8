#!/usr/bin/env python3
"""
Changelog Generator for bgr8 Platform
Automatically generates changelog entries from git commit messages
"""

import subprocess
import re
import sys
from datetime import datetime
from typing import List, Dict, Tuple

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
    """Run a git command and return the output"""
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running git command: {e}")
        sys.exit(1)

def get_commits_since_tag(tag: str) -> List[str]:
    """Get all commits since the specified tag"""
    if tag == "none":
        # Get all commits if no previous tag
        commits = run_git_command(['git', 'log', '--oneline', '--reverse'])
    else:
        commits = run_git_command(['git', 'log', '--oneline', '--reverse', f'{tag}..HEAD'])
    
    return [commit.strip() for commit in commits.split('\n') if commit.strip()]

def categorize_commit(commit_msg: str) -> Tuple[str, str, str]:
    """Categorize a commit message and return (type, emoji, description)"""
    # Remove the commit hash and get just the message
    message = re.sub(r'^[a-f0-9]{7,}\s+', '', commit_msg)
    
    # Check for conventional commit format
    for commit_type, (emoji, description) in COMMIT_TYPES.items():
        if message.lower().startswith(f'{commit_type}:'):
            return commit_type, emoji, description
    
    # Check for common patterns in the message
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['add', 'new', 'feature', 'implement']):
        return 'feat', '✨ Added', 'New features and enhancements'
    elif any(word in message_lower for word in ['fix', 'bug', 'issue', 'error']):
        return 'fix', '🐛 Fixed', 'Bug fixes and improvements'
    elif any(word in message_lower for word in ['doc', 'readme', 'comment']):
        return 'docs', '📚 Documentation', 'Documentation updates'
    elif any(word in message_lower for word in ['style', 'format', 'indent']):
        return 'style', '🎨 Changed', 'Code style and formatting changes'
    elif any(word in message_lower for word in ['refactor', 'restructure', 'clean']):
        return 'refactor', '🔧 Changed', 'Code refactoring and restructuring'
    elif any(word in message_lower for word in ['perf', 'performance', 'speed', 'optimize']):
        return 'perf', '🚀 Performance', 'Performance improvements'
    elif any(word in message_lower for word in ['test', 'spec', 'coverage']):
        return 'test', '🧪 Testing', 'Test additions and improvements'
    elif any(word in message_lower for word in ['security', 'vulnerability', 'auth']):
        return 'security', '🛡️ Security', 'Security improvements'
    elif any(word in message_lower for word in ['remove', 'delete', 'cleanup', 'deprecate']):
        return 'remove', '🗑️ Removed', 'Removed features and cleanup'
    elif any(word in message_lower for word in ['deps', 'dependency', 'package']):
        return 'deps', '📦 Changed', 'Dependency updates'
    else:
        return 'chore', '🔧 Changed', 'Maintenance tasks and chores'

def generate_changelog_entry(version: str, release_name: str = "", commits: List[str] = None) -> str:
    """Generate a complete changelog entry"""
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
        categorized = {}
        for commit in commits:
            commit_type, emoji, description = categorize_commit(commit)
            if commit_type not in categorized:
                categorized[commit_type] = []
            categorized[commit_type].append(commit)
        
        # Generate sections based on actual commits
        for commit_type, (emoji, description) in COMMIT_TYPES.items():
            if commit_type in categorized:
                entry += f"### {emoji} {description}\n"
                for commit in categorized[commit_type]:
                    # Clean up commit message
                    clean_msg = re.sub(r'^[a-f0-9]{7,}\s+', '', commit)
                    entry += f"- {clean_msg}\n"
                entry += "\n"
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
        print("Usage: python generate-changelog.py <version> [release_name] [previous_tag]")
        print("Example: python generate-changelog.py v1.2.3 'Feature Release' v1.2.2")
        sys.exit(1)
    
    version = sys.argv[1]
    release_name = sys.argv[2] if len(sys.argv) > 2 else ""
    previous_tag = sys.argv[3] if len(sys.argv) > 3 else "none"
    
    print(f"Generating changelog for version {version}...")
    
    # Get commits since the previous tag
    commits = get_commits_since_tag(previous_tag)
    
    # Generate the changelog entry
    changelog = generate_changelog_entry(version, release_name, commits)
    
    # Write to file
    output_file = f"changelog-{version}.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(changelog)
    
    print(f"✅ Changelog generated: {output_file}")
    print(f"📝 Found {len(commits)} commits since {previous_tag if previous_tag != 'none' else 'beginning'}")
    
    # Also print to console
    print("\n" + "="*50)
    print("GENERATED CHANGELOG ENTRY:")
    print("="*50)
    print(changelog)

if __name__ == "__main__":
    main()
