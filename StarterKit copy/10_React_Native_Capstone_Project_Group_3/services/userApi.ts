/**
 * Users API Service - DummyJSON
 * Docs: https://dummyjson.com/docs/users
 */
import axios from 'axios';
import type { MeResponse, ProfileUpdate } from '@/types/auth';

const client = axios.create({
  baseURL: 'https://dummyjson.com/users',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const userApi = {
  /**
   * Update a user's profile
   * PUT /users/{id} — DummyJSON simulates the update and returns the merged user.
   */
  async updateUser(id: number, changes: ProfileUpdate): Promise<MeResponse> {
    const response = await client.put<MeResponse>(`/${id}`, changes);
    return response.data;
  },
};
