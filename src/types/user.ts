export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  surname?: string;
  department_name?: string;
  phone?: string;
  foreign_id?: string;
  ad_user?: boolean;
}

export interface UpdateUserRequest {
  id: number;
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  surname?: string;
  department_name?: string;
  phone?: string;
  foreign_id?: string;
  ad_user?: boolean;
}
