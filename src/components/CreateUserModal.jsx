import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import AgentService from '../services/agentService';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebaseConfig';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { user, agentData } = useAuth(); // Obtener el usuario actual y sus datos del contexto
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    teamID: '',
    adminPassword: '' // Contraseña del supervisor para restaurar sesión
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!formData.name || !formData.email || !formData.password || !formData.adminPassword) {
        throw new Error('Todos los campos obligatorios deben ser completados');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Validación de permisos de rol
      if (agentData?.role === 'supervisor' && (formData.role === 'supervisor' || formData.role === 'admin')) {
        throw new Error('Los supervisores solo pueden crear agentes');
      }

      // Crear usuario usando el método que preserva la sesión
      console.log('🔍 Creando usuario con preservación de sesión...', formData.email);
      const authResult = await AuthService.createUserPreservingSession(
        formData.email, 
        formData.password, 
        user?.email, 
        formData.adminPassword
      );
      
      if (!authResult.success) {
        throw new Error(authResult.message);
      }

      console.log('✅ Usuario creado en Auth:', authResult.user.uid);

      // Verificar que tenemos un usuario autenticado
      console.log('🔍 Estado de autenticación actual:', {
        currentUser: auth.currentUser?.email,
        uid: auth.currentUser?.uid
      });

      // Crear documento del agente en Firestore
      const newAgentData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        teamID: formData.teamID || 'Sin asignar',
        status: 'pending', // Estado pendiente hasta activar cuenta
        uid: authResult.user.uid
      };

      console.log('🔍 Creando documento en Firestore...', newAgentData);
      console.log('🔍 Usuario que creará el documento:', auth.currentUser?.email);
      
      // Test de escritura en Firestore antes del intento real
      console.log('🔍 Ejecutando test de escritura en Firestore...');
      const testResult = await AgentService.testFirestoreWrite();
      console.log('🔍 Resultado del test de escritura:', testResult);
      
      if (!testResult.success) {
        throw new Error(`Test de Firestore falló: ${testResult.error}`);
      }
      
      const agentResult = await AgentService.createAgent(newAgentData);
      
      console.log('🔍 Resultado de Firestore:', agentResult);
      
      if (!agentResult.success) {
        console.error('❌ Error detallado de Firestore:', agentResult);
        
        // Intentar diagnóstico adicional
        console.log('🔍 Diagnóstico adicional:');
        console.log('- Usuario actual:', auth.currentUser);
        console.log('- Datos enviados:', newAgentData);
        console.log('- Error específico:', agentResult.error);
        
        throw new Error(`Error al guardar en Firestore: ${agentResult.error}`);
      }

      console.log('✅ Agente creado exitosamente en Firestore con ID:', agentResult.id);
      
      // Éxito - cerrar modal y notificar
      onUserCreated();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('❌ Error en creación de usuario:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'agent',
      teamID: '',
      adminPassword: ''
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Crear Nuevo Agente</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        {/* Mensaje informativo sobre permisos */}
        {agentData?.role === 'supervisor' && (
          <div className="info-banner">
            <p>💡 <strong>Permisos:</strong> Como supervisor, solo puedes crear nuevos agentes.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="name">Nombre Completo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="juan.perez@ccapp.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña Temporal *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="6"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="agent">Agente</option>
              {/* Solo los administradores pueden crear supervisores y otros administradores */}
              {agentData?.role === 'admin' && (
                <>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="teamID">Equipo</label>
            <input
              type="text"
              id="teamID"
              name="teamID"
              value={formData.teamID}
              onChange={handleInputChange}
              placeholder="Ej: Equipo-A, Ventas, Soporte"
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminPassword">Tu Contraseña (Supervisor) *</label>
            <input
              type="password"
              id="adminPassword"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleInputChange}
              required
              placeholder="Ingresa tu contraseña para confirmar"
            />
            <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              Necesaria para mantener tu sesión activa después de crear el usuario
            </small>
          </div>

          {error && (
            <div className="form-error">
              ⚠️ {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Agente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
