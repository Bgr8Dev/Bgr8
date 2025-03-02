import { FaGraduationCap, FaChalkboardTeacher, FaBook, FaUserGraduate } from 'react-icons/fa';

interface AdminPortalBgr8rProps {
  stats?: {
    totalMembers: number;
    activeMembers: number;
    revenue: number;
    engagement: number;
  };
}

export function AdminPortalBgr8r({ stats }: AdminPortalBgr8rProps) {
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

  return (
    <div className="admin-business-portal">
      <h2><FaGraduationCap /> Bgr8r Administration</h2>
      
      <div className="business-stats-cards">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{stats?.totalMembers || 240}</p>
        </div>
        <div className="stat-card">
          <h3>Active Courses</h3>
          <p>{stats?.activeMembers || 16}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue (Monthly)</h3>
          <p>${stats?.revenue || 14500}</p>
        </div>
        <div className="stat-card">
          <h3>Student Engagement</h3>
          <p>{stats?.engagement || 78}%</p>
        </div>
      </div>
      
      <div className="education-programs-section">
        <h3><FaBook /> Current Education Programs</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Program Name</th>
              <th>Students</th>
              <th>Teachers</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {educationPrograms.map((program, index) => (
              <tr key={index}>
                <td>{program.name}</td>
                <td>{program.students}</td>
                <td>{program.teachers}</td>
                <td>{program.revenue}</td>
                <td>
                  <span className={`status-badge ${program.status.toLowerCase()}`}>
                    {program.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn edit">Edit</button>
                  <button className="action-btn view">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="admin-actions-grid">
        <div className="admin-action-card">
          <FaChalkboardTeacher className="action-icon" />
          <h4>Manage Teachers</h4>
          <p>Add, remove, or update teacher profiles and assignments</p>
          <button className="admin-action-btn">Manage</button>
        </div>
        
        <div className="admin-action-card">
          <FaUserGraduate className="action-icon" />
          <h4>Student Enrollments</h4>
          <p>View and manage student enrollments and course progress</p>
          <button className="admin-action-btn">Manage</button>
        </div>
        
        <div className="admin-action-card">
          <FaBook className="action-icon" />
          <h4>Course Materials</h4>
          <p>Update course content, assignments, and resources</p>
          <button className="admin-action-btn">Manage</button>
        </div>
        
        <div className="admin-action-card">
          <FaGraduationCap className="action-icon" />
          <h4>New Programs</h4>
          <p>Create and set up new education programs</p>
          <button className="admin-action-btn">Create</button>
        </div>
      </div>
    </div>
  );
} 