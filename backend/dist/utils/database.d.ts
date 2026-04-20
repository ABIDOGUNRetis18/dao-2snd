import { PoolClient } from 'pg';
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare function getClient(): Promise<PoolClient>;
export declare function initializeDatabase(): Promise<void>;
export declare function createTaskModelsTable(): Promise<void>;
export declare function createTasksTable(): Promise<void>;
//# sourceMappingURL=database.d.ts.map