// Instagram API Service
// This service handles Instagram Basic Display API integration

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
   * Get recent media posts from Instagram account
   * @param accessToken - Instagram access token
   * @param limit - Number of posts to fetch (max 25)
   */
  async getRecentMedia(accessToken: string, limit: number = 6): Promise<InstagramPost[]> {
    try {
      // For development/demo purposes, return mock data
      // In production, you would need to set up a backend proxy to avoid CSP issues
      console.warn('Instagram API calls are blocked by CSP. Using mock data for development.');
      
      // Mock data for development - using data URIs to avoid CSP issues
      const mockPosts: InstagramPost[] = [
        {
          id: '1',
          media_type: 'IMAGE',
          media_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjM2I4MmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkluc3RhZ3JhbSBQb3N0IDE8L3RleHQ+PC9zdmc+',
          caption: 'Welcome to our platform! 🚀 #b8network #tech #innovation',
          permalink: 'https://instagram.com/p/mock1',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjM2I4MmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjE8L3RleHQ+PC9zdmc+'
        },
        {
          id: '2',
          media_type: 'IMAGE',
          media_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTBiOTgxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkluc3RhZ3JhbSBQb3N0IDI8L3RleHQ+PC9zdmc+',
          caption: 'Building the future of networking! 💡 #networking #community',
          permalink: 'https://instagram.com/p/mock2',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTBiOTgxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjI8L3RleHQ+PC9zdmc+'
        },
        {
          id: '3',
          media_type: 'VIDEO',
          media_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI1Y2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlZpZGVvIFBvc3Q8L3RleHQ+PC9zdmc+',
          caption: 'Check out our latest features! 🎥 #video #features',
          permalink: 'https://instagram.com/p/mock3',
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI1Y2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjM8L3RleHQ+PC9zdmc+'
        }
      ];

      return mockPosts.slice(0, limit);
      
      /* Production code (commented out due to CSP):
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
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Get user profile information
   * @param accessToken - Instagram access token
   */
  async getUserProfile(accessToken: string): Promise<InstagramUser> {
    try {
      // For development/demo purposes, return mock data
      console.warn('Instagram API calls are blocked by CSP. Using mock data for development.');
      console.log('Access token provided:', accessToken ? 'Yes' : 'No');
      
      // Mock user data for development
      const mockUser: InstagramUser = {
        id: 'mock_user_id',
        username: 'b8network',
        account_type: 'BUSINESS',
        media_count: 150
      };

      return mockUser;
      
      /* Production code (commented out due to CSP):
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
      // Return mock data instead of throwing to prevent app crashes
      return {
        id: 'error_user',
        username: 'instagram_user',
        account_type: 'PERSONAL',
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
