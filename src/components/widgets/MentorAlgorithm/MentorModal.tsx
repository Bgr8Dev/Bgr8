import React, { useEffect, useState } from 'react';

interface MentorModalProps {
  open: boolean;
  onClose: () => void;
  user: any | null;
  editMode?: boolean;
  onSave?: (updatedUser: any) => void;
}

const MentorModal: React.FC<MentorModalProps> = ({ open, onClose, user, editMode = false, onSave }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any | null>(user);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (editMode && user) setEditUser(user);
  }, [editMode, user]);

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditUser((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: string, idx: number, value: string) => {
    setEditUser((prev: any) => {
      const arr = [...(prev[field] || [])];
      arr[idx] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayField = (field: string) => {
    setEditUser((prev: any) => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayField = (field: string, idx: number) => {
    setEditUser((prev: any) => {
      const arr = [...(prev[field] || [])];
      arr.splice(idx, 1);
      return { ...prev, [field]: arr.length ? arr : [''] };
    });
  };

  if (!open || !user) return null;

  return (
    <div className="mentor-modal-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={e => e.stopPropagation()}>
        <button className="mentor-modal-close" onClick={onClose}>&times;</button>
        <h2 className="mentor-modal-title">{user.name} <span>({user.type})</span></h2>
        <div className="mentor-modal-section">
          <h3>Contact</h3>
          {editMode ? (
            <>
              <div><b>Email:</b> <input name="email" value={editUser.email} onChange={handleInputChange} /></div>
              <div><b>Phone:</b> <input name="phone" value={editUser.phone} onChange={handleInputChange} /></div>
              <div><b>County:</b> <input name="county" value={editUser.county} onChange={handleInputChange} /></div>
            </>
          ) : (
            <>
              <div
                className="copyable-field"
                tabIndex={0}
                onClick={() => handleCopy(user.email, 'email')}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCopy(user.email, 'email'); }}
                title="Click to copy email"
              >
                <b>Email:</b> <span className="field-value">{user.email}</span>
                <button
                  className="copy-btn"
                  onClick={e => { e.stopPropagation(); handleCopy(user.email, 'email'); }}
                  title="Copy email"
                  type="button"
                >📋</button>
                {copiedField === 'email' && <span className="copied-feedback">Copied!</span>}
              </div>
              <div
                className="copyable-field"
                tabIndex={0}
                onClick={() => handleCopy(user.phone, 'phone')}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCopy(user.phone, 'phone'); }}
                title="Click to copy phone"
              >
                <b>Phone:</b> <span className="field-value">{user.phone}</span>
                <button
                  className="copy-btn"
                  onClick={e => { e.stopPropagation(); handleCopy(user.phone, 'phone'); }}
                  title="Copy phone"
                  type="button"
                >📋</button>
                {copiedField === 'phone' && <span className="copied-feedback">Copied!</span>}
              </div>
              <div><b>County:</b> <span className="field-value">{user.county}</span></div>
            </>
          )}
        </div>
        <div className="mentor-modal-section">
          <h3>Education & Professional</h3>
          {editMode ? (
            <>
              <div><b>Degree:</b> <input name="degree" value={editUser.degree} onChange={handleInputChange} /></div>
              <div><b>Education Level:</b> <input name="educationLevel" value={editUser.educationLevel} onChange={handleInputChange} /></div>
              <div><b>Current Profession:</b> <input name="currentProfession" value={editUser.currentProfession} onChange={handleInputChange} /></div>
              <div><b>Past Professions:</b>
                {editUser.pastProfessions && editUser.pastProfessions.map((prof: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input value={prof} onChange={e => handleArrayChange('pastProfessions', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('pastProfessions', idx)} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('pastProfessions')} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>+ Add</button>
              </div>
              <div><b>LinkedIn:</b> <input name="linkedin" value={editUser.linkedin} onChange={handleInputChange} /></div>
            </>
          ) : (
            <>
              <div><b>Degree:</b> <span className="field-value">{user.degree}</span></div>
              <div><b>Education Level:</b> <span className="field-value">{user.educationLevel}</span></div>
              <div><b>Current Profession:</b> <span className="field-value">{user.currentProfession}</span></div>
              <div><b>Past Professions:</b> <span className="field-value">{user.pastProfessions && user.pastProfessions.length > 0 ? user.pastProfessions.join(', ') : 'N/A'}</span></div>
              <div><b>LinkedIn:</b> <span className="field-value">{user.linkedin ? (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mentor-modal-linkedin-btn"
                  title="View LinkedIn Profile"
                >
                  <span className="linkedin-icon" aria-hidden="true">&#xe80c;</span>
                  View Profile
                </a>
              ) : 'N/A'}</span></div>
            </>
          )}
        </div>
        <div className="mentor-modal-section">
          <h3>Skills & Interests</h3>
          {editMode ? (
            <>
              <div><b>Skills:</b>
                {editUser.skills && editUser.skills.map((skill: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input value={skill} onChange={e => handleArrayChange('skills', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('skills', idx)} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('skills')} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>+ Add</button>
              </div>
              <div><b>Looking For:</b>
                {editUser.lookingFor && editUser.lookingFor.map((skill: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input value={skill} onChange={e => handleArrayChange('lookingFor', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('lookingFor', idx)} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('lookingFor')} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>+ Add</button>
              </div>
              <div><b>Hobbies:</b>
                {editUser.hobbies && editUser.hobbies.map((hobby: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input value={hobby} onChange={e => handleArrayChange('hobbies', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('hobbies', idx)} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('hobbies')} style={{ color: '#ff2a2a', background: 'none', border: 'none', fontSize: 18 }}>+ Add</button>
              </div>
            </>
          ) : (
            <>
              <div><b>Skills:</b> <span className="field-value">{user.skills && user.skills.length > 0 ? user.skills.join(', ') : 'N/A'}</span></div>
              <div><b>Looking For:</b> <span className="field-value">{user.lookingFor && user.lookingFor.length > 0 ? user.lookingFor.join(', ') : 'N/A'}</span></div>
              <div><b>Hobbies:</b> <span className="field-value">{user.hobbies && user.hobbies.length > 0 ? user.hobbies.join(', ') : 'N/A'}</span></div>
            </>
          )}
        </div>
        <div className="mentor-modal-section">
          <h3>Additional Information</h3>
          {editMode ? (
            <>
              <div><b>Ethnicity:</b> <input name="ethnicity" value={editUser.ethnicity} onChange={handleInputChange} /></div>
              <div><b>Religion:</b> <input name="religion" value={editUser.religion} onChange={handleInputChange} /></div>
            </>
          ) : (
            <>
              <div><b>Ethnicity:</b> <span className="field-value">{user.ethnicity || 'N/A'}</span></div>
              <div><b>Religion:</b> <span className="field-value">{user.religion || 'N/A'}</span></div>
            </>
          )}
        </div>
        {editMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button className="mentor-profile-save-btn" onClick={() => onSave && onSave(editUser)} style={{ minWidth: 90 }}>Save</button>
            <button className="mentor-profile-cancel-btn" onClick={onClose} style={{ minWidth: 90 }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorModal;
