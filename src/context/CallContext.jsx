import React, { createContext, useContext, useEffect, useState } from 'react';
import CallService from '../services/callService';
import { useAuth } from './AuthContext';

const CallContext = createContext();

/**
 * Hook para usar el contexto de llamadas
 */
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall debe ser usado dentro de CallProvider');
  }
  return context;
};

/**
 * Provider del contexto de llamadas
 */
export const CallProvider = ({ children }) => {
  const { agentData, isAuthenticated } = useAuth();
  
  const [activeCalls, setActiveCalls] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Escuchar llamadas activas en tiempo real
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = CallService.onActiveCallsChange((calls) => {
      setActiveCalls(calls);
      
      // Verificar si hay una llamada activa para el agente actual
      if (agentData) {
        const agentActiveCall = calls.find(call => call.agentID === agentData.agentID);
        setCurrentCall(agentActiveCall || null);
      }
    });

    return unsubscribe;
  }, [isAuthenticated, agentData]);

  // Cargar historial de llamadas del agente
  useEffect(() => {
    if (!agentData) return;

    const loadCallHistory = async () => {
      setLoading(true);
      try {
        const result = await CallService.getCallsByAgent(agentData.agentID, 20);
        if (result.success) {
          setCallHistory(result.data);
        }
      } catch (error) {
        setError('Error cargando historial de llamadas');
      } finally {
        setLoading(false);
      }
    };

    loadCallHistory();
  }, [agentData]);

  /**
   * Iniciar una nueva llamada
   */
  const startCall = async (callData) => {
    if (!agentData) {
      return { success: false, message: 'No hay agente autenticado' };
    }

    setLoading(true);
    setError(null);

    try {
      const newCallData = {
        ...callData,
        agentID: agentData.agentID,
        teamID: agentData.teamID
      };

      const result = await CallService.createCall(newCallData);
      
      if (result.success) {
        // La llamada se actualizará automáticamente por el listener
        console.log('Llamada iniciada:', result.callId);
      } else {
        setError(result.error || 'Error iniciando llamada');
      }

      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado iniciando llamada';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Finalizar llamada actual
   */
  const endCall = async (endData = {}) => {
    if (!currentCall) {
      return { success: false, message: 'No hay llamada activa' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CallService.endCall(currentCall.id, endData);
      
      if (result.success) {
        setCurrentCall(null);
        // Recargar historial
        const historyResult = await CallService.getCallsByAgent(agentData.agentID, 20);
        if (historyResult.success) {
          setCallHistory(historyResult.data);
        }
      } else {
        setError(result.error || 'Error finalizando llamada');
      }

      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado finalizando llamada';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener estadísticas de llamadas
   */
  const getCallStats = async (startDate, endDate) => {
    setLoading(true);
    try {
      const result = await CallService.getCallStats(startDate, endDate);
      return result;
    } catch (error) {
      setError('Error obteniendo estadísticas');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refrescar datos de llamadas
   */
  const refreshData = async () => {
    if (!agentData) return;

    setLoading(true);
    try {
      const [activeResult, historyResult] = await Promise.all([
        CallService.getActiveCalls(),
        CallService.getCallsByAgent(agentData.agentID, 20)
      ]);

      if (activeResult.success) {
        setActiveCalls(activeResult.data);
      }

      if (historyResult.success) {
        setCallHistory(historyResult.data);
      }
    } catch (error) {
      setError('Error refrescando datos');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Estado
    activeCalls,
    currentCall,
    callHistory,
    loading,
    error,
    
    // Acciones
    startCall,
    endCall,
    getCallStats,
    refreshData,
    
    // Utilidades
    hasActiveCall: !!currentCall,
    totalActiveCalls: activeCalls.length,
    
    // Limpiar error
    clearError: () => setError(null)
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export default CallContext;
