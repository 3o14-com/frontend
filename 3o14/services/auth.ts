import { AUTH_CONFIG } from '@/constants/auth';
import { API_ENDPOINTS } from '@/constants/api';
import * as Linking from 'expo-linking';

export const AuthService = {
  async registerApp(server: string) {
    const response = await fetch(`https://${server}${API_ENDPOINTS.APPS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_name: AUTH_CONFIG.CLIENT_NAME,
        redirect_uris: Linking.createURL(AUTH_CONFIG.REDIRECT_URI),
        scopes: AUTH_CONFIG.SCOPES,
        website: AUTH_CONFIG.WEBSITE,
      }).toString(),
    });

    return response.json();
  },

  async getAccessToken(server: string, params: {
    client_id: string;
    client_secret: string;
    code: string;
  }) {
    const response = await fetch(`https://${server}${API_ENDPOINTS.TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        ...params,
        grant_type: 'authorization_code',
        redirect_uri: Linking.createURL(AUTH_CONFIG.REDIRECT_URI),
        scope: AUTH_CONFIG.SCOPES,
      }).toString(),
    });

    return response.json();
  },
};
