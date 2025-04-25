
import { User } from "../context/AuthContext";

// Basic utility functions for auth
export const isUserActive = (user: User): boolean => {
  return user.isActive !== false; // Default to true if not specified
};

export const formatRole = (role: string): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
