import { UserWithoutPassword } from '../models/User';
export interface JwtPayload {
    userId: number;
    username: string;
    email: string;
    roleId: number;
}
export declare function generateToken(user: UserWithoutPassword): string;
export declare function verifyToken(token: string): JwtPayload;
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
//# sourceMappingURL=jwt.d.ts.map