#!/usr/bin/env python3
"""
Smart Changelog Generator for bgr8 Platform
Automatically generates meaningful changelog entries from git commits
"""

import subprocess
import re
import sys
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
    """Run a git command and return the output"""
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running git command: {e}")
        return ""

def get_commits_since_tag(tag: str) -> List[Dict]:
    """Get all commits since the specified tag with detailed information"""
    if tag == "none":
        # Get all commits if no previous tag
        format_str = "%H|%s|%an|%ad|%b"
        commits = run_git_command(['git', 'log', '--pretty=format:' + format_str, '--reverse'])
    else:
        format_str = "%H|%s|%an|%ad|%b"
        commits = run_git_command(['git', 'log', '--pretty=format:' + format_str, '--reverse', f'{tag}..HEAD'])
    
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
    
    return commit_list

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
    else:
        print("⚠️  No commits found")
    
    # Generate the changelog entry
    changelog = generate_smart_changelog_entry(version, release_name, commits)
    
    # Write to file
    output_file = f"smart-changelog-{version}.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(changelog)
    
    print(f"\n✅ Smart changelog generated: {output_file}")
    
    # Also print to console
    print("\n" + "="*60)
    print("GENERATED SMART CHANGELOG ENTRY:")
    print("="*60)
    print(changelog)

if __name__ == "__main__":
    main()
