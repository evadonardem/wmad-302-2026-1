/**
 * User API Service - DummyJSON Users
 * Docs: https://dummyjson.com/docs/users
 *
 * Note: DummyJSON simulates updates. PUT /users/{id} returns the updated user,
 * but nothing is saved on the server. The app keeps the edited profile on the
 * device (see updateUser in AuthContext) so the changes survive a restart.
 */
import axios, { AxiosInstance } from 'axios';
import { AuthUser } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/users';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

class UserApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update a user's profile
   * PUT /users/{id}
   */
  async updateUser(id: number, data: UpdateProfileData): Promise<Partial<AuthUser>> {
    const response = await this.client.put<Partial<AuthUser>>(`/${id}`, data);
    return response.data;
  }
}

export const userApi = new UserApiService();
export { UserApiService };
