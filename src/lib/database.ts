// Database abstraction layer supporting both Supabase and PostgreSQL
import { supabase } from "@/integrations/supabase/client";
import { safeLocalStorage } from "./consent";

// Database provider types
export type DatabaseProvider = 'supabase' | 'postgres';

// Configuration interface
export interface DatabaseConfig {
  provider: DatabaseProvider;
  postgres?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
}

// Get database provider from environment
export const getDatabaseProvider = (): DatabaseProvider => {
  const provider = safeLocalStorage.getItem('database_provider') || 'supabase';
  return provider as DatabaseProvider;
};

// Set database provider
export const setDatabaseProvider = (provider: DatabaseProvider) => {
  safeLocalStorage.setItem('database_provider', provider);
  window.location.reload(); // Reload to apply changes
};

// Database interface for common operations
export interface DatabaseClient {
  // Paste operations
  insertPaste: (paste: any) => Promise<{ data: any; error: any }>;
  getPaste: (id: string) => Promise<{ data: any; error: any }>;
  updatePaste: (id: string, updates: any) => Promise<{ data: any; error: any }>;
  deletePaste: (id: string) => Promise<{ error: any }>;
  
  // Storage operations (for files)
  uploadFile: (bucket: string, path: string, file: Blob) => Promise<{ error: any }>;
  deleteFile: (bucket: string, path: string) => Promise<{ error: any }>;
}

// Supabase client implementation
class SupabaseClient implements DatabaseClient {
  async insertPaste(paste: any) {
    return await supabase.from('pastes').insert(paste).select().single();
  }

  async getPaste(id: string) {
    return await supabase.from('pastes').select('*').eq('id', id).single();
  }

  async updatePaste(id: string, updates: any) {
    return await supabase.from('pastes').update(updates).eq('id', id);
  }

  async deletePaste(id: string) {
    return await supabase.from('pastes').delete().eq('id', id);
  }

  async uploadFile(bucket: string, path: string, file: Blob) {
    return await supabase.storage.from(bucket).upload(path, file);
  }

  async deleteFile(bucket: string, path: string) {
    return await supabase.storage.from(bucket).remove([path]);
  }
}

// PostgreSQL client implementation (using REST API)
class PostgresClient implements DatabaseClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = safeLocalStorage.getItem('postgres_api_url') || 'http://localhost:3001/api';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: data.error || 'Request failed' };
    }

    return { data, error: null };
  }

  async insertPaste(paste: any) {
    return await this.request('/pastes', {
      method: 'POST',
      body: JSON.stringify(paste),
    });
  }

  async getPaste(id: string) {
    return await this.request(`/pastes/${id}`);
  }

  async updatePaste(id: string, updates: any) {
    return await this.request(`/pastes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePaste(id: string) {
    return await this.request(`/pastes/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadFile(bucket: string, path: string, file: Blob) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const response = await fetch(`${this.baseUrl}/storage/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      return { error };
    }

    return { error: null };
  }

  async deleteFile(bucket: string, path: string) {
    return await this.request(`/storage/${bucket}/${path}`, {
      method: 'DELETE',
    });
  }
}

// Get the appropriate database client
export const getDatabase = (): DatabaseClient => {
  const provider = getDatabaseProvider();
  
  switch (provider) {
    case 'postgres':
      return new PostgresClient();
    case 'supabase':
    default:
      return new SupabaseClient();
  }
};

// Database configuration utilities
export const isPostgresConfigured = (): boolean => {
  return !!safeLocalStorage.getItem('postgres_api_url');
};

export const configurePostgres = (apiUrl: string) => {
  safeLocalStorage.setItem('postgres_api_url', apiUrl);
};

export const getPostgresConfig = () => {
  return safeLocalStorage.getItem('postgres_api_url');
};