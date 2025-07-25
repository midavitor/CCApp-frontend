# 🚀 Guía de Cloud Functions para CCApp

## ¿Qué son las Cloud Functions?

Las Cloud Functions son funciones que se ejecutan en los servidores de Google, no en el navegador. Son como un "backend" que puedes llamar desde tu aplicación frontend.

## ¿Por qué las necesitamos?

### Problema Actual:
- ✅ Eliminamos usuarios de Firestore (base de datos)
- ❌ NO eliminamos de Authentication (sistema de login)
- 🚨 **Resultado**: Usuario eliminado puede seguir haciendo login!

### Limitaciones de Seguridad:
- **Frontend**: Solo puede eliminar su propia cuenta
- **Backend**: Puede eliminar cualquier cuenta (con Admin SDK)

## Cómo implementar Cloud Functions

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Inicializar Functions en tu proyecto
```bash
cd "c:\Users\User\CCApp Ultim 2\CCApp-frontend"
firebase login
firebase init functions
```

### 3. Estructura que se creará:
```
CCApp-frontend/
├── functions/
│   ├── package.json
│   ├── index.js
│   └── node_modules/
├── src/
└── package.json
```

### 4. Código de la Cloud Function

En `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cloud Function para eliminar usuarios
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // 1. Verificar que quien llama tiene permisos de admin/supervisor
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    // 2. Obtener datos del usuario que llama
    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore()
      .collection('agents')
      .where('uid', '==', callerUid)
      .get();

    if (callerDoc.empty) {
      throw new functions.https.HttpsError('permission-denied', 'Usuario no encontrado');
    }

    const callerData = callerDoc.docs[0].data();
    const callerRole = callerData.role;

    // 3. Verificar permisos
    if (callerRole !== 'admin' && callerRole !== 'supervisor') {
      throw new functions.https.HttpsError('permission-denied', 'Sin permisos para eliminar usuarios');
    }

    // 4. Verificar que supervisor no elimine admin
    const targetUserDoc = await admin.firestore()
      .collection('agents')
      .doc(data.agentId)
      .get();

    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuario a eliminar no encontrado');
    }

    const targetUserData = targetUserDoc.data();
    const targetUserRole = targetUserData.role;

    if (callerRole === 'supervisor' && targetUserRole !== 'agent') {
      throw new functions.https.HttpsError('permission-denied', 'Supervisores solo pueden eliminar agentes');
    }

    // 5. Eliminar de Authentication
    if (targetUserData.uid) {
      await admin.auth().deleteUser(targetUserData.uid);
      console.log('✅ Usuario eliminado de Authentication:', targetUserData.uid);
    }

    // 6. Eliminar de Firestore
    await admin.firestore().collection('agents').doc(data.agentId).delete();
    console.log('✅ Usuario eliminado de Firestore:', data.agentId);

    return {
      success: true,
      message: 'Usuario eliminado completamente de Authentication y Firestore'
    };

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 5. Actualizar el Frontend

En `agentService.js`, agregar función para llamar a Cloud Function:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

// Inicializar Functions
const functions = getFunctions();

/**
 * Eliminar usuario usando Cloud Function (eliminación completa)
 * @param {string} agentId - ID del agente a eliminar
 * @returns {Promise<Object>} Resultado de la eliminación
 */
static async deleteUserComplete(agentId) {
  try {
    // Llamar a la Cloud Function
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    const result = await deleteUserFunction({ agentId });
    
    return {
      success: true,
      message: result.data.message,
      deletedFromFirestore: true,
      deletedFromAuth: true,
      requiresManualAuthDeletion: false
    };
  } catch (error) {
    console.error('Error calling deleteUser function:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 6. Desplegar las Functions
```bash
firebase deploy --only functions
```

## Ventajas de usar Cloud Functions

### ✅ Ventajas:
- **Eliminación completa**: Authentication + Firestore
- **Seguridad**: Permisos verificados en servidor
- **Automático**: No requiere intervención manual
- **Escalable**: Se ejecuta en servidores de Google

### ❌ Consideraciones:
- **Costo**: Google cobra por ejecución (muy barato para uso normal)
- **Complejidad**: Requiere configuración adicional
- **Dependencia**: Requiere conexión a internet

## Alternativa Simple (Actual)

Si no quieres implementar Cloud Functions ahora, la solución actual es:
1. ✅ Eliminar de Firestore (automático)
2. 📋 Mostrar instrucciones para eliminar de Authentication (manual)
3. 🔗 Enlace directo a Firebase Console

## ¿Cuándo implementar Cloud Functions?

### Implementar SI:
- Tienes muchos usuarios para gestionar
- Quieres automatización completa
- Tienes presupuesto para Cloud Functions
- El equipo puede mantener código backend

### NO implementar SI:
- Pocos usuarios (< 50)
- Presupuesto muy limitado
- Equipo solo frontend
- Eliminaciones muy infrecuentes

## Costos Estimados

Para un call center pequeño:
- **Eliminaciones por mes**: ~10 usuarios
- **Costo por función**: $0.0000004 USD
- **Costo mensual**: < $0.01 USD (prácticamente gratis)

## Próximos Pasos

1. **Decidir**: ¿Implementar Cloud Functions o mantener solución actual?
2. **Si implementas**: Seguir pasos 1-6 de esta guía
3. **Si no implementas**: La solución actual funciona perfectamente

La aplicación funciona correctamente con cualquiera de las dos opciones! 🚀
