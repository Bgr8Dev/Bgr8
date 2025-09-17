// Instagram API Service
// This service handles Instagram feed data from Firestore and Instagram Basic Display API integration

import { instagramAdminService } from './instagramAdminService';

export interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption?: string;
  permalink: string;
  timestamp: string;
  thumbnail_url?: string;
}

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'PERSONAL';
  media_count: number;
}

class InstagramService {
  private readonly baseURL = 'https://graph.instagram.com';
  private readonly version = 'v18.0';

  constructor() {
    // API credentials will be loaded from environment variables
  }

  /**
   * Get recent media posts from Firestore (managed through admin portal)
   * @param accessToken - Instagram access token (not used for Firestore data)
   * @param limit - Number of posts to fetch
   */
  async getRecentMedia(_accessToken: string, limit: number = 6): Promise<InstagramPost[]> {
    try {
      // Get active posts from Firestore via admin service
      const adminPosts = await instagramAdminService.getActivePosts(limit);
      
      // Convert admin posts to public interface format
      const posts: InstagramPost[] = adminPosts.map(post => ({
        id: post.id!,
        media_type: post.media_type,
        media_url: post.media_url,
        caption: post.caption,
        permalink: post.permalink,
        timestamp: (post.timestamp instanceof Date ? post.timestamp : post.timestamp.toDate()).toISOString(),
        thumbnail_url: post.thumbnail_url
      }));

      return posts;
      
      /* Fallback to Instagram API (commented out due to CSP):
      const response = await fetch(
        `${this.baseURL}/${this.version}/me/media?fields=id,media_type,media_url,caption,permalink,timestamp,thumbnail_url&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
      */
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      
      // Return mock data as fallback if Firestore is unavailable
      console.warn('Using mock data as fallback due to Firestore error');
      const mockPosts: InstagramPost[] = [
        {
          id: 'fallback-1',
          media_type: 'IMAGE',
          media_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjM2I4MmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkluc3RhZ3JhbSBQb3N0IDE8L3RleHQ+PC9zdmc+',
          caption: 'Welcome to our platform! 🚀 #b8network #tech #innovation',
          permalink: 'https://instagram.com/p/fallback1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjM2I4MmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjE8L3RleHQ+PC9zdmc+'
        }
      ];

      return mockPosts.slice(0, limit);
    }
  }

  /**
   * Get user profile information from Firestore (managed through admin portal)
   */
  async getUserProfile(): Promise<InstagramUser> {
    try {
      // Get user profile from Firestore via admin service
      const adminUsers = await instagramAdminService.getUserProfile();
      
      if (adminUsers.length > 0) {
        const adminUser = adminUsers[0];
        return {
          id: adminUser.id!,
          username: adminUser.username,
          account_type: adminUser.account_type,
          media_count: adminUser.media_count
        };
      }
      
      // Return default user data if no profile is configured
      return {
        id: 'default_user',
        username: 'b8network',
        account_type: 'BUSINESS',
        media_count: 0
      };
      
      /* Fallback to Instagram API (commented out due to CSP):
      const response = await fetch(
        `${this.baseURL}/${this.version}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      
      // Return fallback data if Firestore is unavailable
      return {
        id: 'fallback_user',
        username: 'b8network',
        account_type: 'BUSINESS',
        media_count: 0
      };
    }
  }

  /**
   * Exchange short-lived access token for long-lived token
   * @param shortLivedToken - Short-lived access token
   * @param appSecret - Facebook app secret
   */
  async getLongLivedToken(shortLivedToken: string, appSecret: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseURL}/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
      );

      if (!response.ok) {
        throw new Error(`Token exchange error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging Instagram token:', error);
      throw error;
    }
  }

  /**
   * Refresh long-lived access token
   * @param longLivedToken - Long-lived access token
   */
  async refreshLongLivedToken(longLivedToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseURL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`
      );

      if (!response.ok) {
        throw new Error(`Token refresh error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing Instagram token:', error);
      throw error;
    }
  }

  /**
   * Generate Instagram authorization URL
   * @param appId - Facebook app ID
   * @param redirectUri - OAuth redirect URI
   * @param state - Optional state parameter for security
   */
  generateAuthURL(appId: string, redirectUri: string, state?: string): string {
    const baseURL = 'https://api.instagram.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      ...(state && { state })
    });

    return `${baseURL}?${params.toString()}`;
  }

  /**
   * Extract code from authorization callback
   * @param url - Callback URL with authorization code
   */
  extractCodeFromCallback(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('code');
    } catch (error) {
      console.error('Error extracting code from callback:', error);
      return null;
    }
  }

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code
   * @param appId - Facebook app ID
   * @param appSecret - Facebook app secret
   * @param redirectUri - OAuth redirect URI
   */
  async exchangeCodeForToken(
    code: string,
    appId: string,
    appSecret: string,
    redirectUri: string
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseURL}/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code: code,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Token exchange error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
}

export const instagramService = new InstagramService();
