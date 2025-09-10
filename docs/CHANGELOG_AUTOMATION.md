# 📝 Changelog Automation Guide

This guide explains how to automatically update your changelog when creating new releases for the bgr8 Platform.

## 🚀 **Available Automation Options**

### 1. **Enhanced Release Script (Recommended)**
The updated `release.sh` script now automatically updates your changelog when creating new releases.

**Features:**
- ✅ **Automatic changelog entry generation**
- ✅ **Smart release type detection** (Major/Minor/Patch/Pre-release)
- ✅ **Professional formatting** with emojis and sections
- ✅ **Automatic commit and push** of changelog changes
- ✅ **Skip option** for manual changelog updates

**Usage:**
```bash
# Create a new patch release with automatic changelog
./release.sh --patch

# Create a minor release with custom name
./release.sh --minor --name "Feature Release"

# Create a major release
./release.sh --major

# Skip changelog update (manual mode)
./release.sh --patch --skip-changelog

# Set specific version
./release.sh --set-tag v1.2.3
```

### 2. **GitHub Actions Workflow**
Automatically updates the changelog when you create a GitHub release.

**Features:**
- ✅ **Triggered by GitHub releases**
- ✅ **Manual workflow dispatch** for testing
- ✅ **Automatic commit categorization**
- ✅ **Professional formatting**
- ✅ **Commit summary generation**

**How it works:**
1. Create a GitHub release (either through the UI or API)
2. The workflow automatically runs
3. Updates `CHANGELOG.md` with a new entry
4. Commits and pushes the changes
5. Provides a summary of what was done

**Manual trigger:**
```bash
# Go to Actions tab → Auto Changelog Update → Run workflow
# Enter version (e.g., v1.2.3) and optional release name
```

### 3. **Python Script Generator**
Standalone script that generates changelog entries from git commits.

**Features:**
- ✅ **Commit message analysis** and categorization
- ✅ **Conventional commit format** support
- ✅ **Smart pattern matching** for commit types
- ✅ **Professional output formatting**
- ✅ **Standalone operation** (no GitHub required)

**Usage:**
```bash
# Generate changelog for version v1.2.3
python scripts/generate-changelog.py v1.2.3

# With release name
python scripts/generate-changelog.py v1.2.3 "Feature Release"

# Since specific tag
python scripts/generate-changelog.py v1.2.3 "Feature Release" v1.2.2
```

## 🔧 **Setup Instructions**

### **Option 1: Enhanced Release Script**
1. **Make the script executable:**
   ```bash
   chmod +x release.sh
   ```

2. **Test the script:**
   ```bash
   ./release.sh --current
   ```

3. **Create your first automated release:**
   ```bash
   ./release.sh --patch
   ```

### **Option 2: GitHub Actions**
1. **The workflow is already configured** in `.github/workflows/auto-changelog.yml`
2. **Create a GitHub release** through the GitHub UI
3. **The workflow will automatically run** and update your changelog

### **Option 3: Python Script**
1. **Ensure Python 3.7+ is installed**
2. **Navigate to the scripts directory:**
   ```bash
   cd scripts
   ```

3. **Run the script:**
   ```bash
   python generate-changelog.py v1.2.3
   ```

## 📋 **Changelog Format**

All automation methods generate changelog entries in this format:

```markdown
## [v1.2.3] - 2025-01-15

### 🚀 Major Release
**Release Name:** Feature Release

### ✨ Added
- New features and enhancements

### 🔧 Changed
- Modified functionality

### 🐛 Fixed
- Bug fixes and improvements

### 🗑️ Removed
- Deprecated features and cleanup

### 📚 Documentation
- Documentation updates

### 🛡️ Security
- Security improvements

### 🚀 Performance
- Performance optimizations

---
```

## 🎯 **Best Practices**

### **1. Commit Message Convention**
Use conventional commit format for better automation:

```bash
# Feature
git commit -m "feat: add new mentor matching algorithm"

# Bug fix
git commit -m "fix: resolve authentication timeout issue"

# Documentation
git commit -m "docs: update README with new features"

# Performance
git commit -m "perf: optimize database queries"

# Security
git commit -m "security: fix XSS vulnerability in forms"
```

### **2. Release Workflow**
1. **Develop features** with conventional commit messages
2. **Create release** using one of the automation methods
3. **Review generated changelog** and update with actual changes
4. **Push final changelog** to repository
5. **Create GitHub release** with the changelog content

### **3. Changelog Maintenance**
- **Keep entries up-to-date** with actual changes
- **Use descriptive language** for user-facing changes
- **Include breaking changes** prominently
- **Link to related issues** when possible

## 🔄 **Workflow Examples**

### **Example 1: Patch Release**
```bash
# 1. Make bug fixes
git commit -m "fix: resolve login issue on mobile devices"
git commit -m "fix: correct typo in error message"

# 2. Create release with automatic changelog
./release.sh --patch

# 3. Review and update changelog
# 4. Push final version
git add CHANGELOG.md
git commit -m "docs: finalize changelog for v1.2.4"
git push
```

### **Example 2: Minor Release**
```bash
# 1. Add new features
git commit -m "feat: implement dark mode theme"
git commit -m "feat: add export functionality for mentor data"

# 2. Create release with custom name
./release.sh --minor --name "Dark Mode Release"

# 3. Update changelog with actual features
# 4. Push and create GitHub release
```

### **Example 3: Major Release**
```bash
# 1. Make breaking changes
git commit -m "feat!: redesign authentication system"
git commit -m "feat!: restructure database schema"

# 2. Create major release
./release.sh --major

# 3. Document breaking changes prominently
# 4. Create migration guide
```

## 🚨 **Troubleshooting**

### **Common Issues**

**1. Script Permission Denied**
```bash
chmod +x release.sh
```

**2. Git Not Found**
```bash
# Ensure git is in PATH
which git
```

**3. Python Script Errors**
```bash
# Check Python version
python --version

# Install dependencies if needed
pip install -r requirements.txt
```

**4. GitHub Actions Not Running**
- Check workflow file syntax
- Ensure repository has Actions enabled
- Verify branch protection rules

### **Manual Override**
If automation fails, you can always update the changelog manually:

1. **Copy the template** from any generated entry
2. **Fill in the actual changes** made in your release
3. **Commit and push** manually
4. **Create GitHub release** with the content

## 📚 **Additional Resources**

- **[Keep a Changelog](https://keepachangelog.com/)** - Changelog format standards
- **[Conventional Commits](https://www.conventionalcommits.org/)** - Commit message standards
- **[Semantic Versioning](https://semver.org/)** - Version numbering standards
- **[GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)** - GitHub release documentation

## 🤝 **Support**

If you encounter issues with changelog automation:

1. **Check the logs** from your chosen method
2. **Review this documentation** for troubleshooting steps
3. **Create an issue** with detailed error information
4. **Ask in the community** for help

---

**Happy releasing! 🚀**

The bgr8 Platform changelog automation makes it easy to maintain professional, consistent release documentation with minimal effort.
