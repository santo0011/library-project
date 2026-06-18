import { authService } from '../services/AuthService.js';

export const seedDefaultAdmin = async () => {
  try {
    await authService.seedDefaultAdmin();
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
  }
};