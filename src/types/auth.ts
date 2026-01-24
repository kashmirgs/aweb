export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}
