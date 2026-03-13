import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserDto } from '../types/auth.types';

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ✅ FIX: lazy initializer en lugar de useEffect+setState
  //    Esto evita el error react-hooks/set-state-in-effect
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('rover_token')
  );
  const [user, setUser] = useState<UserDto | null>(() => {
    const saved = localStorage.getItem('rover_user');
    return saved ? (JSON.parse(saved) as UserDto) : null;
  });

  const login = (token: string, user: UserDto) => {
    localStorage.setItem('rover_token', token);
    localStorage.setItem('rover_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('rover_token');
    localStorage.removeItem('rover_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, isLoading: false, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ FIX: eslint-disable para react-refresh/only-export-components
//    useAuth vive en el mismo archivo que AuthProvider por diseño (patrón Context)
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}