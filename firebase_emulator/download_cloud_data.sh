#!/bin/bash

# Firebase Production Data Export Script
# This script exports data from Firebase and downloads it locally

FIREBASERC_PATH=".firebaserc"

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Firebase Data Export Script${NC}"
echo -e "${BLUE}============================${NC}"

# Get available Firebase projects from .firebaserc
if [ -f "$FIREBASERC_PATH" ]; then
    echo -e "${CYAN}Available Firebase environments:${NC}"
    grep -o '"[^"]*":[[:space:]]*"[^"]*"' $FIREBASERC_PATH | sed 's/"//g' | sed 's/:/: /' | nl -w2 -s'. '
    echo
    read -p "Enter environment name (e.g., prod, dev): " ENV_NAME
else
    echo -e "${RED}Error: .firebaserc not found in current directory${NC}"
    exit 1
fi

# Validate environment exists
PROJECT_ID=$(grep -o "\"$ENV_NAME\":[[:space:]]*\"[^\"]*\"" $FIREBASERC_PATH | cut -d'"' -f4)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Environment '$ENV_NAME' not found in .firebaserc${NC}"
    exit 1
fi

echo -e "${GREEN}Selected: $ENV_NAME -> $PROJECT_ID${NC}"

# Configuration
BUCKET_NAME="${PROJECT_ID}.appspot.com"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FOLDER="exports/${TIMESTAMP}"
LOCAL_DATA_DIR="./data"

echo -e "${PURPLE}Configuration:${NC}"
echo -e "  ${CYAN}Project:${NC} $PROJECT_ID"
echo -e "  ${CYAN}Bucket:${NC} $BUCKET_NAME"
echo -e "  ${CYAN}Timestamp:${NC} $TIMESTAMP"
echo -e "  ${CYAN}Local Dir:${NC} $LOCAL_DATA_DIR"
echo

# Step 1: Switch to selected project
echo -e "${YELLOW}Step 1: Switching to $ENV_NAME project...${NC}"
firebase use $ENV_NAME
echo -e "${GREEN}Switched to $ENV_NAME project${NC}"
echo

# Step 2: Export Firestore data
echo -e "${YELLOW}Step 2: Exporting Firestore data...${NC}"
echo -e "Destination: ${CYAN}gs://${BUCKET_NAME}/${EXPORT_FOLDER}${NC}"
gcloud firestore export "gs://${BUCKET_NAME}/${EXPORT_FOLDER}" --project=${PROJECT_ID}
echo -e "${GREEN}Firestore data exported successfully${NC}"
echo

# Step 3: Create local directory
echo -e "${YELLOW}Step 3: Creating local directories...${NC}"
mkdir -p ${LOCAL_DATA_DIR}/${TIMESTAMP}/
echo -e "${GREEN}Local directories created: ${CYAN}${LOCAL_DATA_DIR}/${TIMESTAMP}${NC}"
echo

# Step 4: Download Firestore data
echo -e "${YELLOW}Step 4: Downloading Firestore data...${NC}"
echo -e "From: ${CYAN}gs://${BUCKET_NAME}/${EXPORT_FOLDER}${NC}"
echo -e "To: ${CYAN}${LOCAL_DATA_DIR}/${TIMESTAMP}/firestore${NC}"
gsutil -m cp -r "gs://${BUCKET_NAME}/${EXPORT_FOLDER}" "${LOCAL_DATA_DIR}/"
echo -e "${GREEN}Firestore data downloaded successfully${NC}"
echo

# Step 6: Cleanup option
echo -e "${YELLOW}Step 6: Cleanup option${NC}"
read -p "Delete export from Cloud Storage to save costs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gsutil -m rm -r "gs://${BUCKET_NAME}/${EXPORT_FOLDER}"
    echo -e "${GREEN}Cloud Storage cleaned up${NC}"
else
    echo -e "${BLUE}Export kept in Cloud Storage${NC}"
    echo -e "${YELLOW}Note: This will incur small monthly storage costs${NC}"
fi
echo

# Summary
echo -e "${GREEN}Export completed successfully!${NC}"
echo -e "${GREEN}============================${NC}"
echo -e "${PURPLE}Exported from:${NC} $PROJECT_ID"
echo -e "${PURPLE}Downloaded to:${NC} ${CYAN}${LOCAL_DATA_DIR}/${TIMESTAMP}${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  ${GREEN}Start emulators:${NC} firebase emulators:start --import=${LOCAL_DATA_DIR}/${TIMESTAMP}"
echo
