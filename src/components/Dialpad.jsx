import React, { useState, useEffect } from 'react';
import dialpadService from '../services/dialpadService';
import './Dialpad.css';

const Dialpad = () => {
  // Estados del componente
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success, error, info
  const [currentCall, setCurrentCall] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [microphonePermission, setMicrophonePermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Números del dialpad
  const dialpadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'], 
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  // Verificar estado del servicio al cargar
  useEffect(() => {
    checkServiceStatus();
    
    // Agregar listeners para eventos de Twilio
    const handleTwilioConnected = (event) => {
      console.log('🔊 Evento: Twilio conectado', event.detail);
      setMessage(event.detail.message);
      setMessageType('success');
      
      // Actualizar estado de la llamada
      const updatedCall = dialpadService.getCurrentCall();
      if (updatedCall) {
        setCurrentCall(updatedCall);
      }
    };

    const handleAudioConnected = (event) => {
      console.log('🔊 Evento: Audio conectado', event.detail);
      setMessage(event.detail.message);
      setMessageType('success');
    };

    const handleCallDisconnected = (event) => {
      console.log('📴 Evento: Llamada desconectada', event.detail);
      setMessage(event.detail.message);
      setMessageType('info');
      setCurrentCall(null);
      setMicrophonePermission(false);
      setIsMuted(false);
      setAudioLevel(0);
    };

    const handleConnectionError = (event) => {
      console.log('❌ Evento: Error de conexión', event.detail);
      setMessage(event.detail.message);
      setMessageType('error');
    };

    const handleCallRinging = (event) => {
      console.log('📱 Evento: Llamada sonando', event.detail);
      setMessage(event.detail.message);
      setMessageType('info');
    };

    // Agregar event listeners
    window.addEventListener('twilioConnected', handleTwilioConnected);
    window.addEventListener('audioConnected', handleAudioConnected);
    window.addEventListener('callDisconnected', handleCallDisconnected);
    window.addEventListener('connectionError', handleConnectionError);
    window.addEventListener('callRinging', handleCallRinging);

    // Cleanup function
    return () => {
      window.removeEventListener('twilioConnected', handleTwilioConnected);
      window.removeEventListener('audioConnected', handleAudioConnected);
      window.removeEventListener('callDisconnected', handleCallDisconnected);
      window.removeEventListener('connectionError', handleConnectionError);
      window.removeEventListener('callRinging', handleCallRinging);
    };
  }, []);

  /**
   * Verificar si el servicio de llamadas está disponible
   */
  const checkServiceStatus = async () => {
    const status = await dialpadService.getServiceStatus();
    setServiceStatus(status);
    
    if (status.available) {
      setMessage('🟢 Listo para realizar llamadas');
      setMessageType('success');
    } else {
      setMessage('� Servicio en verificación - Puede intentar realizar llamadas');
      setMessageType('info');
    }
  };

  /**
   * Manejar cambios en el input del número
   */
  const handleNumberChange = (e) => {
    const value = e.target.value;
    // Permitir solo números, espacios, + y -
    const cleanValue = value.replace(/[^0-9+\-\s]/g, '');
    setPhoneNumber(cleanValue);
  };

  /**
   * Agregar número desde el dialpad
   */
  const addNumber = (num) => {
    if (phoneNumber.length < 20) { // Limitar longitud
      setPhoneNumber(prev => prev + num);
    }
  };

  /**
   * Borrar último número
   */
  const deleteLastNumber = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  /**
   * Limpiar todo el número
   */
  const clearNumber = () => {
    setPhoneNumber('');
  };

  /**
   * Realizar llamada
   */
  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      setMessage('⚠️ Por favor ingrese un número de teléfono');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('🔄 Solicitando permisos de micrófono...');
    setMessageType('info');

    try {
      const result = await dialpadService.makeCall(phoneNumber);
      
      if (result.success) {
        setCurrentCall(dialpadService.getCurrentCall());
        setMicrophonePermission(dialpadService.hasMicrophonePermission());
        setMessage(`✅ ${result.message}`);
        setMessageType('success');
        
        // Iniciar monitoreo de audio si la llamada tiene audio
        if (result.audioEnabled) {
          startAudioMonitoring();
        }
        
        // Si usa Twilio, mostrar mensaje específico
        if (result.twilioDevice) {
          setMessage(`✅ Llamada iniciada - Esperando conexión WebRTC...`);
        }
      } else {
        setMessage(`❌ ${result.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`❌ Error inesperado: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Monitorear niveles de audio
   */
  const startAudioMonitoring = () => {
    const monitorAudio = async () => {
      if (currentCall && dialpadService.hasActiveCall()) {
        const level = await dialpadService.getAudioLevel();
        setAudioLevel(level);
        setIsMuted(dialpadService.isMicrophoneMuted());
        
        // Continuar monitoreando cada 100ms
        setTimeout(monitorAudio, 100);
      }
    };
    
    monitorAudio();
  };

  /**
   * Alternar silencio del micrófono
   */
  const toggleMute = () => {
    const newMuteState = !isMuted;
    dialpadService.muteMicrophone(newMuteState);
    setIsMuted(newMuteState);
    
    setMessage(newMuteState ? '🔇 Micrófono silenciado' : '🎙️ Micrófono activado');
    setMessageType('info');
  };

  /**
   * Finalizar llamada
   */
  const endCall = async () => {
    setIsLoading(true);
    setMessage('🔄 Finalizando llamada...');
    setMessageType('info');

    try {
      const result = await dialpadService.endCall();
      
      if (result.success) {
        setCurrentCall(null);
        setMicrophonePermission(false);
        setIsMuted(false);
        setAudioLevel(0);
        setMessage(`✅ ${result.message}`);
        setMessageType('success');
      } else {
        setMessage(`❌ ${result.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`❌ Error al finalizar: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formatear número para mostrar
   */
  const getFormattedNumber = () => {
    return dialpadService.formatPhoneNumber(phoneNumber) || phoneNumber;
  };

  return (
    <div className="dialpad-container">
      {/* Header */}
      <div className="dialpad-header">
        <h2>📞 Realizar Llamada</h2>
        <div className={`service-status ${serviceStatus?.available ? 'online' : 'offline'}`}>
          {serviceStatus?.available ? '🟢 En línea' : '🔴 Fuera de línea'}
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Display del número */}
      <div className="phone-display">
        <input
          type="text"
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder="+57 300 123 4567"
          className="phone-input"
          disabled={isLoading || currentCall}
        />
        <div className="formatted-number">
          {getFormattedNumber()}
        </div>
        
        {/* Botones de edición */}
        <div className="display-actions">
          <button 
            onClick={deleteLastNumber}
            className="delete-btn"
            disabled={!phoneNumber || isLoading || currentCall}
          >
            ⌫ Borrar
          </button>
          <button 
            onClick={clearNumber}
            className="clear-btn"
            disabled={!phoneNumber || isLoading || currentCall}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Dialpad Grid */}
      <div className="dialpad-grid">
        {dialpadNumbers.map((row, rowIndex) => (
          <div key={rowIndex} className="dialpad-row">
            {row.map((number) => (
              <button
                key={number}
                onClick={() => addNumber(number)}
                className="dialpad-button"
                disabled={isLoading || currentCall}
              >
                {number}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Botones de llamada */}
      {!currentCall ? (
        <div className="call-actions">
          <button
            onClick={makeCall}
            className={`call-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Llamando...
              </>
            ) : (
              <>
                📞 Realizar Llamada
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="active-call-controls">
          <div className="call-info">
            <p><strong>📞 Llamada Activa</strong></p>
            <p>Número: {getFormattedNumber()}</p>
            <p>Duración: {currentCall?.startTime ? 
              Math.floor((new Date() - new Date(currentCall.startTime)) / 1000) + 's' : 
              'N/A'}
            </p>
          </div>

          {/* Controles de audio */}
          {microphonePermission && (
            <div className="audio-controls">
              <div className="audio-status">
                <div className="microphone-status">
                  <span className={`mic-icon ${isMuted ? 'muted' : 'active'}`}>
                    {isMuted ? '🔇' : '🎙️'}
                  </span>
                  <span className="mic-label">
                    {isMuted ? 'Silenciado' : 'Activo'}
                  </span>
                </div>
                
                {/* Indicador de nivel de audio */}
                <div className="audio-level-container">
                  <span className="level-label">Audio:</span>
                  <div className="audio-level-bar">
                    <div 
                      className="audio-level-fill"
                      style={{ width: `${audioLevel}%` }}
                    ></div>
                  </div>
                  <span className="level-value">{audioLevel}%</span>
                </div>
              </div>

              {/* Botón de silencio */}
              <button
                onClick={toggleMute}
                className={`mute-button ${isMuted ? 'muted' : 'active'}`}
                disabled={isLoading}
              >
                {isMuted ? '🔊 Activar Micrófono' : '🔇 Silenciar'}
              </button>
            </div>
          )}

          <button
            onClick={endCall}
            className="end-call-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Finalizando...
              </>
            ) : (
              <>
                📵 Finalizar Llamada
              </>
            )}
          </button>
        </div>
      )}

      {/* Instrucciones */}
      <div className="dialpad-instructions">
        <h4>📋 Instrucciones:</h4>
        <ul>
          <li>✅ Ingrese el número en formato internacional (+57 300 123 4567)</li>
          <li>✅ Use el dialpad o escriba directamente</li>
          <li>✅ Presione "Realizar Llamada" para conectar</li>
          <li>✅ Use "Finalizar Llamada" cuando termine</li>
        </ul>
        
        <div className="api-info">
          <p><strong>🔗 API:</strong> llamadas-node2.onrender.com</p>
          <p><strong>� Token:</strong> /token → 🔧 Llamada: /call</p>
          <p><strong>📡 Estado:</strong> {serviceStatus?.available ? '🟢 Listo' : '🟡 Verificando'}</p>
        </div>
      </div>

      {/* Botón para verificar servicio */}
      <div className="service-check">
        <button
          onClick={checkServiceStatus}
          className="check-service-btn"
          disabled={isLoading}
        >
          🔄 Verificar Servicio
        </button>
      </div>
    </div>
  );
};

export default Dialpad;