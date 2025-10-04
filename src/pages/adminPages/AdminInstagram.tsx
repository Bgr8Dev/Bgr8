import React, { useState, useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  instagramAdminService, 
  InstagramAdminPost, 
  InstagramAdminUser 
} from '../../services/instagramAdminService';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUpload, FaSave, FaTimes, FaInstagram } from 'react-icons/fa';
import BannerWrapper from '../../components/ui/BannerWrapper';
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
      
      console.log('Loading Instagram admin data from Firestore...');
      
      const [postsData, userData] = await Promise.all([
        instagramAdminService.getPosts(),
        instagramAdminService.getUserProfile()
      ]);
      
      console.log('Loaded posts:', postsData.length);
      console.log('Loaded user profiles:', userData.length);
      
      // Posts are already sorted in the service
      setPosts(postsData);
      
      if (userData.length > 0) {
        setUserProfile(userData[0]);
        setUserForm({
          username: userData[0].username,
          account_type: userData[0].account_type,
          media_count: userData[0].media_count,
          isActive: userData[0].isActive
        });
      } else {
        console.log('No user profile found - will show setup form');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load Instagram data: ${errorMessage}`);
      console.error('Error loading Instagram admin data:', err);
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

  const generateRandomInstagramLink = () => {
    // Generate a random post ID (mix of letters and numbers like real Instagram posts)
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let postId = '';
    for (let i = 0; i < 11; i++) {
      postId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const randomLink = `https://instagram.com/p/${postId}/`;
    setPostForm({...postForm, permalink: randomLink});
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
        console.log('Post updated successfully:', editingPost.id);
        setSuccess('Post updated successfully and saved to Firestore');
      } else {
        // Set order to be the highest
        const maxOrder = Math.max(...posts.map(p => p.order), -1);
        postData.order = maxOrder + 1;
        
        const newPostId = await instagramAdminService.createPost(postData);
        console.log('Post created successfully with ID:', newPostId);
        setSuccess('Post created successfully and saved to Firestore');
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
      const userId = await instagramAdminService.updateUserProfile(userForm);
      console.log('User profile updated successfully:', userId);
      setSuccess('Brand info updated successfully and saved to Firestore');
      setShowUserForm(false);
      loadData();
    } catch (err) {
      setError('Failed to update brand info');
      console.error('Error updating user profile:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post? This will also delete the associated image from storage.')) {
      try {
        await instagramAdminService.deletePost(postId);
        console.log('Post deleted successfully:', postId);
        setSuccess('Post deleted successfully from Firestore and storage');
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
      console.log('Post status toggled:', postId);
      setSuccess('Post visibility updated on homepage');
      loadData();
    } catch (err) {
      setError('Failed to update post visibility');
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
      <BannerWrapper sectionId="instagram" className="admin-insta-container">
        <div className="admin-insta-loading-spinner">
          <div className="admin-insta-spinner"></div>
          <p>Loading Instagram data...</p>
        </div>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper sectionId="instagram" className="admin-insta-container">
      <div className="admin-insta-header">
        <h2>
          <FaInstagram /> Homepage Instagram Feed
        </h2>
        <p>Manage content for the Instagram feed displayed on the BGR8 homepage</p>
        <div className="header-controls">
          <button 
            onClick={loadData}
            title="Refresh data from Firestore"
          >
            🔄 Refresh Data
          </button>
          <span>
            {posts.length} posts loaded from Firestore
          </span>
        </div>
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

      {/* Homepage Brand Section */}
      <div className="admin-insta-section">
        <div className="admin-insta-section-header">
          <h3>Homepage Branding</h3>
          <button 
            className="admin-insta-btn admin-insta-btn-primary"
            onClick={() => setShowUserForm(!showUserForm)}
          >
            {userProfile ? 'Edit Brand Info' : 'Setup Brand Info'}
          </button>
        </div>

        {userProfile && (
          <div className="admin-insta-user-profile-display">
            <div className="admin-insta-profile-info">
              <strong>@{userProfile.username}</strong>
              <span className="admin-insta-profile-type">{userProfile.account_type}</span>
              <span className="admin-insta-profile-count">{userProfile.media_count} posts</span>
              <span className={`admin-insta-profile-status ${userProfile.isActive ? 'active' : 'inactive'}`}>
                {userProfile.isActive ? 'Visible on Homepage' : 'Hidden'}
              </span>
            </div>
          </div>
        )}

        {showUserForm && (
          <div className="admin-insta-form-container">
            <form onSubmit={handleUserSubmit} className="user-form">
              <div className="admin-insta-form-row">
                <div className="admin-insta-form-group">
                  <label>Instagram Handle</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    placeholder="@bgr8_official"
                    required
                  />
                </div>
                <div className="admin-insta-form-group">
                  <label>Account Type</label>
                  <select
                    value={userForm.account_type}
                    onChange={(e) => setUserForm({...userForm, account_type: e.target.value as 'BUSINESS' | 'PERSONAL'})}
                  >
                    <option value="BUSINESS">Business Account</option>
                    <option value="PERSONAL">Personal Account</option>
                  </select>
                </div>
              </div>
              <div className="admin-insta-form-row">
                <div className="admin-insta-form-group">
                  <label>Total Posts Count</label>
                  <input
                    type="number"
                    value={userForm.media_count}
                    onChange={(e) => setUserForm({...userForm, media_count: parseInt(e.target.value) || 0})}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="admin-insta-form-group">
                  <label className="admin-insta-checkbox-label">
                    <input
                      type="checkbox"
                      checked={userForm.isActive}
                      onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                    />
                    Show on Homepage
                  </label>
                </div>
              </div>
              <div className="admin-insta-form-actions">
                <button type="submit" className="admin-insta-btn admin-insta-btn-primary">
                  <FaSave /> Save Brand Info
                </button>
                <button type="button" className="admin-insta-btn admin-insta-btn-secondary" onClick={() => setShowUserForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Homepage Feed Posts */}
      <div className="admin-insta-section">
        <div className="admin-insta-section-header">
          <h3>Homepage Feed Posts ({posts.length})</h3>
          <button 
            className="admin-insta-btn admin-insta-btn-primary"
            onClick={() => setShowPostForm(!showPostForm)}
          >
            <FaPlus /> Add Homepage Post
          </button>
        </div>

        {showPostForm && (
          <div className="admin-insta-form-container">
            <form onSubmit={handlePostSubmit} className="post-form">
              <div className="admin-insta-form-row">
                <div className="admin-insta-form-group">
                  <label>Content Type</label>
                  <select
                    value={postForm.media_type}
                    onChange={(e) => setPostForm({...postForm, media_type: e.target.value as 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'})}
                  >
                    <option value="IMAGE">Single Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="CAROUSEL_ALBUM">Image Gallery</option>
                  </select>
                </div>
                <div className="admin-insta-form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={postForm.order}
                    onChange={(e) => setPostForm({...postForm, order: parseInt(e.target.value) || 0})}
                    min="0"
                    placeholder="0 (appears first)"
                  />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>Lower numbers appear first on homepage</small>
                </div>
              </div>

              <div className="admin-insta-form-group">
                <label>Post Image</label>
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
                    <FaUpload /> {selectedImage ? 'Change Image' : 'Upload Image'}
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
                <small style={{color: '#6b7280', fontSize: '0.8rem'}}>Recommended: Square or 4:5 aspect ratio for best homepage display</small>
              </div>

              <div className="admin-insta-form-group">
                <label>Post Description</label>
                <textarea
                  value={postForm.caption}
                  onChange={(e) => setPostForm({...postForm, caption: e.target.value})}
                  placeholder="Describe your post content, event, or announcement..."
                  rows={3}
                />
                <small style={{color: '#6b7280', fontSize: '0.8rem'}}>This will be shown on the homepage feed</small>
              </div>

              <div className="admin-insta-form-group">
                <label>Link to Original Post</label>
                <div style={{display: 'flex', gap: '0.5rem', alignItems: 'flex-start'}}>
                  <input
                    type="url"
                    value={postForm.permalink}
                    onChange={(e) => setPostForm({...postForm, permalink: e.target.value})}
                    placeholder="https://instagram.com/p/abc123/"
                    required
                    style={{flex: 1}}
                  />
                  <button 
                    type="button"
                    className="admin-insta-btn admin-insta-btn-secondary admin-insta-btn-sm"
                    onClick={generateRandomInstagramLink}
                    title="Generate random Instagram link"
                    style={{whiteSpace: 'nowrap'}}
                  >
                    🎲 Auto-fill
                  </button>
                </div>
                <small style={{color: '#6b7280', fontSize: '0.8rem'}}>Link to the original Instagram post (optional but recommended)</small>
              </div>

              <div className="admin-insta-form-group">
                <label className="admin-insta-checkbox-label">
                  <input
                    type="checkbox"
                    checked={postForm.isActive}
                    onChange={(e) => setPostForm({...postForm, isActive: e.target.checked})}
                  />
                  Show on Homepage
                </label>
                <small style={{color: '#6b7280', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem'}}>Uncheck to hide this post from the homepage feed</small>
              </div>

              <div className="admin-insta-form-actions">
                <button 
                  type="submit" 
                  className="admin-insta-btn admin-insta-btn-primary"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : editingPost ? 'Update Post' : 'Add to Homepage'}
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
                <img 
                  src={post.thumbnail_url || post.media_url} 
                  alt={post.caption || 'Instagram post'}
                  onError={(e) => {
                    console.error('Failed to load image:', post.media_url);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBWMTIwSDgwdjQwaDQwdjQwSDgwIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjEyIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
                  }}
                />
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
                    {post.isActive ? 'On Homepage' : 'Hidden'}
                  </span>
                </div>
                {post.permalink && (
                  <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280'}}>
                    <a 
                      href={post.permalink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{color: '#3b82f6', textDecoration: 'none'}}
                    >
                      View Original Post →
                    </a>
                  </div>
                )}
              </div>
              <div className="admin-insta-post-actions">
                <button 
                  className="admin-insta-btn admin-insta-btn-sm admin-insta-btn-secondary"
                  onClick={() => handleTogglePostStatus(post.id!)}
                  title={post.isActive ? 'Hide from homepage' : 'Show on homepage'}
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
            <h4>No homepage posts yet</h4>
            <p>Add your first post to start building your homepage Instagram feed</p>
          </div>
        )}
      </div>
    </BannerWrapper>
  );
}
