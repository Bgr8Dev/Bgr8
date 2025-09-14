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
      const response = await fetch(
        `${this.baseURL}/${this.version}/me/media?fields=id,media_type,media_url,caption,permalink,timestamp,thumbnail_url&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      throw error;
    }
  }

  /**
   * Get user profile information
   * @param accessToken - Instagram access token
   */
  async getUserProfile(accessToken: string): Promise<InstagramUser> {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.version}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      throw error;
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
