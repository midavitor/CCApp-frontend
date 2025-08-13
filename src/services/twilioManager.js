/**
 * Gestor de conexiones Twilio mejorado
 * Mejora: Separar lógica de Twilio del DialpadService
 */

import { Device } from '@twilio/voice-sdk';

class TwilioManager {
  constructor() {
    this.device = null;
    this.connection = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
  }

  /**
   * Configurar Device de Twilio con retry logic
   */
  async setupDevice(token) {
    try {
      if (this.device?.state === 'registered') {
        return { success: true, message: 'Device ya registrado' };
      }

      this.device = new Device(token, {
        codecPreferences: ['opus', 'pcmu'],
        fakeLocalDTMF: true,
        enableRingingState: true,
        allowIncomingWhileBusy: false
      });

      this.setupDeviceListeners();
      await this.registerWithRetry();

      return { success: true, message: 'Device configurado exitosamente' };
      
    } catch (error) {
      console.error('Error configurando Twilio Device:', error);
      return { 
        success: false, 
        error: error.message,
        shouldRetry: this.shouldRetryConnection(error)
      };
    }
  }

  /**
   * Registrar device con reintentos automáticos
   */
  async registerWithRetry() {
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      try {
        await this.device.register();
        this.reconnectAttempts = 0;
        console.log(`Device registrado en intento ${attempt}`);
        return;
        
      } catch (error) {
        console.warn(`Intento ${attempt} falló:`, error.message);
        
        if (attempt === this.maxReconnectAttempts) {
          throw new Error(`No se pudo registrar después de ${this.maxReconnectAttempts} intentos`);
        }
        
        await this.delay(this.reconnectDelay * attempt);
      }
    }
  }

  /**
   * Configurar listeners del Device con mejor manejo
   */
  setupDeviceListeners() {
    if (!this.device) return;

    // Limpiar listeners anteriores
    this.clearDeviceListeners();

    this.device.on('ready', () => {
      console.log('✅ Twilio Device listo');
      this.emit('deviceReady');
    });

    this.device.on('error', (error) => {
      console.error('❌ Error en Device:', error);
      this.emit('deviceError', error);
      this.handleDeviceError(error);
    });

    this.device.on('incoming', (connection) => {
      console.log('📞 Conexión entrante');
      this.handleIncomingConnection(connection);
    });

    this.device.on('offline', () => {
      console.log('📴 Device desconectado');
      this.emit('deviceOffline');
    });

    this.device.on('tokenWillExpire', () => {
      console.log('⚠️ Token expirará pronto');
      this.emit('tokenExpiring');
    });
  }

  /**
   * Manejar conexión entrante con mejor control
   */
  async handleIncomingConnection(connection) {
    try {
      this.connection = connection;
      this.setupConnectionListeners(connection);
      
      await connection.accept();
      
      this.emit('connectionEstablished', {
        connectionId: connection.parameters.CallSid,
        from: connection.parameters.From
      });
      
    } catch (error) {
      console.error('Error aceptando conexión:', error);
      this.emit('connectionError', error);
    }
  }

  /**
   * Configurar listeners de conexión
   */
  setupConnectionListeners(connection) {
    connection.on('accept', () => {
      console.log('🔊 Audio conectado');
      this.emit('audioConnected');
    });

    connection.on('disconnect', () => {
      console.log('📴 Conexión desconectada');
      this.connection = null;
      this.emit('connectionDisconnected');
    });

    connection.on('error', (error) => {
      console.error('❌ Error en conexión:', error);
      this.emit('connectionError', error);
    });

    connection.on('ringing', () => {
      console.log('📱 Llamada sonando');
      this.emit('callRinging');
    });
  }

  /**
   * Determinar si se debe reintentar la conexión
   */
  shouldRetryConnection(error) {
    const retryableErrors = [
      'Network error',
      'Connection timeout',
      'Registration failed'
    ];
    
    return retryableErrors.some(retryError => 
      error.message.toLowerCase().includes(retryError.toLowerCase())
    );
  }

  /**
   * Manejar errores del Device con recuperación automática
   */
  async handleDeviceError(error) {
    if (this.shouldRetryConnection(error) && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      await this.delay(this.reconnectDelay * this.reconnectAttempts);
      
      try {
        await this.device.register();
        this.reconnectAttempts = 0;
        this.emit('deviceRecovered');
      } catch (retryError) {
        console.error('Error en reintento:', retryError);
      }
    }
  }

  /**
   * Sistema de eventos mejorado
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data = null) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en listener ${event}:`, error);
      }
    });
  }

  /**
   * Limpiar listeners del Device
   */
  clearDeviceListeners() {
    if (this.device) {
      this.device.removeAllListeners();
    }
  }

  /**
   * Desconectar llamada actual
   */
  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
  }

  /**
   * Controlar micrófono
   */
  mute(isMuted) {
    if (this.connection) {
      this.connection.mute(isMuted);
      return !isMuted;
    }
    return false;
  }

  /**
   * Verificar si está silenciado
   */
  isMuted() {
    return this.connection ? this.connection.isMuted() : false;
  }

  /**
   * Obtener estado del Device
   */
  getDeviceState() {
    return {
      state: this.device?.state || 'not_initialized',
      isRegistered: this.device?.state === 'registered',
      hasActiveConnection: !!this.connection,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Actualizar token
   */
  async updateToken(newToken) {
    if (this.device) {
      this.device.updateToken(newToken);
    }
  }

  /**
   * Utilidad para delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.disconnect();
    this.clearDeviceListeners();
    
    if (this.device) {
      try {
        this.device.destroy();
      } catch (error) {
        console.warn('Error destruyendo device:', error);
      }
      this.device = null;
    }
    
    this.eventListeners.clear();
    this.reconnectAttempts = 0;
  }
}

export default TwilioManager;
