import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { MentorMenteeProfile } from '../widgets/MentorAlgorithm/matchUsers';
import GenerateRandomProfile from './GenerateRandomProfile';
import { FaSync } from 'react-icons/fa';
import MentorModal from '../widgets/MentorAlgorithm/MentorModal';
import '../../styles/adminStyles/MentorManagement.css';
import BookingsTable from './BookingsTable';
import BookingDetailsModal from './BookingDetailsModal';
import BookingsGrouped from './BookingsGrouped';

// Add Booking interface for admin view
interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  mentorEmail: string;
  menteeEmail: string;
  day: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date | string | number;
  sessionDate?: Date | string | number;
  meetLink?: string;
  eventId?: string;
}

interface MentorMenteeProfileWithId extends MentorMenteeProfile {
  id: string;
}

export default function MentorManagement() {
  const [users, setUsers] = useState<MentorMenteeProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<'users' | 'bookings'>('users');
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  // Bookings view mode
  const [bookingsView, setBookingsView] = useState<'table' | 'grouped'>('table');
  const [groupBy, setGroupBy] = useState<'mentor' | 'mentee'>('mentor');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add state for sorting and searching
  const [userSortField, setUserSortField] = useState<'name' | 'type' | 'email' | 'profession' | 'education' | 'county'>('name');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('asc');
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [userGeneratedFilter, setUserGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');

  // Stat tile hover state
  const [hoveredTile, setHoveredTile] = useState<'total' | 'mentors' | 'mentees' | null>(null);

  // Calculate counts
  const realUsers = users.filter(u => !u.isGenerated);
  const generatedUsers = users.filter(u => u.isGenerated);
  const realMentors = realUsers.filter(u => u.type === 'mentor');
  const generatedMentors = generatedUsers.filter(u => u.type === 'mentor');
  const realMentees = realUsers.filter(u => u.type === 'mentee');
  const generatedMentees = generatedUsers.filter(u => u.type === 'mentee');

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'mentorProgram'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data() as MentorMenteeProfile,
        id: doc.id
      }));
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Only fetch bookings when tab is switched to 'bookings'
  const fetchBookings = async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Booking[];
      setBookings(bookingsData);
    } catch {
      setBookingsError('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Only fetch bookings when tab is switched to 'bookings'
  useEffect(() => {
    if (tab === 'bookings') {
      fetchBookings();
    }
  }, [tab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = async (user: MentorMenteeProfileWithId) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${user.name} (${user.type})? This cannot be undone.`);
    if (!confirmed) return;
    setDeleteStatus(null);
    try {
      await deleteDoc(doc(db, 'mentorProgram', user.id));
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteStatus(`Deleted ${user.name} successfully.`);
    } catch {
      setDeleteStatus('Failed to delete user.');
    }
  };

  const handleEditUser = (user: MentorMenteeProfileWithId) => {
    setEditUser(user);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedUser: MentorMenteeProfileWithId) => {
    setDeleteStatus(null);
    try {
      // Update Firestore
      await setDoc(doc(db, 'mentorProgram', updatedUser.id), updatedUser);
      // Update local state
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditModalOpen(false);
      setEditUser(null);
      setDeleteStatus(`Updated ${updatedUser.name} successfully.`);
    } catch {
      setDeleteStatus('Failed to update user.');
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected user(s)? This cannot be undone.`);
    if (!confirmed) return;
    setDeleteStatus(null);
    try {
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'mentorProgram', id))));
      setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      setDeleteStatus(`Deleted ${selectedIds.length} user(s) successfully.`);
    } catch {
      setDeleteStatus('Failed to delete selected users.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;
      const matchesGenerated = userGeneratedFilter === 'all' || 
        (userGeneratedFilter === 'generated' && user.isGenerated) ||
        (userGeneratedFilter === 'real' && !user.isGenerated);
      const s = userSearch.toLowerCase();
      const matchesSearch =
        s === '' ||
        (user.name?.toLowerCase() ?? '').includes(s) ||
        (user.email?.toLowerCase() ?? '').includes(s) ||
        (user.profession?.toLowerCase() ?? '').includes(s);
      return matchesType && matchesGenerated && matchesSearch;
    });
  }, [users, userTypeFilter, userGeneratedFilter, userSearch]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let vA: string | undefined, vB: string | undefined;
      if (userSortField === 'name') {
        vA = a.name?.toLowerCase(); vB = b.name?.toLowerCase();
      } else if (userSortField === 'type') {
        vA = a.type; vB = b.type;
      } else if (userSortField === 'email') {
        vA = a.email?.toLowerCase(); vB = b.email?.toLowerCase();
      } else if (userSortField === 'profession') {
        vA = a.profession?.toLowerCase(); vB = b.profession?.toLowerCase();
      } else if (userSortField === 'education') {
        vA = a.educationLevel; vB = b.educationLevel;
      } else if (userSortField === 'county') {
        vA = a.county; vB = b.county;
      }
      if (vA === undefined || vB === undefined) return 0;
      return userSortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });
  }, [filteredUsers, userSortField, userSortDir]);

  // Admin action handlers
  const handleDeleteBooking = async (booking: Booking) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'bookings', booking.id));
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setDetailsModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateBookingStatus = async (booking: Booking, status: 'confirmed' | 'cancelled') => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), { status });
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b));
      setDetailsModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="mentor-management-loading">Loading users...</div>;
  }

  if (error) {
    return <div className="mentor-management-error">{error}</div>;
  }

  return (
    <div className="mentor-management">
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
        <button className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>Bookings</button>
      </div>
      {/* USERS TAB */}
      {tab === 'users' && (
        <>
          <div className="mentor-management-header">
            <h2>Mentor Program Management</h2>
            <div className="mentor-management-controls">
              {/* In the users tab, add search and filter controls above the table */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name, email, or profession..." style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: 15, minWidth: 180 }} />
                <select value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value as 'all' | 'mentor' | 'mentee')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
                  <option value="all">All Types</option>
                  <option value="mentor">Mentor</option>
                  <option value="mentee">Mentee</option>
                </select>
                <select value={userGeneratedFilter} onChange={e => setUserGeneratedFilter(e.target.value as 'all' | 'generated' | 'real')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
                  <option value="all">All Profiles</option>
                  <option value="real">Real Profiles</option>
                  <option value="generated">Generated Profiles</option>
                </select>
              </div>
              <div className="mentor-management-filters">
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={filter === 'mentor' ? 'active' : ''}
                  onClick={() => setFilter('mentor')}
                >
                  Mentors
                </button>
                <button
                  className={filter === 'mentee' ? 'active' : ''}
                  onClick={() => setFilter('mentee')}
                >
                  Mentees
                </button>
                <button
                  className="refresh-button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <FaSync className={refreshing ? 'spinning' : ''} /> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="mentor-management-stats">
            <div className="stat-card" onMouseEnter={() => setHoveredTile('total')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Total Users</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'total' ? ' stat-hidden' : ''}`}>
                  <p>{users.length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'total' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realUsers.length}</span>
                  <span className="stat-generated">Generated: {generatedUsers.length}</span>
                </div>
              </div>
            </div>
            <div className="stat-card" onMouseEnter={() => setHoveredTile('mentors')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Mentors</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'mentors' ? ' stat-hidden' : ''}`}>
                  <p>{users.filter(u => u.type === 'mentor').length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'mentors' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realMentors.length}</span>
                  <span className="stat-generated">Generated: {generatedMentors.length}</span>
                </div>
              </div>
            </div>
            <div className="stat-card" onMouseEnter={() => setHoveredTile('mentees')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Mentees</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'mentees' ? ' stat-hidden' : ''}`}>
                  <p>{users.filter(u => u.type === 'mentee').length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'mentees' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realMentees.length}</span>
                  <span className="stat-generated">Generated: {generatedMentees.length}</span>
                </div>
              </div>
            </div>
          </div>

          <GenerateRandomProfile />

          {deleteStatus && (
            <div className={deleteStatus.startsWith('Deleted') ? 'mentor-management-success' : 'mentor-management-error'} style={{ marginBottom: '1rem' }}>
              {deleteStatus}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#ff2a2a', fontWeight: 600 }}>{selectedIds.length} selected</span>
              <button className="delete-profile" onClick={handleBulkDelete} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a', fontWeight: 600 }}>
                Delete Selected
              </button>
            </div>
          )}

          <div className="mentor-management-table">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={handleSelectAll} /></th>
                  <th onClick={() => { setUserSortField('name'); setUserSortDir(userSortField === 'name' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Name {userSortField === 'name' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('type'); setUserSortDir(userSortField === 'type' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Type {userSortField === 'type' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('email'); setUserSortDir(userSortField === 'email' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Email {userSortField === 'email' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('profession'); setUserSortDir(userSortField === 'profession' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Profession {userSortField === 'profession' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('education'); setUserSortDir(userSortField === 'education' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Education {userSortField === 'education' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('county'); setUserSortDir(userSortField === 'county' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>County {userSortField === 'county' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th>Skills</th>
                  <th>Looking For</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}
                    style={user.isGenerated ? { background: 'rgba(0, 200, 255, 0.10)' } : {}}
                  >
                    <td><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelectRow(user.id)} /></td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-age">{user.age} years</span>
                      </div>
                    </td>
                    <td>
                      <span className={`user-type ${user.type}`}>
                        {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <div className="profession-info">
                        <span className="profession">{user.profession}</span>
                        {user.pastProfessions.length > 0 && (
                          <span className="past-professions">
                            {user.pastProfessions.length} past roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="education-info">
                        <span className="degree">{user.degree}</span>
                        <span className="education-level">{user.educationLevel}</span>
                      </div>
                    </td>
                    <td>{user.county}</td>
                    <td>
                      <div className="skills-list">
                        {user.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="more-skills">+{user.skills.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="looking-for-list">
                        {user.lookingFor.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {user.lookingFor.length > 3 && (
                          <span className="more-skills">+{user.lookingFor.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-profile" onClick={() => { setModalUser(user); setModalOpen(true); }}>View Profile</button>
                        <button className="edit-profile" onClick={() => handleEditUser(user)}>Edit</button>
                        <button className="delete-profile" onClick={() => handleDeleteUser(user)} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MentorModal open={modalOpen} onClose={() => setModalOpen(false)} user={modalUser} />
          <MentorModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditUser(null); }} user={editUser} editMode={true} onSave={handleSaveEdit} />
        </>
      )}
      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div>
          {/* Bookings View Mode Switch */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <button className={bookingsView === 'table' ? 'active' : ''} onClick={() => setBookingsView('table')}>Table View</button>
            <button className={bookingsView === 'grouped' ? 'active' : ''} onClick={() => setBookingsView('grouped')}>Grouped View</button>
            {bookingsView === 'grouped' && (
              <select value={groupBy} onChange={e => setGroupBy(e.target.value as 'mentor' | 'mentee')} style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 8 }}>
                <option value="mentor">Group by Mentor</option>
                <option value="mentee">Group by Mentee</option>
              </select>
            )}
          </div>
          {/* Bookings Content */}
          {loadingBookings ? (
            <div className="mentor-management-loading">Loading bookings...</div>
          ) : bookingsError ? (
            <div className="mentor-management-error">{bookingsError}</div>
          ) : bookingsView === 'table' ? (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <BookingsTable bookings={bookings} onView={booking => { setSelectedBooking(booking); setDetailsModalOpen(true); }} />
              <BookingDetailsModal booking={selectedBooking} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} onDelete={handleDeleteBooking} onUpdateStatus={handleUpdateBookingStatus} />
              {actionLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#222', color: '#fff', padding: '2rem 3rem', borderRadius: 12, fontSize: 20 }}>Processing...</div></div>}
            </div>
          ) : (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <BookingsGrouped bookings={bookings} groupBy={groupBy} onView={booking => { setSelectedBooking(booking); setDetailsModalOpen(true); }} />
              <BookingDetailsModal booking={selectedBooking} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} onDelete={handleDeleteBooking} onUpdateStatus={handleUpdateBookingStatus} />
              {actionLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#222', color: '#fff', padding: '2rem 3rem', borderRadius: 12, fontSize: 20 }}>Processing...</div></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 