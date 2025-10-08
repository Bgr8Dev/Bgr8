import React from 'react';
import { FaTimes, FaExternalLinkAlt, FaCalendarAlt } from 'react-icons/fa';
import { getName, MentorMenteeProfile } from '../algorithm/matchUsers';
import BannerWrapper from '../../../../components/ui/BannerWrapper';
import './CalComModal.css';

interface CalComModalProps {
  open: boolean;
  onClose: () => void;
  mentor: MentorMenteeProfile | null;
}

const CalComModal: React.FC<CalComModalProps> = ({ open, onClose, mentor }) => {
  if (!open || !mentor) return null;

  return (
    <BannerWrapper sectionId="calcom-integration" bannerType="element">
      <div className="calcom-modal-overlay" onClick={onClose}>
        <div className="calcom-modal" onClick={e => e.stopPropagation()}>
        <div className="calcom-modal-header">
          <h3>
            <FaCalendarAlt /> Book with {getName(mentor)}
          </h3>
          <button onClick={onClose} className="calcom-modal-close" title="Close Cal.com modal">
            <FaTimes />
          </button>
        </div>
        <div className="calcom-modal-content">
          {mentor.calCom ? (
            <>
              <div className="calcom-modal-intro">
                <p>
                  Book a session directly with <b>{getName(mentor)}</b> using their Cal.com calendar.
                </p>
                <a
                  href={mentor.calCom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calcom-modal-link"
                  title="Open Cal.com booking page"
                >
                  <FaExternalLinkAlt />
                  Open Cal.com Booking
                </a>
              </div>
              <div className="calcom-iframe-container">
                <iframe
                  src={mentor.calCom}
                  title="Cal.com Booking"
                  className="calcom-iframe"
                  allow="camera; microphone; fullscreen;"
                />
              </div>
            </>
          ) : (
            <div className="calcom-modal-error">
              This mentor does not have a Cal.com booking link set up.
            </div>
          )}
        </div>
        </div>
      </div>
    </BannerWrapper>
  );
};

export default CalComModal; 