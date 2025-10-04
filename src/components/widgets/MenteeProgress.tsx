import React, { useState } from 'react';
import { FaChartLine, FaBullseye, FaTrophy, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaPlus, FaEdit, FaEye } from 'react-icons/fa';
import BannerWrapper from '../ui/BannerWrapper';
import './MenteeProgress.css';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

const MOCK_GOALS: Goal[] = [
  {
    id: '1',
    title: 'Complete React Development Course',
    description: 'Finish the comprehensive React course and build a portfolio project',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-03-15',
    progress: 65,
    milestones: [
      { id: '1-1', title: 'Complete basic React concepts', completed: true, completedAt: '2024-01-10' },
      { id: '1-2', title: 'Build first React component', completed: true, completedAt: '2024-01-15' },
      { id: '1-3', title: 'Learn state management', completed: true, completedAt: '2024-01-20' },
      { id: '1-4', title: 'Build portfolio project', completed: false },
      { id: '1-5', title: 'Deploy project to production', completed: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-25'
  },
  {
    id: '2',
    title: 'Improve Communication Skills',
    description: 'Develop better presentation and public speaking abilities',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2024-04-30',
    progress: 40,
    milestones: [
      { id: '2-1', title: 'Join Toastmasters club', completed: true, completedAt: '2024-01-05' },
      { id: '2-2', title: 'Complete first speech', completed: true, completedAt: '2024-01-20' },
      { id: '2-3', title: 'Practice weekly presentations', completed: false },
      { id: '2-4', title: 'Lead team meeting', completed: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-25'
  },
  {
    id: '3',
    title: 'Learn TypeScript',
    description: 'Master TypeScript for better JavaScript development',
    status: 'not-started',
    priority: 'medium',
    dueDate: '2024-05-15',
    progress: 0,
    milestones: [
      { id: '3-1', title: 'Complete TypeScript basics', completed: false },
      { id: '3-2', title: 'Practice with real projects', completed: false },
      { id: '3-3', title: 'Convert existing JS to TS', completed: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

const MenteeProgress: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="status-icon completed" />;
      case 'in-progress': return <FaClock className="status-icon in-progress" />;
      case 'on-hold': return <FaExclamationTriangle className="status-icon on-hold" />;
      default: return <FaBullseye className="status-icon not-started" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#ea580c';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#2563eb';
      case 'on-hold': return '#ea580c';
      default: return '#6b7280';
    }
  };

  const handleGoalClick = (goal: Goal) => {
    // In a real implementation, this would open a goal details modal
    console.log('Viewing goal:', goal.title);
    alert(`View Goal: ${goal.title}\n\nThis feature is coming soon!`);
  };

  const handleAddGoal = () => {
    // In a real implementation, this would open a goal creation modal
    console.log('Adding new goal');
    alert('Add New Goal feature coming soon!');
  };

  const handleEditGoal = (goal: Goal) => {
    // In a real implementation, this would open a goal editing modal
    console.log('Editing goal:', goal.title);
    alert(`Edit Goal: ${goal.title}\n\nThis feature is coming soon!`);
  };

  const totalGoals = MOCK_GOALS.length;
  const completedGoals = MOCK_GOALS.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = MOCK_GOALS.filter(goal => goal.status === 'in-progress').length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <BannerWrapper sectionId="progress-tracking" bannerType="element">
      <div className="mentee-progress-widget">
        <div className="progress-header">
          <div className="progress-title">
            <FaChartLine className="progress-icon" />
            <h3>Mentee Progress</h3>
          </div>
          <button 
            className="expand-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse progress" : "Expand progress"}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {isExpanded && (
          <div className="progress-content">
            {/* Progress Overview */}
            <div className="progress-overview">
              <div className="progress-stats">
                <div className="stat-item">
                  <div className="stat-number">{totalGoals}</div>
                  <div className="stat-label">Total Goals</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{completedGoals}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{inProgressGoals}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{overallProgress}%</div>
                  <div className="stat-label">Overall Progress</div>
                </div>
              </div>
              
              <div className="overall-progress-bar">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{overallProgress}% Complete</span>
              </div>
            </div>

            {/* Goals List */}
            <div className="goals-section">
              <div className="goals-header">
                <h4>Goals & Milestones</h4>
                <button className="add-goal-btn" onClick={handleAddGoal}>
                  <FaPlus />
                  Add Goal
                </button>
              </div>

              <div className="goals-list">
                {MOCK_GOALS.map(goal => (
                  <div key={goal.id} className="goal-item">
                    <div className="goal-main" onClick={() => handleGoalClick(goal)}>
                      <div className="goal-icon">
                        {getStatusIcon(goal.status)}
                      </div>
                      <div className="goal-info">
                        <h5 className="goal-title">{goal.title}</h5>
                        <p className="goal-description">{goal.description}</p>
                        <div className="goal-meta">
                          <span 
                            className="goal-priority"
                            style={{ color: getPriorityColor(goal.priority) }}
                          >
                            {goal.priority.toUpperCase()}
                          </span>
                          <span className="goal-due-date">
                            <FaCalendarAlt /> Due: {goal.dueDate}
                          </span>
                          <span 
                            className="goal-status"
                            style={{ color: getStatusColor(goal.status) }}
                          >
                            {goal.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="goal-progress">
                        <div className="goal-progress-bar">
                          <div 
                            className="goal-progress-fill"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <span className="goal-progress-text">{goal.progress}%</span>
                      </div>
                    </div>
                    
                    <div className="goal-actions">
                      <button 
                        className="goal-action-btn"
                        onClick={() => handleEditGoal(goal)}
                        title="Edit goal"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="goal-action-btn"
                        onClick={() => handleGoalClick(goal)}
                        title="View details"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                <div className="activity-item">
                  <FaCheckCircle className="activity-icon completed" />
                  <div className="activity-content">
                    <p>Completed milestone: "Build first React component"</p>
                    <span className="activity-date">2 days ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <FaTrophy className="activity-icon achievement" />
                  <div className="activity-content">
                    <p>Achieved 65% progress on React Development Course</p>
                    <span className="activity-date">1 week ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <FaBullseye className="activity-icon goal" />
                  <div className="activity-content">
                    <p>Added new goal: "Learn TypeScript"</p>
                    <span className="activity-date">2 weeks ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BannerWrapper>
  );
};

export default MenteeProgress;
