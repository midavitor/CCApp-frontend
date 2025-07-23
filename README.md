# CCApp - Frontend

**Plataforma web especializada en recepción, gestión y distribución inteligente de llamadas telefónicas**

CCApp es una solución robusta para call centers que busca reemplazar plataformas como Twilio Flex, ofreciendo mayor estabilidad, control total del flujo de llamadas y enrutamiento inteligente basado en roles y equipos.

## 🎯 Propósito del Proyecto

- **Estabilidad operativa** frente a fallos comunes de plataformas existentes
- **Enrutamiento estratégico** de llamadas basado en roles y equipos
- **Escalabilidad tecnológica** para evolucionar con la organización
- **Mayor autonomía** e integración con APIs como Twilio y WebRTC
- **Paneles de control** e indicadores clave para toma de decisiones

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.1.0** - Framework para interfaces dinámicas y reutilizables
- **Vite 7.0.5** - Build tool ultrarrápido con HMR instantáneo
- **ESLint** - Linting y calidad de código

### Backend & Servicios
- **Node.js** - Backend para manejo de conexiones concurrentes
- **Firebase/Firestore** - Base de datos en tiempo real y escalable
- **Twilio** - APIs de comunicaciones (voz, SMS, SIP)
- **WebRTC** - Comunicación de audio directa navegador-navegador

## 📁 Estructura del Proyecto

```
src/
├── views/          # Páginas principales (Dashboard, CallPanel, Reports)
├── components/     # Componentes reutilizables (botones, formularios, modales)
├── services/       # Conexión con Firestore, APIs externas, Firebase config
├── hooks/          # Custom hooks de React
├── context/        # Context providers para estado global
├── assets/         # Recursos estáticos
├── App.jsx         # Componente principal
└── main.jsx        # Punto de entrada
```

## 🔥 Configuración de Firebase

### Estructura de Firestore

```
collections/
├── agents/         # Información de agentes del call center
├── teams/          # Equipos y supervisores
└── calls/          # Registro de llamadas (entrantes/salientes)
```

### Esquemas de Datos

#### Agents
```javascript
{
  agentID: "agent_001",
  teamID: "team_support", 
  status: "available"
}
```

#### Teams
```javascript
{
  name: "Soporte",
  description: "Equipo de soporte técnico",
  members: ["agent_001", "agent_002", "agent_003"],
  supervisors: ["agent_003"]
}
```

#### Calls
```javascript
{
  agentID: "agente_001",
  duration: 120,
  endTime: Timestamp,
  evaluation: 4,
  from: "+573154794409",
  notes: "Cliente atendido con éxito",
  recordingUrl: "",
  startTime: Timestamp,
  status: "completed",
  teamID: "team_support",
  to: "agente001-twilio",
  type: "incoming"
}
```

## ⚙️ Configuración e Instalación

### 1. Clonar e instalar dependencias
```bash
git clone <repository-url>
cd CCApp-frontend
npm install
```

### 2. Configurar Firebase
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus credenciales de Firebase
```

Obtén las credenciales desde Firebase Console > Project Settings > General > Your apps

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5174/`

## 📜 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo con HMR
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción
- `npm run lint` - Ejecutar ESLint

## 🔒 Variables de Entorno

Configura las siguientes variables en `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## 🚀 Próximas Funcionalidades

- [ ] Autenticación de agentes y supervisores
- [ ] Panel de llamadas en tiempo real
- [ ] Dashboard con métricas y KPIs
- [ ] Integración con Twilio para llamadas
- [ ] Sistema de reportes y analytics
- [ ] Gestión de equipos y roles
- [ ] Grabación y reproducción de llamadas

## 🎯 Objetivo Estratégico

Dotar a la organización de una herramienta de comunicaciones **confiable, adaptable y eficiente**, que solucione problemas actuales y permita escalar de forma sostenible, alineada con las metas corporativas de servicio, eficiencia y transformación digital.

---

**Desarrollado para optimizar la operación interna y garantizar la estabilidad de las comunicaciones en call centers modernos.**
