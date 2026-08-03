export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface IUser {
  id: string;
  company_id: string | null;
  role_id: string;
  complex_id: string | null;
  resident_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  avatar_url: string | null;
  status: UserStatus;
  last_login: Date | null;
  email_verified: boolean;
  phone_verified: boolean;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IUserWithRole extends IUser {
  role_name: string;
  role_slug: string;
  role_permissions: Record<string, any>;
  complex_name?: string | null;
  company_name?: string | null;
}

export interface IUserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  role: {
    id: string;
    name: string;
    slug: string;
    permissions: Record<string, any>;
  };
  companyId: string | null;
  companyName?: string | null;
  complexId: string | null;
  complexName?: string | null;
  residentId: string | null;
  lastLogin: Date | null;
  createdAt: Date;
}
