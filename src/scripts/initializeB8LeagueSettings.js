import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Initializes the B8 League settings in Firestore
 * Sets up default visibility settings for all sections if they don't already exist
 */
export const initializeB8LeagueSettings = async () => {
  try {
    console.log('Checking for B8 League settings...');
    
    // Reference to the B8 League settings document
    const settingsRef = doc(db, 'settings', 'b8League');
    
    // Check if settings document already exists
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      console.log('No B8 League settings found. Creating default settings...');
      
      // Default settings - all sections visible by default
      const defaultSettings = {
        showHero: true,
        showSportNavigation: true,
        showFootball: true,
        showBadminton: true,
        showEsports: true,
        showTournaments: true,
        showTournamentCreator: true,
        showContact: true,
        youtubeLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default YouTube link
        lastUpdated: new Date()
      };
      
      // Create the settings document with default values
      await setDoc(settingsRef, defaultSettings);
      
      console.log('B8 League settings initialized successfully!');
      return defaultSettings;
    } else {
      console.log('B8 League settings already exist.');
      
      // Get existing settings
      const existingSettings = settingsDoc.data();
      
      // Check if any new settings need to be added (for backward compatibility)
      const requiredSettings = [
        'showHero', 
        'showSportNavigation', 
        'showFootball', 
        'showBadminton', 
        'showEsports', 
        'showTournaments', 
        'showTournamentCreator', 
        'showContact'
      ];
      
      // Check if youtubeLink exists, add it if not
      if (!('youtubeLink' in existingSettings)) {
        requiredSettings.push('youtubeLink');
      }
      
      let needsUpdate = false;
      const updatedSettings = { ...existingSettings };
      
      // Add any missing settings with default value of true
      for (const setting of requiredSettings) {
        if (!(setting in existingSettings)) {
          console.log(`Adding missing setting: ${setting}`);
          // Set default value based on setting type
          if (setting === 'youtubeLink') {
            updatedSettings[setting] = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
          } else {
            updatedSettings[setting] = true;
          }
          needsUpdate = true;
        }
      }
      
      // Update the document if any settings were missing
      if (needsUpdate) {
        updatedSettings.lastUpdated = new Date();
        await setDoc(settingsRef, updatedSettings);
        console.log('B8 League settings updated with missing fields.');
        return updatedSettings;
      }
      
      return existingSettings;
    }
  } catch (error) {
    console.error('Error initializing B8 League settings:', error);
    throw error;
  }
};

// Only run the initialization in a browser environment if this script is executed directly
if (typeof window !== 'undefined') {
  initializeB8LeagueSettings();
} 