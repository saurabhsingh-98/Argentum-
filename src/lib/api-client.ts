/**
 * Argentum Unified API Client
 * Handles CSRF tokens, credentials, and common error patterns.
 */

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiClient(url: string, options: RequestOptions = {}) {
  const { token, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');
  
  // Attach CSRF token if provided
  if (token) {
    headers.set('x-csrf-token', token);
  }

  const config: RequestInit = {
    ...rest,
    headers,
    // CRITICAL: Ensure cookies are sent with every request
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Handle security-specific error cases with helpful messages
      if (response.status === 403) {
        if (data.error === 'CSRF token missing') {
          throw new Error('Security session expired or blocked. Please refresh the page.');
        }
        if (data.error === 'Invalid security token') {
          throw new Error('Security mismatch. Please try refreshing or logging out/in.');
        }
        throw new Error(data.error || 'Access Denied: You do not have permission for this action.');
      }
      
      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in as an administrator.');
      }

      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[apiClient] Error fetching ${url}:`, error);
    throw error;
  }
}
