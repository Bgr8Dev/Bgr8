import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import './MentorProgram.css';

interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  day: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp | Date;
  sessionDate?: Timestamp | Date;
}

export default function MentorBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'bookings'), where('mentorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const results: Booking[] = [];
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data() as Booking;
          results.push({ ...data, id: docSnap.id });
        });
        setBookings(results);
      } catch (err) {
        setError('Failed to fetch bookings.');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [currentUser]);

  return (
    <div className="mentor-bookings">
      <h3>Your Bookings</h3>
      {loading && <div className="mentor-bookings-loading">Loading bookings...</div>}
      {error && <div className="mentor-bookings-error">{error}</div>}
      {!loading && bookings.length === 0 && <div className="mentor-bookings-empty">No bookings yet.</div>}
      {!loading && bookings.length > 0 && (
        <table className="mentor-bookings-table">
          <thead>
            <tr>
              <th>Mentee</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.menteeName}</td>
                <td>{booking.sessionDate ? (booking.sessionDate instanceof Timestamp ? booking.sessionDate.toDate().toLocaleDateString('en-GB') : new Date(booking.sessionDate).toLocaleDateString('en-GB')) : '-'}</td>
                <td>{booking.startTime} - {booking.endTime}</td>
                <td style={{ textTransform: 'capitalize' }}>{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 