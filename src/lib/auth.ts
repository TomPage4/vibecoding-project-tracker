import { User } from '../types';
import { db } from './db';

const SESSION_KEY = 'ai-dev-tracker-session';

// Simulating salted SHA-256 with a simple hash function for the prototype
// In a real app, this would use crypto.subtle as requested.
// But since we are strictly client-side and this is a prototype, 
// I'll implement a helper that uses crypto.subtle for the actual hashing.

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const auth = {
  async register(name: string, email: string, password: string, githubUsername: string | null = null): Promise<User> {
    const existing = db.getUserByEmail(email);
    if (existing) throw new Error('User already exists');

    const salt = crypto.randomUUID();
    const hash = await hashPassword(password, salt);

    const user: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      githubUsername,
      teamIds: [],
      theme: 'system',
      createdAt: new Date().toISOString()
    };

    db.saveUser(user);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const user = db.getUserByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const hash = await hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) throw new Error('Invalid email or password');

    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return db.getUser(id) || null;
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
};
