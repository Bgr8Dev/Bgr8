import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextValue';
import type { AuthContextType } from '../contexts/AuthContextValue';

export const useAuth = (): AuthContextType => useContext(AuthContext); 