import { FaGraduationCap, FaChalkboardTeacher, FaBook, FaUserGraduate, FaPlus, FaEdit, FaTrash, FaEye, FaDollarSign, FaUsers, FaUserCheck } from 'react-icons/fa';
import '../../styles/adminStyles/AdminPortalBgr8r.css';
import { useState } from 'react';

interface AdminPortalBgr8rProps {
  stats?: {
    totalMembers: number;
    activeMembers: number;
    revenue: number;
    engagement: number;
  };
}

export function AdminPortalBgr8r({ stats }: AdminPortalBgr8rProps) {
  const [loading] = useState(false);
  
  const educationPrograms = [
    {
      name: 'Basic Learning',
      students: 120,
      teachers: 8,
      revenue: '$4,500',
      status: 'Active'
    },
    {
      name: 'Advanced Courses',
      students: 75,
      teachers: 5,
      revenue: '$6,200',
      status: 'Active'
    },
    {
      name: 'Professional Development',
      students: 45,
      teachers: 3,
      revenue: '$3,800',
      status: 'Pending'
    }
  ];

  const handleAddProgram = () => {
    // Implementation for adding a new program
    console.log('Add new program');
  };

  if (loading) {
    return (
      <div className="bgr8r-admin-container">
        <div className="bgr8r-loading">
          <FaGraduationCap className="bgr8r-spinner" />
          <p>Loading education programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bgr8r-admin-container">
      <div className="bgr8r-admin-header">
        <h2>Bgr8r Education</h2>
        <div className="bgr8r-admin-actions">
          <button className="primary" onClick={handleAddProgram}>
            <FaPlus /> Add Program
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bgr8r-stats-grid">
        <div className="bgr8r-stat-card">
          <FaUserGraduate className="bgr8r-stat-icon" />
          <p className="bgr8r-stat-value">{stats?.totalMembers || 240}</p>
          <p className="bgr8r-stat-label">Total Students</p>
        </div>
        <div className="bgr8r-stat-card">
          <FaChalkboardTeacher className="bgr8r-stat-icon" />
          <p className="bgr8r-stat-value">{stats?.activeMembers || 16}</p>
          <p className="bgr8r-stat-label">Teachers</p>
        </div>
        <div className="bgr8r-stat-card">
          <FaDollarSign className="bgr8r-stat-icon" />
          <p className="bgr8r-stat-value">${stats?.revenue || 14500}</p>
          <p className="bgr8r-stat-label">Revenue</p>
        </div>
        <div className="bgr8r-stat-card">
          <FaUsers className="bgr8r-stat-icon" />
          <p className="bgr8r-stat-value">{stats?.engagement || 85}%</p>
          <p className="bgr8r-stat-label">Engagement</p>
        </div>
      </div>

      {/* Programs Section */}
      <div className="bgr8r-programs-section">
        <div className="bgr8r-section-header">
          <h3 className="bgr8r-section-title">
            <FaBook /> Education Programs
          </h3>
        </div>

        <div className="bgr8r-programs-grid">
          {educationPrograms.map((program, index) => (
            <div key={index} className="bgr8r-program-card">
              <div className="bgr8r-program-header">
                <h4 className="bgr8r-program-name">{program.name}</h4>
              </div>
              <div className="bgr8r-program-content">
                <div className="bgr8r-program-stats">
                  <div className="bgr8r-program-stat">
                    <span className="bgr8r-program-stat-label">Students</span>
                    <p className="bgr8r-program-stat-value">
                      <FaUserGraduate /> {program.students}
                    </p>
                  </div>
                  <div className="bgr8r-program-stat">
                    <span className="bgr8r-program-stat-label">Teachers</span>
                    <p className="bgr8r-program-stat-value">
                      <FaChalkboardTeacher /> {program.teachers}
                    </p>
                  </div>
                  <div className="bgr8r-program-stat">
                    <span className="bgr8r-program-stat-label">Revenue</span>
                    <p className="bgr8r-program-stat-value">
                      <FaDollarSign /> {program.revenue}
                    </p>
                  </div>
                  <div className="bgr8r-program-stat">
                    <span className="bgr8r-program-stat-label">Status</span>
                    <p className="bgr8r-program-stat-value">
                      <FaUserCheck /> {program.status}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bgr8r-program-footer">
                <span className={`bgr8r-program-status ${program.status.toLowerCase()}`}>
                  {program.status}
                </span>
                <div className="bgr8r-program-actions">
                  <button title="View Details">
                    <FaEye />
                  </button>
                  <button title="Edit Program">
                    <FaEdit />
                  </button>
                  <button title="Delete Program">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 