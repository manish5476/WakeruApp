import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authApi } from '@/core/api/services';
import { storage } from '@/core/storage';
import { IUser } from '@/types/user.types';
import { TokenPair } from '@/types/auth.types';

export interface AuthStore {
  user: IUser | null;
  tokens: TokenPair | null;
  firebaseUser: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
    phoneNumber: string,
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  updateProfile: (data: Partial<IUser>) => Promise<void>;
  setUpiId: (upiId: string) => Promise<void>;
  verifyUpi: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: IUser | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const storedTokens = await storage.getTokens();

      if (storedTokens && storedTokens.accessToken) {
        const tokenPair: TokenPair = {
          accessToken: storedTokens.accessToken,
          refreshToken: storedTokens.refreshToken || '',
        };
        set({ tokens: tokenPair });

        try {
          const response = await authApi.getProfile();
          if (response.success && response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }
        } catch {
          if (storedTokens.refreshToken) {
            try {
              const refreshResponse = await authApi.refreshToken(
                storedTokens.refreshToken,
              );
              if (refreshResponse.success && refreshResponse.data) {
                await storage.saveTokens(refreshResponse.data);
                set({ tokens: refreshResponse.data });

                const profileResponse = await authApi.getProfile();
                if (profileResponse.success && profileResponse.data?.user) {
                  set({
                    user: profileResponse.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                    isInitialized: true,
                  });
                  return;
                }
              }
            } catch {
              await storage.clearTokens();
            }
          }
        }
      }

      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      set({
        isLoading: false,
        isInitialized: true,
        error: 'Failed to initialize auth',
      });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const idToken = await userCredential.user.getIdToken(true);

      const response = await authApi.login(idToken);
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        await storage.saveTokens(tokens);

        set({
          user,
          tokens,
          firebaseUser: userCredential.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed. Please try again.',
      });
      throw error;
    }
  },

  registerWithEmail: async (
    email: string,
    password: string,
    displayName: string,
    phoneNumber: string,
  ) => {
    let createdFirebaseUser: any = null;
    try {
      set({ isLoading: true, error: null });

      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      createdFirebaseUser = userCredential.user;
      const idToken = await createdFirebaseUser.getIdToken(true);

      const response = await authApi.register(idToken, {
        displayName,
        phoneNumber: phoneNumber || undefined,
      });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        await storage.saveTokens(tokens);

        set({
          user,
          tokens,
          firebaseUser: createdFirebaseUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      if (createdFirebaseUser) {
        await createdFirebaseUser.delete().catch(() => {});
      }
      set({
        isLoading: false,
        error: error.message || 'Registration failed. Please try again.',
      });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });

      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken =
        (signInResult as any)?.data?.idToken || (signInResult as any)?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed to return a valid ID token.');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential =
        await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;

      const firebaseIdToken = await firebaseUser.getIdToken(true);

      let response: any;
      try {
        response = await authApi.login(firebaseIdToken);
      } catch (loginError: any) {
        if (
          loginError?.response?.status === 404 ||
          loginError.message?.includes('No account found')
        ) {
          response = await authApi.register(firebaseIdToken, {
            displayName: firebaseUser.displayName || 'Traveler',
          });
        } else {
          throw loginError;
        }
      }

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        await storage.saveTokens(tokens);

        set({
          user,
          tokens,
          firebaseUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || 'Google login failed');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Google login failed. Please try again.',
      });
      throw error;
    }
  },

  loginWithGoogleIdToken: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential =
        await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;
      const firebaseIdToken = await firebaseUser.getIdToken(true);

      let response: any;
      try {
        response = await authApi.login(firebaseIdToken);
      } catch (loginError: any) {
        if (
          loginError?.response?.status === 404 ||
          loginError.message?.includes('No account found')
        ) {
          response = await authApi.register(firebaseIdToken, {
            displayName: firebaseUser.displayName || 'Traveler',
          });
        } else {
          throw loginError;
        }
      }

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        await storage.saveTokens(tokens);

        set({
          user,
          tokens,
          firebaseUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || 'Google login failed');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Google login failed.',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    const { tokens } = get();

    await Promise.allSettled([
      tokens?.refreshToken
        ? authApi.logout(tokens.refreshToken)
        : Promise.resolve(),
      auth().signOut(),
    ]);

    try {
      await Promise.all([storage.clearTokens(), storage.clearCachedData()]);
    } catch (e) {
      console.error('Failed to clear storage:', e);
    } finally {
      set({
        user: null,
        tokens: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  logoutAll: async () => {
    set({ isLoading: true });

    await Promise.allSettled([authApi.logoutAll(), auth().signOut()]);

    try {
      await Promise.all([storage.clearTokens(), storage.clearCachedData()]);
    } catch (e) {
      console.error('Failed to clear tokens:', e);
    } finally {
      set({
        user: null,
        tokens: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  forgotPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        throw new Error(res.message || 'Failed to request password reset.');
      }
      await auth().sendPasswordResetEmail(email);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to send reset email.',
      });
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not logged in.');
      }

      const credential = auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await currentUser.reauthenticateWithCredential(credential);
      await currentUser.updatePassword(newPassword);

      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update password.',
      });
      throw error;
    }
  },

  setPassword: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not logged in.');
      }

      const credential = auth.EmailAuthProvider.credential(
        currentUser.email,
        password,
      );
      await currentUser.linkWithCredential(credential);

      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to set password.',
      });
      throw error;
    }
  },

  updateProfile: async (data: Partial<IUser>) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.success && response.data?.user) {
        set({ user: response.data.user });
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setUpiId: async (upiId: string) => {
    try {
      const response = await authApi.setUpiId(upiId);
      if (response.success && response.data?.user) {
        set({ user: response.data.user });
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  verifyUpi: async () => {
    try {
      const response = await authApi.verifyUpi();
      if (response.success) {
        const profileResponse = await authApi.getProfile();
        if (profileResponse.success && profileResponse.data?.user) {
          set({ user: profileResponse.data.user });
        }
        return response.data?.upiVerified || false;
      }
      return false;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user: IUser | null) => set({ user, isAuthenticated: !!user }),
}));

export default useAuthStore;
