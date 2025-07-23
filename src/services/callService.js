import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Servicio para manejar operaciones con llamadas en Firestore
 */
export class CallService {
  
  /**
   * Crear una nueva llamada
   * @param {Object} callData - Datos de la llamada
   * @returns {Promise<Object>} Resultado de la creación
   */
  static async createCall(callData) {
    try {
      const newCall = {
        ...callData,
        startTime: Timestamp.now(),
        status: 'active'
      };
      
      const docRef = await addDoc(collection(db, 'calls'), newCall);
      
      return {
        success: true,
        callId: docRef.id,
        message: 'Llamada creada correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Finalizar una llamada
   * @param {string} callId - ID de la llamada
   * @param {Object} endData - Datos de finalización (duration, notes, evaluation)
   * @returns {Promise<Object>} Resultado de la actualización
   */
  static async endCall(callId, endData) {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        ...endData,
        endTime: Timestamp.now(),
        status: 'completed'
      });
      
      return {
        success: true,
        message: 'Llamada finalizada correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener llamadas por agente
   * @param {string} agentId - ID del agente
   * @param {number} limit - Límite de resultados (opcional)
   * @returns {Promise<Object>} Lista de llamadas
   */
  static async getCallsByAgent(agentId, limit = 50) {
    try {
      const q = query(
        collection(db, 'calls'),
        where('agentID', '==', agentId),
        orderBy('startTime', 'desc')
      );
      
      const callsSnapshot = await getDocs(q);
      const calls = callsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: calls.slice(0, limit)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener llamadas por equipo
   * @param {string} teamId - ID del equipo
   * @param {number} limit - Límite de resultados (opcional)
   * @returns {Promise<Object>} Lista de llamadas
   */
  static async getCallsByTeam(teamId, limit = 100) {
    try {
      const q = query(
        collection(db, 'calls'),
        where('teamID', '==', teamId),
        orderBy('startTime', 'desc')
      );
      
      const callsSnapshot = await getDocs(q);
      const calls = callsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: calls.slice(0, limit)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener llamadas activas
   * @returns {Promise<Object>} Lista de llamadas activas
   */
  static async getActiveCalls() {
    try {
      const q = query(
        collection(db, 'calls'),
        where('status', '==', 'active'),
        orderBy('startTime', 'desc')
      );
      
      const callsSnapshot = await getDocs(q);
      const calls = callsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: calls
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Escuchar llamadas activas en tiempo real
   * @param {Function} callback - Función a ejecutar cuando cambien las llamadas
   * @returns {Function} Función para desuscribirse
   */
  static onActiveCallsChange(callback) {
    const q = query(
      collection(db, 'calls'),
      where('status', '==', 'active'),
      orderBy('startTime', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(calls);
    });
  }

  /**
   * Escuchar cambios en tiempo real de una llamada específica
   * @param {string} callId - ID de la llamada
   * @param {Function} callback - Función a ejecutar cuando cambie la llamada
   * @returns {Function} Función para desuscribirse
   */
  static onCallChange(callId, callback) {
    return onSnapshot(doc(db, 'calls', callId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  /**
   * Obtener estadísticas de llamadas por fecha
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Object>} Estadísticas de llamadas
   */
  static async getCallStats(startDate, endDate) {
    try {
      const q = query(
        collection(db, 'calls'),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('startTime', '<=', Timestamp.fromDate(endDate))
      );
      
      const callsSnapshot = await getDocs(q);
      const calls = callsSnapshot.docs.map(doc => doc.data());
      
      // Calcular estadísticas
      const stats = {
        totalCalls: calls.length,
        completedCalls: calls.filter(call => call.status === 'completed').length,
        averageDuration: calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length || 0,
        averageEvaluation: calls.reduce((sum, call) => sum + (call.evaluation || 0), 0) / calls.length || 0,
        incomingCalls: calls.filter(call => call.type === 'incoming').length,
        outgoingCalls: calls.filter(call => call.type === 'outgoing').length
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default CallService;
