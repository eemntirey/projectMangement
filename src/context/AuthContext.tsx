import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { syncUserProfile, seedDemoDataIfEmpty } from '../firebase/firestoreService';
import { UserProfile, Organization, UserRole } from '../types';
import { DEMO_USERS, DEMO_ORG } from '../data/demoData';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  currentOrg: Organization;
  userRole: UserRole;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  switchUserPersona: (user: UserProfile) => void;
  signOut: () => Promise<void>;
  can(action: 'edit_project' | 'manage_workflow' | 'manage_fields' | 'manage_automations' | 'create_task' | 'delete_task' | 'manage_members'): boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEMO_USERS[0]);
  const [currentOrg, setCurrentOrg] = useState<Organization>(DEMO_ORG);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          if (profile) {
            setCurrentUser(profile);
            await seedDemoDataIfEmpty(profile.uid);
          }
        } catch (e) {
          console.error('Error syncing profile:', e);
        }
      } else {
        // Fallback to default demo user Sophie Martin if not logged in
        setCurrentUser(DEMO_USERS[0]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await syncUserProfile({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
        if (profile) {
          setCurrentUser(profile);
          await seedDemoDataIfEmpty(profile.uid);
        }
      }
    } catch (err: any) {
      console.warn('Sign in with Google popup failed or was closed:', err);
      // Fallback seamlessly to demo user
      setCurrentUser(DEMO_USERS[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserPersona = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setCurrentUser(DEMO_USERS[0]);
  };

  const userRole: UserRole = currentUser?.role || 'admin';

  // Granular RBAC Permissions
  const can = (action: 'edit_project' | 'manage_workflow' | 'manage_fields' | 'manage_automations' | 'create_task' | 'delete_task' | 'manage_members'): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'manager') {
      return action !== 'manage_members';
    }
    if (userRole === 'member') {
      return action === 'create_task';
    }
    // Reader has view-only access
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        currentOrg,
        userRole,
        isLoading,
        signInWithGoogle,
        switchUserPersona,
        signOut,
        can
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
