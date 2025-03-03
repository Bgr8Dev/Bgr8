import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserCheck, FaDollarSign, FaChartLine, FaCog, FaDownload, FaEnvelope, FaEdit, FaSave, FaCheck, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';
import '../../styles/adminStyles/AdminPortalB8World.css';
import { db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface AdminPortalB8WorldProps {
  stats: { totalMembers: number; activeMembers: number; revenue: number; engagement: number };
}

// Define interfaces for editable data
interface Initiative {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'pending';
  participants: number;
  lastUpdated: string;
  description?: string;
}

interface Donation {
  id: string;
  donor: string;
  amount: number;
  initiative: string;
  date: string;
  message?: string;
}

interface Partner {
  id: string;
  organization: string;
  partnershipType: string;
  status: 'active' | 'pending' | 'inactive';
  startDate: string;
  contactPerson?: string;
  email?: string;
}

export function AdminPortalB8World({ stats: initialStats }: AdminPortalB8WorldProps) {
  // State for stats
  const [stats, setStats] = useState(initialStats);
  
  // State for editable sections
  const [editMode, setEditMode] = useState<{
    stats: boolean;
    initiative: string | null;
    donation: string | null;
    partner: string | null;
  }>({
    stats: false,
    initiative: null,
    donation: null,
    partner: null
  });
  
  // State for saving status
  const [saving, setSaving] = useState<string>('');
  
  // State for success/error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Initialize editable data
  const [initiatives, setInitiatives] = useState<Initiative[]>([
    { id: '1', name: 'Clean Water Project', status: 'active', participants: 125, lastUpdated: 'Yesterday', description: 'Providing clean water to communities in need.' },
    { id: '2', name: 'Education Fund', status: 'active', participants: 87, lastUpdated: '3 days ago', description: 'Supporting education initiatives in underserved areas.' },
    { id: '3', name: 'Wildlife Conservation', status: 'planning', participants: 42, lastUpdated: '1 week ago', description: 'Protecting endangered species and their habitats.' }
  ]);
  
  const [donations, setDonations] = useState<Donation[]>([
    { id: '1', donor: 'Anonymous', amount: 150, initiative: 'Clean Water Project', date: 'Today', message: 'Keep up the great work!' },
    { id: '2', donor: 'John D.', amount: 75, initiative: 'Education Fund', date: 'Yesterday', message: 'Happy to support education.' },
    { id: '3', donor: 'Sarah M.', amount: 200, initiative: 'Wildlife Conservation', date: '3 days ago', message: 'For the animals!' }
  ]);
  
  const [partners, setPartners] = useState<Partner[]>([
    { id: '1', organization: 'Global Water Alliance', partnershipType: 'Program', status: 'active', startDate: 'Jan 2023', contactPerson: 'Michael Brown', email: 'mbrown@gwa.org' },
    { id: '2', organization: 'Education First', partnershipType: 'Sponsorship', status: 'active', startDate: 'Mar 2023', contactPerson: 'Jessica Taylor', email: 'jtaylor@edfirst.com' },
    { id: '3', organization: 'Wildlife Trust', partnershipType: 'Program', status: 'pending', startDate: 'N/A', contactPerson: 'Robert Wilson', email: 'rwilson@wildlife.org' }
  ]);

  // Load data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'settings', 'b8World');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.stats) setStats(data.stats);
          if (data.initiatives) setInitiatives(data.initiatives);
          if (data.donations) setDonations(data.donations);
          if (data.partners) setPartners(data.partners);
        }
      } catch (error) {
        console.error('Error fetching B8 World data:', error);
        setErrorMessage('Error loading data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle edit mode for a section
  const toggleEditMode = (section: keyof typeof editMode, id: string | null = null) => {
    setEditMode({
      ...editMode,
      [section]: id === editMode[section] ? null : id
    });
  };
  
  // Save functions for each section
  const saveStats = async () => {
    try {
      setSaving('stats');
      setSuccessMessage('');
      setErrorMessage('');
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        stats: stats
      });
      
      setSuccessMessage('Stats updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setEditMode({...editMode, stats: false});
    } catch (error) {
      console.error('Error saving stats:', error);
      setErrorMessage('Error saving stats: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  const saveInitiative = async (initiative: Initiative) => {
    try {
      setSaving(`initiative-${initiative.id}`);
      setSuccessMessage('');
      setErrorMessage('');
      
      const updatedInitiatives = initiatives.map(i => 
        i.id === initiative.id ? initiative : i
      );
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        initiatives: updatedInitiatives
      });
      
      setInitiatives(updatedInitiatives);
      setSuccessMessage('Initiative updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setEditMode({...editMode, initiative: null});
    } catch (error) {
      console.error('Error saving initiative:', error);
      setErrorMessage('Error saving initiative: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  const saveDonation = async (donation: Donation) => {
    try {
      setSaving(`donation-${donation.id}`);
      setSuccessMessage('');
      setErrorMessage('');
      
      const updatedDonations = donations.map(d => 
        d.id === donation.id ? donation : d
      );
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        donations: updatedDonations
      });
      
      setDonations(updatedDonations);
      setSuccessMessage('Donation updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setEditMode({...editMode, donation: null});
    } catch (error) {
      console.error('Error saving donation:', error);
      setErrorMessage('Error saving donation: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  const savePartner = async (partner: Partner) => {
    try {
      setSaving(`partner-${partner.id}`);
      setSuccessMessage('');
      setErrorMessage('');
      
      const updatedPartners = partners.map(p => 
        p.id === partner.id ? partner : p
      );
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        partners: updatedPartners
      });
      
      setPartners(updatedPartners);
      setSuccessMessage('Partner updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setEditMode({...editMode, partner: null});
    } catch (error) {
      console.error('Error saving partner:', error);
      setErrorMessage('Error saving partner: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  // Add new items
  const addInitiative = () => {
    const newInitiative: Initiative = {
      id: Date.now().toString(),
      name: 'New Initiative',
      status: 'planning',
      participants: 0,
      lastUpdated: new Date().toLocaleDateString(),
      description: 'Description of the new initiative'
    };
    
    setInitiatives([...initiatives, newInitiative]);
    setEditMode({...editMode, initiative: newInitiative.id});
  };
  
  const addDonation = () => {
    const newDonation: Donation = {
      id: Date.now().toString(),
      donor: 'New Donor',
      amount: 0,
      initiative: initiatives[0]?.name || 'General Fund',
      date: new Date().toLocaleDateString(),
      message: 'Thank you for your support!'
    };
    
    setDonations([...donations, newDonation]);
    setEditMode({...editMode, donation: newDonation.id});
  };
  
  const addPartner = () => {
    const newPartner: Partner = {
      id: Date.now().toString(),
      organization: 'New Partner Organization',
      partnershipType: 'Program',
      status: 'pending',
      startDate: 'TBD',
      contactPerson: 'Contact Name',
      email: 'contact@example.com'
    };
    
    setPartners([...partners, newPartner]);
    setEditMode({...editMode, partner: newPartner.id});
  };
  
  // Remove items
  const removeInitiative = async (id: string) => {
    try {
      setSaving(`remove-initiative-${id}`);
      const updatedInitiatives = initiatives.filter(i => i.id !== id);
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        initiatives: updatedInitiatives
      });
      
      setInitiatives(updatedInitiatives);
      setSuccessMessage('Initiative removed successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error removing initiative:', error);
      setErrorMessage('Error removing initiative: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  const removeDonation = async (id: string) => {
    try {
      setSaving(`remove-donation-${id}`);
      const updatedDonations = donations.filter(d => d.id !== id);
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        donations: updatedDonations
      });
      
      setDonations(updatedDonations);
      setSuccessMessage('Donation removed successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error removing donation:', error);
      setErrorMessage('Error removing donation: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  const removePartner = async (id: string) => {
    try {
      setSaving(`remove-partner-${id}`);
      const updatedPartners = partners.filter(p => p.id !== id);
      
      await updateDoc(doc(db, 'settings', 'b8World'), {
        partners: updatedPartners
      });
      
      setPartners(updatedPartners);
      setSuccessMessage('Partner removed successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error removing partner:', error);
      setErrorMessage('Error removing partner: ' + (error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
    }
  };
  
  // Handle form changes
  const handleStatsChange = (field: keyof typeof stats, value: string | number) => {
    setStats({
      ...stats,
      [field]: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value
    });
  };
  
  const updateInitiative = (id: string, field: keyof Initiative, value: string | number) => {
    setInitiatives(initiatives.map(initiative => {
      if (initiative.id === id) {
        if (field === 'participants') {
          return { ...initiative, [field]: Number(value) };
        } else if (field === 'status') {
          return { ...initiative, [field]: value as 'active' | 'planning' | 'pending' };
        }
        return { ...initiative, [field]: value };
      }
      return initiative;
    }));
  };
  
  const updateDonation = (id: string, field: keyof Donation, value: string | number) => {
    setDonations(donations.map(donation => {
      if (donation.id === id) {
        if (field === 'amount') {
          return { ...donation, [field]: Number(value) };
        }
        return { ...donation, [field]: value };
      }
      return donation;
    }));
  };
  
  const updatePartner = (id: string, field: keyof Partner, value: string) => {
    setPartners(partners.map(partner => {
      if (partner.id === id) {
        if (field === 'status') {
          return { ...partner, [field]: value as 'active' | 'pending' | 'inactive' };
        }
        return { ...partner, [field]: value };
      }
      return partner;
    }));
  };
  
  return (
    <div className="admin-portal-page">
      <h2>B8 World Admin Panel</h2>
      
      {/* Stats Section */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Total Participants</h3>
          {editMode.stats ? (
            <input 
              type="number" 
              className="edit-input"
              value={stats.totalMembers}
              onChange={(e) => handleStatsChange('totalMembers', e.target.value)}
            />
          ) : (
            <p className="stat-value">{stats.totalMembers}</p>
          )}
          <FaUsers size={24} color="#9C27B0" />
        </div>
        <div className="admin-stat-card">
          <h3>Active Participants</h3>
          {editMode.stats ? (
            <input 
              type="number" 
              className="edit-input"
              value={stats.activeMembers}
              onChange={(e) => handleStatsChange('activeMembers', e.target.value)}
            />
          ) : (
            <p className="stat-value">{stats.activeMembers}</p>
          )}
          <FaUserCheck size={24} color="#9C27B0" />
        </div>
        <div className="admin-stat-card">
          <h3>Donations Received</h3>
          {editMode.stats ? (
            <input 
              type="number" 
              className="edit-input"
              value={stats.revenue}
              onChange={(e) => handleStatsChange('revenue', e.target.value)}
            />
          ) : (
            <p className="stat-value">${stats.revenue}</p>
          )}
          <FaDollarSign size={24} color="#9C27B0" />
        </div>
        <div className="admin-stat-card">
          <h3>Engagement Rate</h3>
          {editMode.stats ? (
            <input 
              type="number" 
              className="edit-input"
              value={stats.engagement}
              onChange={(e) => handleStatsChange('engagement', e.target.value)}
            />
          ) : (
            <p className="stat-value">{stats.engagement}%</p>
          )}
          <FaChartLine size={24} color="#9C27B0" />
        </div>
      </div>
      
      <div className="stats-actions">
        <button 
          className="action-button"
          onClick={() => setEditMode({...editMode, stats: !editMode.stats})}
        >
          {editMode.stats ? 'Cancel' : 'Edit Stats'}
        </button>
        
        {editMode.stats && (
          <button 
            className="action-button save"
            onClick={saveStats}
            disabled={saving === 'stats'}
          >
            {saving === 'stats' ? <FaSpinner className="spinner" /> : <FaSave />}
            {saving === 'stats' ? 'Saving...' : 'Save Stats'}
          </button>
        )}
      </div>

      <div className="admin-actions">
        <h3>Administrative Actions</h3>
        <div className="admin-action-buttons">
          <button className="admin-action-button">
            <FaCog /> Configure B8 World
          </button>
          <button className="admin-action-button">
            <FaDownload /> Export Participant Data
          </button>
          <button className="admin-action-button">
            <FaEnvelope /> Message All Participants
          </button>
        </div>
      </div>

      {/* Initiatives Section */}
      <div className="world-admin-section">
        <div className="section-header">
          <h3>World Initiatives</h3>
          <button className="add-button" onClick={addInitiative}>
            <FaPlus /> Add Initiative
          </button>
        </div>
        
        <div className="world-admin-grid">
          {initiatives.map((initiative) => (
            <div className="world-admin-card" key={initiative.id}>
              <div className="world-admin-header">
                <h4>{initiative.name}</h4>
                <div className={`status-badge status-${initiative.status}`}>
                  {initiative.status.charAt(0).toUpperCase() + initiative.status.slice(1)}
                </div>
              </div>
              
              {editMode.initiative === initiative.id ? (
                <div className="world-admin-edit-form">
                  <div className="form-group">
                    <label>Name:</label>
                    <input 
                      type="text" 
                      value={initiative.name}
                      onChange={(e) => updateInitiative(initiative.id, 'name', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Status:</label>
                    <select 
                      value={initiative.status}
                      onChange={(e) => updateInitiative(initiative.id, 'status', e.target.value)}
                      className="edit-select"
                    >
                      <option value="active">Active</option>
                      <option value="planning">Planning</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Participants:</label>
                    <input 
                      type="number" 
                      value={initiative.participants}
                      onChange={(e) => updateInitiative(initiative.id, 'participants', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Last Updated:</label>
                    <input 
                      type="text" 
                      value={initiative.lastUpdated}
                      onChange={(e) => updateInitiative(initiative.id, 'lastUpdated', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea 
                      value={initiative.description || ''}
                      onChange={(e) => updateInitiative(initiative.id, 'description', e.target.value)}
                      className="edit-textarea"
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      className="action-button cancel"
                      onClick={() => toggleEditMode('initiative', null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="action-button save"
                      onClick={() => saveInitiative(initiative)}
                      disabled={saving === `initiative-${initiative.id}`}
                    >
                      {saving === `initiative-${initiative.id}` ? <FaSpinner className="spinner" /> : <FaSave />}
                      {saving === `initiative-${initiative.id}` ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="world-admin-content">
                    <div className="content-row">
                      <strong>Participants:</strong>
                      <span>{initiative.participants}</span>
                    </div>
                    <div className="content-row">
                      <strong>Last Updated:</strong>
                      <span>{initiative.lastUpdated}</span>
                    </div>
                    {initiative.description && (
                      <p className="description">{initiative.description}</p>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="action-button"
                      onClick={() => toggleEditMode('initiative', initiative.id)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => removeInitiative(initiative.id)}
                      disabled={saving === `remove-initiative-${initiative.id}`}
                    >
                      {saving === `remove-initiative-${initiative.id}` ? <FaSpinner className="spinner" /> : <FaTrash />}
                      {saving === `remove-initiative-${initiative.id}` ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Donations Section */}
      <div className="world-admin-section">
        <div className="section-header">
          <h3>Recent Donations</h3>
          <button className="add-button" onClick={addDonation}>
            <FaPlus /> Add Donation
          </button>
        </div>
        
        <div className="world-admin-grid">
          {donations.map((donation) => (
            <div className="world-admin-card" key={donation.id}>
              <div className="world-admin-header">
                <h4>{donation.donor}</h4>
                <div className="donation-amount">${donation.amount}</div>
              </div>
              
              {editMode.donation === donation.id ? (
                <div className="world-admin-edit-form">
                  <div className="form-group">
                    <label>Donor:</label>
                    <input 
                      type="text" 
                      value={donation.donor}
                      onChange={(e) => updateDonation(donation.id, 'donor', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Amount:</label>
                    <input 
                      type="number" 
                      value={donation.amount}
                      onChange={(e) => updateDonation(donation.id, 'amount', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Initiative:</label>
                    <input 
                      type="text" 
                      value={donation.initiative}
                      onChange={(e) => updateDonation(donation.id, 'initiative', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date:</label>
                    <input 
                      type="text" 
                      value={donation.date}
                      onChange={(e) => updateDonation(donation.id, 'date', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Message:</label>
                    <textarea 
                      value={donation.message || ''}
                      onChange={(e) => updateDonation(donation.id, 'message', e.target.value)}
                      className="edit-textarea"
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      className="action-button cancel"
                      onClick={() => toggleEditMode('donation', null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="action-button save"
                      onClick={() => saveDonation(donation)}
                      disabled={saving === `donation-${donation.id}`}
                    >
                      {saving === `donation-${donation.id}` ? <FaSpinner className="spinner" /> : <FaSave />}
                      {saving === `donation-${donation.id}` ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="world-admin-content">
                    <div className="content-row">
                      <strong>Initiative:</strong>
                      <span>{donation.initiative}</span>
                    </div>
                    <div className="content-row">
                      <strong>Date:</strong>
                      <span>{donation.date}</span>
                    </div>
                    {donation.message && (
                      <p className="message">"{donation.message}"</p>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="action-button"
                      onClick={() => toggleEditMode('donation', donation.id)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => removeDonation(donation.id)}
                      disabled={saving === `remove-donation-${donation.id}`}
                    >
                      {saving === `remove-donation-${donation.id}` ? <FaSpinner className="spinner" /> : <FaTrash />}
                      {saving === `remove-donation-${donation.id}` ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Partners Section */}
      <div className="world-admin-section">
        <div className="section-header">
          <h3>World Partners</h3>
          <button className="add-button" onClick={addPartner}>
            <FaPlus /> Add Partner
          </button>
        </div>
        
        <div className="world-admin-grid">
          {partners.map((partner) => (
            <div className="world-admin-card" key={partner.id}>
              <div className="world-admin-header">
                <h4>{partner.organization}</h4>
                <div className={`status-badge status-${partner.status}`}>
                  {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                </div>
              </div>
              
              {editMode.partner === partner.id ? (
                <div className="world-admin-edit-form">
                  <div className="form-group">
                    <label>Organization:</label>
                    <input 
                      type="text" 
                      value={partner.organization}
                      onChange={(e) => updatePartner(partner.id, 'organization', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Partnership Type:</label>
                    <input 
                      type="text" 
                      value={partner.partnershipType}
                      onChange={(e) => updatePartner(partner.id, 'partnershipType', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Status:</label>
                    <select 
                      value={partner.status}
                      onChange={(e) => updatePartner(partner.id, 'status', e.target.value)}
                      className="edit-select"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Start Date:</label>
                    <input 
                      type="text" 
                      value={partner.startDate}
                      onChange={(e) => updatePartner(partner.id, 'startDate', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Contact Person:</label>
                    <input 
                      type="text" 
                      value={partner.contactPerson || ''}
                      onChange={(e) => updatePartner(partner.id, 'contactPerson', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email:</label>
                    <input 
                      type="email" 
                      value={partner.email || ''}
                      onChange={(e) => updatePartner(partner.id, 'email', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      className="action-button cancel"
                      onClick={() => toggleEditMode('partner', null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="action-button save"
                      onClick={() => savePartner(partner)}
                      disabled={saving === `partner-${partner.id}`}
                    >
                      {saving === `partner-${partner.id}` ? <FaSpinner className="spinner" /> : <FaSave />}
                      {saving === `partner-${partner.id}` ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="world-admin-content">
                    <div className="content-row">
                      <strong>Partnership Type:</strong>
                      <span>{partner.partnershipType}</span>
                    </div>
                    <div className="content-row">
                      <strong>Start Date:</strong>
                      <span>{partner.startDate}</span>
                    </div>
                    {partner.contactPerson && (
                      <div className="content-row">
                        <strong>Contact:</strong>
                        <span>{partner.contactPerson}</span>
                      </div>
                    )}
                    {partner.email && (
                      <div className="content-row">
                        <strong>Email:</strong>
                        <a href={`mailto:${partner.email}`}>{partner.email}</a>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="action-button"
                      onClick={() => toggleEditMode('partner', partner.id)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => removePartner(partner.id)}
                      disabled={saving === `remove-partner-${partner.id}`}
                    >
                      {saving === `remove-partner-${partner.id}` ? <FaSpinner className="spinner" /> : <FaTrash />}
                      {saving === `remove-partner-${partner.id}` ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="settings-success-message">
          <FaCheck />
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="settings-error-message">
          <FaTrash />
          {errorMessage}
        </div>
      )}
    </div>
  );
} 