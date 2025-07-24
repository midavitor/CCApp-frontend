import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc,
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
   * Crear un nuevo agente en Firestore
   * @param {Object} agentData - Datos del agente
   * @returns {Promise<Object>} Resultado de la creación
   */
  static async createAgent(agentData) {
    try {
      console.log('🔍 AgentService.createAgent - Iniciando creación con datos:', agentData);
      // Usar addDoc para crear un documento con ID autogenerado
      const agentDocRef = await addDoc(collection(db, 'agents'), {
        ...agentData,
        dateCreated: new Date(),
        lastUpdated: new Date()
      });
      console.log('✅ AgentService.createAgent - Documento creado con ID:', agentDocRef.id);
      return {
        success: true,
        id: agentDocRef.id,
        message: 'Agente creado exitosamente'
      };
    } catch (error) {
      console.error('❌ AgentService.createAgent - Error:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error code:', error.code);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Eliminar un agente por su ID
   * @param {string} agentId - ID del documento del agente
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  static async deleteAgent(agentId) {
    try {
      console.log('🗑️ AgentService.deleteAgent - Eliminando agente:', agentId);
      
      const agentDocRef = doc(db, 'agents', agentId);
      await deleteDoc(agentDocRef);
      
      console.log('✅ AgentService.deleteAgent - Agente eliminado exitosamente');
      
      return {
        success: true,
        message: 'Agente eliminado exitosamente'
      };
    } catch (error) {
      console.error('❌ AgentService.deleteAgent - Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener todos los agentes con información completa
   * @returns {Promise<Object>} Lista de agentes con emails
   */
  static async getAllAgentsWithEmails() {
    try {
      const agentsSnapshot = await getDocs(collection(db, 'agents'));
      const agents = agentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Si no hay email en el documento, intentamos construirlo
          email: data.email || data.userEmail || data.emailAddress || 
                 (data.name ? `${data.name.toLowerCase().replace(/\s+/g, '.')}@ccapp.com` : 'Sin email')
        };
      });
      
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