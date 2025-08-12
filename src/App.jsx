import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import { AgentService } from './services/agentService';
import Login from './components/Login';
import CreateUserModal from './components/CreateUserModal';
import Dialpad from './components/Dialpad';
import './App.css';

// Componente principal de la aplicación
const AppContent = () => {
  const { isAuthenticated, agentData, loading, error, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('agent-dashboard');
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // Debug: Mostrar datos del agente en consola
  useEffect(() => {
    if (agentData) {
      console.log('🔍 Debug - Datos del Agente:', agentData);
    }
  }, [agentData]);

  // Cargar usuarios cuando se selecciona la pestaña de usuarios
  useEffect(() => {
    if (activeTab === 'users' && (agentData?.role === 'supervisor' || agentData?.role === 'admin')) {
      loadAllUsers();
    }
  }, [activeTab, agentData]);

  const loadAllUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const result = await AgentService.getAllAgentsWithEmails();
      if (result.success) {
        console.log('🔍 Debug - Datos de usuarios completos:', result.data);
        console.log('🔍 Debug - Primer usuario:', result.data[0]);
        console.log('🔍 Debug - Campos disponibles:', Object.keys(result.data[0] || {}));
        setAllUsers(result.data);
      } else {
        setUsersError('Error cargando usuarios');
      }
    } catch (error) {
      setUsersError('Error cargando usuarios: ' + error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      console.error('Error en logout:', result.message);
    }
  };

  const handleCreateUser = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleUserCreated = () => {
    // Recargar la lista de usuarios después de crear uno nuevo
    loadAllUsers();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando CCApp...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-dashboard">
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>CCApp - Call Center</h1>
            <div className="welcome-info">
              <span className="welcome-text">
                Bienvenido, {agentData?.name || user?.displayName || user?.email}
              </span>
              <span className={`status ${agentData?.status || 'undefined'}`}>
                {agentData?.status || 'Sin estado'}
              </span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <div className="main-layout">
          {/* Panel izquierdo - FIJO */}
          {/* <div className="left-panel">
            <h2>CCApp</h2>
            <p>Sistema de gestión de llamadas</p>
             */}
            {/* Información mínima */}
            {/* <div className="agent-basic-info">
              <div className="info-item">
                <strong>Usuario:</strong> {agentData?.name || user?.displayName || user?.email}
              </div>
              <div className="info-item">
                <strong>Estado:</strong> 
                <span className={`status ${agentData?.status || 'undefined'}`}>
                  {agentData?.status || 'Sin estado'}
                </span>
              </div>
            </div>
          </div> */}

          {/* Panel derecho - TABS */}
          <div className="right-panel">
            {/* Navegación de tabs */}
            <div className="tabs-nav">
              <button 
                className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`tab-button ${activeTab === 'agent-dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('agent-dashboard')}
              >
                Dashboard de Agente
              </button>
              <button 
                className={`tab-button ${activeTab === 'calls' ? 'active' : ''}`}
                onClick={() => setActiveTab('calls')}
              >
                Llamadas
              </button>
              <button 
                className={`tab-button ${activeTab === 'dialpad' ? 'active' : ''}`}
                onClick={() => setActiveTab('dialpad')}
              >
                📞 Dialpad
              </button>
              {/* Pestaña Usuarios - Solo para supervisores */}
              {(agentData?.role === 'supervisor' || agentData?.role === 'admin') && (
                <button 
                  className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  Usuarios
                </button>
              )}
              <button 
                className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                Reportes
              </button>
              <button 
                className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Configuración
              </button>
            </div>

            {/* Contenido de tabs */}
            <div className="tab-content">
              {activeTab === 'dashboard' && (
                <div className="tab-panel">
                  <h3>Dashboard General</h3>
                  <p>Vista general del sistema y métricas globales.</p>
                  {/* Aquí se agregará información general del sistema */}
                </div>
              )}

              {activeTab === 'agent-dashboard' && (
                <div className="tab-panel">
                  <h3>Dashboard de Agente</h3>
                  <p>Sistema de gestión de llamadas en funcionamiento</p>
                  
                  {/* Información del agente */}
                  <div className="agent-info-section">
                    <h4>Información del Agente</h4>
                    <div className="agent-details">
                      <div className="info-row">
                        <span className="info-label">Nombre:</span>
                        <span className="info-value">{agentData?.name || user?.displayName || user?.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Estado:</span>
                        <span className={`status ${agentData?.status || 'undefined'}`}>
                          {agentData?.status || 'Sin estado'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Equipo:</span>
                        <span className="info-value">{agentData?.teamID || 'Sin asignar'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Rol:</span>
                        <span className="info-value">{agentData?.role || 'Agente'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard cards */}
                  <div className="dashboard-cards">
                    <div className="card">
                      <h3>Llamadas Activas</h3>
                      <p>0</p>
                    </div>
                    <div className="card">
                      <h3>Estado</h3>
                      <p>{agentData?.status || 'Sin estado'}</p>
                    </div>
                    <div className="card">
                      <h3>Equipo</h3>
                      <p>{agentData?.teamID || 'Sin asignar'}</p>
                    </div>
                    <div className="card">
                      <h3>Rol</h3>
                      <p>{agentData?.role || 'Agente'}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '24px' }}>
                    <h4>Métricas del Agente</h4>
                    <p>Estadísticas específicas del agente conectado.</p>
                  </div>
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="tab-panel">
                  <h3>Gestión de Llamadas</h3>
                  <p>Panel para manejar llamadas entrantes y salientes.</p>
                  {/* Aquí se agregará el CallPanel de Twilio */}
                </div>
              )}

              {activeTab === 'dialpad' && (
                <div className="tab-panel">
                  <Dialpad />
                </div>
              )}

              {activeTab === 'users' && (agentData?.role === 'supervisor' || agentData?.role === 'admin') && (
                <div className="tab-panel">
                  <h3>Gestión de Usuarios</h3>
                  <p>Panel de administración para gestionar agentes del call center.</p>
                  
                  {/* Sección de estadísticas de usuarios */}
                  <div className="users-stats">
                    <div className="dashboard-cards">
                      <div className="card">
                        <h3>Agentes Activos</h3>
                        <p>{allUsers.filter(user => user.status === 'available').length}</p>
                      </div>
                      <div className="card">
                        <h3>Total Agentes</h3>
                        <p>{allUsers.length}</p>
                      </div>
                      <div className="card">
                        <h3>Sin Estado</h3>
                        <p>{allUsers.filter(user => !user.status || user.status === 'undefined').length}</p>
                      </div>
                      <div className="card">
                        <h3>Supervisores</h3>
                        <p>{allUsers.filter(user => user.role === 'supervisor' || user.role === 'admin').length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de gestión */}
                  <div className="users-actions" style={{ marginTop: '24px' }}>
                    <h4>Acciones de Gestión</h4>
                    <div className="action-buttons">
                      <button className="action-btn primary" onClick={handleCreateUser}>
                        + Agregar Agente
                      </button>
                      <button className="action-btn secondary" onClick={loadAllUsers}>
                        � Actualizar Lista
                      </button>
                      <button className="action-btn secondary">
                        �📊 Ver Reportes de Agentes
                      </button>
                      <button className="action-btn secondary">
                        ⚙️ Configurar Equipos
                      </button>
                    </div>
                  </div>

                  {/* Lista de usuarios */}
                  <div className="users-list" style={{ marginTop: '24px' }}>
                    <h4>Lista de Agentes ({allUsers.length})</h4>
                    
                    {usersLoading && (
                      <div className="loading-message">
                        <p>Cargando usuarios...</p>
                      </div>
                    )}
                    
                    {usersError && (
                      <div className="error-message">
                        <p>⚠️ {usersError}</p>
                      </div>
                    )}
                    
                    {!usersLoading && !usersError && allUsers.length === 0 && (
                      <p>No se encontraron usuarios en el sistema.</p>
                    )}
                    
                    {!usersLoading && !usersError && allUsers.length > 0 && (
                      <div className="users-table">
                        <div className="table-header">
                          <div>Nombre</div>
                          <div>Email</div>
                          <div>Equipo</div>
                          <div>Rol</div>
                          <div>Estado</div>
                        </div>
                        {allUsers.map(user => (
                          <div key={user.id} className="table-row">
                            <div className="table-col">
                              <strong>{user.name || 'Sin nombre'}</strong>
                            </div>
                            <div className="table-col">
                              {user.email}
                            </div>
                            <div className="table-col">
                              {user.teamID || 'Sin asignar'}
                            </div>
                            <div className="table-col">
                              <span className={`role-badge ${user.role || 'agent'}`}>
                                {user.role || 'agent'}
                              </span>
                            </div>
                            <div className="table-col">
                              <span className={`status ${user.status || 'undefined'}`}>
                                {user.status || 'Sin estado'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="tab-panel">
                  <h3>Reportes y Análisis</h3>
                  <p>Estadísticas y reportes de rendimiento.</p>
                  {/* Aquí se agregarán componentes de reportes */}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="tab-panel">
                  <h3>Configuración</h3>
                  <p>Ajustes del agente y preferencias del sistema.</p>
                  {/* Aquí se agregarán componentes de configuración */}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Modal para crear usuarios */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <AppContent />
      </CallProvider>
    </AuthProvider>
  );
}

export default App;
