import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';

export const useAuth = (): AuthContextType => useContext(AuthContext); 