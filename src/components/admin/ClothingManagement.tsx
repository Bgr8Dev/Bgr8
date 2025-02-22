import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ClothingItem } from '../../types/clothing';
import { AddClothingModal } from './AddClothingModal';
import '../../styles/ClothingManagement.css';

export function ClothingManagement() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    fetchClothingItems();
  }, []);

  const fetchClothingItems = async () => {
    try {
      const itemsRef = collection(db, 'B8Clothing');
      const snapshot = await getDocs(itemsRef);
      const clothingItems: ClothingItem[] = [];
      
      snapshot.forEach(doc => {
        clothingItems.push({ id: doc.id, ...doc.data() } as ClothingItem);
      });
      
      setItems(clothingItems);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
    }
  };

  const handleAddItem = async (newItem: Partial<ClothingItem>) => {
    try {
      const itemsRef = collection(db, 'B8Clothing');
      const newItemData = {
        ...newItem,
        dateAdded: new Date(),
        id: doc(itemsRef).id
      };
      
      await setDoc(doc(itemsRef, newItemData.id), newItemData);
      await fetchClothingItems();
      setIsAddingItem(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'B8Clothing', itemId));
        await fetchClothingItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleToggleStock = async (item: ClothingItem) => {
    try {
      await updateDoc(doc(db, 'B8Clothing', item.id), {
        inStock: !item.inStock
      });
      await fetchClothingItems();
    } catch (error) {
      console.error('Error updating stock status:', error);
    }
  };

  return (
    <div className="clothing-management">
      <div className="clothing-header">
        <h3>Inventory Management</h3>
        <button 
          className="add-item-button"
          onClick={() => setIsAddingItem(true)}
        >
          Add New Item
        </button>
      </div>

      {isAddingItem && (
        <AddClothingModal
          onClose={() => setIsAddingItem(false)}
          onSubmit={handleAddItem}
        />
      )}

      <div className="clothing-items-grid">
        {items.map(item => (
          <div key={item.id} className="clothing-item-card">
            <img src={item.images[0]} alt={item.name} />
            <h4>{item.name}</h4>
            <p>£{item.price.toFixed(2)}</p>
            <p className={`stock-status ${item.inStock ? 'in-stock' : 'out-of-stock'}`}>
              {item.inStock ? 'In Stock' : 'Out of Stock'}
            </p>
            <div className="item-actions">
              <button onClick={() => handleToggleStock(item)}>
                Toggle Stock
              </button>
              <button onClick={() => handleDeleteItem(item.id)} className="delete-button">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 