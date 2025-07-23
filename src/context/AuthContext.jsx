import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/authService';
import AgentService from '../services/agentService';

const AuthContext = createContext();

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

/**
 * Provider del contexto de autenticación
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Observar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Obtener datos del agente desde Firestore por UID
        try {
          // Buscar por UID de Firebase (que está en el campo 'uid' del documento)
          const agentResult = await AgentService.getAgentByUid(firebaseUser.uid);
          
          if (agentResult.success) {
            setAgentData(agentResult.data);
            console.log('Datos del agente cargados:', agentResult.data);
          } else {
            console.warn('No se encontraron datos del agente:', firebaseUser.uid);
            setError('No se encontraron datos del agente en el sistema');
          }
        } catch (error) {
          console.error('Error obteniendo datos del agente:', error);
          setError('Error cargando datos del agente');
        }
      } else {
        setUser(null);
        setAgentData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Iniciar sesión
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.login(email, password);
      
      if (!result.success) {
        setError(result.message);
        return result;
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado durante el login';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.logout();
      
      if (result.success) {
        setUser(null);
        setAgentData(null);
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado durante el logout';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar estado del agente
   */
  const updateAgentStatus = async (status) => {
    if (!agentData) return { success: false, message: 'No hay agente autenticado' };
    
    try {
      const result = await AgentService.updateAgentStatus(agentData.id, status);
      
      if (result.success) {
        setAgentData(prev => ({ ...prev, status }));
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Error actualizando estado' };
    }
  };

  /**
   * Verificar si el usuario es supervisor
   */
  const isSupervisor = () => {
    return agentData?.role === 'supervisor' || agentData?.role === 'admin';
  };

  /**
   * Verificar si el usuario es administrador
   */
  const isAdmin = () => {
    return agentData?.role === 'admin';
  };

  const value = {
    // Estado
    user,
    agentData,
    loading,
    error,
    
    // Acciones
    login,
    logout,
    updateAgentStatus,
    
    // Utilidades
    isAuthenticated: !!user,
    isSupervisor,
    isAdmin,
    
    // Limpiar error
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
