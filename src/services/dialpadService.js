/**
 * Servicio para realizar llamadas usando la API de llamadas-node2.onrender.com
 * Este servicio se conecta directamente al endpoint para realizar llamadas
 */

const BASE_API_URL = 'https://llamadas-node2.onrender.com';
const TOKEN_URL = `${BASE_API_URL}/token`;
const CALLS_API_URL = `${BASE_API_URL}/call`;

// Importar Twilio Device SDK
import { Device } from '@twilio/voice-sdk';

class DialpadService {
  constructor() {
    this.currentCall = null;
    this.isCallActive = false;
    this.authToken = null;
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.microphonePermission = false;
    this.twilioDevice = null;
    this.twilioConnection = null;
  }

  /**
   * Configurar Twilio Device para WebRTC
   * @returns {Promise<Object>} Resultado de la configuración
   */
  async setupTwilioDevice() {
    try {
      console.log('🔧 Configurando Twilio Device...');
      
      // Si ya existe un device registrado, usarlo
      if (this.twilioDevice && this.twilioDevice.state === 'registered') {
        console.log('✅ Twilio Device ya está registrado');
        return {
          success: true,
          message: 'Twilio Device ya configurado y registrado'
        };
      }
      
      // Obtener token de Twilio para el cliente WebRTC
      const token = await this.getAuthToken();
      console.log('🔑 Token obtenido para Twilio Device');
      
      // Crear Device de Twilio con la identidad que el backend espera
      this.twilioDevice = new Device(token, {
        // Configuración para mejorar la calidad de audio
        codecPreferences: ['opus', 'pcmu'],
        fakeLocalDTMF: true,
        enableRingingState: true
      });

      console.log('📱 Device creado con identidad: usuario_navegador');

      // Event listeners para el Device
      this.setupTwilioEventListeners();

      // Registrar el device
      console.log('📝 Registrando Twilio Device...');
      await this.twilioDevice.register();
      
      console.log('✅ Twilio Device registrado exitosamente');
      console.log('📋 Estado del Device:', this.getTwilioDeviceStatus());

      return {
        success: true,
        message: 'Twilio Device configurado y registrado'
      };

    } catch (error) {
      console.error('❌ Error configurando Twilio Device:', error);
      return {
        success: false,
        error: error.message,
        message: `Error configurando Device: ${error.message}`
      };
    }
  }

  /**
   * Configurar event listeners para Twilio Device
   */
  setupTwilioEventListeners() {
    if (!this.twilioDevice) return;

    // Cuando el device está listo
    this.twilioDevice.on('ready', () => {
      console.log('✅ Twilio Device está listo para recibir llamadas');
    });

    // Cuando se produce un error
    this.twilioDevice.on('error', (error) => {
      console.error('❌ Error en Twilio Device:', error);
    });

    // Cuando llega una llamada entrante (conexión desde el backend)
    this.twilioDevice.on('incoming', (connection) => {
      console.log('📞 Recibiendo conexión desde backend...');
      
      // Aceptar automáticamente la conexión desde el backend
      this.acceptIncomingConnection(connection);
    });

    // Cuando el device se desconecta
    this.twilioDevice.on('offline', () => {
      console.log('📴 Twilio Device desconectado');
    });

    // Cambios de estado del token
    this.twilioDevice.on('tokenWillExpire', () => {
      console.log('⚠️ Token de Twilio expirará pronto, renovando...');
      this.renewTwilioToken();
    });
  }

  /**
   * Aceptar conexión entrante desde el backend
   * @param {Connection} connection - Conexión de Twilio
   */
  async acceptIncomingConnection(connection) {
    try {
      console.log('🔗 Aceptando conexión desde backend...');
      
      // Configurar event listeners para la conexión
      this.setupConnectionEventListeners(connection);
      
      // Aceptar la conexión
      await connection.accept();
      
      this.twilioConnection = connection;
      this.isCallActive = true;
      
      // Actualizar el estado de la llamada
      if (this.currentCall) {
        this.currentCall.status = 'connected';
        this.currentCall.twilioConnected = true;
        console.log('✅ Audio conectado - Llamada en curso');
        
        // Disparar evento personalizado para actualizar la UI
        window.dispatchEvent(new CustomEvent('twilioConnected', {
          detail: {
            callId: this.currentCall.id,
            status: 'connected',
            message: '🔊 Audio conectado - Puedes hablar ahora'
          }
        }));
      }
      
      console.log('✅ Conexión aceptada - Audio conectado');
      
    } catch (error) {
      console.error('❌ Error aceptando conexión:', error);
    }
  }

  /**
   * Configurar event listeners para la conexión
   * @param {Connection} connection - Conexión de Twilio
   */
  setupConnectionEventListeners(connection) {
    // Cuando la conexión se establece
    connection.on('accept', () => {
      console.log('🔊 Audio conectado con la llamada');
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new CustomEvent('audioConnected', {
        detail: {
          message: '🔊 Audio conectado - La llamada está activa',
          status: 'audio_connected'
        }
      }));
    });

    // Cuando la conexión se desconecta
    connection.on('disconnect', () => {
      console.log('📴 Llamada desconectada');
      this.twilioConnection = null;
      this.isCallActive = false;
      
      // Actualizar estado de la llamada
      if (this.currentCall) {
        this.currentCall.status = 'disconnected';
        this.currentCall = null;
      }
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new CustomEvent('callDisconnected', {
        detail: {
          message: '📴 Llamada finalizada',
          status: 'disconnected'
        }
      }));
    });

    // Errores en la conexión
    connection.on('error', (error) => {
      console.error('❌ Error en conexión:', error);
      
      // Disparar evento para mostrar error en UI
      window.dispatchEvent(new CustomEvent('connectionError', {
        detail: {
          message: `❌ Error en conexión: ${error.message}`,
          error: error.message
        }
      }));
    });

    // Cambios de estado
    connection.on('ringing', () => {
      console.log('📱 Llamada sonando...');
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new CustomEvent('callRinging', {
        detail: {
          message: '📱 Llamada sonando...',
          status: 'ringing'
        }
      }));
    });
  }

  /**
   * Renovar token de Twilio cuando expire
   */
  async renewTwilioToken() {
    try {
      const newToken = await this.getAuthToken();
      this.twilioDevice.updateToken(newToken);
      console.log('✅ Token de Twilio renovado');
    } catch (error) {
      console.error('❌ Error renovando token:', error);
    }
  }
  async requestMediaPermissions() {
    try {
      console.log('🎙️ Solicitando permisos de micrófono...');
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false // Solo audio para llamadas
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.microphonePermission = true;
      
      console.log('✅ Permisos de micrófono concedidos');
      return {
        success: true,
        message: 'Permisos de micrófono concedidos',
        stream: this.localStream
      };

    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      this.microphonePermission = false;
      
      let errorMessage = 'Error desconocido';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró micrófono. Verifica que tengas un micrófono conectado.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Micrófono en uso por otra aplicación. Cierra otras aplicaciones que usen el micrófono.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Configuración de micrófono no compatible.';
      }
      
      return {
        success: false,
        error: error.name,
        message: errorMessage
      };
    }
  }

  /**
   * Configurar conexión WebRTC para llamadas de audio
   * @returns {Promise<RTCPeerConnection>} Conexión WebRTC configurada
   */
  async setupWebRTC() {
    try {
      console.log('🔗 Configurando WebRTC...');
      
      // Configuración de servidores STUN/TURN (usa servidores públicos de Google)
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      this.peerConnection = new RTCPeerConnection(configuration);

      // Agregar el stream local a la conexión
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }

      // Manejar el stream remoto
      this.peerConnection.ontrack = (event) => {
        console.log('🔊 Recibiendo audio remoto...');
        this.remoteStream = event.streams[0];
        this.playRemoteAudio();
      };

      // Manejar cambios de estado de la conexión
      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔄 Estado de conexión WebRTC:', this.peerConnection.connectionState);
        
        if (this.peerConnection.connectionState === 'connected') {
          console.log('✅ Llamada conectada con audio');
        } else if (this.peerConnection.connectionState === 'disconnected') {
          console.log('🔚 Llamada desconectada');
          this.cleanup();
        }
      };

      console.log('✅ WebRTC configurado exitosamente');
      return this.peerConnection;

    } catch (error) {
      console.error('❌ Error configurando WebRTC:', error);
      throw error;
    }
  }

  /**
   * Reproducir audio remoto
   */
  playRemoteAudio() {
    try {
      // Crear elemento de audio para reproducir el stream remoto
      let remoteAudio = document.getElementById('remoteAudio');
      
      if (!remoteAudio) {
        remoteAudio = document.createElement('audio');
        remoteAudio.id = 'remoteAudio';
        remoteAudio.autoplay = true;
        remoteAudio.controls = false;
        document.body.appendChild(remoteAudio);
      }

      remoteAudio.srcObject = this.remoteStream;
      console.log('🔊 Audio remoto configurado para reproducción');

    } catch (error) {
      console.error('❌ Error configurando audio remoto:', error);
    }
  }

  /**
   * Limpiar recursos de audio y WebRTC
   */
  cleanup() {
    console.log('🧹 Limpiando recursos de audio...');
    
    // Detener tracks locales
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Cerrar conexión WebRTC
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Limpiar conexión de Twilio
    if (this.twilioConnection) {
      this.twilioConnection.disconnect();
      this.twilioConnection = null;
    }

    // Desregistrar Twilio Device (pero mantenerlo para futuras llamadas)
    if (this.twilioDevice && this.twilioDevice.state === 'registered') {
      // No desregistramos el device para mantenerlo listo para próximas llamadas
      console.log('📱 Twilio Device se mantiene registrado para futuras llamadas');
    }

    // Remover elemento de audio remoto
    const remoteAudio = document.getElementById('remoteAudio');
    if (remoteAudio) {
      remoteAudio.remove();
    }

    this.remoteStream = null;
    this.microphonePermission = false;
  }

  /**
   * Obtener token de autenticación
   * @returns {Promise<string>} Token de autenticación
   */
  async getAuthToken() {
    try {
      console.log('🔑 Obteniendo token de autenticación...');
      
      const response = await fetch(TOKEN_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo token: ${response.status}`);
      }

      const result = await response.json();
      this.authToken = result.token || result.accessToken || result;
      
      console.log('✅ Token obtenido exitosamente');
      return this.authToken;

    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      
      // Si hay error de CORS, mostrar mensaje específico
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new Error('Error de CORS: El servidor no permite peticiones desde este dominio');
      }
      
      throw error;
    }
  }

  /**
   * Realizar una llamada a un número de teléfono
   * @param {string} phoneNumber - Número de teléfono al que llamar
   * @param {Object} options - Opciones adicionales para la llamada
   * @returns {Promise<Object>} Respuesta de la API
   */
  async makeCall(phoneNumber, options = {}) {
    try {
      console.log(`🔄 Iniciando llamada a: ${phoneNumber}`);
      
      // Validar el número antes de realizar la llamada
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.message,
          message: validation.message
        };
      }

      // PASO 1: Solicitar permisos de micrófono
      const permissionResult = await this.requestMediaPermissions();
      if (!permissionResult.success) {
        return {
          success: false,
          error: 'Permisos requeridos',
          message: permissionResult.message
        };
      }

      // PASO 2: Configurar Twilio Device para WebRTC
      const deviceResult = await this.setupTwilioDevice();
      if (!deviceResult.success) {
        return {
          success: false,
          error: 'Error configurando Device',
          message: deviceResult.message
        };
      }

      // PASO 3: Obtener token de autenticación
      const token = await this.getAuthToken();

      // PASO 4: Preparar el payload para la llamada
      const payload = {
        params: {
          to: validation.cleanNumber,  // La API espera params['to']
          from: '+1234567890', // Número de origen
          audioEnabled: true,   // Indicar que queremos audio
          mediaType: 'audio'    // Tipo de media
        },
        timestamp: new Date().toISOString(),
        source: 'CCApp-frontend',
        webrtc: true, // Indicar que usamos WebRTC
        twilioDevice: true, // Indicar que usamos Twilio Device
        ...options
      };

      console.log('📤 Enviando payload a /call:', payload);

      // PASO 5: Marcar como llamada activa
      this.isCallActive = true;

      // PASO 6: Realizar la petición POST al backend
      const response = await fetch(CALLS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text();
        this.isCallActive = false;
        this.cleanup(); // Limpiar recursos si hay error
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Obtener la respuesta JSON
      const result = await response.json();
      console.log('✅ Respuesta de /call:', result);
      console.log('🔄 Esperando que el backend conecte con Twilio Device...');

      // PASO 7: Guardar información de la llamada actual
      this.currentCall = {
        id: result.callId || result.id || Date.now().toString(),
        phoneNumber: validation.cleanNumber,
        startTime: new Date(),
        status: 'connecting',
        hasAudio: true,
        twilioEnabled: true,
        webrtcEnabled: true,
        backendCallId: result.callId || result.id,
        ...result
      };

      // Mostrar información útil para debugging
      console.log('📋 Información de la llamada:', {
        callId: this.currentCall.id,
        phoneNumber: this.currentCall.phoneNumber,
        status: this.currentCall.status,
        backendResponse: result
      });

      return {
        success: true,
        data: result,
        message: 'Llamada iniciada - Esperando conexión de audio...',
        callId: this.currentCall.id,
        audioEnabled: true,
        twilioDevice: true
      };

    } catch (error) {
      console.error('❌ Error al realizar la llamada:', error);
      this.isCallActive = false;
      this.cleanup(); // Limpiar recursos en caso de error
      
      // Manejo específico de errores CORS
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Error de conectividad',
          message: 'No se puede conectar con el servidor de llamadas. Verifique la conexión.'
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: `Error al realizar la llamada: ${error.message}`
      };
    }
  }

  /**
   * Finalizar la llamada actual
   * @returns {Promise<Object>} Resultado de finalizar la llamada
   */
  async endCall() {
    try {
      if (!this.currentCall) {
        return {
          success: false,
          message: 'No hay llamada activa para finalizar'
        };
      }

      console.log('🔚 Finalizando llamada:', this.currentCall.id);

      // Finalizar conexión de Twilio si existe
      if (this.twilioConnection) {
        this.twilioConnection.disconnect();
        this.twilioConnection = null;
      }

      // Limpiar recursos de audio y WebRTC
      this.cleanup();

      // Limpiar el estado local
      this.currentCall = null;
      this.isCallActive = false;

      return {
        success: true,
        message: 'Llamada finalizada correctamente'
      };

    } catch (error) {
      console.error('❌ Error al finalizar la llamada:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error al finalizar la llamada'
      };
    }
  }

  /**
   * Obtener el estado de la llamada actual
   * @returns {Object|null} Información de la llamada actual
   */
  getCurrentCall() {
    return this.currentCall;
  }

  /**
   * Verificar si hay una llamada activa
   * @returns {boolean} True si hay una llamada activa
   */
  hasActiveCall() {
    return this.isCallActive && this.currentCall !== null;
  }

  /**
   * Verificar si el micrófono está disponible
   * @returns {boolean} True si el micrófono tiene permisos
   */
  hasMicrophonePermission() {
    return this.microphonePermission;
  }

  /**
   * Silenciar/activar micrófono
   * @param {boolean} mute - True para silenciar, false para activar
   * @returns {boolean} Estado actual del micrófono
   */
  muteMicrophone(mute = true) {
    // Si hay conexión de Twilio, usar sus controles
    if (this.twilioConnection) {
      this.twilioConnection.mute(mute);
      console.log(mute ? '🔇 Micrófono silenciado (Twilio)' : '🎙️ Micrófono activado (Twilio)');
      return !mute;
    }

    // Fallback a WebRTC nativo
    if (!this.localStream) {
      console.log('⚠️ No hay stream local disponible');
      return false;
    }

    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !mute;
    });

    console.log(mute ? '🔇 Micrófono silenciado' : '🎙️ Micrófono activado');
    return !mute;
  }

  /**
   * Verificar si el micrófono está silenciado
   * @returns {boolean} True si está silenciado
   */
  isMicrophoneMuted() {
    // Si hay conexión de Twilio, usar su estado
    if (this.twilioConnection) {
      return this.twilioConnection.isMuted();
    }

    // Fallback a WebRTC nativo
    if (!this.localStream) return true;
    
    const audioTracks = this.localStream.getAudioTracks();
    return audioTracks.length === 0 || !audioTracks[0].enabled;
  }

  /**
   * Obtener niveles de audio (para mostrar indicadores visuales)
   * @returns {Promise<number>} Nivel de audio (0-100)
   */
  async getAudioLevel() {
    if (!this.localStream) return 0;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(this.localStream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calcular el nivel promedio
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / bufferLength;
      return Math.round((average / 255) * 100);
      
    } catch (error) {
      console.log('⚠️ Error obteniendo nivel de audio:', error);
      return 0;
    }
  }

  /**
   * Validar formato del número de teléfono
   * @param {string} phoneNumber - Número a validar
   * @returns {Object} Resultado de la validación
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return {
        valid: false,
        message: 'El número de teléfono no puede estar vacío'
      };
    }

    // Remover espacios y caracteres especiales excepto +
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si no tiene +, agregarlo para Colombia por defecto
    if (!cleanNumber.startsWith('+')) {
      if (cleanNumber.length === 10) {
        cleanNumber = '+57' + cleanNumber; // Agregar código de Colombia
      } else {
        cleanNumber = '+' + cleanNumber;
      }
    }
    
    // Verificar que tenga un formato válido internacional
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    
    if (!cleanNumber) {
      return {
        valid: false,
        message: 'El número de teléfono no puede estar vacío'
      };
    }

    if (cleanNumber.length < 10) {
      return {
        valid: false,
        message: 'El número es demasiado corto (mínimo 10 dígitos con código de país)'
      };
    }

    if (cleanNumber.length > 16) {
      return {
        valid: false,
        message: 'El número es demasiado largo (máximo 15 dígitos + código)'
      };
    }

    if (!phoneRegex.test(cleanNumber)) {
      return {
        valid: false,
        message: 'Formato inválido. Debe estar en formato internacional: +573001234567'
      };
    }

    return {
      valid: true,
      cleanNumber: cleanNumber,
      message: 'Número válido en formato internacional'
    };
  }

  /**
   * Formatear número de teléfono para mostrar
   * @param {string} phoneNumber - Número a formatear
   * @returns {string} Número formateado
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si es un número colombiano (+57)
    if (cleaned.startsWith('+57') && cleaned.length === 13) {
      return `+57 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    
    // Si es un número estadounidense (+1)
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
      return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    }
    
    // Formato genérico para otros países
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Si no tiene código de país, asumir Colombia
    if (cleaned.length === 10) {
      return `+57 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return cleaned;
  }

  /**
   * Obtener historial de llamadas (funcionalidad simplificada)
   * @returns {Promise<Object>} Historial de llamadas
   */
  async getCallHistory() {
    // Como no sabemos si la API tiene un endpoint de historial,
    // devolvemos un mensaje informativo
    console.log('ℹ️ Funcionalidad de historial no implementada en la API');
    return {
      success: true,
      data: [],
      message: 'Historial no disponible en esta versión'
    };
  }

  /**
   * Obtener estado del Device de Twilio
   * @returns {Object} Estado del Device
   */
  getTwilioDeviceStatus() {
    if (!this.twilioDevice) {
      return {
        registered: false,
        ready: false,
        state: 'not_initialized',
        message: 'Device no inicializado'
      };
    }

    return {
      registered: this.twilioDevice.state === 'registered',
      ready: this.twilioDevice.state === 'ready',
      state: this.twilioDevice.state,
      identity: this.twilioDevice.identity || 'usuario_navegador',
      message: `Device ${this.twilioDevice.state}`
    };
  }

  /**
   * Obtener estado del servicio de llamadas
   * @returns {Promise<Object>} Estado del servicio
   */
  async getServiceStatus() {
    try {
      console.log('🔍 Verificando disponibilidad del servicio...');
      
      // Intentar verificar que podemos obtener un token
      await this.getAuthToken();
      
      console.log('✅ Servicio de llamadas disponible (token obtenido)');
      return {
        available: true,
        message: 'Servicio disponible'
      };

    } catch (error) {
      console.log('⚠️ Error verificando servicio:', error.message);
      
      // Si es un error de CORS, aún permitir intentar llamadas
      if (error.message.includes('CORS')) {
        return {
          available: true,
          message: 'Servicio disponible (sin verificación por CORS)',
          warning: 'Problemas de CORS detectados'
        };
      }
      
      return {
        available: false,
        message: 'Error verificando servicio',
        error: error.message
      };
    }
  }
}

// Crear una instancia única del servicio
const dialpadService = new DialpadService();

export default dialpadService;