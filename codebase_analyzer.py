#!/usr/bin/env python3
"""
Codebase Line Counter
Analyzes a codebase and provides detailed line count statistics by root-level directories.
"""

import os
import sys
from pathlib import Path
from collections import defaultdict
import argparse
from datetime import datetime

class CodebaseAnalyzer:
    def __init__(self, root_path="."):
        self.root_path = Path(root_path).resolve()
        self.stats = defaultdict(lambda: {
            'files': 0,
            'lines': 0,
            'blank_lines': 0,
            'comment_lines': 0,
            'code_lines': 0,
            'file_types': defaultdict(int)
        })
        
        # Common file extensions to analyze
        self.code_extensions = {
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r',
            '.m', '.mm', '.vue', '.svelte', '.html', '.css', '.scss', '.sass', '.less',
            '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
            '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            '.dockerfile', '.dockerignore', '.gitignore', '.env', '.md', '.txt'
        }
        
        # Directories to skip
        self.skip_dirs = {
            'node_modules', '.git', '.vscode', '.idea', 'dist', 'build', 'out',
            'target', 'bin', 'obj', '.next', '.nuxt', 'coverage', '.nyc_output',
            'emulator', 'firebase-debug.log', 'firestore-debug.log', '.firebase',
            'venv', 'env', '.env', '__pycache__', '.pytest_cache', '.mypy_cache',
            'logs', 'tmp', 'temp', '.cache', '.parcel-cache', '.turbo'
        }

    def is_code_file(self, file_path):
        """Check if file should be analyzed based on extension."""
        return file_path.suffix.lower() in self.code_extensions

    def should_skip_directory(self, dir_path):
        """Check if directory should be skipped."""
        return dir_path.name.lower() in self.skip_dirs or dir_path.name.startswith('.')

    def count_lines_in_file(self, file_path):
        """Count different types of lines in a file."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            total_lines = len(lines)
            blank_lines = 0
            comment_lines = 0
            code_lines = 0
            
            # Simple comment detection (can be improved for specific languages)
            in_multiline_comment = False
            
            for line in lines:
                stripped = line.strip()
                
                if not stripped:
                    blank_lines += 1
                elif stripped.startswith('//') or stripped.startswith('#') or stripped.startswith('*'):
                    comment_lines += 1
                elif stripped.startswith('/*'):
                    comment_lines += 1
                    if not stripped.endswith('*/'):
                        in_multiline_comment = True
                elif in_multiline_comment:
                    comment_lines += 1
                    if stripped.endswith('*/'):
                        in_multiline_comment = False
                else:
                    code_lines += 1
            
            return {
                'total': total_lines,
                'blank': blank_lines,
                'comments': comment_lines,
                'code': code_lines
            }
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return {'total': 0, 'blank': 0, 'comments': 0, 'code': 0}

    def analyze_directory(self, dir_path, root_dir_name):
        """Recursively analyze a directory."""
        try:
            for item in dir_path.iterdir():
                if item.is_file() and self.is_code_file(item):
                    line_counts = self.count_lines_in_file(item)
                    self.stats[root_dir_name]['files'] += 1
                    self.stats[root_dir_name]['lines'] += line_counts['total']
                    self.stats[root_dir_name]['blank_lines'] += line_counts['blank']
                    self.stats[root_dir_name]['comment_lines'] += line_counts['comments']
                    self.stats[root_dir_name]['code_lines'] += line_counts['code']
                    self.stats[root_dir_name]['file_types'][item.suffix.lower()] += 1
                    
                elif item.is_dir() and not self.should_skip_directory(item):
                    self.analyze_directory(item, root_dir_name)
        except PermissionError:
            print(f"Permission denied: {dir_path}")

    def analyze_codebase(self):
        """Analyze the entire codebase."""
        print(f"🔍 Analyzing codebase at: {self.root_path}")
        print("=" * 60)
        
        # Get root-level directories
        root_dirs = [d for d in self.root_path.iterdir() 
                    if d.is_dir() and not self.should_skip_directory(d)]
        
        # Also analyze root-level files
        root_files = [f for f in self.root_path.iterdir() 
                     if f.is_file() and self.is_code_file(f)]
        
        if root_files:
            print("📁 Analyzing root-level files...")
            for file_path in root_files:
                line_counts = self.count_lines_in_file(file_path)
                self.stats['root']['files'] += 1
                self.stats['root']['lines'] += line_counts['total']
                self.stats['root']['blank_lines'] += line_counts['blank']
                self.stats['root']['comment_lines'] += line_counts['comments']
                self.stats['root']['code_lines'] += line_counts['code']
                self.stats['root']['file_types'][file_path.suffix.lower()] += 1
        
        # Analyze each root directory
        for root_dir in root_dirs:
            print(f"📁 Analyzing {root_dir.name}/...")
            self.analyze_directory(root_dir, root_dir.name)

    def generate_markdown_report(self):
        """Generate a markdown report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        # Sort directories by total lines
        sorted_stats = sorted(self.stats.items(), 
                            key=lambda x: x[1]['lines'], reverse=True)
        
        total_files = sum(stats['files'] for stats in self.stats.values())
        total_lines = sum(stats['lines'] for stats in self.stats.values())
        total_code = sum(stats['code_lines'] for stats in self.stats.values())
        total_comments = sum(stats['comment_lines'] for stats in self.stats.values())
        total_blank = sum(stats['blank_lines'] for stats in self.stats.values())
        
        # Calculate percentages
        code_percentage = (total_code / total_lines) * 100 if total_lines > 0 else 0
        comment_percentage = (total_comments / total_lines) * 100 if total_lines > 0 else 0
        blank_percentage = (total_blank / total_lines) * 100 if total_lines > 0 else 0
        
        # Get top file types
        all_file_types = defaultdict(int)
        for stats in self.stats.values():
            for ext, count in stats['file_types'].items():
                all_file_types[ext] += count
        
        sorted_types = sorted(all_file_types.items(), key=lambda x: x[1], reverse=True)
        
        # Generate markdown content
        markdown_content = f"""# 📊 Codebase Analysis Report

**Generated:** {timestamp}  
**Project:** {self.root_path.name}  
**Path:** `{self.root_path}`

---

## 🎯 Overall Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| 📄 **Total Files** | {total_files:,} | - |
| 📏 **Total Lines** | {total_lines:,} | 100% |
| 💻 **Code Lines** | {total_code:,} | {code_percentage:.1f}% |
| 💬 **Comment Lines** | {total_comments:,} | {comment_percentage:.1f}% |
| ⚪ **Blank Lines** | {total_blank:,} | {blank_percentage:.1f}% |

---

## 📁 Directory Breakdown

| Directory | Files | Lines | Code | Comments | Blank |
|-----------|-------|-------|------|----------|-------|
"""
        
        for dir_name, stats in sorted_stats:
            if stats['files'] > 0:
                markdown_content += f"| **{dir_name}** | {stats['files']:,} | {stats['lines']:,} | {stats['code_lines']:,} | {stats['comment_lines']:,} | {stats['blank_lines']:,} |\n"
        
        markdown_content += f"""
---

## 📋 Top File Types

| Extension | File Count |
|-----------|------------|
"""
        
        for ext, count in sorted_types[:10]:
            if ext:
                markdown_content += f"| **{ext}** | {count:,} |\n"
        
        markdown_content += f"""
---

## 📈 Code Quality Metrics

- **Code Density:** {code_percentage:.1f}% (higher is better)
- **Documentation Ratio:** {comment_percentage:.1f}% (comments to total lines)
- **File Distribution:** {len([s for s in self.stats.values() if s['files'] > 0])} directories with code

---

## 🔍 Analysis Notes

- Analysis performed on: {timestamp}
- Excluded directories: `node_modules`, `.git`, `dist`, `build`, `emulator`, etc.
- File types analyzed: {len(self.code_extensions)} different extensions
- Total directories scanned: {len([d for d in self.root_path.iterdir() if d.is_dir() and not self.should_skip_directory(d)])}

---

*Report generated by Codebase Analyzer v1.0*
"""
        
        return markdown_content

    def save_report(self, markdown_content):
        """Save the markdown report to a changelog file."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        # Create reports directory if it doesn't exist
        reports_dir = self.root_path / "reports"
        reports_dir.mkdir(exist_ok=True)
        
        # Changelog file path
        changelog_filepath = reports_dir / "codebase_changelog.md"
        
        # Create entry header
        entry_header = f"""
---

## 📊 Analysis Run - {timestamp}

**Date:** {date_str}  
**Time:** {datetime.now().strftime("%H:%M:%S")}  
**Project:** {self.root_path.name}

"""
        
        try:
            # Check if changelog exists
            changelog_exists = changelog_filepath.exists()
            
            # If it's the first run, create the changelog with header
            if not changelog_exists:
                changelog_header = f"""# 📈 Codebase Analysis Changelog

**Project:** {self.root_path.name}  
**Started:** {timestamp}  
**Path:** `{self.root_path}`

This changelog tracks all codebase analysis runs over time, showing how the project grows and evolves.

"""
                with open(changelog_filepath, 'w', encoding='utf-8') as f:
                    f.write(changelog_header)
            
            # Append the new analysis to the changelog
            with open(changelog_filepath, 'a', encoding='utf-8') as f:
                f.write(entry_header)
                f.write(markdown_content)
            
            print(f"\n📄 Changelog updated:")
            print(f"   📁 Changelog: {changelog_filepath}")
            
            return changelog_filepath
            
        except Exception as e:
            print(f"❌ Error saving changelog: {e}")
            return None

    def print_results(self):
        """Print formatted results."""
        print("\n" + "=" * 80)
        print("📊 CODEBASE ANALYSIS RESULTS")
        print("=" * 80)
        
        # Sort directories by total lines
        sorted_stats = sorted(self.stats.items(), 
                            key=lambda x: x[1]['lines'], reverse=True)
        
        total_files = sum(stats['files'] for stats in self.stats.values())
        total_lines = sum(stats['lines'] for stats in self.stats.values())
        total_code = sum(stats['code_lines'] for stats in self.stats.values())
        total_comments = sum(stats['comment_lines'] for stats in self.stats.values())
        total_blank = sum(stats['blank_lines'] for stats in self.stats.values())
        
        print(f"\n🎯 OVERALL TOTALS:")
        print(f"   📄 Total Files: {total_files:,}")
        print(f"   📏 Total Lines: {total_lines:,}")
        print(f"   💻 Code Lines: {total_code:,}")
        print(f"   💬 Comment Lines: {total_comments:,}")
        print(f"   ⚪ Blank Lines: {total_blank:,}")
        
        if total_lines > 0:
            code_percentage = (total_code / total_lines) * 100
            comment_percentage = (total_comments / total_lines) * 100
            blank_percentage = (total_blank / total_lines) * 100
            print(f"\n📈 PERCENTAGES:")
            print(f"   💻 Code: {code_percentage:.1f}%")
            print(f"   💬 Comments: {comment_percentage:.1f}%")
            print(f"   ⚪ Blank: {blank_percentage:.1f}%")
        
        print(f"\n📁 BREAKDOWN BY DIRECTORY:")
        print("-" * 80)
        print(f"{'Directory':<20} {'Files':<8} {'Lines':<10} {'Code':<10} {'Comments':<10} {'Blank':<8}")
        print("-" * 80)
        
        for dir_name, stats in sorted_stats:
            if stats['files'] > 0:
                print(f"{dir_name:<20} {stats['files']:<8,} {stats['lines']:<10,} "
                      f"{stats['code_lines']:<10,} {stats['comment_lines']:<10,} "
                      f"{stats['blank_lines']:<8,}")
        
        print("\n📋 TOP FILE TYPES:")
        print("-" * 40)
        all_file_types = defaultdict(int)
        for stats in self.stats.values():
            for ext, count in stats['file_types'].items():
                all_file_types[ext] += count
        
        sorted_types = sorted(all_file_types.items(), key=lambda x: x[1], reverse=True)
        for ext, count in sorted_types[:10]:
            if ext:
                print(f"   {ext:<8} {count:>6,} files")
        
        print("\n" + "=" * 80)
        
        # Generate and save markdown report
        print("\n📝 Updating changelog...")
        markdown_content = self.generate_markdown_report()
        self.save_report(markdown_content)

def main():
    parser = argparse.ArgumentParser(description='Analyze codebase line counts')
    parser.add_argument('path', nargs='?', default='.', 
                       help='Path to codebase root (default: current directory)')
    args = parser.parse_args()
    
    analyzer = CodebaseAnalyzer(args.path)
    analyzer.analyze_codebase()
    analyzer.print_results()

if __name__ == "__main__":
    main()
