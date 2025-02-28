import React, { useState, useEffect } from 'react';
import {
  getPricingPlans,
  addPricingPlan,
  updatePricingPlan,
  deletePricingPlan
} from '../../../services/marketingService';
import { MarketingPricingPlan } from '../../../types/marketing';
import { renderIcon, IconPicker } from '../../../utils/iconMapping';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';

export const PricingManager: React.FC = () => {
  const [pricingPlans, setPricingPlans] = useState<MarketingPricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<MarketingPricingPlan, 'id'>>({
    title: '',
    price: '',
    description: '',
    iconName: 'FaChartLine',
    isActive: true,
    orderIndex: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load pricing plans
  const loadPricingPlans = async () => {
    setIsLoading(true);
    try {
      const plansData = await getPricingPlans();
      setPricingPlans(plansData);
      
      // Set default orderIndex for new plans
      if (plansData.length > 0) {
        const maxOrderIndex = Math.max(...plansData.map(plan => plan.orderIndex));
        setFormData(prev => ({ ...prev, orderIndex: maxOrderIndex + 1 }));
      }
    } catch (error) {
      console.error('Error loading pricing plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPricingPlans();
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

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      description: '',
      iconName: 'FaChartLine',
      isActive: true,
      orderIndex: pricingPlans.length > 0 
        ? Math.max(...pricingPlans.map(plan => plan.orderIndex)) + 1 
        : 0
    });
  };

  // Add new pricing plan
  const handleAddPricingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price.trim() || !formData.description.trim()) return;

    try {
      setIsLoading(true);
      const planId = await addPricingPlan(formData);
      if (planId) {
        setPricingPlans([...pricingPlans, { id: planId, ...formData }]);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding pricing plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing pricing plan
  const startEditing = (plan: MarketingPricingPlan) => {
    setEditingId(plan.id);
    setFormData({
      title: plan.title,
      price: plan.price,
      description: plan.description,
      iconName: plan.iconName,
      isActive: plan.isActive,
      orderIndex: plan.orderIndex
    });
    setIsEditing(true);
  };

  // Update pricing plan
  const handleUpdatePricingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.title.trim() || !formData.price.trim() || !formData.description.trim()) return;

    try {
      setIsLoading(true);
      const success = await updatePricingPlan(editingId, formData);
      
      if (success) {
        const updatedPlan = { id: editingId, ...formData };
        setPricingPlans(pricingPlans.map(plan => plan.id === editingId ? updatedPlan : plan));
        resetForm();
        setEditingId(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating pricing plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle pricing plan active status
  const togglePlanStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const planToUpdate = pricingPlans.find(plan => plan.id === id);
      if (!planToUpdate) return;

      const updatedPlan = {
        ...planToUpdate,
        isActive: !planToUpdate.isActive
      };

      const success = await updatePricingPlan(id, {
        isActive: !planToUpdate.isActive,
        orderIndex: planToUpdate.orderIndex
      });
      
      if (success) {
        setPricingPlans(pricingPlans.map(plan => plan.id === id ? updatedPlan : plan));
      }
    } catch (error) {
      console.error('Error updating pricing plan status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete pricing plan
  const handleDeletePricingPlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) return;

    try {
      setIsLoading(true);
      const success = await deletePricingPlan(id);
      if (success) {
        setPricingPlans(pricingPlans.filter(plan => plan.id !== id));
      }
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setIsEditing(false);
    resetForm();
  };

  return (
    <div className="admin-panel-section">
      <h3>Manage Pricing Plans</h3>
      <p>Add, edit or hide the pricing plans that appear on the marketing page.</p>

      {/* Form for adding/editing pricing plans */}
      <form onSubmit={isEditing ? handleUpdatePricingPlan : handleAddPricingPlan} className="admin-form">
        <div className="form-group">
          <label htmlFor="title">Plan Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Basic Marketing Package"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="e.g. $500/month"
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
            placeholder="Brief description of the pricing plan"
            required
            className="form-control"
          />
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
            {isEditing ? 'Update Plan' : 'Add Plan'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Pricing plans list */}
      <div className="items-list">
        <h4>Pricing Plans</h4>
        {isLoading && (
          <div className="loading-indicator">
            <FaSpinner className="spinner" /> Loading pricing plans...
          </div>
        )}
        
        {pricingPlans.length === 0 && !isLoading ? (
          <p className="text-muted">No pricing plans added yet.</p>
        ) : (
          <ul className="pricing-plans-list">
            {pricingPlans.map(plan => (
              <li key={plan.id} className={`pricing-plan-item ${!plan.isActive ? 'inactive' : ''}`}>
                <div className="pricing-plan-icon">{renderIcon(plan.iconName)}</div>
                <div className="pricing-plan-details">
                  <h5>{plan.title}</h5>
                  <span className="pricing-plan-price">{plan.price}</span>
                  <p>{plan.description}</p>
                </div>
                <div className="pricing-plan-actions">
                  <button 
                    onClick={() => togglePlanStatus(plan.id)} 
                    className="btn btn-sm btn-info"
                    title={plan.isActive ? "Hide" : "Show"}
                  >
                    {plan.isActive ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button 
                    onClick={() => startEditing(plan)} 
                    className="btn btn-sm btn-warning"
                    title="Edit"
                  >
                    <FaPencilAlt />
                  </button>
                  <button 
                    onClick={() => handleDeletePricingPlan(plan.id)} 
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