import React from 'react';
import { FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { UserType, MENTOR, MENTEE } from '../types/mentorTypes';
import '../styles/RoleSelection.css';

interface RoleSelectionProps {
  onRoleSelect: (role: UserType) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  return (
    <div className="mentor-role-selection">
      <div className="role-cards">
        <div className="role-card mentor" onClick={() => onRoleSelect(MENTOR)}>
          <FaChalkboardTeacher size={48} />
          <h3>Become a Mentor</h3>
          <p>Share your expertise and help guide the next generation. List your skills and get matched with mentees looking for your knowledge.</p>
        </div>
        <div className="role-card mentee" onClick={() => onRoleSelect(MENTEE)}>
          <FaUserGraduate size={48} />
          <h3>Become a Mentee</h3>
          <p>Find a mentor to help you grow. Tell us what skills you're looking for and get matched with the right mentor for you.</p>
        </div>
      </div>
    </div>
  );
};
