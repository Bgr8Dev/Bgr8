import React, { useState, useEffect, useCallback } from 'react';
import { instagramService, InstagramPost, InstagramUser } from '../../services/instagramService';
import './InstagramFeed.css';

interface InstagramFeedProps {
  accessToken?: string;
  maxPosts?: number;
  showProfile?: boolean;
  className?: string;
}

export default function InstagramFeed({ 
  accessToken, 
  maxPosts = 6, 
  showProfile = true,
  className = '' 
}: InstagramFeedProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [user, setUser] = useState<InstagramUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstagramData = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile and posts in parallel
      const [postsData, userData] = await Promise.all([
        instagramService.getRecentMedia(accessToken, maxPosts),
        showProfile ? instagramService.getUserProfile() : null
      ]);

      setPosts(postsData);
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      console.error('Error fetching Instagram data:', err);
      setError('Failed to load Instagram posts. Please check your access token.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, maxPosts, showProfile]);

  useEffect(() => {
    if (accessToken) {
      fetchInstagramData();
    } else {
      setError('Instagram access token is required');
      setLoading(false);
    }
  }, [accessToken, fetchInstagramData]);

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateCaption = (caption: string, maxLength: number = 100): string => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className={`instagram-feed ${className}`}>
        <div className="instagram-loading">
          <div className="instagram-spinner"></div>
          <p>Loading Instagram posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`instagram-feed ${className}`}>
        <div className="instagram-error">
          <div className="instagram-error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchInstagramData} className="instagram-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`instagram-feed ${className}`}>
        <div className="instagram-empty">
          <div className="instagram-empty-icon">📷</div>
          <p>No Instagram posts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`instagram-feed ${className}`}>
      {showProfile && user && (
        <div className="instagram-profile">
          <div className="instagram-profile-info">
            <h3>@{user.username}</h3>
            <p>{user.media_count} posts</p>
          </div>
          <a 
            href={`https://instagram.com/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-follow-btn"
          >
            Follow on Instagram
          </a>
        </div>
      )}

      <div className="instagram-posts">
        {posts.map((post) => (
          <div key={post.id} className="instagram-post">
            <a 
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-post-link"
            >
              <div className="instagram-post-media">
                {post.media_type === 'VIDEO' && (
                  <div className="instagram-video-overlay">
                    <div className="instagram-play-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
                
                <img
                  src={post.thumbnail_url || post.media_url}
                  alt={post.caption || 'Instagram post'}
                  loading="lazy"
                />
              </div>
              
              <div className="instagram-post-info">
                <div className="instagram-post-caption">
                  {post.caption && truncateCaption(post.caption)}
                </div>
                <div className="instagram-post-meta">
                  <span className="instagram-post-date">
                    {formatDate(post.timestamp)}
                  </span>
                  {post.media_type === 'CAROUSEL_ALBUM' && (
                    <span className="instagram-post-type">
                      📷 Album
                    </span>
                  )}
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      <div className="instagram-footer">
        <a 
          href={user ? `https://instagram.com/${user.username}` : 'https://instagram.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-view-all"
        >
          View all posts on Instagram →
        </a>
      </div>
    </div>
  );
}
