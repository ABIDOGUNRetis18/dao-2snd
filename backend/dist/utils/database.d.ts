import { PoolClient } from 'pg';
export declare function query(text: string, params?: any[]): Promise<any>;
export declare function getClient(): Promise<PoolClient>;
export declare function initializeDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map