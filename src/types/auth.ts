export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  surname?: string;
  department_name?: string;
  phone?: string;
  foreign_id?: string;
  ad_user?: boolean;
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
