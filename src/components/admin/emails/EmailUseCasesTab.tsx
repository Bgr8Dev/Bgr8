import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaPlus, FaEdit, FaTrash, FaSave } from 'react-icons/fa';
import { loggers } from '../../../utils/logger';
import './EmailUseCasesTab.css';

interface UseCase {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  completedDate?: string;
  createdAt: string;
}

interface UseCaseCategory {
  name: string;
  useCases: UseCase[];
}

const EmailUseCasesTab: React.FC = () => {
  const [categories, setCategories] = useState<UseCaseCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [newUseCase, setNewUseCase] = useState<{ title: string; category: string; priority: 'high' | 'medium' | 'low' }>({ 
    title: '', 
    category: '', 
    priority: 'medium' 
  });
  const [showAddForm, setShowAddForm] = useState(false);

    // Initialize with default use cases (Bgr8-specific)
    useEffect(() => {
      const defaultUseCases: UseCaseCategory[] = [
        {
          name: 'User Registration & Account Management',
          useCases: [
            { id: '1', title: 'Registration welcome email', category: 'User Registration & Account Management', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '2', title: 'Email verification request', category: 'User Registration & Account Management', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '3', title: 'Account created confirmation', category: 'User Registration & Account Management', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '4', title: 'Password reset request', category: 'User Registration & Account Management', completed: false, priority: 'high', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Mentor Profile & Verification',
          useCases: [
            { id: '5', title: 'Mentor profile created successfully', category: 'Mentor Profile & Verification', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '6', title: 'Mentor profile sent for verification', category: 'Mentor Profile & Verification', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '7', title: 'Mentor profile verified successfully', category: 'Mentor Profile & Verification', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '8', title: 'Mentor profile verification rejected', category: 'Mentor Profile & Verification', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '9', title: 'Welcome email for new mentors', category: 'Mentor Profile & Verification', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Mentee Profile & Onboarding',
          useCases: [
            { id: '10', title: 'Mentee profile created successfully', category: 'Mentee Profile & Onboarding', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '11', title: 'Welcome email for new mentees', category: 'Mentee Profile & Onboarding', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
            { id: '12', title: 'How to find a mentor guide', category: 'Mentee Profile & Onboarding', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Mentorship Matching & Sessions',
          useCases: [
            { id: '13', title: 'New mentor match found (to mentee)', category: 'Mentorship Matching & Sessions', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '14', title: 'Session booking confirmation', category: 'Mentorship Matching & Sessions', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '15', title: 'Session reminder (24 hours before)', category: 'Mentorship Matching & Sessions', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '16', title: 'Session completed confirmation', category: 'Mentorship Matching & Sessions', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Ambassador Program',
          useCases: [
            { id: '17', title: 'Ambassador application submitted', category: 'Ambassador Program', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
            { id: '18', title: 'Ambassador application approved', category: 'Ambassador Program', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
            { id: '19', title: 'Welcome email for new ambassadors', category: 'Ambassador Program', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Platform Announcements & Updates',
          useCases: [
            { id: '20', title: 'New feature release', category: 'Platform Announcements & Updates', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
            { id: '21', title: 'System maintenance scheduled', category: 'Platform Announcements & Updates', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Reminders & Follow-ups',
          useCases: [
            { id: '22', title: 'Incomplete profile reminder', category: 'Reminders & Follow-ups', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
            { id: '23', title: 'Mentor profile completion reminder', category: 'Reminders & Follow-ups', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
          ]
        },
        {
          name: 'Support & Help',
          useCases: [
            { id: '24', title: 'Support ticket created', category: 'Support & Help', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: '25', title: 'Support ticket resolved', category: 'Support & Help', completed: false, priority: 'high', createdAt: new Date().toISOString() },
          ]
        },
      ];

    // Load from localStorage or use defaults
    const saved = localStorage.getItem('emailUseCases');
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (error) {
        loggers.error.error('Error loading use cases:', error);
        setCategories(defaultUseCases);
      }
    } else {
      setCategories(defaultUseCases);
    }

    // Expand all categories by default
    setExpandedCategories(new Set(defaultUseCases.map(c => c.name)));
  }, []);

  // Save to localStorage whenever categories change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('emailUseCases', JSON.stringify(categories));
    }
  }, [categories]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleUseCase = (categoryName: string, useCaseId: string) => {
    setCategories(prev => prev.map(category => {
      if (category.name === categoryName) {
        return {
          ...category,
          useCases: category.useCases.map(uc => {
            if (uc.id === useCaseId) {
              return {
                ...uc,
                completed: !uc.completed,
                completedDate: !uc.completed ? new Date().toISOString() : undefined
              };
            }
            return uc;
          })
        };
      }
      return category;
    }));
  };

  const addNote = (categoryName: string, useCaseId: string) => {
    const category = categories.find(c => c.name === categoryName);
    const useCase = category?.useCases.find(uc => uc.id === useCaseId);
    if (useCase) {
      setEditNotes(useCase.notes || '');
      setEditingId(useCaseId);
    }
  };

  const saveNote = (categoryName: string, useCaseId: string) => {
    setCategories(prev => prev.map(category => {
      if (category.name === categoryName) {
        return {
          ...category,
          useCases: category.useCases.map(uc => {
            if (uc.id === useCaseId) {
              return { ...uc, notes: editNotes };
            }
            return uc;
          })
        };
      }
      return category;
    }));
    setEditingId(null);
    setEditNotes('');
  };

  const deleteUseCase = (categoryName: string, useCaseId: string) => {
    if (window.confirm('Are you sure you want to delete this use case?')) {
      setCategories(prev => prev.map(category => {
        if (category.name === categoryName) {
          return {
            ...category,
            useCases: category.useCases.filter(uc => uc.id !== useCaseId)
          };
        }
        return category;
      }));
    }
  };

  const addUseCase = () => {
    if (!newUseCase.title || !newUseCase.category) {
      alert('Please fill in title and category');
      return;
    }

    const newCase: UseCase = {
      id: Date.now().toString(),
      title: newUseCase.title,
      category: newUseCase.category,
      completed: false,
      priority: newUseCase.priority,
      createdAt: new Date().toISOString()
    };

    setCategories(prev => prev.map(category => {
      if (category.name === newUseCase.category) {
        return {
          ...category,
          useCases: [...category.useCases, newCase]
        };
      }
      return category;
    }));

    setNewUseCase({ title: '', category: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCompletionStats = () => {
    const total = categories.reduce((sum, cat) => sum + cat.useCases.length, 0);
    const completed = categories.reduce((sum, cat) => 
      sum + cat.useCases.filter(uc => uc.completed).length, 0
    );
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();

  return (
    <div className="email-use-cases-tab">
      <div className="use-cases-header">
        <h2>Email Use Cases Checklist</h2>
        <div className="use-cases-stats">
          <div className="stat-item">
            <span className="stat-label">Progress:</span>
            <span className="stat-value">{stats.completed}/{stats.total} ({stats.percentage}%)</span>
          </div>
          <div className="stat-bar">
            <div 
              className="stat-bar-fill" 
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="use-cases-actions">
        <button 
          className="btn-add-use-case"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <FaPlus /> Add Custom Use Case
        </button>
      </div>

      {showAddForm && (
        <div className="add-use-case-form">
          <input
            type="text"
            placeholder="Use case title..."
            value={newUseCase.title}
            onChange={(e) => setNewUseCase({ ...newUseCase, title: e.target.value })}
          />
          <select
            value={newUseCase.category}
            onChange={(e) => setNewUseCase({ ...newUseCase, category: e.target.value })}
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select
            value={newUseCase.priority}
            onChange={(e) => {
              const priority = e.target.value as 'high' | 'medium' | 'low';
              setNewUseCase({ ...newUseCase, priority });
            }}
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <div className="form-actions">
            <button onClick={addUseCase} className="btn-save">Add</button>
            <button onClick={() => setShowAddForm(false)} className="btn-cancel">Cancel</button>
          </div>
        </div>
      )}

      <div className="use-cases-list">
        {categories.map(category => {
          const completedCount = category.useCases.filter(uc => uc.completed).length;
          const totalCount = category.useCases.length;
          const isExpanded = expandedCategories.has(category.name);

          return (
            <div key={category.name} className="use-case-category">
              <div 
                className="category-header"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">
                    {completedCount}/{totalCount} completed
                  </span>
                </div>
                <span className="category-toggle">
                  {isExpanded ? '−' : '+'}
                </span>
              </div>

              {isExpanded && (
                <div className="category-use-cases">
                  {category.useCases.map(useCase => (
                    <div 
                      key={useCase.id} 
                      className={`use-case-item ${useCase.completed ? 'completed' : ''}`}
                    >
                      <div className="use-case-main">
                        <button
                          className="use-case-checkbox"
                          onClick={() => toggleUseCase(category.name, useCase.id)}
                          style={{ 
                            backgroundColor: useCase.completed ? '#10b981' : 'transparent',
                            borderColor: useCase.completed ? '#10b981' : '#6b7280'
                          }}
                        >
                          {useCase.completed && <FaCheck />}
                        </button>
                        <div className="use-case-content">
                          <span className="use-case-title">{useCase.title}</span>
                          <span 
                            className="use-case-priority"
                            style={{ color: getPriorityColor(useCase.priority) }}
                          >
                            {useCase.priority}
                          </span>
                        </div>
                        <div className="use-case-actions">
                          <button
                            className="btn-icon"
                            onClick={() => addNote(category.name, useCase.id)}
                            title="Add note"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => deleteUseCase(category.name, useCase.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      {editingId === useCase.id && (
                        <div className="use-case-notes-editor">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={3}
                          />
                          <div className="notes-actions">
                            <button
                              className="btn-save"
                              onClick={() => saveNote(category.name, useCase.id)}
                            >
                              <FaSave /> Save
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={() => {
                                setEditingId(null);
                                setEditNotes('');
                              }}
                            >
                              <FaTimes /> Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {useCase.notes && editingId !== useCase.id && (
                        <div className="use-case-notes">
                          <strong>Notes:</strong> {useCase.notes}
                          <button
                            className="btn-edit-note"
                            onClick={() => addNote(category.name, useCase.id)}
                            title="Edit note"
                            aria-label="Edit note"
                          >
                            <FaEdit />
                          </button>
                        </div>
                      )}

                      {useCase.completedDate && (
                        <div className="use-case-completed-date">
                          Completed: {new Date(useCase.completedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmailUseCasesTab;

