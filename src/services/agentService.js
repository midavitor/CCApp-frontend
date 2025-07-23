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
 * Servicio para manejar operaciones con agentes en Firestore
 */
export class AgentService {
  
  /**
   * Obtener información de un agente por su UID de Firebase
   * @param {string} uid - UID de Firebase del agente
   * @returns {Promise<Object>} Datos del agente
   */
  static async getAgentByUid(uid) {
    try {
      const q = query(
        collection(db, 'agents'), 
        where('uid', '==', uid)
      );
      const agentsSnapshot = await getDocs(q);
      
      if (!agentsSnapshot.empty) {
        const agentDoc = agentsSnapshot.docs[0];
        return {
          success: true,
          data: { id: agentDoc.id, ...agentDoc.data() }
        };
      } else {
        return {
          success: false,
          message: 'Agente no encontrado por UID'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener información de un agente por su ID de documento
   * @param {string} agentId - ID del documento del agente
   * @returns {Promise<Object>} Datos del agente
   */
  static async getAgentById(agentId) {
    try {
      const agentDoc = await getDoc(doc(db, 'agents', agentId));
      if (agentDoc.exists()) {
        return {
          success: true,
          data: { id: agentDoc.id, ...agentDoc.data() }
        };
      } else {
        return {
          success: false,
          message: 'Agente no encontrado'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener información de un agente por su email
   * @param {string} email - Email del agente
   * @returns {Promise<Object>} Datos del agente
   */
  static async getAgentByEmail(email) {
    try {
      const q = query(
        collection(db, 'agents'), 
        where('email', '==', email)
      );
      const agentsSnapshot = await getDocs(q);
      
      if (!agentsSnapshot.empty) {
        const agentDoc = agentsSnapshot.docs[0];
        return {
          success: true,
          data: { id: agentDoc.id, ...agentDoc.data() }
        };
      } else {
        return {
          success: false,
          message: 'Agente no encontrado por email'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener todos los agentes
   * @returns {Promise<Object>} Lista de agentes
   */
  static async getAllAgents() {
    try {
      const agentsSnapshot = await getDocs(collection(db, 'agents'));
      const agents = agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: agents
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener agentes por equipo
   * @param {string} teamId - ID del equipo
   * @returns {Promise<Object>} Lista de agentes del equipo
   */
  static async getAgentsByTeam(teamId) {
    try {
      const q = query(
        collection(db, 'agents'), 
        where('teamID', '==', teamId)
      );
      const agentsSnapshot = await getDocs(q);
      const agents = agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: agents
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar estado de un agente
   * @param {string} agentId - ID del agente
   * @param {string} status - Nuevo estado (available, busy, offline)
   * @returns {Promise<Object>} Resultado de la actualización
   */
  static async updateAgentStatus(agentId, status) {
    try {
      await updateDoc(doc(db, 'agents', agentId), {
        status: status,
        lastActivity: Timestamp.now()
      });
      
      return {
        success: true,
        message: 'Estado actualizado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Escuchar cambios en tiempo real de un agente
   * @param {string} agentId - ID del agente
   * @param {Function} callback - Función a ejecutar cuando cambien los datos
   * @returns {Function} Función para desuscribirse
   */
  static onAgentChange(agentId, callback) {
    return onSnapshot(doc(db, 'agents', agentId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  /**
   * Escuchar cambios en tiempo real de todos los agentes
   * @param {Function} callback - Función a ejecutar cuando cambien los datos
   * @returns {Function} Función para desuscribirse
   */
  static onAgentsChange(callback) {
    return onSnapshot(collection(db, 'agents'), (snapshot) => {
      const agents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(agents);
    });
  }
}

export default AgentService;
