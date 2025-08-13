/**
 * Gestor separado para audio y WebRTC
 * Mejora: Separar responsabilidades del DialpadService
 */

class AudioManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.microphonePermission = false;
  }

  /**
   * Solicitar permisos de micrófono con mejor manejo de errores
   */
  async requestMicrophonePermission() {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        },
        video: false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.microphonePermission = true;
      
      // Configurar análisis de audio
      await this.setupAudioAnalysis();
      
      return {
        success: true,
        message: 'Permisos de micrófono concedidos',
        stream: this.localStream
      };

    } catch (error) {
      return this.handleMicrophoneError(error);
    }
  }

  /**
   * Configurar análisis de audio para medición de niveles
   */
  async setupAudioAnalysis() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      
      source.connect(this.analyser);
      this.analyser.fftSize = 256;
      
    } catch (error) {
      console.warn('Error configurando análisis de audio:', error);
    }
  }

  /**
   * Obtener nivel de audio en tiempo real
   */
  getAudioLevel() {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }

    return Math.round((sum / bufferLength / 255) * 100);
  }

  /**
   * Manejo específico de errores de micrófono
   */
  handleMicrophoneError(error) {
    const errorMap = {
      'NotAllowedError': 'Permisos de micrófono denegados. Permite el acceso en tu navegador.',
      'NotFoundError': 'No se encontró micrófono. Verifica tu dispositivo de audio.',
      'NotReadableError': 'Micrófono ocupado por otra aplicación.',
      'OverconstrainedError': 'Configuración de audio no compatible.',
      'SecurityError': 'Conexión no segura. Usa HTTPS.'
    };

    return {
      success: false,
      error: error.name,
      message: errorMap[error.name] || `Error de audio: ${error.message}`
    };
  }

  /**
   * Limpiar recursos de audio
   */
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.microphonePermission = false;
  }
}

export default AudioManager;
