import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import Login from './components/Login';
import './App.css';

// Componente principal de la aplicación
const AppContent = () => {
  const { isAuthenticated, agentData, loading, error, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Debug: Mostrar datos del agente en consola
  useEffect(() => {
    if (agentData) {
      console.log('🔍 Debug - Datos del Agente:', agentData);
    }
  }, [agentData]);

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      console.error('Error en logout:', result.message);
    }
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
              <span className={`status ${agentData?.status || 'offline'}`}>
                {agentData?.status || 'offline'}
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
          <div className="left-panel">
            <h2>Dashboard de Agente</h2>
            <p>Sistema de gestión de llamadas en funcionamiento</p>
            
            {/* Dashboard cards - FIJAS */}
            <div className="dashboard-cards">
              <div className="card">
                <h3>Llamadas Activas</h3>
                <p>0</p>
              </div>
              <div className="card">
                <h3>Estado</h3>
                <p>{agentData?.status || 'Desconectado'}</p>
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
            
            {/* Debug info movido a consola - ver DevTools */}
          </div>

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
                className={`tab-button ${activeTab === 'calls' ? 'active' : ''}`}
                onClick={() => setActiveTab('calls')}
              >
                Llamadas
              </button>
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
                  <h3>Resumen General</h3>
                  <p>Vista general del estado del agente y métricas importantes.</p>
                  {/* Aquí se agregarán componentes de dashboard */}
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="tab-panel">
                  <h3>Gestión de Llamadas</h3>
                  <p>Panel para manejar llamadas entrantes y salientes.</p>
                  {/* Aquí se agregará el CallPanel de Twilio */}
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
