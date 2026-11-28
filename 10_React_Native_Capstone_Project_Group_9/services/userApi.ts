import axios from 'axios';
import { AuthUser } from '@/types/auth';

const client = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export type UserProfileUpdate = Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'username'>;

export const userApi = {
  async updateUser(id: number, profile: UserProfileUpdate): Promise<Partial<AuthUser>> {
    const response = await client.put<Partial<AuthUser>>(`/users/${id}`, profile);
    return response.data;
  },
};
