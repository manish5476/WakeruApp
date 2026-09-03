export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: import('./user.types').IUser | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export interface FirebaseAuthResult {
  idToken: string;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
  };
}
