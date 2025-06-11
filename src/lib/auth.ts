import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './mongodb';
import { User } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUser(username: string): Promise<User | null> {
  const db = await getDb();
  const user = await db.collection<User>('users').findOne({ username });
  return user;
}

export async function createUser(username: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
  const db = await getDb();
  const hashedPassword = await hashPassword(password);
  
  const user: User = {
    username,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  };
  
  await db.collection('users').insertOne(user);
  return user;
}

