# Firebase Configuration & Data Export

This directory contains Firebase configuration files and scripts for managing your Firebase project data.

## 📋 Prerequisites

Before using the export script, ensure you have:

- **Firebase CLI** installed (should be part of the `package.json` in root dir)
- **Google Cloud CLI** installed: [Install gcloud](https://cloud.google.com/sdk/docs/install)
- **Authenticated** with both Firebase and Google Cloud

## 🚀 Initial Setup

### 1. **Initialize Firebase in your project**

If you haven't already set up Firebase in your project, run:

```bash
# Navigate to firebase_emulator directory
cd firebase_emulator

# Initialize Firebase
firebase init
```

**Select these options:**
(press *spacebar* to select and *Enter* to confirm)
1. ✅ **Emulators**: Set up local emulators for development
2. ✅ **Authentication**, ✅ **Firestore**, and ✅ **Storage**
3. Enter `Y` for "Would you like to download the emulators now? (Y/n)"


### 2. **Configure Firebase projects**

Manually edit `.firebaserc`:

```json
{
  "projects": {
    "default": "b8network",
    "prod": "b8network", 
    "dev": "b8network-dev-2"
  }
}
```

### 3. **Authenticate with Google Cloud**

```bash
# Login to Firebase
firebase login

# Login to Google Cloud (for Firestore export)
gcloud auth login

# Set default project
gcloud config set project b8network
```

## 📦 Data Export Script

### **What it does:**
- Exports Firestore data from any Firebase environment
- Downloads the export to your local machine
- Organizes data with timestamps
- Optional cleanup to save storage costs

### **Usage:**

1. **Navigate to the emulator directory:**
   ```bash
   cd firebase_emulator
   ```

2. **Run the export script:**
   Linux/MacOS
   ```
   ./download_cloud_data.sh
   ```

   Windows
   To setup bash see [here](../README.md#windows-powershell-alias-setup)
   ```powershell
   bash ./download_cloud_data.sh
   ```

3. **Follow the prompts:**
   - Choose your Firebase environment (prod, dev, etc.)
   - Wait for export and download to complete
   - Optionally clean up Cloud Storage to save costs

### **Example Output:**
```
Available Firebase environments:
 1. default: b8network-dev-2
 2. prod: b8network
 3. dev: b8network-dev-2

Enter environment name: prod

Selected: prod -> b8network
Configuration:
  Project: b8network
  Bucket: b8network.appspot.com
  Timestamp: 20250808_143022
  Local Dir: ./data
```

## 🧪 Using Exported Data with Emulators

### **Start emulators with imported data:**

Make sure the `.env` in the root directory has set:
```bash
VITE_USE_EMULATORS=true
```

Then
```bash
# Navigate to firebase_emulator directory if not already there
cd firebase_emulator

# Start emulators with imported data
firebase emulators:start --import=./data/<name_of_save_folder>
```

### **Start emulators and export on exit:**
```bash
firebase emulators:start --import=./data/<name_of_save_folder> --export-on-exit=./data/latest
```

💡 **Tip**: Choose "y" when prompted to clean up Cloud Storage to minimize costs.

## 🔧 Troubleshooting

### **Common Issues:**

1. **"Permission denied" errors**
   ```bash
   # Re-authenticate
   firebase login --reauth
   gcloud auth login
   ```

2. **"Project not found" errors**
   ```bash
   # Check your .firebaserc file
   cat .firebaserc
   
   # List available projects
   firebase projects:list
   ```

## 📚 Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firestore Export/Import Guide](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Google Cloud Firestore Export](https://cloud.google.com/firestore/docs/manage-data/export-import)
