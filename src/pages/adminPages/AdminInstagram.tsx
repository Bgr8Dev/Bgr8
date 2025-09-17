import React, { useState, useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  instagramAdminService, 
  InstagramAdminPost, 
  InstagramAdminUser 
} from '../../services/instagramAdminService';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUpload, FaSave, FaTimes, FaInstagram } from 'react-icons/fa';
import '../../styles/adminStyles/AdminInstagram.css';

interface PostFormData {
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  caption: string;
  permalink: string;
  isActive: boolean;
  order: number;
}

interface UserFormData {
  username: string;
  account_type: 'BUSINESS' | 'PERSONAL';
  media_count: number;
  isActive: boolean;
}

export default function AdminInstagram() {
  const [posts, setPosts] = useState<InstagramAdminPost[]>([]);
  const [userProfile, setUserProfile] = useState<InstagramAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Post management
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<InstagramAdminPost | null>(null);
  const [postForm, setPostForm] = useState<PostFormData>({
    media_type: 'IMAGE',
    caption: '',
    permalink: '',
    isActive: true,
    order: 0
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User profile management
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: '',
    account_type: 'BUSINESS',
    media_count: 0,
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [postsData, userData] = await Promise.all([
        instagramAdminService.getPosts(),
        instagramAdminService.getUserProfile()
      ]);
      
      setPosts(postsData);
      if (userData.length > 0) {
        setUserProfile(userData[0]);
        setUserForm({
          username: userData[0].username,
          account_type: userData[0].account_type,
          media_count: userData[0].media_count,
          isActive: userData[0].isActive
        });
      }
    } catch (err) {
      setError('Failed to load Instagram data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setError('Please select a valid image file');
      }
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage && !editingPost) {
      setError('Please select an image for the post');
      return;
    }

    try {
      setError(null);
      setUploadingImage(true);

      let mediaUrl = '';
      let thumbnailUrl = '';

      if (selectedImage) {
        const timestamp = Date.now();
        const fileName = `post_${timestamp}_${selectedImage.name}`;
        mediaUrl = await instagramAdminService.uploadImage(selectedImage, fileName);
        thumbnailUrl = mediaUrl; // For now, use the same URL for thumbnail
      } else if (editingPost) {
        mediaUrl = editingPost.media_url;
        thumbnailUrl = editingPost.thumbnail_url || editingPost.media_url;
      }

      const postData = {
        ...postForm,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        timestamp: new Date()
      };

      if (editingPost) {
        await instagramAdminService.updatePost(editingPost.id!, postData);
        setSuccess('Post updated successfully');
      } else {
        // Set order to be the highest
        const maxOrder = Math.max(...posts.map(p => p.order), -1);
        postData.order = maxOrder + 1;
        
        await instagramAdminService.createPost(postData);
        setSuccess('Post created successfully');
      }

      resetPostForm();
      loadData();
    } catch (err) {
      setError('Failed to save post');
      console.error('Error saving post:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      await instagramAdminService.updateUserProfile(userForm);
      setSuccess('User profile updated successfully');
      setShowUserForm(false);
      loadData();
    } catch (err) {
      setError('Failed to update user profile');
      console.error('Error updating user profile:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await instagramAdminService.deletePost(postId);
        setSuccess('Post deleted successfully');
        loadData();
      } catch (err) {
        setError('Failed to delete post');
        console.error('Error deleting post:', err);
      }
    }
  };

  const handleTogglePostStatus = async (postId: string) => {
    try {
      await instagramAdminService.togglePostStatus(postId);
      setSuccess('Post status updated');
      loadData();
    } catch (err) {
      setError('Failed to update post status');
      console.error('Error toggling post status:', err);
    }
  };

  const resetPostForm = () => {
    setPostForm({
      media_type: 'IMAGE',
      caption: '',
      permalink: '',
      isActive: true,
      order: 0
    });
    setSelectedImage(null);
    setPreviewUrl(null);
    setEditingPost(null);
    setShowPostForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEditPost = (post: InstagramAdminPost) => {
    setEditingPost(post);
    setPostForm({
      media_type: post.media_type,
      caption: post.caption || '',
      permalink: post.permalink,
      isActive: post.isActive,
      order: post.order
    });
    setPreviewUrl(post.media_url);
    setShowPostForm(true);
  };

  const formatDate = (date: Date | Timestamp) => {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-insta-container">
        <div className="admin-insta-loading-spinner">
          <div className="admin-insta-spinner"></div>
          <p>Loading Instagram data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-insta-container">
      <div className="admin-insta-header">
        <h2>
          <FaInstagram /> Instagram Feed Management
        </h2>
        <p>Manage your Instagram posts and profile information</p>
      </div>

      {error && (
        <div className="admin-insta-alert admin-insta-alert-error">
          {error}
          <button onClick={() => setError(null)} className="admin-insta-alert-close" title="Close error message">
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-insta-alert admin-insta-alert-success">
          {success}
          <button onClick={() => setSuccess(null)} className="admin-insta-alert-close" title="Close success message">
            <FaTimes />
          </button>
        </div>
      )}

      {/* User Profile Section */}
      <div className="admin-insta-section">
        <div className="admin-insta-section-header">
          <h3>Instagram Profile</h3>
          <button 
            className="admin-insta-btn admin-insta-btn-primary"
            onClick={() => setShowUserForm(!showUserForm)}
          >
            {userProfile ? 'Edit Profile' : 'Setup Profile'}
          </button>
        </div>

        {userProfile && (
          <div className="admin-insta-user-profile-display">
            <div className="admin-insta-profile-info">
              <strong>@{userProfile.username}</strong>
              <span className="admin-insta-profile-type">{userProfile.account_type}</span>
              <span className="admin-insta-profile-count">{userProfile.media_count} posts</span>
              <span className={`admin-insta-profile-status ${userProfile.isActive ? 'active' : 'inactive'}`}>
                {userProfile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}

        {showUserForm && (
          <div className="admin-insta-form-container">
            <form onSubmit={handleUserSubmit} className="user-form">
              <div className="admin-insta-form-row">
                <div className="admin-insta-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    placeholder="@username"
                    required
                  />
                </div>
                <div className="admin-insta-form-group">
                  <label>Account Type</label>
                  <select
                    value={userForm.account_type}
                    onChange={(e) => setUserForm({...userForm, account_type: e.target.value as 'BUSINESS' | 'PERSONAL'})}
                  >
                    <option value="BUSINESS">Business</option>
                    <option value="PERSONAL">Personal</option>
                  </select>
                </div>
              </div>
              <div className="admin-insta-form-row">
                <div className="admin-insta-form-group">
                  <label>Media Count</label>
                  <input
                    type="number"
                    value={userForm.media_count}
                    onChange={(e) => setUserForm({...userForm, media_count: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="admin-insta-form-group">
                  <label className="admin-insta-checkbox-label">
                    <input
                      type="checkbox"
                      checked={userForm.isActive}
                      onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="admin-insta-form-actions">
                <button type="submit" className="admin-insta-btn admin-insta-btn-primary">
                  <FaSave /> Save Profile
                </button>
                <button type="button" className="admin-insta-btn admin-insta-btn-secondary" onClick={() => setShowUserForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div className="admin-insta-section">
        <div className="admin-insta-section-header">
          <h3>Instagram Posts ({posts.length})</h3>
          <button 
            className="admin-insta-btn admin-insta-btn-primary"
            onClick={() => setShowPostForm(!showPostForm)}
          >
            <FaPlus /> Add Post
          </button>
        </div>

        {showPostForm && (
          <div className="admin-insta-form-container">
            <form onSubmit={handlePostSubmit} className="post-form">
              <div className="admin-insta-form-row">
                <div className="admin-insta-form-group">
                  <label>Media Type</label>
                  <select
                    value={postForm.media_type}
                    onChange={(e) => setPostForm({...postForm, media_type: e.target.value as 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'})}
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="CAROUSEL_ALBUM">Album</option>
                  </select>
                </div>
                <div className="admin-insta-form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    value={postForm.order}
                    onChange={(e) => setPostForm({...postForm, order: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>

              <div className="admin-insta-form-group">
                <label>Image Upload</label>
                <div className="admin-insta-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="admin-insta-file-input"
                  />
                  <button 
                    type="button" 
                    className="admin-insta-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaUpload /> {selectedImage ? 'Change Image' : 'Select Image'}
                  </button>
                  {selectedImage && (
                    <span className="admin-insta-file-name">{selectedImage.name}</span>
                  )}
                </div>
                {previewUrl && (
                  <div className="admin-insta-image-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="admin-insta-form-group">
                <label>Caption</label>
                <textarea
                  value={postForm.caption}
                  onChange={(e) => setPostForm({...postForm, caption: e.target.value})}
                  placeholder="Post caption..."
                  rows={3}
                />
              </div>

              <div className="admin-insta-form-group">
                <label>Instagram URL</label>
                <input
                  type="url"
                  value={postForm.permalink}
                  onChange={(e) => setPostForm({...postForm, permalink: e.target.value})}
                  placeholder="https://instagram.com/p/..."
                  required
                />
              </div>

              <div className="admin-insta-form-group">
                <label className="admin-insta-checkbox-label">
                  <input
                    type="checkbox"
                    checked={postForm.isActive}
                    onChange={(e) => setPostForm({...postForm, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>

              <div className="admin-insta-form-actions">
                <button 
                  type="submit" 
                  className="admin-insta-btn admin-insta-btn-primary"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : editingPost ? 'Update Post' : 'Create Post'}
                </button>
                <button type="button" className="admin-insta-btn admin-insta-btn-secondary" onClick={resetPostForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="admin-insta-posts-grid">
          {posts.map((post) => (
            <div key={post.id} className={`admin-insta-post-card ${!post.isActive ? 'inactive' : ''}`}>
              <div className="admin-insta-post-image">
                <img src={post.thumbnail_url || post.media_url} alt={post.caption || 'Instagram post'} />
                <div className="admin-insta-post-overlay">
                  <span className="admin-insta-post-type">{post.media_type}</span>
                  <span className="admin-insta-post-order">#{post.order}</span>
                </div>
              </div>
              <div className="admin-insta-post-content">
                <div className="admin-insta-post-caption">
                  {post.caption ? (
                    post.caption.length > 100 ? 
                      `${post.caption.substring(0, 100)}...` : 
                      post.caption
                  ) : 'No caption'}
                </div>
                <div className="admin-insta-post-meta">
                  <span className="post-date">{formatDate(post.timestamp)}</span>
                  <span className={`admin-insta-post-status ${post.isActive ? 'active' : 'inactive'}`}>
                    {post.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="admin-insta-post-actions">
                <button 
                  className="admin-insta-btn admin-insta-btn-sm admin-insta-btn-secondary"
                  onClick={() => handleTogglePostStatus(post.id!)}
                  title={post.isActive ? 'Hide post' : 'Show post'}
                >
                  {post.isActive ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button 
                  className="admin-insta-btn admin-insta-btn-sm admin-insta-btn-secondary"
                  onClick={() => startEditPost(post)}
                  title="Edit post"
                >
                  <FaEdit />
                </button>
                <button 
                  className="admin-insta-btn admin-insta-btn-sm admin-insta-btn-danger"
                  onClick={() => handleDeletePost(post.id!)}
                  title="Delete post"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="admin-insta-empty-state">
            <FaInstagram />
            <h4>No posts yet</h4>
            <p>Create your first Instagram post to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
