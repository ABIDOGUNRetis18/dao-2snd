import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare function getTasksByDao(req: Request, res: Response): Promise<void>;
export declare function createTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTaskProgress(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function assignTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDaoTasksStats(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=taskController_v2.d.ts.map