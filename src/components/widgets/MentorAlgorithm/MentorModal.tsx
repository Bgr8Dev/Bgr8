import React, { useEffect, useState } from 'react';
import { MentorMenteeProfile } from './algorithm/matchUsers';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';

interface MentorModalProps {
  open: boolean;
  onClose: () => void;
  user: MentorMenteeProfile | null;
  editMode?: boolean;
  onSave?: (updatedUser: MentorMenteeProfile) => void;
}

const MentorModal: React.FC<MentorModalProps> = ({ open, onClose, user, editMode = false, onSave }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<MentorMenteeProfile | null>(user);

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
    setEditUser((prev: MentorMenteeProfile | null) => prev ? { ...prev, [name]: value } : null);
  };

  const handleArrayChange = (field: string, idx: number, value: string) => {
    setEditUser((prev: MentorMenteeProfile | null) => {
      if (!prev) return null;
      const arr = [...(prev[field as keyof MentorMenteeProfile] as string[] || [])];
      arr[idx] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayField = (field: string) => {
    setEditUser((prev: MentorMenteeProfile | null) => {
      if (!prev) return null;
      const currentArray = prev[field as keyof MentorMenteeProfile] as string[] || [];
      return { ...prev, [field]: [...currentArray, ''] };
    });
  };

  const removeArrayField = (field: string, idx: number) => {
    setEditUser((prev: MentorMenteeProfile | null) => {
      if (!prev) return null;
      const arr = [...(prev[field as keyof MentorMenteeProfile] as string[] || [])];
      arr.splice(idx, 1);
      return { ...prev, [field]: arr.length ? arr : [''] };
    });
  };

  if (!open || !user) return null;

  return (
    <div className="mentor-modal-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={e => e.stopPropagation()}>
        <button className="mentor-modal-close" onClick={onClose}>&times;</button>
        <h2 className="mentor-modal-title">{user.firstName} {user.lastName} <span>({user.isMentor ? 'Mentor' : 'Mentee'})</span></h2>
        <div className="mentor-modal-section">
          <h3>Contact</h3>
          {editMode ? (
            <>
              <div><b>Email:</b> <input name="email" value={editUser?.email || ''} onChange={handleInputChange} /></div>
              <div><b>Phone:</b> <input name="phone" value={editUser?.phone || ''} onChange={handleInputChange} /></div>
              <div><b>County:</b> <input name="county" value={editUser?.county || ''} onChange={handleInputChange} /></div>
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
              <div><b>Degree:</b> <input name="degree" value={editUser?.degree || ''} onChange={handleInputChange} /></div>
              <div><b>Education Level:</b> 
                <select name="educationLevel" value={editUser?.educationLevel || ''} onChange={handleInputChange} className="mentor-modal-select">
                  <option value="">Select Education Level</option>
                  {ukEducationLevels
                    .filter(level => {
                      // For mentees, only show up to Bachelor's degree
                      if (user.isMentee) {
                        const menteeLevels = [
                          'GCSEs', 'A-Levels', 'BTEC', 'Foundation Degree', "Bachelor's Degree"
                        ];
                        return menteeLevels.includes(level);
                      }
                      // For mentors, show all levels
                      return true;
                    })
                    .map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                </select>
              </div>
              <div><b>{user.isMentee ? 'Desired Profession:' : 'Current Profession:'}</b> <input name="profession" value={editUser?.profession || ''} onChange={handleInputChange} /></div>
              <div><b>Past Professions:</b>
                {editUser?.pastProfessions && editUser.pastProfessions.map((prof: string, idx: number) => (
                  <div key={idx} className="mentor-modal-array-field">
                    <input value={prof} onChange={e => handleArrayChange('pastProfessions', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('pastProfessions', idx)} className="mentor-modal-remove-btn">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('pastProfessions')} className="mentor-modal-add-btn">+ Add</button>
              </div>
              <div><b>LinkedIn:</b> <input name="linkedin" value={editUser?.linkedin || ''} onChange={handleInputChange} /></div>
              {user.isMentor && (
                <div><b>Cal.com:</b> <input name="calCom" value={editUser?.calCom || ''} onChange={handleInputChange} /></div>
              )}
            </>
          ) : (
            <>
              <div><b>Degree:</b> <span className="field-value">{user.degree}</span></div>
              <div><b>Education Level:</b> <span className="field-value">{user.educationLevel}</span></div>
              <div><b>{user.isMentee ? 'Desired Profession:' : 'Current Profession:'}</b> <span className="field-value">{user.profession}</span></div>
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
              {user.isMentor && (
                <div><b>Cal.com:</b> <span className="field-value">{user.calCom ? (
                  <a
                    href={user.calCom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mentor-modal-calcom-btn"
                    title="Book a session"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Book Session
                  </a>
                ) : 'N/A'}</span></div>
              )}
            </>
          )}
        </div>
        <div className="mentor-modal-section">
          <h3>Skills & Interests</h3>
          {editMode ? (
            <>
              <div><b>Skills:</b>
                {editUser?.skills && editUser.skills.map((skill: string, idx: number) => (
                  <div key={idx} className="mentor-modal-array-field">
                    <input value={skill} onChange={e => handleArrayChange('skills', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('skills', idx)} className="mentor-modal-remove-btn">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('skills')} className="mentor-modal-add-btn">+ Add</button>
              </div>
              <div><b>Looking For:</b>
                {editUser?.lookingFor && editUser.lookingFor.map((skill: string, idx: number) => (
                  <div key={idx} className="mentor-modal-array-field">
                    <input value={skill} onChange={e => handleArrayChange('lookingFor', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('lookingFor', idx)} className="mentor-modal-remove-btn">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('lookingFor')} className="mentor-modal-add-btn">+ Add</button>
              </div>
              <div><b>Hobbies:</b>
                {editUser?.hobbies && editUser.hobbies.map((hobby: string, idx: number) => (
                  <div key={idx} className="mentor-modal-array-field">
                    <input value={hobby} onChange={e => handleArrayChange('hobbies', idx, e.target.value)} />
                    <button type="button" onClick={() => removeArrayField('hobbies', idx)} className="mentor-modal-remove-btn">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('hobbies')} className="mentor-modal-add-btn">+ Add</button>
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
              <div><b>Ethnicity:</b> 
                <select name="ethnicity" value={editUser?.ethnicity || ''} onChange={handleInputChange} className="mentor-modal-select">
                  <option value="">Select Ethnicity</option>
                  {ethnicityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div><b>Religion:</b> 
                <select name="religion" value={editUser?.religion || ''} onChange={handleInputChange} className="mentor-modal-select">
                  <option value="">Select Religion</option>
                  {religionOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div><b>Ethnicity:</b> <span className="field-value">{user.ethnicity || 'N/A'}</span></div>
              <div><b>Religion:</b> <span className="field-value">{user.religion || 'N/A'}</span></div>
            </>
          )}
        </div>
        {editMode && (
          <div className="mentor-modal-actions">
            <button className="mentor-profile-save-btn" onClick={() => onSave && editUser && onSave(editUser)}>Save</button>
            <button className="mentor-profile-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorModal;
