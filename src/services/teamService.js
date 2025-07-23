import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Servicio para manejar operaciones con equipos en Firestore
 */
export class TeamService {
  
  /**
   * Obtener información de un equipo por su ID
   * @param {string} teamId - ID del equipo
   * @returns {Promise<Object>} Datos del equipo
   */
  static async getTeamById(teamId) {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (teamDoc.exists()) {
        return {
          success: true,
          data: { id: teamDoc.id, ...teamDoc.data() }
        };
      } else {
        return {
          success: false,
          message: 'Equipo no encontrado'
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
   * Obtener todos los equipos
   * @returns {Promise<Object>} Lista de equipos
   */
  static async getAllTeams() {
    try {
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: teams
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar si un agente es supervisor de un equipo
   * @param {string} agentId - ID del agente
   * @param {string} teamId - ID del equipo
   * @returns {Promise<boolean>} True si es supervisor
   */
  static async isAgentSupervisor(agentId, teamId) {
    try {
      const teamResult = await this.getTeamById(teamId);
      if (teamResult.success) {
        const supervisors = teamResult.data.supervisors || [];
        return supervisors.includes(agentId);
      }
      return false;
    } catch (error) {
      console.error('Error verificando supervisor:', error);
      return false;
    }
  }

  /**
   * Obtener equipos donde un agente es supervisor
   * @param {string} agentId - ID del agente
   * @returns {Promise<Object>} Lista de equipos donde es supervisor
   */
  static async getTeamsBySupervisor(agentId) {
    try {
      const teamsResult = await this.getAllTeams();
      if (teamsResult.success) {
        const supervisorTeams = teamsResult.data.filter(team => {
          const supervisors = team.supervisors || [];
          return supervisors.includes(agentId);
        });
        
        return {
          success: true,
          data: supervisorTeams
        };
      }
      return teamsResult;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener miembros de un equipo con detalles
   * @param {string} teamId - ID del equipo
   * @returns {Promise<Object>} Lista de miembros con sus datos
   */
  static async getTeamMembers(teamId) {
    try {
      const teamResult = await this.getTeamById(teamId);
      if (!teamResult.success) {
        return teamResult;
      }

      const members = teamResult.data.members || [];
      const memberDetails = [];

      // Importar AgentService para obtener detalles de agentes
      const { AgentService } = await import('./agentService');

      for (const memberId of members) {
        const agentResult = await AgentService.getAgentById(memberId);
        if (agentResult.success) {
          memberDetails.push(agentResult.data);
        }
      }

      return {
        success: true,
        data: memberDetails
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Escuchar cambios en tiempo real de un equipo
   * @param {string} teamId - ID del equipo
   * @param {Function} callback - Función a ejecutar cuando cambien los datos
   * @returns {Function} Función para desuscribirse
   */
  static onTeamChange(teamId, callback) {
    return onSnapshot(doc(db, 'teams', teamId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  /**
   * Escuchar cambios en tiempo real de todos los equipos
   * @param {Function} callback - Función a ejecutar cuando cambien los datos
   * @returns {Function} Función para desuscribirse
   */
  static onTeamsChange(callback) {
    return onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(teams);
    });
  }
}

export default TeamService;
