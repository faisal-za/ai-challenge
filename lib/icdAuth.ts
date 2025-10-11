/**
 * ICD-11 API OAuth2 Token Manager
 * Handles automatic token acquisition and refresh using axios
 */

import axios from 'axios';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class IcdAuthService {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get valid access token (automatically refreshes if expired)
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid (with 5-minute buffer)
    if (this.token && Date.now() < this.tokenExpiry - 300000) {
      return this.token;
    }

    // Fetch new token
    await this.refreshToken();
    return this.token!;
  }

  /**
   * Fetch new OAuth2 token from WHO ICD API
   */
  private async refreshToken(): Promise<void> {
    const clientId = process.env.ICD_CLIENT_ID;
    const clientSecret = process.env.ICD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'ICD OAuth2 credentials not found. Please set ICD_CLIENT_ID and ICD_CLIENT_SECRET in .env\n' +
        'Obtain credentials from: https://icd.who.int/icdapi'
      );
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'icdapi_access',
      });

      const response = await axios.post<TokenResponse>(
        'https://icdaccessmanagement.who.int/connect/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.token = response.data.access_token;
      // Set expiry with 5-minute safety buffer
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log(`[ICD Auth] Token acquired, expires in ${response.data.expires_in}s`);
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      throw new Error(
        `Failed to acquire ICD API token: ${errorMsg}\n` +
        'Verify your ICD_CLIENT_ID and ICD_CLIENT_SECRET are correct.'
      );
    }
  }

  /**
   * Force token refresh (useful for testing)
   */
  async forceRefresh(): Promise<void> {
    this.token = null;
    this.tokenExpiry = 0;
    await this.refreshToken();
  }
}

// Singleton instance
export const icdAuthService = new IcdAuthService();
