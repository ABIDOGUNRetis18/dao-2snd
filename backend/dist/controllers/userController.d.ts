import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare function getAllUsersController(req: Request, res: Response): Promise<void>;
export declare function createUserController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUserController(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteUserController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUserProfileController(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map