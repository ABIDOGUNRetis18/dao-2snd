import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
export declare function getAllDaos(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getNextDaoNumber(req: Request, res: Response): Promise<void>;
export declare function getDaoTypes(req: Request, res: Response): Promise<void>;
export declare function getDao(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateDao(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteDao(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function archiveDao(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getFinishedDaos(req: Request, res: Response): Promise<void>;
export declare function markDaoAsFinished(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function checkAndUpdateDaoStatus(daoId: number): Promise<void>;
export declare function diagnoseDaoStatus(req: Request, res: Response): Promise<void>;
export declare function updateAllDaoStatus(req: Request, res: Response): Promise<void>;
export declare function getMyDaos(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getDaoTasks(req: Request, res: Response): Promise<void>;
export declare function getDaoAssignableMembers(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createDao(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=daoController.d.ts.map