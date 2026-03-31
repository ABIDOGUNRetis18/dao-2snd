import { query } from '../utils/database';
import bcrypt from 'bcryptjs';

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

export async function getUserByUsername(username: string): Promise<UserWithoutPassword | null> {
  try {
    const result = await query(
      'SELECT id, username, email, url_photo, role_id, created_at, updated_at FROM users WHERE username = $1',
      [username]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur par username:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserWithoutPassword | null> {
  try {
    const result = await query(
      'SELECT id, username, email, url_photo, role_id, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur par email:', error);
    return null;
  }
}

export async function getUserWithPassword(username: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur avec mot de passe:', error);
    return null;
  }
}

export async function updateUserLastLogin(userId: number): Promise<void> {
  try {
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<UserWithoutPassword[]> {
  try {
    const result = await query(
      'SELECT id, username, email, url_photo, role_id, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    
    return result.rows;
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les utilisateurs:', error);
    return [];
  }
}

export async function createUser(userData: {
  username: string;
  email: string;
  password: string;
  role_id: number;
  url_photo?: string;
}): Promise<UserWithoutPassword> {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const result = await query(`
      INSERT INTO users (username, email, password, role_id, url_photo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, url_photo, role_id, created_at, updated_at
    `, [
      userData.username,
      userData.email,
      hashedPassword,
      userData.role_id,
      userData.url_photo || null
    ]);

    if (result.rows.length === 0) {
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
}
