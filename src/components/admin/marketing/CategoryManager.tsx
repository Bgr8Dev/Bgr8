import React, { useState, useEffect } from 'react';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from '../../../services/marketingService';
import { MarketingCategory } from '../../../types/marketing';
import { FaPlus, FaPencilAlt, FaTrash, FaCheck, FaTimes, FaEye, FaEyeSlash, FaSort, FaSpinner } from 'react-icons/fa';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<MarketingCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newCategoryOrderIndex, setNewCategoryOrderIndex] = useState(0);
  const [editOrderIndex, setEditOrderIndex] = useState(0);

  // Load categories
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Add new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      setIsLoading(true);
      const categoryData = {
        name: newCategory.trim(),
        isActive: true,
        orderIndex: newCategoryOrderIndex
      };
      const categoryId = await addCategory(categoryData);
      if (categoryId) {
        setCategories([...categories, { id: categoryId, ...categoryData }]);
        setNewCategory('');
        setNewCategoryOrderIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit category
  const handleEditCategory = async (id: string) => {
    if (!editValue.trim()) return;
    
    try {
      setIsLoading(true);
      const categoryToUpdate = categories.find(cat => cat.id === id);
      if (!categoryToUpdate) return;

      const success = await updateCategory(id, {
        name: editValue.trim(),
        orderIndex: editOrderIndex
      });
      
      if (success) {
        setCategories(categories.map(cat => 
          cat.id === id ? {...cat, name: editValue.trim(), orderIndex: editOrderIndex} : cat
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle category active status
  const toggleCategoryStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const categoryToUpdate = categories.find(cat => cat.id === id);
      if (!categoryToUpdate) return;

      const updatedStatus = !categoryToUpdate.isActive;
      
      const success = await updateCategory(id, {
        isActive: updatedStatus,
        orderIndex: categoryToUpdate.orderIndex
      });
      
      if (success) {
        setCategories(categories.map(cat => 
          cat.id === id ? {...cat, isActive: updatedStatus} : cat
        ));
      }
    } catch (error) {
      console.error('Error updating category status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      setIsLoading(true);
      const success = await deleteCategory(id);
      if (success) {
        setCategories(categories.filter(cat => cat.id !== id));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const startEditing = (category: MarketingCategory) => {
    setEditingId(category.id);
    setEditValue(category.name);
    setEditOrderIndex(category.orderIndex);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <div className="admin-panel-section">
      <h3>Manage Categories</h3>
      <p>Add, edit or hide categories that appear in the software tools section.</p>

      {/* Add new category form */}
      <form onSubmit={handleAddCategory} className="admin-form">
        <div className="form-group">
          <label htmlFor="newCategory">New Category</label>
          <div className="input-group">
            <input 
              id="newCategory"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              disabled={isLoading}
              className="form-control"
            />
            <input 
              type="number"
              value={newCategoryOrderIndex}
              onChange={(e) => setNewCategoryOrderIndex(parseInt(e.target.value))}
              placeholder="Order"
              disabled={isLoading}
              className="form-control order-input"
              min="0"
              title="Display order (lower numbers appear first)"
            />
            <button 
              type="submit" 
              disabled={isLoading || !newCategory.trim()} 
              className="admin-btn admin-btn-primary"
            >
              <FaPlus /> Add Category
            </button>
          </div>
        </div>
      </form>

      {/* Categories list */}
      <div className="items-list">
        <h4>Existing Categories</h4>
        {isLoading && (
          <div className="loading-indicator">
            <FaSpinner className="spinner" /> Loading categories...
          </div>
        )}
        
        {categories.length === 0 && !isLoading ? (
          <p className="text-muted item-list-empty">No categories added yet. Add your first category above.</p>
        ) : (
          <ul className="category-list">
            {categories.sort((a, b) => a.orderIndex - b.orderIndex).map(category => (
              <li key={category.id} className={`item-card ${!category.isActive ? 'inactive-item' : ''}`}>
                {editingId === category.id ? (
                  <div className="edit-form">
                    <div className="input-group">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-control"
                        placeholder="Category name"
                      />
                      <input
                        type="number"
                        value={editOrderIndex}
                        onChange={(e) => setEditOrderIndex(parseInt(e.target.value))}
                        className="form-control order-input"
                        min="0"
                        title="Display order"
                      />
                      <div className="edit-actions">
                        <button 
                          onClick={() => handleEditCategory(category.id)}
                          disabled={isLoading || !editValue.trim()}
                          className="admin-btn admin-btn-success"
                          title="Save changes"
                        >
                          <FaCheck />
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="admin-btn"
                          title="Cancel editing"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="item-content">
                    <div className="item-info">
                      <span className="item-title">{category.name}</span>
                      <span className="item-order" title="Display order"><FaSort /> {category.orderIndex}</span>
                    </div>
                    <div className="item-actions">
                      <button 
                        onClick={() => toggleCategoryStatus(category.id)} 
                        className="admin-btn admin-btn-sm"
                        title={category.isActive ? "Hide this category" : "Make this category visible"}
                      >
                        {category.isActive ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button 
                        onClick={() => startEditing(category)} 
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        title="Edit this category"
                      >
                        <FaPencilAlt />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)} 
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        title="Delete this category"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 