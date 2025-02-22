import { useState } from 'react';
import { ClothingItem, ClothingCategory } from '../../types/clothing';
import '../../styles/AdminModal.css';

interface AddClothingModalProps {
  onClose: () => void;
  onSubmit: (item: Partial<ClothingItem>) => void;
}

export function AddClothingModal({ onClose, onSubmit }: AddClothingModalProps) {
  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'tops',
    sizes: [],
    colors: [],
    images: [],
    inStock: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newItem);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Clothing Item</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Price (£)</label>
            <input
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value as ClothingCategory})}
              required
            >
              <option value="tops">Tops</option>
              <option value="bottoms">Bottoms</option>
              <option value="outerwear">Outerwear</option>
              <option value="accessories">Accessories</option>
              <option value="footwear">Footwear</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sizes (comma-separated)</label>
            <input
              type="text"
              value={newItem.sizes?.join(', ')}
              onChange={(e) => setNewItem({...newItem, sizes: e.target.value.split(',').map(s => s.trim())})}
              placeholder="S, M, L, XL"
            />
          </div>

          <div className="form-group">
            <label>Colors (comma-separated)</label>
            <input
              type="text"
              value={newItem.colors?.join(', ')}
              onChange={(e) => setNewItem({...newItem, colors: e.target.value.split(',').map(s => s.trim())})}
              placeholder="Black, White, Red"
            />
          </div>

          <div className="form-group">
            <label>Image URLs (comma-separated)</label>
            <input
              type="text"
              value={newItem.images?.join(', ')}
              onChange={(e) => setNewItem({...newItem, images: e.target.value.split(',').map(s => s.trim())})}
              placeholder="http://example.com/image1.jpg, http://example.com/image2.jpg"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">Add Item</button>
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
} 