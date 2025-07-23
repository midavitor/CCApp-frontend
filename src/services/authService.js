import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from './firebaseConfig';

/**
 * Servicio de autenticación para CCApp
 * Maneja login, logout y estado de autenticación de agentes
 */
export class AuthService {
  
  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Email del agente
   * @param {string} password - Contraseña del agente
   * @returns {Promise<Object>} Usuario autenticado
   */
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user,
        message: 'Login exitoso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Cerrar sesión
   * @returns {Promise<Object>} Resultado del logout
   */
  static async logout() {
    try {
      await signOut(auth);
      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        message: 'Error al cerrar sesión'
      };
    }
  }

  /**
   * Crear nuevo usuario (solo para administradores)
   * @param {string} email - Email del nuevo agente
   * @param {string} password - Contraseña temporal
   * @returns {Promise<Object>} Usuario creado
   */
  static async createUser(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user,
        message: 'Usuario creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Observar cambios en el estado de autenticación
   * @param {Function} callback - Función a ejecutar cuando cambie el estado
   * @returns {Function} Función para desuscribirse
   */
  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Obtener usuario actual
   * @returns {Object|null} Usuario actual o null
   */
  static getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Verificar si hay usuario autenticado
   * @returns {boolean} True si hay usuario autenticado
   */
  static isAuthenticated() {
    return !!auth.currentUser;
  }

  /**
   * Obtener mensaje de error legible
   * @param {string} errorCode - Código de error de Firebase
   * @returns {string} Mensaje de error en español
   */
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'El email ya está en uso',
      'auth/weak-password': 'La contraseña es muy débil',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión'
    };
    
    return errorMessages[errorCode] || 'Error desconocido';
  }
}

export default AuthService;
