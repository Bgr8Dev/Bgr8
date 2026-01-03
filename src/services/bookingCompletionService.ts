/**
 * Booking Completion Service
 * 
 * Automatically tracks and marks bookings/sessions as completed
 * when their scheduled end time has passed.
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { loggers } from '../utils/logger';

export class BookingCompletionService {
  private static readonly BOOKINGS_COLLECTION = 'bookings';
  private static readonly SESSIONS_COLLECTION = 'sessions';
  
  /**
   * Check and mark bookings as completed if their end time has passed
   * This should be called periodically or when bookings are loaded
   */
  static async checkAndMarkCompletedBookings(): Promise<{
    bookingsUpdated: number;
    sessionsUpdated: number;
  }> {
    try {
      const now = new Date();
      loggers.booking.log('🔄 Checking for completed bookings...', { currentTime: now.toISOString() });
      
      // Get all confirmed bookings that haven't been marked as completed
      const bookingsQuery = query(
        collection(firestore, this.BOOKINGS_COLLECTION),
        where('status', '==', 'confirmed')
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      loggers.booking.log(`📊 Found ${bookingsSnapshot.docs.length} confirmed bookings to check`);
      
      const batch = writeBatch(firestore);
      let bookingsUpdated = 0;
      let sessionsUpdated = 0;
      
      for (const bookingDoc of bookingsSnapshot.docs) {
        const bookingData = bookingDoc.data();
        
        // Determine the end time of the booking
        let endTime: Date | null = null;
        
        // Try to get end time from sessionEndTime (most accurate)
        if (bookingData.sessionEndTime) {
          if (bookingData.sessionEndTime.toDate && typeof bookingData.sessionEndTime.toDate === 'function') {
            endTime = bookingData.sessionEndTime.toDate();
          } else if (bookingData.sessionEndTime instanceof Timestamp) {
            endTime = bookingData.sessionEndTime.toDate();
          } else if (bookingData.sessionEndTime.seconds) {
            endTime = new Date(bookingData.sessionEndTime.seconds * 1000);
          }
        }
        // Fallback to calculating from sessionDate + endTime string
        else if (bookingData.sessionDate && bookingData.endTime) {
          try {
            let sessionDate: Date | null = null;
            
            if (bookingData.sessionDate.toDate && typeof bookingData.sessionDate.toDate === 'function') {
              sessionDate = bookingData.sessionDate.toDate();
            } else if (bookingData.sessionDate instanceof Timestamp) {
              sessionDate = bookingData.sessionDate.toDate();
            } else if (bookingData.sessionDate.seconds) {
              sessionDate = new Date(bookingData.sessionDate.seconds * 1000);
            } else if (bookingData.day) {
              sessionDate = new Date(bookingData.day);
            }
            
            if (sessionDate && bookingData.endTime) {
              // Parse endTime string (e.g., "11:15" or "11:15:00")
              const [hours, minutes] = bookingData.endTime.split(':').map(Number);
              endTime = new Date(sessionDate);
              endTime.setHours(hours, minutes || 0, 0, 0);
            }
          } catch (error) {
            loggers.booking.warn(`Error calculating end time for booking ${bookingDoc.id}:`, error);
          }
        }
        
        // If we have an end time and it's in the past, mark as completed
        if (endTime && endTime < now) {
          loggers.booking.log(`✅ Marking booking ${bookingDoc.id} as completed (ended at ${endTime.toISOString()})`);
          
          // Update booking status
          const bookingRef = doc(firestore, this.BOOKINGS_COLLECTION, bookingDoc.id);
          batch.update(bookingRef, {
            status: 'completed',
            completedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          bookingsUpdated++;
          
          // Also update corresponding session if it exists
          try {
            const sessionsQuery = query(
              collection(firestore, this.SESSIONS_COLLECTION),
              where('bookingId', '==', bookingDoc.id)
            );
            const sessionsSnapshot = await getDocs(sessionsQuery);
            
            sessionsSnapshot.docs.forEach(sessionDoc => {
              const sessionData = sessionDoc.data();
              // Only update if session is still scheduled
              if (sessionData.status === 'scheduled') {
                const sessionRef = doc(firestore, this.SESSIONS_COLLECTION, sessionDoc.id);
                batch.update(sessionRef, {
                  status: 'completed',
                  updatedAt: Timestamp.now()
                });
                sessionsUpdated++;
                loggers.booking.log(`✅ Marking session ${sessionDoc.id} as completed`);
              }
            });
          } catch (sessionError) {
            loggers.booking.warn(`Error updating session for booking ${bookingDoc.id}:`, sessionError);
          }
        }
      }
      
      // Commit all updates in a single batch
      if (bookingsUpdated > 0 || sessionsUpdated > 0) {
        await batch.commit();
        loggers.booking.log(`✅ Completed booking check: ${bookingsUpdated} bookings and ${sessionsUpdated} sessions marked as completed`);
      } else {
        loggers.booking.log('ℹ️ No bookings needed to be marked as completed');
      }
      
      return { bookingsUpdated, sessionsUpdated };
    } catch (error) {
      loggers.booking.error('Error checking completed bookings:', error);
      return { bookingsUpdated: 0, sessionsUpdated: 0 };
    }
  }
  
  /**
   * Check a specific booking and mark it as completed if needed
   * Useful for checking individual bookings when they're loaded
   */
  static async checkBookingCompletion(bookingId: string): Promise<boolean> {
    try {
      const bookingRef = doc(firestore, this.BOOKINGS_COLLECTION, bookingId);
      
      // Try to get the booking document directly
      const allBookings = await getDocs(collection(firestore, this.BOOKINGS_COLLECTION));
      const found = allBookings.docs.find(d => d.id === bookingId);
      
      if (!found) {
        loggers.booking.warn(`Booking ${bookingId} not found`);
        return false;
      }
      
      const bookingData = found.data();
      
      // Skip if already completed or cancelled
      if (bookingData.status === 'completed' || bookingData.status === 'cancelled') {
        return false;
      }
      
      const now = new Date();
      let endTime: Date | null = null;
      
      // Get end time (same logic as above)
      if (bookingData.sessionEndTime) {
        if (bookingData.sessionEndTime.toDate && typeof bookingData.sessionEndTime.toDate === 'function') {
          endTime = bookingData.sessionEndTime.toDate();
        } else if (bookingData.sessionEndTime instanceof Timestamp) {
          endTime = bookingData.sessionEndTime.toDate();
        } else if (bookingData.sessionEndTime.seconds) {
          endTime = new Date(bookingData.sessionEndTime.seconds * 1000);
        }
      } else if (bookingData.sessionDate && bookingData.endTime) {
        try {
          let sessionDate: Date | null = null;
          
          if (bookingData.sessionDate.toDate && typeof bookingData.sessionDate.toDate === 'function') {
            sessionDate = bookingData.sessionDate.toDate();
          } else if (bookingData.sessionDate instanceof Timestamp) {
            sessionDate = bookingData.sessionDate.toDate();
          } else if (bookingData.sessionDate.seconds) {
            sessionDate = new Date(bookingData.sessionDate.seconds * 1000);
          } else if (bookingData.day) {
            sessionDate = new Date(bookingData.day);
          }
          
          if (sessionDate && bookingData.endTime) {
            const [hours, minutes] = bookingData.endTime.split(':').map(Number);
            endTime = new Date(sessionDate);
            endTime.setHours(hours, minutes || 0, 0, 0);
          }
        } catch (error) {
          loggers.booking.warn(`Error calculating end time:`, error);
        }
      }
      
      if (endTime && endTime < now) {
        await updateDoc(bookingRef, {
          status: 'completed',
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        // Update corresponding session
        try {
          const sessionsQuery = query(
            collection(firestore, this.SESSIONS_COLLECTION),
            where('bookingId', '==', bookingId)
          );
          const sessionsSnapshot = await getDocs(sessionsQuery);
          
          for (const sessionDoc of sessionsSnapshot.docs) {
            const sessionData = sessionDoc.data();
            if (sessionData.status === 'scheduled') {
              const sessionRef = doc(firestore, this.SESSIONS_COLLECTION, sessionDoc.id);
              await updateDoc(sessionRef, {
                status: 'completed',
                updatedAt: Timestamp.now()
              });
            }
          }
        } catch (sessionError) {
          loggers.booking.warn(`Error updating session:`, sessionError);
        }
        
        loggers.booking.log(`✅ Booking ${bookingId} marked as completed`);
        return true;
      }
      
      return false;
    } catch (error) {
      loggers.booking.error(`Error checking booking completion for ${bookingId}:`, error);
      return false;
    }
  }
  
  /**
   * Initialize automatic completion checking
   * Call this when the app loads or dashboard opens
   */
  static initializeAutoCompletion(): void {
    // Check immediately
    this.checkAndMarkCompletedBookings();
    
    // Then check every 5 minutes
    setInterval(() => {
      this.checkAndMarkCompletedBookings();
    }, 5 * 60 * 1000); // 5 minutes
    
    loggers.booking.log('🔄 Auto-completion checking initialized (checks every 5 minutes)');
  }
}

