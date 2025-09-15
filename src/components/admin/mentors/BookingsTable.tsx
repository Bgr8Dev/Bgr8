import React, { useState, useMemo } from 'react';
import { Booking, ExtendedBooking } from '../../../types/bookings';

interface BookingsTableProps {
  bookings: ExtendedBooking[];
  onView: (booking: Booking) => void;
}

// Type guard for Firestore Timestamp
function isFirestoreTimestamp(obj: unknown): obj is { toDate: () => Date } {
  return typeof obj === 'object' && obj !== null && 'toDate' in obj && typeof (obj as { toDate?: () => Date }).toDate === 'function';
}

function exportToCSV(bookings: 
  Booking[]) {
  const header = ['Mentor Name', 'Mentor Email', 'Mentee Name', 'Mentee Email', 'Date', 'Time', 'Status'];
  const rows = bookings.map(b => [
    b.mentorName,
    b.mentorEmail,
    b.menteeName,
    b.menteeEmail,
    b.sessionDate ? (isFirestoreTimestamp(b.sessionDate) ? b.sessionDate.toDate().toLocaleDateString('en-GB') : new Date(b.sessionDate).toLocaleDateString('en-GB')) : '-',
    `${b.startTime} - ${b.endTime}`,
    b.status
  ]);
  const csv = [header, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bookings.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BookingsTable({ bookings, onView }: BookingsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'mentor' | 'mentee' | 'date' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!b.mentorName.toLowerCase().includes(s) && !b.menteeName.toLowerCase().includes(s) && !b.mentorEmail.toLowerCase().includes(s) && !b.menteeEmail.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [bookings, search, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let vA: string | Date | undefined, vB: string | Date | undefined;
      if (sortField === 'mentor') {
        vA = a.mentorName.toLowerCase(); vB = b.mentorName.toLowerCase();
      } else if (sortField === 'mentee') {
        vA = a.menteeName.toLowerCase(); vB = b.menteeName.toLowerCase();
      } else if (sortField === 'date') {
        vA = isFirestoreTimestamp(a.sessionDate) ? a.sessionDate.toDate() : new Date(a.sessionDate || '');
        vB = isFirestoreTimestamp(b.sessionDate) ? b.sessionDate.toDate() : new Date(b.sessionDate || '');
      } else if (sortField === 'status') {
        vA = a.status; vB = b.status;
      }
      if (vA === undefined || vB === undefined) return 0;
      if (typeof vA === 'string' && typeof vB === 'string') {
        return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      if (vA instanceof Date && vB instanceof Date) {
        return sortDir === 'asc' ? vA.getTime() - vB.getTime() : vB.getTime() - vA.getTime();
      }
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: 15, minWidth: 180 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => exportToCSV(sorted)} style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Export CSV</button>
      </div>
      <table className="admin-bookings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th onClick={() => { setSortField('mentor'); setSortDir(sortField === 'mentor' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Mentor {sortField === 'mentor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th>Mentor Email</th>
            <th onClick={() => { setSortField('mentee'); setSortDir(sortField === 'mentee' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Mentee {sortField === 'mentee' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th>Mentee Email</th>
            <th onClick={() => { setSortField('date'); setSortDir(sortField === 'date' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Date {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th>Time</th>
            <th onClick={() => { setSortField('status'); setSortDir(sortField === 'status' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Status {sortField === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(booking => (
            <tr key={booking.id} style={{ transition: 'background 0.18s', cursor: 'pointer' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,179,0,0.08)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
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
              <td>{booking.mentorEmail}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{booking.menteeName}</span>
                  {booking.isGeneratedMentee && (
                    <span style={{ background: '#667eea', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }} title="Generated Mentee">🎲</span>
                  )}
                </div>
              </td>
              <td>{booking.menteeEmail}</td>
              <td>{booking.sessionDate ? (typeof booking.sessionDate === 'object' && 'toDate' in booking.sessionDate ? (booking.sessionDate as { toDate: () => Date }).toDate().toLocaleDateString('en-GB') : new Date(booking.sessionDate).toLocaleDateString('en-GB')) : '-'}</td>
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
      {sorted.length === 0 && <div style={{ marginTop: 24, color: '#ffb300', textAlign: 'center' }}>No bookings found.</div>}
    </div>
  );
} 