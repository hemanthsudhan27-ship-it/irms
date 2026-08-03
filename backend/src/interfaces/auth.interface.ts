import { Request } from 'express';
import { IUserResponse } from './user.interface.js';

export interface IJwtPayload {
  userId: string;
  email: string;
  roleId: string;
  roleSlug: string;
  companyId: string | null;
  complexId: string | null;
  residentId: string | null;
  iat?: number;
  exp?: number;
}

export interface IAuthenticatedRequest extends Request {
  user?: IJwtPayload;
}

export interface ILoginResponse {
  user: IUserResponse;
  accessToken: string;
}
