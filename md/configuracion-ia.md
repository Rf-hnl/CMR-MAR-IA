# 🧠 Configuración de IA - Documentación Técnica

## 📋 Resumen Ejecutivo

El módulo de **Configuración de IA** permite personalizar completamente los prompts utilizados por las funciones de inteligencia artificial del sistema MAR-IA. Esta herramienta está diseñada para optimizar las respuestas de la IA según las necesidades específicas del negocio.

---

## 🎯 Objetivos del Módulo

- **Personalización Avanzada**: Editar prompts para mejorar la calidad de respuestas de IA
- **Flexibilidad**: Adaptar el comportamiento de la IA a diferentes contextos empresariales
- **Control Total**: Gestionar configuraciones globales del modelo de IA
- **Facilidad de Uso**: Interface intuitiva para usuarios no técnicos

---

## 🔧 Funcionalidades Principales

### 1. 📝 Editor de Prompts
- **Editor Avanzado** con validación de sintaxis Handlebars
- **Resaltado Visual** de variables dinámicas
- **Validación en Tiempo Real** de prompts requeridos
- **Historial de Versiones** para cada plantilla

### 2. 🎛️ Configuración Global
- **Ajustes del Modelo**: Temperatura, tokens máximos, Top-P
- **Selección de Modelo**: Google AI Gemini variants
- **Configuraciones Preestablecidas**: Creatividad vs Precisión
- **Indicadores de Impacto**: Visualización del efecto de los cambios

### 3. 👁️ Vista Previa en Tiempo Real
- **Pruebas Instantáneas** con datos de ejemplo
- **Integración con APIs** existentes para testing
- **Comparación de Resultados** antes/después de cambios
- **Métricas de Rendimiento** de las respuestas

---

## 🎨 Plantillas de IA Disponibles

### 1. 💬 Mensaje de Bienvenida
**Propósito**: Generar mensajes de bienvenida personalizados para nuevos leads
```handlebars
Variables disponibles:
- {{leadName}} - Nombre del negocio
- {{businessType}} - Tipo de negocio
- {{contactName}} - Nombre del contacto
- {{location}} - Ubicación del negocio
```

### 2. 🔍 Evaluación de Negocio
**Propósito**: Analizar el potencial y características de un negocio
```handlebars
Variables disponibles:
- {{leadName}} - Nombre del negocio
- {{businessType}} - Tipo de negocio
- {{address}} - Dirección del negocio
- {{website}} - Sitio web del negocio
```

### 3. 🎯 Recomendaciones de Ventas
**Propósito**: Generar estrategias y recomendaciones de venta personalizadas
```handlebars
Variables disponibles:
- {{leadName}} - Nombre del negocio
- {{businessType}} - Tipo de negocio
- {{businessSize}} - Tamaño del negocio
- {{budget}} - Presupuesto estimado
- {{currentSystems}} - Sistemas actuales
```

### 4. 📧 Email de Configuración TPV
**Propósito**: Crear emails técnicos para configuración de terminales de pago
```handlebars
Variables disponibles:
- {{leadName}} - Nombre del negocio
- {{businessType}} - Tipo de negocio
- {{contactName}} - Persona de contacto
- {{proposedConfiguration}} - Configuración propuesta (array)
```

### 📝 Sintaxis de Variables

**Uso Estándar de Variables:**
```handlebars
{{variableName}}        # Insertar texto plano (recomendado)
{{#if variable}}...{{/if}}  # Condicional
{{#each array}}...{{/each}}  # Iteración sobre arrays
```

**Variables de Array (Ejemplo TPV):**
```handlebars
{{#each proposedConfiguration}}
  - Área: {{this.areaFunction}}
  {{#each this.suggestedProducts}}
    - Producto: {{this.quantity}} x {{this.productName}}
  {{/each}}
{{/each}}
```

**Nota de Seguridad:** Se usa doble llave `{{}}` para inserción segura de texto. El uso de triple llave `{{{variable}}}` permite HTML pero puede introducir riesgos de seguridad.

---

## 🛠️ Guía de Uso

### Acceso al Módulo
1. Navegar a **HERRAMIENTAS Y AUTOMATIZACIÓN**
2. Seleccionar **"Configuración de IA"**
3. Elegir la pestaña deseada: Prompts, Configuración Global, o Vista Previa

### Editar un Prompt
1. **Seleccionar** la plantilla deseada de la lista
2. **Hacer clic** en "Editar" para activar el modo de edición
3. **Modificar** el texto del prompt manteniendo las variables necesarias
4. **Validar** que no hay errores de sintaxis
5. **Guardar** los cambios

### Probar Cambios
1. Ir a la pestaña **"Vista Previa"**
2. **Seleccionar** la plantilla modificada
3. **Llenar** los campos de prueba con datos de ejemplo
4. **Ejecutar** la prueba para ver resultados
5. **Ajustar** si es necesario

---

## ⚙️ Configuraciones Técnicas

### Parámetros del Modelo de IA

| Parámetro | Rango | Descripción | Impacto |
|-----------|-------|-------------|---------|
| **Temperatura** | 0.0 - 2.0 | Creatividad vs Consistencia | Alto en variabilidad |
| **Max Tokens** | 1 - 8192 | Longitud máxima de respuesta | Medio en costo |
| **Top-P** | 0.0 - 1.0 | Diversidad de vocabulario | Medio en calidad |

### Configuraciones Preestablecidas

#### 🎨 Modo Creativo
- Temperatura: 1.2
- Top-P: 0.9
- Ideal para: Contenido marketing, mensajes personalizados

#### 🎯 Modo Preciso
- Temperatura: 0.3
- Top-P: 0.5
- Ideal para: Análisis técnicos, configuraciones TPV

#### ⚖️ Modo Balanceado
- Temperatura: 0.7
- Top-P: 0.7
- Ideal para: Uso general, recomendaciones

---

## 🔒 Seguridad y Permisos

### Control de Acceso
- **Autenticación Firebase**: Solo usuarios autenticados
- **Aislamiento por Usuario**: Cada usuario ve solo sus configuraciones
- **Validación del Lado del Servidor**: Todas las operaciones validadas

### Buenas Prácticas
- ✅ Probar cambios en Vista Previa antes de guardar
- ✅ Mantener variables requeridas en los prompts
- ✅ Documentar cambios importantes para el equipo
- ❌ No eliminar variables críticas del sistema
- ❌ No usar información sensible en prompts de prueba

---

## 📊 Métricas y Monitoreo

### Indicadores Disponibles
- **Tiempo de Respuesta**: Latencia de generación de IA
- **Calidad de Respuesta**: Evaluación automática de coherencia
- **Uso de Tokens**: Consumo de tokens por prompt
- **Tasa de Error**: Fallos en la generación

### Dashboard de Rendimiento
- Gráficos de uso por plantilla
- Comparativas antes/después de cambios
- Alertas de consumo excesivo
- Reportes de optimización

---

## 🚀 Ideas para Futuras Mejoras

### 🎯 Funcionalidades Propuestas

#### 1. Sistema de Versiones Avanzado
- **Historial Completo** de cambios por prompt
- **Rollback Fácil** a versiones anteriores
- **Comparación Visual** entre versiones
- **Etiquetas de Versión** (stable, beta, experimental)

#### 2. Colaboración en Equipo
- **Comentarios** en prompts específicos
- **Revisión y Aprobación** de cambios
- **Asignación de Roles** (editor, revisor, admin)
- **Notificaciones** de cambios importantes

#### 3. A/B Testing Automatizado
- **Pruebas Divididas** entre prompts
- **Métricas de Conversión** automáticas
- **Selección Automática** del mejor prompt
- **Reportes de Rendimiento** comparativos

#### 4. Plantillas Inteligentes
- **Sugerencias de IA** para mejorar prompts
- **Detección de Patrones** en respuestas exitosas
- **Optimización Automática** basada en resultados
- **Prompts Adaptativos** según contexto

#### 5. Integración Avanzada
- **Webhook Notifications** para cambios críticos
- **API Externa** para gestión programática
- **Importación/Exportación** de configuraciones
- **Sincronización Multi-ambiente** (dev, staging, prod)

### 🎨 Mejoras de UX/UI

#### 1. Editor Mejorado
- **Autocompletado** de variables disponibles
- **Syntax Highlighting** avanzado
- **Plegado de Código** para prompts largos
- **Vista Split** para comparar versiones

#### 2. Visualización de Datos
- **Gráficos Interactivos** de métricas
- **Mapas de Calor** de uso de variables
- **Timeline** de cambios y versiones
- **Dashboard Personalizable** por usuario

#### 3. Experiencia Mobile
- **Interface Responsive** optimizada
- **Edición Táctil** mejorada
- **Sincronización Offline** para cambios
- **Push Notifications** para equipos

---

## 🛡️ Consideraciones de Seguridad

### Datos Sensibles
- **Encriptación** de prompts en base de datos
- **Logs Seguros** sin información confidencial
- **Validación Estricta** de inputs de usuario
- **Auditoría Completa** de cambios críticos

### Compliance
- **GDPR**: Cumplimiento de protección de datos
- **Retention Policies**: Políticas de retención de logs
- **Access Controls**: Controles de acceso granulares
- **Data Minimization**: Minimización de datos almacenados

---

## 📞 Soporte y Contacto

### Para el Equipo de Ideas y Creatividad

#### 🎨 Sugerencias de Contenido
- **Nuevos Tipos de Prompt**: ¿Qué otros casos de uso necesitan IA?
- **Mejoras de Lenguaje**: ¿Cómo hacer los prompts más efectivos?
- **Personalización Avanzada**: ¿Qué variables adicionales serían útiles?

#### 🔧 Solicitudes Técnicas
- **Nuevas Integraciones**: APIs externas, herramientas de marketing
- **Automatizaciones**: Flujos de trabajo automáticos
- **Reportes Personalizados**: Métricas específicas del negocio

#### 📋 Proceso de Solicitudes
1. **Documentar** la idea o mejora propuesta
2. **Definir** casos de uso específicos
3. **Priorizar** según impacto en el negocio
4. **Crear** ticket en el sistema de gestión
5. **Seguimiento** del desarrollo e implementación

---

## 📈 Roadmap de Desarrollo

### 🎯 Próximos 30 días
- [ ] Implementar A/B Testing básico
- [ ] Agregar más métricas de rendimiento
- [ ] Mejorar validación de prompts
- [ ] Documentación para usuarios finales

### 🎯 Próximos 60 días
- [ ] Sistema de versiones avanzado
- [ ] Colaboración en equipo
- [ ] API externa para gestión
- [ ] Dashboard de analytics

### 🎯 Próximos 90 días
- [ ] Plantillas inteligentes con IA
- [ ] Integración con herramientas externas
- [ ] Mobile app nativa
- [ ] Automatización completa de flujos

---

## 🆕 Nuevas Funcionalidades Implementadas

### 🎯 **Paleta de Variables Inteligente**
- **Click para insertar**: Variables disponibles como botones clickeables
- **Autocompletado**: Inserta variables en la posición del cursor
- **Validación visual**: Variables requeridas marcadas con asterisco
- **Sintaxis helpers**: Botones para insertar `{{#if}}` y `{{#each}}`

### 📊 **Estimador de Tokens y Costos**
- **Estimación en tiempo real**: Cálculo automático basado en el prompt procesado
- **Alertas de costo**: Advertencias para prompts largos (>2000 tokens)
- **Información detallada**: Tokens estimados y costo en USD
- **Modelo Gemini**: Precios actualizados para Google AI

### 💾 **Casos de Prueba Múltiples**
- **Guardar y cargar**: Almacena conjuntos de datos de prueba
- **Gestión completa**: Crear, cargar, eliminar casos
- **Reutilización**: Prueba el mismo prompt con diferentes datos
- **Interfaz intuitiva**: Botones para cambiar entre casos

### 🔄 **Indicador de Sincronización**
- **Estado en tiempo real**: Guardando, guardado, error
- **Feedback visual**: Indicadores de colores y animaciones
- **Última sincronización**: Timestamp del último guardado
- **Persistencia automática**: Guardado en background

### 💡 **Consejos Contextuales**
- **Específicos por tipo**: Tips adaptados a cada plantilla
- **Mejores prácticas**: Guías para crear prompts efectivos
- **Integración visual**: Directamente en la interfaz del editor
- **Actualización dinámica**: Cambian según el prompt seleccionado

---

## ✅ Estado Actual del Proyecto

**Versión**: 1.1.0  
**Estado**: ✅ Producción  
**Última Actualización**: Junio 2025  
**Desarrollador**: Equipo MAR-IA  

### Funcionalidades Implementadas ✅
- [x] Editor de prompts con validación
- [x] Paleta de variables clickeable con autocompletado
- [x] Indicador de sincronización en tiempo real
- [x] Estimador de tokens y costos
- [x] Casos de prueba múltiples y reutilizables
- [x] Consejos contextuales por tipo de prompt
- [x] Configuración global del modelo
- [x] Vista previa en tiempo real
- [x] Persistencia en Firebase
- [x] Interface responsiva
- [x] Sistema de autenticación
- [x] Navegación integrada

### En Desarrollo 🚧
- [ ] Métricas avanzadas de rendimiento
- [ ] Sistema de comentarios
- [ ] Exportación de configuraciones

### Pendiente 📋
- [ ] A/B Testing automatizado
- [ ] API externa
- [ ] Colaboración en equipo
- [ ] Plantillas inteligentes

---

*Documento creado para el equipo de Ideas y Creatividad. Para sugerencias, mejoras o nuevas funcionalidades, contactar al equipo de desarrollo.*