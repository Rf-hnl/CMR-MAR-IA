/**
 * Evolution API - Servicio para integración con WhatsApp
 * Basado en la documentación: EVOLUTION-API-TRAINING.md
 */

interface EvolutionAPIConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

interface WhatsAppMessage {
  number: string;
  text: string;
}

interface WhatsAppMediaMessage {
  number: string;
  mediatype: 'image' | 'video' | 'audio' | 'document';
  media: string;
  caption?: string;
  fileName?: string;
}

interface WhatsAppButtonMessage {
  number: string;
  title: string;
  description: string;
  buttons: Array<{
    buttonId: string;
    buttonText: {
      displayText: string;
    };
    type: 'reply';
  }>;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class EvolutionAPIService {
  private config: EvolutionAPIConfig;

  constructor(config?: Partial<EvolutionAPIConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.EVOLUTION_API_BASE_URL || 'http://localhost:8081',
      apiKey: config?.apiKey || process.env.EVOLUTION_API_KEY || 'evolution_api_key_2024',
      instance: config?.instance || process.env.EVOLUTION_API_INSTANCE || 'h',
    };
  }

  /**
   * Verificar el estado de la conexión de la instancia
   */
  async checkConnectionStatus(): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${this.config.instance}`, {
        headers: {
          'apikey': this.config.apiKey
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const isConnected = result.instance?.state === 'open';
        return {
          success: isConnected,
          data: {
            state: result.instance?.state,
            connected: isConnected
          }
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al verificar estado de conexión'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje de texto simple
   */
  async sendTextMessage(message: WhatsAppMessage): Promise<APIResponse> {
    try {
      // Verificar conexión primero
      const connectionStatus = await this.checkConnectionStatus();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: `WhatsApp no conectado: ${connectionStatus.error}`
        };
      }

      // Limpiar y validar el número de teléfono
      const cleanNumber = this.cleanPhoneNumber(message.number);
      if (!cleanNumber) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }

      const body = {
        number: cleanNumber,
        text: message.text
      };

      const response = await fetch(`${this.config.baseUrl}/message/sendText/${this.config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al enviar mensaje'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje con imagen
   */
  async sendMediaMessage(message: WhatsAppMediaMessage): Promise<APIResponse> {
    try {
      const connectionStatus = await this.checkConnectionStatus();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: `WhatsApp no conectado: ${connectionStatus.error}`
        };
      }

      const cleanNumber = this.cleanPhoneNumber(message.number);
      if (!cleanNumber) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }

      const body = {
        number: cleanNumber,
        mediatype: message.mediatype,
        media: message.media,
        ...(message.caption && { caption: message.caption }),
        ...(message.fileName && { fileName: message.fileName })
      };

      const response = await fetch(`${this.config.baseUrl}/message/sendMedia/${this.config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al enviar media'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar media: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje con botones
   */
  async sendButtonMessage(message: WhatsAppButtonMessage): Promise<APIResponse> {
    try {
      const connectionStatus = await this.checkConnectionStatus();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: `WhatsApp no conectado: ${connectionStatus.error}`
        };
      }

      const cleanNumber = this.cleanPhoneNumber(message.number);
      if (!cleanNumber) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }

      const body = {
        number: cleanNumber,
        title: message.title,
        description: message.description,
        buttons: message.buttons
      };

      const response = await fetch(`${this.config.baseUrl}/message/sendButtons/${this.config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al enviar botones'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar botones: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Limpiar y formatear número de teléfono
   */
  private cleanPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remover todos los caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');

    // Validar que tenga al menos 10 dígitos
    if (cleanPhone.length < 10) return null;

    // Formatear según las reglas de la documentación
    let phoneNumber = cleanPhone;

    // Si tiene 10 dígitos y no empieza con 52 (México), agregar 52
    if (phoneNumber.length === 10 && !phoneNumber.startsWith('52')) {
      phoneNumber = '52' + phoneNumber;
    }
    // Si tiene 11 dígitos y empieza con 1 (Estados Unidos), mantener
    else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
      phoneNumber = phoneNumber;
    }
    // Si tiene 12 dígitos y empieza con 52 (México), mantener
    else if (phoneNumber.length === 12 && phoneNumber.startsWith('52')) {
      phoneNumber = phoneNumber;
    }

    return phoneNumber;
  }

  /**
   * Crear un mensaje de bienvenida personalizado
   */
  createWelcomeMessage(leadName: string, businessType?: string): WhatsAppButtonMessage {
    const greeting = businessType 
      ? `¡Hola ${leadName}! 👋\n\nVi que tienes un ${businessType} y me encantaría conocer más sobre tu negocio.`
      : `¡Hola ${leadName}! 👋\n\nMe encantaría conocer más sobre tu negocio.`;

    return {
      number: '', // Se asignará cuando se use
      title: "🎯 ¿En qué podemos ayudarte?",
      description: `${greeting}\n\n¿Te gustaría que conversemos sobre cómo podemos potenciar tu negocio?`,
      buttons: [
        {
          buttonId: "info_productos",
          buttonText: {
            displayText: "📋 Ver Productos"
          },
          type: "reply"
        },
        {
          buttonId: "agendar_cita",
          buttonText: {
            displayText: "📅 Agendar Cita"
          },
          type: "reply"
        },
        {
          buttonId: "mas_info",
          buttonText: {
            displayText: "💬 Más Información"
          },
          type: "reply"
        }
      ]
    };
  }

  /**
   * Enviar mensaje de bienvenida automático
   */
  async sendWelcomeMessage(phone: string, leadName: string, businessType?: string): Promise<APIResponse> {
    const welcomeMessage = this.createWelcomeMessage(leadName, businessType);
    welcomeMessage.number = phone;

    // Primero enviar un mensaje de texto simple
    const textResult = await this.sendTextMessage({
      number: phone,
      text: `¡Hola ${leadName}! 👋\n\nGracias por tu interés en nuestros servicios. Me encantaría conocer más sobre tu negocio y cómo podemos ayudarte a crecer. 🚀`
    });

    if (!textResult.success) {
      return textResult;
    }

    // Esperar un momento antes de enviar los botones
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Luego enviar el mensaje con botones
    return await this.sendButtonMessage(welcomeMessage);
  }
}

// Instancia singleton
let evolutionAPI: EvolutionAPIService | null = null;

export function getEvolutionAPI(config?: Partial<EvolutionAPIConfig>): EvolutionAPIService {
  if (!evolutionAPI) {
    evolutionAPI = new EvolutionAPIService(config);
  }
  return evolutionAPI;
}

export { EvolutionAPIService };
export type { WhatsAppMessage, WhatsAppMediaMessage, WhatsAppButtonMessage, APIResponse };