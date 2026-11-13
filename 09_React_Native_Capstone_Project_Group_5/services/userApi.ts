/**
 * User API Service - DummyJSON Users
 * Docs: https://dummyjson.com/docs/users
 *
 * NOTE: DummyJSON simulates writes. POST /users/add and PUT /users/{id}
 * return the "updated" object but nothing is persisted server side, so the
 * app keeps the local copy as the source of truth.
 */
import axios, { isAxiosError } from 'axios';
import { ProfileUpdate, RegisterData } from '@/types/auth';

const client = axios.create({
    baseURL: 'https://dummyjson.com/users',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

export const userApi = {
    /** POST /users/add - simulated user creation, returns the new id */
    async addUser(data: RegisterData): Promise<{ id: number }> {
        const response = await client.post<{ id: number }>('/add', {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            password: data.password,
            email: data.email,
            age: data.age,
            gender: data.gender,
        });
        return response.data;
    },

    /**
     * PUT /users/{id}. Locally registered accounts have ids that do not exist
     * on DummyJSON (404); in that case the update is applied locally only.
     */
    async updateUser(id: number, data: ProfileUpdate): Promise<ProfileUpdate> {
        try {
            await client.put(`/${id}`, data);
        } catch (error) {
            if (!(isAxiosError(error) && error.response?.status === 404)) throw error;
        }
        return data;
    },
};