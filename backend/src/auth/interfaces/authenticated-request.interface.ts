import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}
