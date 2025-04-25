
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role: UserRole, secretCode?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if secret code for teachers is valid
const isValidTeacherCode = (code: string) => {
  // In a real app, this would be a more secure validation
  return code === "TEACH2025"; // Example secret code for teachers
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // console.log("Auth state changed:", event);
        setIsLoading(true);
        
        if (session?.user) {
          // User is signed in
          // Use setTimeout to avoid infinite recursion with RLS policies
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          // User is signed out
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    // Check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch user profile from Supabase
  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // console.log("Fetching user profile for:", supabaseUser.id);
      
      // Get the profile from the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (profileError) {
        // console.log("Error fetching profile, falling back to metadata:", profileError);
        // Fall back to user metadata if profile fetch fails
        const userData = supabaseUser.user_metadata;
        
        if (userData) {
          setUser({
            id: supabaseUser.id,
            name: userData.name || '',
            email: supabaseUser.email || '',
            phone: userData.phone || '',
            role: (userData.role as UserRole) || 'student',
            isActive: true,
            createdAt: supabaseUser.created_at
          });
        } else {
          // console.error("No user metadata found");
          setUser(null);
        }
      } else if (profileData) {
        // Use the profile data from the database
        setUser({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone || '',
          role: profileData.role as UserRole,
          isActive: true,
          createdAt: profileData.created_at
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      // console.error('Error in fetchUserProfile:', error);
      setUser(null);
      setIsLoading(false);
    }
  };

  // Helper function to get all stored users (admin only)
  const getAllUsers = async (): Promise<User[]> => {
    try {
      if (!user || user.role !== 'admin') {
        return [];
      }

      // Use a try/catch here to prevent breaking the app if RLS policies are not configured correctly
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) throw error;
        
        return (data || []).map(profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          role: profile.role as UserRole,
          isActive: true,
          createdAt: profile.created_at
        }));
      } catch (err) {
        // console.error('Error fetching all users, likely an RLS issue:', err);
        return [];
      }
    } catch (error) {
      // console.error('Error in getAllUsers:', error);
      return [];
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      // console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An error occurred during login.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string,
    phone: string,
    role: UserRole,
    secretCode?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    // Validate teacher secret code
    if (role === 'teacher' && (!secretCode || !isValidTeacherCode(secretCode))) {
      toast({
        title: "Registration failed",
        description: "Invalid teacher verification code.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
    
    try {
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      if (data.user) {
        toast({
          title: "Registration successful",
          description: `Welcome, ${name}!`,
        });
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      // console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An error occurred during registration.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      return true;
    } catch (error) {
      // console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        getAllUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
