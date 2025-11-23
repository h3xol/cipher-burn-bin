// Database abstraction layer (PostgreSQL only)

// Database provider types
export type DatabaseProvider = 'postgres';

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
export const getDatabaseProvider = (): DatabaseProvider => 'postgres';

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
  downloadFile: (bucket: string, path: string) => Promise<{ data: Blob | null; error: any }>;
}

// PostgreSQL client implementation (using REST API)
class PostgresClient implements DatabaseClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_POSTGRES_API_URL || 'http://localhost:3001/api';
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

  async downloadFile(bucket: string, path: string) {
    const response = await fetch(`${this.baseUrl}/storage/${bucket}/${path}`);

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error };
    }

    const blob = await response.blob();
    return { data: blob, error: null };
  }
}

// Get the appropriate database client
export const getDatabase = (): DatabaseClient => {
  return new PostgresClient();
};

// Database configuration utilities
export const isPostgresConfigured = (): boolean => {
  return !!import.meta.env.VITE_POSTGRES_API_URL;
};

export const configurePostgres = (apiUrl: string) => {
  console.warn('PostgreSQL API URL should be set in .env file using VITE_POSTGRES_API_URL');
};

export const getPostgresConfig = () => {
  return import.meta.env.VITE_POSTGRES_API_URL || null;
};
