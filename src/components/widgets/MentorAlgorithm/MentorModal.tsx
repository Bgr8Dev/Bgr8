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
        </div>
        <div className="mentor-modal-section">
          <h3>Education & Professional</h3>
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
        </div>
        <div className="mentor-modal-section">
          <h3>Skills & Interests</h3>
          <div><b>Skills:</b> <span className="field-value">{user.skills && user.skills.length > 0 ? user.skills.join(', ') : 'N/A'}</span></div>
          <div><b>Looking For:</b> <span className="field-value">{user.lookingFor && user.lookingFor.length > 0 ? user.lookingFor.join(', ') : 'N/A'}</span></div>
          <div><b>Hobbies:</b> <span className="field-value">{user.hobbies && user.hobbies.length > 0 ? user.hobbies.join(', ') : 'N/A'}</span></div>
        </div>
        <div className="mentor-modal-section">
          <h3>Additional Information</h3>
          <div><b>Ethnicity:</b> <span className="field-value">{user.ethnicity || 'N/A'}</span></div>
          <div><b>Religion:</b> <span className="field-value">{user.religion || 'N/A'}</span></div>
        </div>
      </div>
    </div>
  );
};

export default MentorModal;
