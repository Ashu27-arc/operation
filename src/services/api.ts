import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AuthResponse, Task, TaskFormData } from '../types';

// Try multiple fallback URLs for better connectivity
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('Using API URL from environment:', envUrl);
    return envUrl;
  }
  
  // Use Render deployment URL
  console.log('Using Render deployment URL');
  return 'https://operations-backend-vnrw.onrender.com/api';
};

const API_URL = getApiUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No token found in storage for request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    console.error('API Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Current API URL:', API_URL);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Backend server is not running or not accessible');
      console.error('Make sure backend is running on:', API_URL);
      const networkError = new Error('Backend server is not running. Please start the server.');
      (networkError as any).response = { data: { message: 'Backend server is not running. Please start the server.' } };
      return Promise.reject(networkError);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      console.log('401 Unauthorized - Clearing auth data');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Add custom error message for better user experience
      const authError = new Error('Session expired. Please login again.');
      (authError as any).response = error.response;
      (authError as any).isAuthError = true;
      return Promise.reject(authError);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
    return response.data;
  },

  registerWithOTP: async (name: string, email: string, password: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register-with-otp', { name, email, password, otp });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  loginWithOTP: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login-with-otp', { email, otp });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// OTP API
export const otpAPI = {
  sendOTP: async (email: string, purpose: string = 'verification') => {
    const response = await api.post('/otp/send', { email, purpose });
    return response.data;
  },

  verifyOTP: async (email: string, otp: string, purpose: string = 'verification') => {
    const response = await api.post('/otp/verify', { email, otp, purpose });
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks');
    return response.data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData: TaskFormData): Promise<Task> => {
    try {
      const response = await api.post<Task>('/tasks', taskData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateTask: async (id: string, taskData: TaskFormData): Promise<Task> => {
    try {
      console.log('Updating task with ID:', id);
      console.log('Task data:', taskData);
      const response = await api.put<Task>(`/tasks/${id}`, taskData);
      console.log('Update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update task error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

export default api;
