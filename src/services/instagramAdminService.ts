// Instagram Admin Service
// Handles CRUD operations for Instagram feed posts via Firestore and Firebase Storage

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { firestore, storage } from '../firebase/firebase';

export interface InstagramAdminPost {
  id?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption?: string;
  permalink: string;
  timestamp: Timestamp | Date;
  thumbnail_url?: string;
  isActive: boolean;
  order: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface InstagramAdminUser {
  id?: string;
  username: string;
  account_type: 'BUSINESS' | 'PERSONAL';
  media_count: number;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

class InstagramAdminService {
  private readonly postsCollection = 'instagramPosts';
  private readonly usersCollection = 'instagramUsers';
  private readonly storageBucket = 'instagram';

  /**
   * Upload image to Firebase Storage
   */
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, `${this.storageBucket}/${path}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Create a new Instagram post
   */
  async createPost(post: Omit<InstagramAdminPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const postData = {
        ...post,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(firestore, this.postsCollection), postData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Update an existing Instagram post
   */
  async updatePost(postId: string, updates: Partial<InstagramAdminPost>): Promise<void> {
    try {
      const postRef = doc(firestore, this.postsCollection, postId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(postRef, updateData);
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error('Failed to update post');
    }
  }

  /**
   * Delete an Instagram post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      // Get post data first to delete associated images
      const posts = await this.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (post) {
        // Delete images from storage
        if (post.media_url && post.media_url.includes('firebase')) {
          await this.deleteImage(post.media_url);
        }
        if (post.thumbnail_url && post.thumbnail_url.includes('firebase')) {
          await this.deleteImage(post.thumbnail_url);
        }
      }

      // Delete from Firestore
      const postRef = doc(firestore, this.postsCollection, postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  }

  /**
   * Get all Instagram posts
   */
  async getPosts(): Promise<InstagramAdminPost[]> {
    try {
      // Simple query without composite index requirement
      const postsQuery = query(
        collection(firestore, this.postsCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as InstagramAdminPost[];
      
      // Sort by order first, then by creation date (handled in application layer)
      return posts.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error getting posts:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  /**
   * Get active Instagram posts for public display
   */
  async getActivePosts(limitCount: number = 6): Promise<InstagramAdminPost[]> {
    try {
      const posts = await this.getPosts();
      return posts
        .filter(post => post.isActive)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting active posts:', error);
      throw new Error('Failed to fetch active posts');
    }
  }

  /**
   * Update Instagram user profile
   */
  async updateUserProfile(userData: Omit<InstagramAdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const userProfile = {
        ...userData,
        createdAt: now,
        updatedAt: now
      };

      // Check if user profile already exists
      const existingUsers = await this.getUserProfile();
      
      if (existingUsers.length > 0) {
        // Update existing user
        const userRef = doc(firestore, this.usersCollection, existingUsers[0].id!);
        await updateDoc(userRef, {
          ...userProfile,
          updatedAt: now
        });
        return existingUsers[0].id!;
      } else {
        // Create new user profile
        const docRef = await addDoc(collection(firestore, this.usersCollection), userProfile);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Get Instagram user profile
   */
  async getUserProfile(): Promise<InstagramAdminUser[]> {
    try {
      const querySnapshot = await getDocs(collection(firestore, this.usersCollection));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as InstagramAdminUser[];
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Reorder posts
   */
  async reorderPosts(postIds: string[]): Promise<void> {
    try {
      const updatePromises = postIds.map((postId, index) => 
        this.updatePost(postId, { order: index })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error reordering posts:', error);
      throw new Error('Failed to reorder posts');
    }
  }

  /**
   * Toggle post active status
   */
  async togglePostStatus(postId: string): Promise<void> {
    try {
      const posts = await this.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (post) {
        await this.updatePost(postId, { isActive: !post.isActive });
      }
    } catch (error) {
      console.error('Error toggling post status:', error);
      throw new Error('Failed to toggle post status');
    }
  }
}

export const instagramAdminService = new InstagramAdminService();
