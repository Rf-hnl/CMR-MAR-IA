## Variables de Entorno

Esta sección detalla las variables de entorno necesarias para la configuración de la aplicación.
```
bash
# URL de la base de datos PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/database"

# Secreto para la autenticación de la aplicación
AUTH_SECRET="your_auth_secret"

# Credenciales para Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# URL de la API externa
EXTERNAL_API_URL="https://api.example.com"
```
**Nota:** Reemplaza los valores de ejemplo con tus credenciales y configuraciones reales. Para mantener la seguridad, se recomienda no incluir valores sensibles directamente en el control de versiones. Utiliza un archivo `.env` y asegúrate de que esté excluido de tu repositorio (por ejemplo, usando un archivo `.gitignore`).