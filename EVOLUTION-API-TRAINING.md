# 🎓 Evolution API - Guía de Entrenamiento Práctico

## 📚 Tutorial Paso a Paso: Cómo Usar Evolution API

### 🎯 **Objetivo del Entrenamiento**
Aprender a usar Evolution API para enviar mensajes de WhatsApp de forma práctica, siguiendo el mismo flujo del HTML Tester.

---

## 🚀 **PASO 1: Verificar que Todo Funciona**

### **1.1 Comprobar Servicios Activos**
```bash
# Verificar que Evolution API esté corriendo
curl -I http://localhost:8081

# Resultado esperado: HTTP/1.1 200 OK
```

### **1.2 Verificar API Key**
```bash
# Probar autenticación
curl -H "apikey: evolution_api_key_2024" \
  http://localhost:8081/instance/fetchInstances

# Resultado esperado: Lista de instancias en JSON
```

### **1.3 Verificar Instancia Activa**
```bash
# Comprobar estado de la instancia 'h'
curl -H "apikey: evolution_api_key_2024" \
  http://localhost:8081/instance/connectionState/h

# Resultado esperado: {"instance": {"state": "open"}}
```

---

## 📝 **PASO 2: Enviar Tu Primer Mensaje de Texto**

### **2.1 Estructura Básica**
```javascript
// Configuración base
const API_BASE = 'http://localhost:8081';
const API_KEY = 'evolution_api_key_2024';
const INSTANCE = 'h';
```

### **2.2 Envío con JavaScript (como el HTML)**
```javascript
async function sendTextMessage() {
    const body = {
        number: "50763116918",  // ⬅️ CAMBIAR POR TU NÚMERO
        text: "¡Hola desde Evolution API! 🚀"
    };

    const response = await fetch(`${API_BASE}/message/sendText/${INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log('Respuesta:', result);
}

// Ejecutar
sendTextMessage();
```

### **2.3 Envío con cURL**
```bash
curl -X POST "http://localhost:8081/message/sendText/u" \
  -H "apikey: evolution_api_key_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "50763116918",
    "text": "¡Mi primer mensaje con Evolution API!"
  }'
```

### **2.4 Envío con Postman**
```
POST http://localhost:8081/message/sendText/u

Headers:
apikey: evolution_api_key_2024
Content-Type: application/json

Body (raw JSON):
{
  "number": "50763116918",
  "text": "¡Hola desde Postman!"
}
```

---

## 🖼️ **PASO 3: Enviar Mensaje con Imagen**

### **3.1 Con Imagen desde URL**
```javascript
async function sendImageMessage() {
    const body = {
        number: "50763116918",
        mediatype: "image",
        media: "https://picsum.photos/400/300",
        caption: "Imagen enviada desde Evolution API 📸"
    };

    const response = await fetch(`${API_BASE}/message/sendMedia/${INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify(body)
    });

    return await response.json();
}
```

### **3.2 Con cURL**
```bash
curl -X POST "http://localhost:8081/message/sendMedia/u" \
  -H "apikey: evolution_api_key_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "50763116918",
    "mediatype": "image", 
    "media": "https://picsum.photos/600/400",
    "caption": "¡Mira esta imagen! 🎨"
  }'
```

### **3.3 Tipos de Media Soportados**
```javascript
// Imagen
const imageMessage = {
    mediatype: "image",
    media: "https://ejemplo.com/imagen.jpg"
};

// Video
const videoMessage = {
    mediatype: "video", 
    media: "https://ejemplo.com/video.mp4"
};

// Audio
const audioMessage = {
    mediatype: "audio",
    media: "https://ejemplo.com/audio.mp3"
};

// Documento
const documentMessage = {
    mediatype: "document",
    media: "https://ejemplo.com/documento.pdf",
    fileName: "documento.pdf"
};
```

---

## 🔘 **PASO 4: Enviar Mensaje con Botones**

### **4.1 Botones Básicos**
```javascript
async function sendButtonMessage() {
    const body = {
        number: "50763116918",
        title: "🎯 Selecciona una opción",
        description: "Por favor, elige una de las siguientes opciones:",
        buttons: [
            {
                buttonId: "option1",
                buttonText: {
                    displayText: "✅ Opción 1"
                },
                type: "reply"
            },
            {
                buttonId: "option2", 
                buttonText: {
                    displayText: "🚀 Opción 2"
                },
                type: "reply"
            },
            {
                buttonId: "option3",
                buttonText: {
                    displayText: "💡 Opción 3" 
                },
                type: "reply"
            }
        ]
    };

    const response = await fetch(`${API_BASE}/message/sendButtons/${INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify(body)
    });

    return await response.json();
}
```

### **4.2 Con cURL**
```bash
curl -X POST "http://localhost:8081/message/sendButtons/u" \
  -H "apikey: evolution_api_key_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "50763116918",
    "title": "¿Qué te interesa?",
    "description": "Selecciona una opción:",
    "buttons": [
      {
        "buttonId": "info",
        "buttonText": {"displayText": "📋 Información"},
        "type": "reply"
      },
      {
        "buttonId": "support", 
        "buttonText": {"displayText": "🆘 Soporte"},
        "type": "reply"
      }
    ]
  }'
```

---

## 📋 **PASO 5: Enviar Lista de Opciones**

### **5.1 Lista Completa**
```javascript
async function sendListMessage() {
    const body = {
        number: "50763116918",
        title: "📋 Menú Principal",
        description: "Selecciona una opción del menú:",
        buttonText: "🔽 Ver Opciones",
        footerText: "Evolution API Bot",
        sections: [
            {
                title: "🛍️ Productos",
                rows: [
                    {
                        rowId: "prod1",
                        title: "iPhone 15",
                        description: "Último modelo de Apple"
                    },
                    {
                        rowId: "prod2", 
                        title: "Samsung Galaxy S24",
                        description: "Flagship de Samsung"
                    }
                ]
            },
            {
                title: "🔧 Servicios",
                rows: [
                    {
                        rowId: "serv1",
                        title: "Soporte Técnico",
                        description: "Ayuda con tu dispositivo"
                    },
                    {
                        rowId: "serv2",
                        title: "Garantía",
                        description: "Información de garantía"
                    }
                ]
            }
        ]
    };

    const response = await fetch(`${API_BASE}/message/sendList/${INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify(body)
    });

    return await response.json();
}
```

---

## 🔍 **PASO 6: Verificar Estado y Respuestas**

### **6.1 Función para Verificar Estado**
```javascript
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE}/instance/connectionState/${INSTANCE}`, {
            headers: { 'apikey': API_KEY }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ API Conectada');
            console.log('Estado:', result.instance?.state);
            return true;
        } else {
            console.log('❌ Error de API');
            return false;
        }
    } catch (error) {
        console.log('🔴 Sin conexión:', error.message);
        return false;
    }
}
```

### **6.2 Manejar Respuestas**
```javascript
async function handleAPIResponse(response, action) {
    if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${action} exitoso:`, result);
        return result;
    } else {
        const error = await response.json();
        console.log(`❌ Error en ${action}:`, error);
        throw new Error(error.message || 'Error desconocido');
    }
}

// Uso
try {
    const response = await fetch(url, options);
    const result = await handleAPIResponse(response, 'Envío de mensaje');
} catch (error) {
    console.log('Error:', error.message);
}
```

---

## 🎨 **PASO 7: Personalización Avanzada**

### **7.1 Mensajes Dinámicos**
```javascript
function createPersonalizedMessage(customerName, orderNumber) {
    return {
        number: "50763116918",
        text: `¡Hola ${customerName}! 👋
        
Tu pedido #${orderNumber} está listo para entrega.

¿Confirmas tu dirección? 📦`
    };
}

// Uso
const message = createPersonalizedMessage("Juan", "ORD001");
```

### **7.2 Templates de Mensaje**
```javascript
const messageTemplates = {
    welcome: (name) => ({
        number: "50763116918",
        text: `¡Bienvenido ${name}! 🎉\n\nGracias por contactarnos. ¿En qué podemos ayudarte?`
    }),
    
    order_confirmation: (orderNumber, total) => ({
        number: "50763116918", 
        text: `✅ Pedido confirmado\n\nNúmero: ${orderNumber}\nTotal: $${total}\n\nEstimado de entrega: 2-3 días hábiles`
    }),
    
    support: () => ({
        number: "50763116918",
        title: "🔧 Soporte Técnico",
        description: "¿Con qué necesitas ayuda?",
        buttons: [
            {buttonId: "bug", buttonText: {displayText: "🐛 Reportar Error"}, type: "reply"},
            {buttonId: "help", buttonText: {displayText: "❓ Ayuda General"}, type: "reply"},
            {buttonId: "contact", buttonText: {displayText: "📞 Contactar Agente"}, type: "reply"}
        ]
    })
};
```

---

## 🔄 **PASO 8: Automatización con Webhooks**

### **8.1 Configurar Webhook**
```javascript
async function setupWebhook() {
    const webhookConfig = {
        webhook: {
            enabled: true,
            url: "https://tu-servidor.com/webhook",
            webhookByEvents: true,
            webhookBase64: false,
            events: [
                "MESSAGES_UPSERT",    // Mensajes recibidos
                "MESSAGES_UPDATE",    // Estados de mensaje
                "CONNECTION_UPDATE"   // Cambios de conexión
            ]
        }
    };

    const response = await fetch(`${API_BASE}/webhook/set/${INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify(webhookConfig)
    });

    return await response.json();
}
```

### **8.2 Procesar Mensajes Recibidos**
```javascript
// En tu servidor webhook
app.post('/webhook', (req, res) => {
    const { event, data } = req.body;
    
    if (event === 'MESSAGES_UPSERT') {
        const message = data.messages[0];
        const from = message.key.remoteJid;
        const text = message.message?.conversation || '';
        
        // Respuesta automática
        if (text.toLowerCase().includes('hola')) {
            sendAutoReply(from, '¡Hola! ¿Cómo puedo ayudarte? 😊');
        }
    }
    
    res.status(200).send('OK');
});

async function sendAutoReply(number, text) {
    const cleanNumber = number.replace('@s.whatsapp.net', '');
    
    await fetch(`${API_BASE}/message/sendText/${INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify({
            number: cleanNumber,
            text: text
        })
    });
}
```

---

## 🛠️ **PASO 9: Herramientas de Desarrollo**

### **9.1 Script de Prueba Completo**
```javascript
// test-evolution-api.js
const API_BASE = 'http://localhost:8081';
const API_KEY = 'evolution_api_key_2024';
const INSTANCE = 'h';
const TEST_NUMBER = '50763116918'; // ⬅️ CAMBIAR POR TU NÚMERO

async function runTests() {
    console.log('🚀 Iniciando pruebas Evolution API...\n');
    
    // Test 1: Verificar conexión
    console.log('📡 Test 1: Verificando conexión...');
    const isConnected = await checkConnection();
    if (!isConnected) return;
    
    // Test 2: Mensaje de texto
    console.log('📝 Test 2: Enviando mensaje de texto...');
    await testTextMessage();
    
    // Test 3: Mensaje con imagen
    console.log('🖼️ Test 3: Enviando mensaje con imagen...');
    await testImageMessage();
    
    // Test 4: Mensaje con botones
    console.log('🔘 Test 4: Enviando mensaje con botones...');
    await testButtonMessage();
    
    console.log('✅ Todas las pruebas completadas!');
}

async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/instance/connectionState/${INSTANCE}`, {
            headers: { 'apikey': API_KEY }
        });
        const result = await response.json();
        console.log('  Estado:', result.instance?.state || 'desconocido');
        return response.ok;
    } catch (error) {
        console.log('  ❌ Error:', error.message);
        return false;
    }
}

async function testTextMessage() {
    const body = {
        number: TEST_NUMBER,
        text: `🧪 Mensaje de prueba - ${new Date().toLocaleTimeString()}`
    };
    
    await sendRequest('/message/sendText', body);
}

async function testImageMessage() {
    const body = {
        number: TEST_NUMBER,
        mediatype: "image",
        media: "https://picsum.photos/400/300",
        caption: `📸 Imagen de prueba - ${new Date().toLocaleTimeString()}`
    };
    
    await sendRequest('/message/sendMedia', body);
}

async function testButtonMessage() {
    const body = {
        number: TEST_NUMBER,
        title: "🧪 Prueba de Botones",
        description: "Selecciona una opción de prueba:",
        buttons: [
            {
                buttonId: "test1",
                buttonText: { displayText: "✅ Test 1" },
                type: "reply"
            },
            {
                buttonId: "test2", 
                buttonText: { displayText: "🔄 Test 2" },
                type: "reply"
            }
        ]
    };
    
    await sendRequest('/message/sendButtons', body);
}

async function sendRequest(endpoint, body) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}/${INSTANCE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('  ✅ Enviado exitosamente');
        } else {
            console.log('  ❌ Error:', result.message || 'Error desconocido');
        }
    } catch (error) {
        console.log('  ❌ Error de conexión:', error.message);
    }
}

// Ejecutar pruebas
runTests();
```

---

## 📊 **PASO 10: Monitoreo y Debug**

### **10.1 Log de Actividad**
```javascript
class EvolutionAPILogger {
    constructor() {
        this.logs = [];
    }
    
    log(action, status, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            action,
            status,
            details
        };
        
        this.logs.push(entry);
        console.log(`[${entry.timestamp}] ${action}: ${status}`, details);
    }
    
    getLogs() {
        return this.logs;
    }
    
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}

const logger = new EvolutionAPILogger();

// Uso
async function sendMessageWithLogging(body) {
    logger.log('Enviando mensaje', 'INICIADO', { number: body.number });
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (response.ok) {
            logger.log('Mensaje enviado', 'ÉXITO', result);
        } else {
            logger.log('Error al enviar', 'ERROR', result);
        }
    } catch (error) {
        logger.log('Error de conexión', 'FALLO', error.message);
    }
}
```

---

## 🎯 **Ejercicios Prácticos**

### **Ejercicio 1: Bot de Saludo**
Crear un bot que responda automáticamente a mensajes con "hola" enviando un mensaje de bienvenida con botones.

### **Ejercicio 2: Catálogo de Productos**
Implementar un sistema que muestre productos usando listas y permita "comprar" con botones.

### **Ejercicio 3: Soporte Automatizado**
Crear un flujo de soporte que clasifique consultas y derive a diferentes departamentos.

### **Ejercicio 4: Notificaciones**
Sistema que envíe notificaciones automáticas basadas en eventos (pagos, entregas, etc.).

---

## 🏆 **Checklist de Dominio**

- [ ] ✅ Enviar mensaje de texto básico
- [ ] ✅ Enviar imagen con caption
- [ ] ✅ Crear botones interactivos
- [ ] ✅ Implementar listas de opciones
- [ ] ✅ Verificar estado de instancia
- [ ] ✅ Configurar webhooks
- [ ] ✅ Manejar errores correctamente
- [ ] ✅ Crear respuestas automáticas
- [ ] ✅ Personalizar mensajes dinámicamente
- [ ] ✅ Implementar logging y monitoreo

---

## 🚀 **¡Felicitaciones!**

Ahora dominas Evolution API y puedes:
- 📱 Enviar cualquier tipo de mensaje de WhatsApp
- 🤖 Crear bots automatizados
- 🔔 Recibir y procesar mensajes
- 🛠️ Debuggear y monitorear tu aplicación

**¡Comienza a construir tu propia solución de WhatsApp Business!** 🎉