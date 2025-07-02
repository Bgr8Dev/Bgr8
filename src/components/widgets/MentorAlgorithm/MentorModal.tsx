import React, { useEffect, useState } from 'react';

interface MentorModalProps {
  open: boolean;
  onClose: () => void;
  user: any | null;
}

const MentorModal: React.FC<MentorModalProps> = ({ open, onClose, user }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  if (!open || !user) return null;

  return (
    <div className="mentor-modal-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={e => e.stopPropagation()}>
        <button className="mentor-modal-close" onClick={onClose}>&times;</button>
        <h2 className="mentor-modal-title">{user.name} <span>({user.type})</span></h2>
        <div className="mentor-modal-section">
          <h3>Contact</h3>
          <div>
            <b>Email:</b> {user.email}
            <button
              className="copy-btn"
              onClick={() => handleCopy(user.email, 'email')}
              title="Copy email"
              type="button"
            >📋</button>
            {copiedField === 'email' && <span className="copied-feedback">Copied!</span>}
          </div>
          <div>
            <b>Phone:</b> {user.phone}
            <button
              className="copy-btn"
              onClick={() => handleCopy(user.phone, 'phone')}
              title="Copy phone"
              type="button"
            >📋</button>
            {copiedField === 'phone' && <span className="copied-feedback">Copied!</span>}
          </div>
          <div><b>County:</b> {user.county}</div>
        </div>
        <div className="mentor-modal-section">
          <h3>Education & Professional</h3>
          <div><b>Degree:</b> {user.degree}</div>
          <div><b>Education Level:</b> {user.educationLevel}</div>
          <div><b>Current Profession:</b> {user.currentProfession}</div>
          <div><b>Past Professions:</b> {user.pastProfessions && user.pastProfessions.length > 0 ? user.pastProfessions.join(', ') : 'N/A'}</div>
          <div><b>LinkedIn:</b> {user.linkedin ? <a href={user.linkedin} target="_blank" rel="noopener noreferrer">View Profile</a> : 'N/A'}</div>
        </div>
        <div className="mentor-modal-section">
          <h3>Skills & Interests</h3>
          <div><b>Skills:</b> {user.skills && user.skills.length > 0 ? user.skills.join(', ') : 'N/A'}</div>
          <div><b>Looking For:</b> {user.lookingFor && user.lookingFor.length > 0 ? user.lookingFor.join(', ') : 'N/A'}</div>
          <div><b>Hobbies:</b> {user.hobbies && user.hobbies.length > 0 ? user.hobbies.join(', ') : 'N/A'}</div>
        </div>
        <div className="mentor-modal-section">
          <h3>Additional Information</h3>
          <div><b>Ethnicity:</b> {user.ethnicity || 'N/A'}</div>
          <div><b>Religion:</b> {user.religion || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

export default MentorModal;
