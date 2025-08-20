INSTRUCTIVO DE INSTALACIÃ“N DE TALLERPRO â€“ VERCEL, RENDER Y GOOGLE CLOUD SQL

1. GOOGLE CLOUD SQL (MySQL)
- AsegÃºrate de tener tu instancia creada y anota:
  HOST (IP pÃºblica o DNS)
  USUARIO
  CONTRASEÃ‘A
  NOMBRE DE BASE DE DATOS
- Autoriza las IPs de Render y de tu mÃ¡quina local en â€œControl de acceso de redâ€ de Google Cloud SQL.

2. BACKEND EN RENDER
- Sube tu backend a un repositorio (GitHub/GitLab).
- Crea un nuevo servicio â€œWeb Serviceâ€ en https://render.com desde tu repositorio.
- Selecciona Node.js como entorno.
- En â€œEnvironment Variablesâ€ agrega:
  DB_HOST=TU_HOST_DE_GOOGLE_SQL
  DB_USER=TU_USUARIO
  DB_PASSWORD=TU_PASSWORD
  DB_NAME=TU_BASEDEDATOS
  PORT=10000 (o el que Render asigne)
- Render instalarÃ¡ dependencias y ejecutarÃ¡ tu backend automÃ¡ticamente.
- Guarda la URL pÃºblica que Render te da, por ejemplo:
  https://tallerpro-backend.onrender.com

3. FRONTEND EN VERCEL
- Sube tu frontend a un repositorio.
- Crea un nuevo proyecto en https://vercel.com desde tu repositorio.
- En â€œEnvironment Variablesâ€ de Vercel, agrega:
  REACT_APP_API_URL=https://tallerpro-backend.onrender.com/api
- Vercel desplegarÃ¡ tu frontend y te darÃ¡ una URL pÃºblica, por ejemplo:
  https://tallerpro-frontend.vercel.app

4. VERIFICACIÃ“N
- Ingresa a la URL de Vercel y prueba el flujo completo.
- Verifica que el frontend se conecte correctamente al backend y que el backend acceda a la base de datos de Google Cloud SQL.

5. NOTAS DE SEGURIDAD
- No expongas tus credenciales en el cÃ³digo, usa solo variables de entorno.
- Limita el acceso a la base de datos solo a las IPs necesarias (Render y desarrollo).
- Usa HTTPS (Vercel y Render lo ofrecen por defecto).

FIN DEL INSTRUCTIVO
