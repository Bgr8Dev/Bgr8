import React, { useState, useEffect } from 'react';
import {
  getServices,
  addService,
  updateService,
  deleteService
} from '../../../services/marketingService';
import { MarketingService } from '../../../types/marketing';
import { renderIcon, IconPicker } from '../../../utils/iconMapping';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash, FaPlus, FaTimes } from 'react-icons/fa';

export const ServiceManager: React.FC = () => {
  const [services, setServices] = useState<MarketingService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<MarketingService, 'id'>>({
    category: '',
    title: '',
    services: [''],
    price: '',
    iconName: 'FaGlobe',
    isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load services
  const loadServices = async () => {
    setIsLoading(true);
    try {
      const servicesData = await getServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
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

  // Handle service items changes
  const handleServiceItemChange = (index: number, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = value;
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  // Add new service item field
  const addServiceItem = () => {
    setFormData(prev => ({ ...prev, services: [...prev.services, ''] }));
  };

  // Remove service item field
  const removeServiceItem = (index: number) => {
    if (formData.services.length <= 1) return; // Keep at least one item
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  // Add new service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category.trim() || !formData.title.trim() || !formData.price.trim()) return;
    
    // Filter out empty service items
    const filteredServices = formData.services.filter(item => item.trim() !== '');
    if (filteredServices.length === 0) return;

    try {
      setIsLoading(true);
      const serviceData = {
        ...formData,
        services: filteredServices
      };
      
      const serviceId = await addService(serviceData);
      if (serviceId) {
        setServices([...services, { id: serviceId, ...serviceData }]);
        // Reset form
        setFormData({
          category: '',
          title: '',
          services: [''],
          price: '',
          iconName: 'FaGlobe',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing service
  const startEditing = (serviceItem: MarketingService) => {
    setEditingId(serviceItem.id);
    setFormData({
      category: serviceItem.category,
      title: serviceItem.title,
      services: serviceItem.services.length > 0 ? serviceItem.services : [''],
      price: serviceItem.price,
      iconName: serviceItem.iconName,
      isActive: serviceItem.isActive
    });
    setIsEditing(true);
  };

  // Toggle service active status
  const toggleServiceStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const serviceToUpdate = services.find(service => service.id === id);
      if (!serviceToUpdate) return;

      const updatedStatus = !serviceToUpdate.isActive;
      
      const success = await updateService(id, {
        isActive: updatedStatus
      });
      
      if (success) {
        setServices(services.map(service => 
          service.id === id ? {...service, isActive: updatedStatus} : service
        ));
      }
    } catch (error) {
      console.error('Error updating service status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update service
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.title.trim() || !formData.category.trim() || formData.services.some(s => !s.trim())) return;

    try {
      setIsLoading(true);
      const success = await updateService(editingId, formData);
      
      if (success) {
        const updatedService = { id: editingId, ...formData };
        setServices(services.map(service => service.id === editingId ? updatedService : service));
        setFormData({
          category: '',
          title: '',
          services: [''],
          price: '',
          iconName: 'globe',
          isActive: true
        });
        setEditingId(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete service
  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      setIsLoading(true);
      const success = await deleteService(id);
      if (success) {
        setServices(services.filter(service => service.id !== id));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setIsEditing(false);
    setFormData({
      category: '',
      title: '',
      services: [''],
      price: '',
      iconName: 'FaGlobe',
      isActive: true
    });
  };

  return (
    <div className="admin-panel-section">
      <h3>Manage Services</h3>
      <p>Add, edit or hide the marketing services that appear on the page.</p>

      {/* Form for adding/editing services */}
      <form onSubmit={isEditing ? handleUpdateService : handleAddService} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Service Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g. Web Marketing"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">Service Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Digital Web Marketing"
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="e.g. Starting from $500/month"
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

        <div className="form-group">
          <label>Service Features</label>
          {formData.services.map((service, index) => (
            <div key={index} className="service-item-input">
              <input
                type="text"
                value={service}
                onChange={(e) => handleServiceItemChange(index, e.target.value)}
                placeholder="Service feature"
                className="form-control"
              />
              <button
                type="button"
                onClick={() => removeServiceItem(index)}
                className="btn btn-sm btn-danger"
                disabled={formData.services.length <= 1}
                title="Remove item"
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addServiceItem}
            className="btn btn-sm btn-secondary mt-2"
          >
            <FaPlus /> Add Another Feature
          </button>
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
            {isEditing ? 'Update Service' : 'Add Service'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Services list */}
      <div className="items-list">
        <h4>Services List</h4>
        {services.length === 0 ? (
          <p className="text-muted">No services added yet.</p>
        ) : (
          <ul className="services-list">
            {services.map(service => (
              <li key={service.id} className={`service-item ${!service.isActive ? 'inactive' : ''}`}>
                <div className="service-header">
                  <div className="service-icon">{renderIcon(service.iconName)}</div>
                  <div className="service-title">
                    <h5>{service.category}: {service.title}</h5>
                    <span className="service-price">{service.price}</span>
                  </div>
                </div>
                <div className="service-features">
                  <ul>
                    {service.services.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="service-actions">
                  <button 
                    onClick={() => toggleServiceStatus(service.id)} 
                    className="btn btn-sm btn-info"
                    title={service.isActive ? "Hide" : "Show"}
                  >
                    {service.isActive ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button 
                    onClick={() => startEditing(service)} 
                    className="btn btn-sm btn-warning"
                    title="Edit"
                  >
                    <FaPencilAlt />
                  </button>
                  <button 
                    onClick={() => handleDeleteService(service.id)} 
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