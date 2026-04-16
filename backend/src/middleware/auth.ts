import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    email: string;
    roleId: number;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
}

export function requireRole(allowedRoles: number[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour accéder à cette ressource'
      });
    }

    next();
  };
}

// Middleware pour vérifier si l'utilisateur est admin (role_id = 2)
export const requireAdmin = requireRole([2]);

// Middleware pour vérifier si l'utilisateur est admin (2) ou directeur (1)
export const requireAdminOrDirector = requireRole([1, 2]);

// Middleware pour vérifier si l'utilisateur est admin (2) ou chef de projet (3)
export const requireAdminOrChef = requireRole([2, 3]);

// Middleware pour vérifier si l'utilisateur a un rôle de gestion (1, 2, 3)
export const requireManagementRole = requireRole([1, 2, 3]);
