import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import Login from './components/Login';
import './App.css';

// Componente principal de la aplicación
const AppContent = () => {
  const { isAuthenticated, agentData, loading, error, user, logout } = useAuth();

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
        <div className="dashboard-content">
          <h2>Dashboard de Agente</h2>
          <p>Sistema de gestión de llamadas en funcionamiento</p>
          
          {/* Aquí irán los componentes del dashboard */}
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
          
          {/* Debug info - temporal */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4>Debug - Datos del Agente:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(agentData, null, 2)}
            </pre>
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
