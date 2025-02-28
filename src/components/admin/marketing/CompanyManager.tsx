import React, { useState, useEffect } from 'react';
import {
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany
} from '../../../services/marketingService';
import { MarketingCompany } from '../../../types/marketing';
import { FaPlus, FaPencilAlt, FaTrash, FaEye, FaEyeSlash, FaCheck, FaTimes, FaLink } from 'react-icons/fa';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const CompanyManager: React.FC = () => {
  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Omit<MarketingCompany, 'id' | 'imageUrl'> & { imageUrl?: string }>({
    name: '',
    websiteUrl: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load companies
  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const companiesData = await getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle toggling the active status
  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `marketing/companies/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  };

  // Add new company
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.websiteUrl.trim() || !selectedFile) return;

    try {
      setIsLoading(true);
      setUploadProgress(30);
      
      // Upload image
      const imageUrl = await uploadImage(selectedFile);
      setUploadProgress(80);
      
      // Add company to Firestore
      const companyData = {
        name: formData.name,
        websiteUrl: formData.websiteUrl,
        imageUrl,
        isActive: formData.isActive
      };
      
      const companyId = await addCompany(companyData);
      setUploadProgress(100);
      
      if (companyId) {
        setCompanies([...companies, { id: companyId, ...companyData }]);
        // Reset form
        setFormData({
          name: '',
          websiteUrl: '',
          isActive: true
        });
        setSelectedFile(null);
        
        // Reset file input by clearing its value
        const fileInput = document.getElementById('company-logo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error adding company:', error);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Start editing company
  const startEditing = (company: MarketingCompany) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      websiteUrl: company.websiteUrl,
      imageUrl: company.imageUrl,
      isActive: company.isActive
    });
    setIsEditing(true);
  };

  // Update company
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.name.trim() || !formData.websiteUrl.trim()) return;

    try {
      setIsLoading(true);
      setUploadProgress(30);
      
      let imageUrl = formData.imageUrl;
      
      // If a new file is selected, upload it
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }
      
      setUploadProgress(80);
      
      const companyToUpdate = companies.find(co => co.id === editingId);
      if (!companyToUpdate) return;
      
      const updatedCompany: MarketingCompany = {
        id: editingId,
        name: formData.name,
        websiteUrl: formData.websiteUrl,
        imageUrl: imageUrl as string,
        isActive: formData.isActive
      };
      
      const success = await updateCompany(updatedCompany);
      setUploadProgress(100);
      
      if (success) {
        setCompanies(companies.map(co => co.id === editingId ? updatedCompany : co));
        // Reset form
        setFormData({
          name: '',
          websiteUrl: '',
          isActive: true
        });
        setSelectedFile(null);
        setEditingId(null);
        setIsEditing(false);
        
        // Reset file input
        const fileInput = document.getElementById('company-logo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Toggle company active status
  const toggleCompanyStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const companyToUpdate = companies.find(co => co.id === id);
      if (!companyToUpdate) return;

      const updatedCompany = {
        ...companyToUpdate,
        isActive: !companyToUpdate.isActive
      };

      const success = await updateCompany(updatedCompany);
      if (success) {
        setCompanies(companies.map(co => co.id === id ? updatedCompany : co));
      }
    } catch (error) {
      console.error('Error updating company status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete company
  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      setIsLoading(true);
      const companyToDelete = companies.find(co => co.id === id);
      if (!companyToDelete) return;
      
      // Delete image from storage if it exists
      if (companyToDelete.imageUrl) {
        try {
          const imageRef = ref(storage, companyToDelete.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image file:', error);
          // Continue with deletion even if image deletion fails
        }
      }
      
      const success = await deleteCompany(id);
      if (success) {
        setCompanies(companies.filter(co => co.id !== id));
      }
    } catch (error) {
      console.error('Error deleting company:', error);
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
      websiteUrl: '',
      isActive: true
    });
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('company-logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="admin-panel-section">
      <h3>Manage Companies</h3>
      <p>Add, edit or hide the companies that appear in the "Companies We've Worked With" section.</p>

      {/* Form for adding/editing companies */}
      <form onSubmit={isEditing ? handleUpdateCompany : handleAddCompany} className="admin-form">
        <div className="form-group">
          <label htmlFor="name">Company Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Company Name"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="websiteUrl">Website URL</label>
          <input
            type="url"
            id="websiteUrl"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleInputChange}
            placeholder="https://example.com"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="company-logo">Logo Image</label>
          <input
            type="file"
            id="company-logo"
            name="logo"
            onChange={handleFileChange}
            accept="image/*"
            className="form-control"
            required={!isEditing}
          />
          {isEditing && formData.imageUrl && (
            <div className="image-preview">
              <img src={formData.imageUrl} alt={formData.name} width="200" />
              <p>Current logo (will be replaced if you select a new file)</p>
            </div>
          )}
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

        {uploadProgress > 0 && (
          <div className="progress">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
              {uploadProgress}%
            </div>
          </div>
        )}

        <div className="form-buttons">
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isEditing ? 'Update Company' : 'Add Company'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Companies list */}
      <div className="items-list">
        <h4>Companies List</h4>
        {companies.length === 0 ? (
          <p className="text-muted">No companies added yet.</p>
        ) : (
          <ul className="companies-list">
            {companies.map(company => (
              <li key={company.id} className={`company-item ${!company.isActive ? 'inactive' : ''}`}>
                <div className="company-logo">
                  <img src={company.imageUrl} alt={company.name} />
                </div>
                <div className="company-details">
                  <h5>{company.name}</h5>
                  <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="company-url">
                    <FaLink /> {company.websiteUrl}
                  </a>
                </div>
                <div className="company-actions">
                  <button 
                    onClick={() => toggleCompanyStatus(company.id)} 
                    className="btn btn-sm btn-info"
                    title={company.isActive ? "Hide" : "Show"}
                  >
                    {company.isActive ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button 
                    onClick={() => startEditing(company)} 
                    className="btn btn-sm btn-warning"
                    title="Edit"
                  >
                    <FaPencilAlt />
                  </button>
                  <button 
                    onClick={() => handleDeleteCompany(company.id)} 
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