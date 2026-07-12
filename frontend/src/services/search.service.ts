import { apiClient } from './apiClient';

export interface SearchResults {
  assets: { id: string; name: string; assetTag: string; status: string }[];
  employees: { id: string; name: string; email: string; role: string }[];
  departments: { id: string; name: string }[];
}

export const searchService = {
  query: (q: string) => apiClient.get<SearchResults>('/search', { params: { q } }).then((r) => r.data),
};
