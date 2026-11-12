CLIPMASTER AI — VERSIÓN 0.2 (PWA PARA ANDROID)

QUÉ INCLUYE ESTA VERSIÓN
- Elegir un video guardado en el celular.
- Ver el video dentro de un marco vertical.
- Marcar el inicio y el final usando controles deslizantes.
- Reproducir solamente el fragmento elegido.
- Marcar el inicio o el final desde el punto actual de reproducción.
- Elegir entre “Rellenar vertical” (recorta para llenar 9:16) y “Ajustar completo” (conserva todo el cuadro y puede dejar franjas negras).
- Exportar un video vertical de 720 x 1280 usando MediaRecorder, cuando el navegador lo admite.
- Guardar la aplicación como PWA desde Chrome en Android.

LO QUE TODAVÍA NO HACE
- NO detecta automáticamente momentos destacados con IA.
- NO genera subtítulos automáticos en español.
- NO exporta necesariamente MP4: depende de lo que permita el navegador; normalmente será WebM.
- NO es un APK nativo. Es una aplicación web instalable (PWA).

PRIVACIDAD Y LIMITACIONES
- El video elegido se procesa localmente en el navegador. La aplicación no lo envía a un servidor.
- El código de la aplicación sí se publica en el hosting para que el celular pueda abrirla.
- La exportación depende de MediaRecorder, captureStream y de la memoria disponible en el teléfono.
- La captura de audio puede variar según el navegador. Si no se captura, el archivo podría salir sin sonido.
- Prueba primero con un video corto (10 a 20 segundos). Videos grandes pueden tardar, fallar o cerrar la pestaña.
- El recorte “Rellenar vertical” usa el centro de la imagen; todavía no hay encuadre manual por arrastre.
- No se ha probado en el teléfono del usuario. Hay que comprobarlo en su Android.

ARCHIVOS
Todos estos archivos deben quedar juntos en la raíz del repositorio/hosting:
index.html
styles.css
app.js
manifest.webmanifest
sw.js
icon.svg
icon-192.png
icon-512.png
README.txt

PUBLICAR GRATIS CON GITHUB PAGES DESDE ANDROID
1. Abre https://github.com/ e inicia sesión.
2. Crea un repositorio llamado clipmaster-ai y elige Public. Puedes marcar Add a README file.
3. Entra en el repositorio. Busca Add file y luego Upload files.
4. En el selector de archivos de Android, abre la carpeta donde descomprimiste ClipMaster_AI.
5. Selecciona los archivos que están DENTRO de esa carpeta. No subas solo el ZIP y no dejes los archivos dentro de otra carpeta. index.html debe quedar al mismo nivel que app.js y styles.css.
6. Pulsa Commit changes para guardar la carga.
7. En el repositorio, abre Settings > Pages.
8. En Build and deployment, elige Deploy from a branch.
9. Selecciona la rama main y la carpeta /(root), y pulsa Save.
10. Espera a que GitHub Pages publique el sitio. En Settings > Pages aparecerá Visit site y una dirección parecida a https://TU-USUARIO.github.io/clipmaster-ai/.
11. Abre esa dirección en Chrome para Android. Menú ⋮ > Instalar aplicación o Añadir a pantalla de inicio.

IMPORTANTE SOBRE GITHUB PAGES
El repositorio y el sitio se configuran como públicos para usar Pages gratis en esta modalidad. No subas videos personales al repositorio. Solo se suben los archivos de la aplicación.

CÓMO PROBAR
1. Abre ClipMaster AI instalado o desde Chrome.
2. Selecciona un video corto del teléfono.
3. Mueve los controles de Inicio y Final, o reproduce y usa “Marcar inicio aquí” / “Marcar final aquí”.
4. Elige “Rellenar vertical” o “Ajustar completo”.
5. Pulsa “Exportar clip” y espera sin cerrar la pestaña.
6. Busca el archivo en Descargas. Comprueba imagen y sonido.

SIGUIENTE ETAPA DE DESARROLLO
A. Probar y corregir exportación en el Android del usuario.
B. Añadir control manual de encuadre (mover la zona visible dentro del 9:16).
C. Añadir subtítulos: evaluar Whisper (costo de ejecución, memoria y posibilidad de correr localmente o con servidor gratuito limitado).
D. Añadir detección de momentos destacados: primero definir señales simples (cambios de escena, volumen, pausas y duración); luego evaluar modelos de IA. No se prometerá detección automática hasta probarla.
