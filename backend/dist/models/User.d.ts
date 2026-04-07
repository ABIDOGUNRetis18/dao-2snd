export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    url_photo?: string;
    role_id: number;
    created_at: Date;
    updated_at: Date;
}
export interface UserWithoutPassword {
    id: number;
    username: string;
    email: string;
    url_photo?: string;
    role_id: number;
    created_at: Date;
    updated_at: Date;
}
export declare function getUserByUsername(username: string): Promise<UserWithoutPassword | null>;
export declare function getUserByEmail(email: string): Promise<UserWithoutPassword | null>;
export declare function getUserWithPassword(username: string): Promise<User | null>;
export declare function updateUserLastLogin(userId: number): Promise<void>;
export declare function getAllUsers(): Promise<UserWithoutPassword[]>;
export declare function createUser(userData: {
    username: string;
    email: string;
    password: string;
    role_id: number;
    url_photo?: string;
}): Promise<UserWithoutPassword>;
//# sourceMappingURL=User.d.ts.map