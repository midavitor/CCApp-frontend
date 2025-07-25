# Guía de Eliminación Completa de Usuarios

## Problema Actual
Actualmente, cuando se elimina un usuario desde la aplicación:
- ✅ Se elimina el documento del usuario de Firestore
- ❌ El usuario permanece en Firebase Authentication

Esto crea cuentas "huérfanas" que pueden representar un riesgo de seguridad.

## Solución 1: Eliminación Manual (Actual)
La aplicación muestra un modal con instrucciones para eliminar manualmente el usuario de Firebase Authentication a través de Firebase Console.

## Solución 2: Cloud Functions (Recomendada)

### Paso 1: Instalar Firebase Functions
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### Paso 2: Crear la Cloud Function
Crear el archivo `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verificar permisos (admin o supervisor)
  const userRecord = await admin.auth().getUser(context.auth.uid);
  const userDoc = await admin.firestore().collection('agents').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || !['admin', 'supervisor'].includes(userData.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { uid, userRole, currentUserRole } = data;

  // Validaciones de permisos
  if (currentUserRole === 'supervisor' && userRole !== 'agent') {
    throw new functions.https.HttpsError('permission-denied', 'Supervisors can only delete agents');
  }

  if (currentUserRole === 'admin' && userRole === 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admins cannot delete other admins');
  }

  try {
    // Eliminar de Authentication
    await admin.auth().deleteUser(uid);
    
    // Eliminar de Firestore
    await admin.firestore().collection('agents').doc(uid).delete();
    
    return { 
      success: true, 
      message: 'Usuario eliminado completamente',
      deletedFromAuth: true,
      deletedFromFirestore: true
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', `Error deleting user: ${error.message}`);
  }
});
```

### Paso 3: Actualizar el Frontend
Modificar `agentService.js` para usar la Cloud Function:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deleteUserFunction = httpsCallable(functions, 'deleteUser');

static async deleteAgent(agentId) {
  try {
    // Obtener datos del agente
    const agentDoc = await getDoc(doc(db, 'agents', agentId));
    if (!agentDoc.exists()) {
      throw new Error('Agente no encontrado');
    }

    const agentData = agentDoc.data();
    const currentUser = auth.currentUser;
    const currentUserDoc = await getDoc(doc(db, 'agents', currentUser.uid));
    const currentUserData = currentUserDoc.data();

    // Llamar a la Cloud Function
    const result = await deleteUserFunction({
      uid: agentData.uid,
      userRole: agentData.role,
      currentUserRole: currentUserData.role
    });

    return {
      success: true,
      message: 'Usuario eliminado completamente',
      deletedFromAuth: true,
      deletedFromFirestore: true,
      requiresManualAuthDeletion: false
    };
  } catch (error) {
    // Si falla la Cloud Function, usar método actual
    return this.deleteAgentFallback(agentId);
  }
}
```

### Paso 4: Desplegar la función
```bash
firebase deploy --only functions
```

## Configuración de Reglas de Seguridad

Actualizar `firestore.rules` para permitir que las Cloud Functions accedan:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso completo a las Cloud Functions
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.firebase.sign_in_provider == 'custom';
    }
    
    // Reglas existentes para usuarios normales...
  }
}
```

## Beneficios de la Implementación Completa

1. **Seguridad**: Eliminación completa sin cuentas huérfanas
2. **Automatización**: No requiere intervención manual
3. **Auditoría**: Cloud Functions proporcionan logs automáticos
4. **Escalabilidad**: Maneja múltiples eliminaciones simultáneas

## Costo Estimado
- Cloud Functions: ~$0.0000004 por invocación
- Para 1000 eliminaciones al mes: < $0.50

## Estado Actual del Proyecto
- ✅ Modal informativo implementado
- ✅ Instrucciones claras para eliminación manual
- ⏳ Cloud Functions pendiente de implementación
- ⏳ Integración con el frontend pendiente
