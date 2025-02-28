import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  MarketingCategory, 
  MarketingSoftware, 
  MarketingService, 
  MarketingCompany,
  MarketingPricingPlan
} from '../types/marketing';

// Collections
const CATEGORIES_COLLECTION = 'marketingCategories';
const SOFTWARE_COLLECTION = 'marketingSoftware';
const SERVICES_COLLECTION = 'marketingServices';
const COMPANIES_COLLECTION = 'marketingCompanies';
const PRICING_PLANS_COLLECTION = 'marketingPricingPlans';

// Category Functions
export const getCategories = async (): Promise<MarketingCategory[]> => {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const q = query(categoriesRef, orderBy('orderIndex'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingCategory[];
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

export const addCategory = async (category: Omit<MarketingCategory, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    return null;
  }
};

export const updateCategory = async (id: string, data: Partial<MarketingCategory>): Promise<boolean> => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

// Software Functions
export const getSoftware = async (): Promise<MarketingSoftware[]> => {
  try {
    const softwareRef = collection(db, SOFTWARE_COLLECTION);
    const q = query(softwareRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingSoftware[];
  } catch (error) {
    console.error('Error getting software:', error);
    return [];
  }
};

export const addSoftware = async (software: Omit<MarketingSoftware, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, SOFTWARE_COLLECTION), {
      ...software,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding software:', error);
    return null;
  }
};

export const updateSoftware = async (id: string, data: Partial<MarketingSoftware>): Promise<boolean> => {
  try {
    const docRef = doc(db, SOFTWARE_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating software:', error);
    return false;
  }
};

export const deleteSoftware = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, SOFTWARE_COLLECTION, id));
    return true;
  } catch (error) {
    console.error('Error deleting software:', error);
    return false;
  }
};

// Service Functions
export const getServices = async (): Promise<MarketingService[]> => {
  try {
    const servicesRef = collection(db, SERVICES_COLLECTION);
    const q = query(servicesRef, orderBy('category'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingService[];
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
};

export const addService = async (service: Omit<MarketingService, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
      ...service,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    return null;
  }
};

export const updateService = async (id: string, data: Partial<MarketingService>): Promise<boolean> => {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    return false;
  }
};

export const deleteService = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, SERVICES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
};

// Company Functions
export const getCompanies = async (): Promise<MarketingCompany[]> => {
  try {
    const companiesRef = collection(db, COMPANIES_COLLECTION);
    const q = query(companiesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingCompany[];
  } catch (error) {
    console.error('Error getting companies:', error);
    return [];
  }
};

export const addCompany = async (
  company: Omit<MarketingCompany, 'id' | 'imageUrl'>,
  imageFile: File
): Promise<string | null> => {
  try {
    // First upload the image
    const imagePath = `marketing/companies/${Date.now()}_${imageFile.name}`;
    const storageRef = ref(storage, imagePath);
    
    const uploadTask = await uploadBytesResumable(storageRef, imageFile);
    const downloadURL = await getDownloadURL(uploadTask.ref);
    
    // Then create the document with the image URL
    const docRef = await addDoc(collection(db, COMPANIES_COLLECTION), {
      ...company,
      imageUrl: downloadURL,
      imagePath: imagePath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding company:', error);
    return null;
  }
};

export const updateCompany = async (
  id: string, 
  data: Partial<Omit<MarketingCompany, 'imageUrl' | 'imagePath'>>,
  imageFile?: File
): Promise<boolean> => {
  try {
    const companyRef = doc(db, COMPANIES_COLLECTION, id);
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }
    
    const companyData = companyDoc.data() as MarketingCompany;
    let updateData: any = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    // If there's a new image, upload it and update the URL
    if (imageFile) {
      // Delete the old image if it exists
      if (companyData.imagePath) {
        const oldImageRef = ref(storage, companyData.imagePath);
        try {
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue even if deletion fails
        }
      }
      
      // Upload the new image
      const imagePath = `marketing/companies/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, imagePath);
      
      const uploadTask = await uploadBytesResumable(storageRef, imageFile);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      // Add the new image URL to the update data
      updateData.imageUrl = downloadURL;
      updateData.imagePath = imagePath;
    }
    
    // Update the document
    await updateDoc(companyRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating company:', error);
    return false;
  }
};

export const deleteCompany = async (id: string): Promise<boolean> => {
  try {
    // First get the company to check if it has an image
    const companyRef = doc(db, COMPANIES_COLLECTION, id);
    const companyDoc = await getDoc(companyRef);
    
    if (companyDoc.exists()) {
      const companyData = companyDoc.data() as MarketingCompany;
      
      // Delete the image if it exists
      if (companyData.imagePath) {
        const imageRef = ref(storage, companyData.imagePath);
        try {
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue even if deletion fails
        }
      }
    }
    
    // Delete the document
    await deleteDoc(companyRef);
    return true;
  } catch (error) {
    console.error('Error deleting company:', error);
    return false;
  }
};

// Pricing Plan Functions
export const getPricingPlans = async (): Promise<MarketingPricingPlan[]> => {
  try {
    const plansRef = collection(db, PRICING_PLANS_COLLECTION);
    const q = query(plansRef, orderBy('orderIndex'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingPricingPlan[];
  } catch (error) {
    console.error('Error getting pricing plans:', error);
    return [];
  }
};

export const addPricingPlan = async (plan: Omit<MarketingPricingPlan, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, PRICING_PLANS_COLLECTION), {
      ...plan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding pricing plan:', error);
    return null;
  }
};

export const updatePricingPlan = async (id: string, data: Partial<MarketingPricingPlan>): Promise<boolean> => {
  try {
    const docRef = doc(db, PRICING_PLANS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    return false;
  }
};

export const deletePricingPlan = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, PRICING_PLANS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    return false;
  }
};

// Initialize default data for a new installation
export const initializeMarketingData = async (
  categories: Omit<MarketingCategory, 'id'>[],
  software: Omit<MarketingSoftware, 'id'>[],
  services: Omit<MarketingService, 'id'>[],
  pricingPlans: Omit<MarketingPricingPlan, 'id'>[]
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    
    // Add categories
    for (const category of categories) {
      const newDocRef = doc(collection(db, CATEGORIES_COLLECTION));
      batch.set(newDocRef, {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Add software
    for (const item of software) {
      const newDocRef = doc(collection(db, SOFTWARE_COLLECTION));
      batch.set(newDocRef, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Add services
    for (const service of services) {
      const newDocRef = doc(collection(db, SERVICES_COLLECTION));
      batch.set(newDocRef, {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Add pricing plans
    for (const plan of pricingPlans) {
      const newDocRef = doc(collection(db, PRICING_PLANS_COLLECTION));
      batch.set(newDocRef, {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error initializing marketing data:', error);
    return false;
  }
}; 