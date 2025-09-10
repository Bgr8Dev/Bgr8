import React, { useState } from 'react';
import { Booking } from '../../types/bookings';

// Extend the Booking interface to include generated properties
interface ExtendedBooking extends Booking {
  isGeneratedMentor?: boolean;
  isGeneratedMentee?: boolean;
}

interface BookingsGroupedProps {
  bookings: ExtendedBooking[];
  groupBy: 'mentor' | 'mentee';
  onView: (booking: ExtendedBooking) => void;
}

export default function BookingsGrouped({ bookings, groupBy, onView }: BookingsGroupedProps) {
  // Group bookings by mentor or mentee
  const groups = bookings.reduce((acc, booking) => {
    const key = groupBy === 'mentor' ? booking.mentorName : booking.menteeName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, ExtendedBooking[]>);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="admin-bookings-grouped">
      {Object.entries(groups).map(([key, groupBookings]) => (
        <div key={key} style={{ marginBottom: 24, background: 'rgba(40,0,0,0.15)', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 700, fontSize: 18, marginBottom: 8 }} onClick={() => toggleGroup(key)}>
            <span style={{ marginRight: 12 }}>{openGroups[key] ? '▼' : '▶'}</span>
            {groupBy === 'mentor' ? 'Mentor: ' : 'Mentee: '} {key} <span style={{ color: '#ffb300', marginLeft: 10, fontSize: 14 }}>({groupBookings.length} bookings)</span>
          </div>
          {openGroups[key] && (
            <table style={{ width: '100%', background: 'rgba(24,24,24,0.95)', borderRadius: 8 }}>
              <thead>
                <tr>
                  {groupBy === 'mentor' ? null : <th>Mentor</th>}
                  {groupBy === 'mentee' ? null : <th>Mentee</th>}
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupBookings.map(booking => (
                  <tr key={booking.id}>
                    {groupBy === 'mentor' ? null : (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{booking.mentorName}</span>
                          {booking.isCalComBooking && (
                            <span style={{ background: '#00eaff', color: '#181818', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>Cal.com</span>
                          )}
                          {booking.isGeneratedMentor && (
                            <span style={{ background: '#667eea', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }} title="Generated Mentor">🎲</span>
                          )}
                        </div>
                      </td>
                    )}
                    {groupBy === 'mentee' ? null : (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{booking.menteeName}</span>
                          {booking.isGeneratedMentee && (
                            <span style={{ background: '#667eea', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }} title="Generated Mentee">🎲</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td>{booking.sessionDate ? (booking.sessionDate instanceof Date ? booking.sessionDate.toLocaleDateString('en-GB') : (typeof booking.sessionDate === 'string' ? new Date(booking.sessionDate).toLocaleDateString('en-GB') : booking.sessionDate.toDate().toLocaleDateString('en-GB'))) : '-'}</td>
                    <td>{booking.startTime} - {booking.endTime}</td>
                    <td>
                      <span style={{
                        background: booking.status === 'confirmed' ? '#00e676' : booking.status === 'pending' ? '#ffb300' : '#ff4444',
                        color: '#181818',
                        borderRadius: 6,
                        padding: '2px 10px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}>{booking.status.toUpperCase()}</span>
                    </td>
                    <td>
                      <button onClick={() => onView(booking)} style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
} 