/**
 * Utility to get users by role from Firestore
 */

import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { UserProfile } from './userProfile';
import { loggers } from './logger';

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(role: keyof UserProfile['roles']): Promise<UserProfile[]> {
  try {
    const usersRef = collection(firestore, 'users');
    
    // Firestore doesn't support nested field queries directly, so we need to query all users
    // and filter client-side. This is okay for small datasets, but for larger datasets,
    // consider using a different data structure (e.g., a roles subcollection)
    const querySnapshot = await getDocs(usersRef);
    
    const users: UserProfile[] = [];
    
    for (const userDoc of querySnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user has the specified role
      if (userData.roles && userData.roles[role] === true) {
        // Convert Firestore timestamps to Dates
        const user: UserProfile = {
          ...userData,
          uid: userDoc.id,
          dateCreated: userData.dateCreated?.toDate ? userData.dateCreated.toDate() : new Date(userData.dateCreated),
          lastUpdated: userData.lastUpdated?.toDate ? userData.lastUpdated.toDate() : new Date(userData.lastUpdated),
        } as UserProfile;
        
        users.push(user);
      }
    }
    
    loggers.info.log(`Found ${users.length} users with role: ${role}`);
    return users;
  } catch (error) {
    loggers.error.error(`Error getting users by role (${role}):`, error);
    return [];
  }
}

/**
 * Get all email addresses for users with a specific role
 */
export async function getEmailsByRole(role: keyof UserProfile['roles']): Promise<string[]> {
  const users = await getUsersByRole(role);
  return users
    .filter(user => user.email && user.email.trim() !== '')
    .map(user => user.email);
}

