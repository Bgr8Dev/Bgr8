import React, { useState, useEffect } from 'react';
import {
  getSoftware,
  addSoftware,
  updateSoftware,
  deleteSoftware,
  getCategories
} from '../../../services/marketingService';
import { MarketingSoftware, MarketingCategory } from '../../../types/marketing';
import { renderIcon, IconPicker } from '../../../utils/iconMapping';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';

export const SoftwareManager: React.FC = () => {
  const [software, setSoftware] = useState<MarketingSoftware[]>([]);
  const [categories, setCategories] = useState<MarketingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<MarketingSoftware, 'id'>>({
    name: '',
    description: '',
    category: '',
    iconName: 'FaCode',
    isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [softwareData, categoriesData] = await Promise.all([
        getSoftware(),
        getCategories()
      ]);
      setSoftware(softwareData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle toggling the active status
  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  // Add new software
  const handleAddSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category.trim()) return;

    try {
      setIsLoading(true);
      const softwareId = await addSoftware(formData);
      if (softwareId) {
        setSoftware([...software, { id: softwareId, ...formData }]);
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          iconName: 'FaCode',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error adding software:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing software
  const startEditing = (softwareItem: MarketingSoftware) => {
    setEditingId(softwareItem.id);
    setFormData({
      name: softwareItem.name,
      description: softwareItem.description,
      category: softwareItem.category,
      iconName: softwareItem.iconName,
      isActive: softwareItem.isActive
    });
    setIsEditing(true);
  };

  // Update software
  const handleUpdateSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.name.trim() || !formData.category.trim()) return;

    try {
      setIsLoading(true);
      const success = await updateSoftware(editingId, formData);
      
      if (success) {
        const updatedSoftware = { id: editingId, ...formData };
        setSoftware(software.map(item => item.id === editingId ? updatedSoftware : item));
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          iconName: 'code',
          isActive: true
        });
        setEditingId(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating software:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle software active status
  const toggleSoftwareStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const softwareToUpdate = software.find(item => item.id === id);
      if (!softwareToUpdate) return;

      const updatedStatus = !softwareToUpdate.isActive;
      
      const success = await updateSoftware(id, {
        isActive: updatedStatus
      });
      
      if (success) {
        setSoftware(software.map(item => 
          item.id === id ? {...item, isActive: updatedStatus} : item
        ));
      }
    } catch (error) {
      console.error('Error updating software status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete software
  const handleDeleteSoftware = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this software?')) return;

    try {
      setIsLoading(true);
      const success = await deleteSoftware(id);
      if (success) {
        setSoftware(software.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting software:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      category: '',
      iconName: 'FaCode',
      isActive: true
    });
  };

  // Get active categories
  const activeCategories = categories.filter(cat => cat.isActive);

  return (
    <div className="admin-panel-section">
      <h3>Manage Software Tools</h3>
      <p>Add, edit or hide software tools that appear in the marketing tech stack section.</p>

      {/* Form for adding/editing software */}
      <form onSubmit={isEditing ? handleUpdateSoftware : handleAddSoftware} className="admin-form">
        <div className="form-group">
          <label htmlFor="name">Software Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Software Name"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the software"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="form-control"
          >
            <option value="">Select a category</option>
            {activeCategories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="iconName">Icon</label>
          <IconPicker 
            selectedIcon={formData.iconName} 
            onSelectIcon={(iconName) => setFormData(prev => ({...prev, iconName}))}
          />
        </div>

        <div className="form-check">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleActiveChange}
            className="form-check-input"
          />
          <label htmlFor="isActive" className="form-check-label">
            Active (visible to users)
          </label>
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isEditing ? 'Update Software' : 'Add Software'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Software list */}
      <div className="items-list">
        <h4>Software List</h4>
        {isLoading && (
          <div className="loading-indicator">
            <FaSpinner className="spinner" /> Loading software...
          </div>
        )}
        
        {software.length === 0 && !isLoading ? (
          <p className="text-muted">No software added yet.</p>
        ) : (
          <ul className="software-list">
            {software.map(item => (
              <li key={item.id} className={`software-item ${!item.isActive ? 'inactive' : ''}`}>
                <div className="software-icon">{renderIcon(item.iconName)}</div>
                <div className="software-details">
                  <h5>{item.name}</h5>
                  <span className="category-tag">{item.category}</span>
                  <p>{item.description}</p>
                </div>
                <div className="software-actions">
                  <button 
                    onClick={() => toggleSoftwareStatus(item.id)} 
                    className="btn btn-sm btn-info"
                    title={item.isActive ? "Hide" : "Show"}
                  >
                    {item.isActive ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button 
                    onClick={() => startEditing(item)} 
                    className="btn btn-sm btn-warning"
                    title="Edit"
                  >
                    <FaPencilAlt />
                  </button>
                  <button 
                    onClick={() => handleDeleteSoftware(item.id)} 
                    className="btn btn-sm btn-danger"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 