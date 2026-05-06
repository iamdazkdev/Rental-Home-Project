import { CONFIG, HTTP_METHODS } from '../constants/api';

export const searchService = {
  performSearch: async (searchPayload) => {
    const params = new URLSearchParams();
    
    Object.keys(searchPayload).forEach(key => {
      if (searchPayload[key] !== '' && searchPayload[key] !== null) {
        if (Array.isArray(searchPayload[key])) {
          searchPayload[key].forEach(val => params.append(key, val));
        } else {
          params.append(key, searchPayload[key]);
        }
      }
    });

    const response = await fetch(`${CONFIG.API_BASE_URL}/search?${params.toString()}`, {
      method: HTTP_METHODS.GET,
    });
    
    if (!response.ok) {
      throw new Error(`Search failed`);
    }
    
    return await response.json();
  }
};
