CLIPMASTER AI — VERSIÓN 0.1

QUÉ HACE
- Permite seleccionar un video desde el celular.
- Muestra una vista previa.
- Permite elegir el tiempo de inicio y final.
- Exporta un clip vertical 9:16 en formato WebM usando el navegador.
- Incluye estructura PWA (manifest y service worker).

IMPORTANTE
- Esta versión NO detecta todavía momentos virales con IA.
- Esta versión NO genera todavía subtítulos automáticos.
- La exportación depende de MediaRecorder y de la compatibilidad del navegador Android.
- La exportación actual crea video WebM; no MP4.
- El recorte vertical es central y puede cortar partes de los lados.
- Videos muy largos o teléfonos con poca memoria pueden fallar al exportar.
- El archivo se procesa localmente en el navegador; no se envía a un servidor.

CÓMO PROBAR EN ANDROID
1. Descomprime el ZIP en una computadora o usa un servicio de hosting estático.
2. Publica la carpeta completa en un hosting HTTPS estático. Para pruebas puedes usar GitHub Pages o Cloudflare Pages; ambos tienen opciones gratuitas.
3. Abre la dirección HTTPS en Chrome para Android.
4. Menú ⋮ > Añadir a pantalla de inicio / Instalar aplicación.
5. Abre ClipMaster AI, selecciona un video, ajusta inicio y final, y toca Exportar clip.

NOTA DE DESARROLLO
Para que la instalación PWA y el service worker funcionen, sirve la app por HTTPS o localhost. Abrir index.html directamente como archivo no permite instalarla como PWA.

SIGUIENTE ETAPA
1. Probar exportación en el Android del usuario.
2. Añadir selección de relación de aspecto y encuadre ajustable.
3. Añadir subtítulos con Whisper (modelo local o servidor propio).
4. Añadir detección de momentos destacados; esto requiere un modelo/servicio de IA y pruebas de rendimiento.
