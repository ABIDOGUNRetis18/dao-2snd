import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare function getTasksByDao(req: Request, res: Response): Promise<void>;
export declare function createTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function assignTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateTaskStatus(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTaskProgress(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=taskController.d.ts.map