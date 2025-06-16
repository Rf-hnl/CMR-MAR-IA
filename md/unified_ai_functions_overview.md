# Unified Overview of AI Functions

## AI Functionalities

### 1. formatXmlLeads
- **Descripción**: Formatea leads en formato XML.
- **Estado**: Habilitado
- **Proceso de Generación de IA**: Esta función formatea leads en XML, útil para la integración con otros servicios.

### 2. evaluateBusinessFeatures
- **Descripción**: Evalúa las características empresariales basadas en la entrada.
- **Estado**: Habilitado
- **Proceso de Generación de IA**: Analiza características de un negocio utilizando métricas y datos de rendimiento.

### 3. generateSalesRecommendations
- **Descripción**: Genera recomendaciones de ventas basadas en la entrada.
- **Estado**: Habilitado
- **Proceso de Generación de IA**: Utiliza algoritmos de aprendizaje automático para generar recomendaciones personalizadas.

### 4. generateSolutionConfigurationEmail
- **Descripción**: Genera un correo electrónico de configuración de solución basado en la entrada.
- **Estado**: Habilitado
- **Proceso de Generación de IA**: Compila información sobre las necesidades del cliente en un formato de correo electrónico.

### 5. generateWelcomeMessage
- **Descripción**: Genera un mensaje de bienvenida basado en la entrada.
- **Estado**: Habilitado
- **Proceso de Generación de IA**: Personaliza los mensajes de bienvenida utilizando datos del usuario.

### 6. formatCsvLeads
- **Descripción**: Formatea leads en formato CSV.
- **Estado**: Habilitado
- **Proceso de Generación de IA**: Estructura los leads en formato CSV para facilitar la importación/exportación.

## AI Action Flows

### General Architecture
- **Flujo de Datos**: Frontend (Kanban/Table) → LeadActionButtons → API Routes → AI Flows → Genkit → Google AI → Response → Modal

### Implemented AI Flows
1. **Mensaje de Bienvenida**
   - **Input**: { leadName, businessType? }
   - **Output**: { message }
   - **Propósito**: Primer contacto personalizado

2. **Evaluación de Negocio**
   - **Input**: { leadName, businessType?, address?, website? }
   - **Output**: { evaluation }
   - **Propósito**: Análisis de fortalezas y oportunidades tecnológicas

3. **Recomendaciones de Ventas**
   - **Input**: { leadName, businessType?, userProducts[] }
   - **Output**: { recommendations[] }
   - **Propósito**: Sugerencias de productos específicos

4. **Email de Configuración TPV**
   - **Input**: { nombre_lead, tipo_negocio_lead, configuracion_propuesta[] }
   - **Output**: { asunto, cuerpo }
   - **Propósito**: Propuesta técnica personalizada para TPV

### API Endpoints
- **/api/ai/welcome-message**: POST, Validación: leadName requerido
- **/api/ai/evaluate-business**: POST, Validación: leadName requerido
- **/api/ai/sales-recommendations**: POST, Validación: leadName requerido
- **/api/ai/generate-solution-email**: POST, Validación: configuración de propuesta compleja

## AI Prompts Configuration Module

### Overview
El módulo de **Configuración de Prompts de IA** permite a los usuarios personalizar y gestionar todos los prompts utilizados en las funciones de IA.

### Core Features
- **Editor Visual de Prompts**: Editor con resaltado de sintaxis y validación en tiempo real.
- **Vista Previa en Vivo**: Prueba prompts con datos reales.
- **Sistema de Variables**: Gestión visual de variables con validación automática.

### Default Prompts
1. **Mensaje de Bienvenida**
2. **Evaluación de Negocio**
3. **Recomendaciones de Ventas**
4. **Email de Configuración TPV**

### Technical Configuration
- **Tipos de Datos**: Interfaces para gestionar prompts y variables.
- **API Endpoints**: GET, POST, DELETE para gestionar configuraciones de prompts.

## Recommendations for Future Improvements
- **Rate Limiting**: Implementar limitaciones de tasa para evitar abusos.
- **Caché de Resultados**: Implementar caché para evitar re-procesamiento.
- **Analytics y Metrics**: Implementar seguimiento de uso y efectividad de IA.
- **A/B Testing**: Framework para testear diferentes prompts.

---

**Última actualización**: Junio 2025  
**Versión del sistema**: v1.0  
**Autor**: Unificación de funciones de IA
