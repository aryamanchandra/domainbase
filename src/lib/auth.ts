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

export function generateToken(payload: { userId?: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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

export async function createUser(
  username: string, 
  password: string, 
  role: 'admin' | 'user' = 'user',
  oauthData?: {
    email?: string;
    name?: string;
    picture?: string;
    googleId?: string;
  }
): Promise<User> {
  const db = await getDb();
  const hashedPassword = password ? await hashPassword(password) : '';
  
  const user = {
    username,
    password: hashedPassword,
    role,
    createdAt: new Date(),
    ...oauthData,
  };
  
  await db.collection('users').insertOne(user as any);
  return user;
}

export async function findOrCreateOAuthUser(
  email: string,
  userData: {
    name?: string;
    picture?: string;
    googleId: string;
  }
): Promise<User> {
  const db = await getDb();
  
  // Try to find user by googleId first
  let user = await db.collection<User>('users').findOne({ googleId: userData.googleId });
  
  if (!user) {
    // Try to find by email
    user = await db.collection<User>('users').findOne({ email });
    
    if (!user) {
      // Create new user
      const newUser = {
        username: email,
        email,
        name: userData.name,
        picture: userData.picture,
        googleId: userData.googleId,
        password: '', // No password for OAuth users
        role: 'user' as const,
        createdAt: new Date(),
      };
      
      await db.collection('users').insertOne(newUser as any);
      return newUser as User;
    } else {
      // Update existing user with Google ID
      await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            googleId: userData.googleId,
            picture: userData.picture,
            name: userData.name || user.name,
          }
        }
      );
      user.googleId = userData.googleId;
    }
  }
  
  return user;
}

