import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { MentorMenteeProfile } from '../widgets/MentorAlgorithm/matchUsers';
import GenerateRandomProfile from './GenerateRandomProfile';
import { FaSync } from 'react-icons/fa';
import MentorModal from '../widgets/MentorAlgorithm/MentorModal';
import '../../styles/adminStyles/MentorManagement.css';

interface MentorMenteeProfileWithId extends MentorMenteeProfile {
  id: string;
}

export default function MentorManagement() {
  const [users, setUsers] = useState<MentorMenteeProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.type === filter;
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profession.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div className="mentor-management-loading">Loading users...</div>;
  }

  if (error) {
    return <div className="mentor-management-error">{error}</div>;
  }

  return (
    <div className="mentor-management">
      <div className="mentor-management-header">
        <h2>Mentor Program Management</h2>
        <div className="mentor-management-controls">
          <div className="mentor-management-search">
            <input
              type="text"
              placeholder="Search by name, email, or profession..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Mentors</h3>
          <p>{users.filter(u => u.type === 'mentor').length}</p>
        </div>
        <div className="stat-card">
          <h3>Mentees</h3>
          <p>{users.filter(u => u.type === 'mentee').length}</p>
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
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Profession</th>
              <th>Education</th>
              <th>County</th>
              <th>Skills</th>
              <th>Looking For</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
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
    </div>
  );
} 