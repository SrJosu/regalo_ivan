# Original User Request

## Initial Request — 2026-08-26T16:04:17Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Un juego de plataformas en el navegador (estilo Mario clásico) con un nivel corto donde el personaje salta, recoge monedas y llega a la meta. El juego debe ser 100% jugable en smartphones Android a través del navegador, implementando controles táctiles en pantalla.

Working directory: ~/teamwork_projects/android_platformer_game
Integrity mode: development

## Requirements

### R1. Mecánica de Plataformas y Meta
El juego debe tener físicas básicas (gravedad, colisiones), plataformas sobre las cuales saltar, monedas para recolectar y una meta final que, al alcanzarla, muestre un mensaje de victoria.

### R2. Controles Táctiles en Pantalla
Debe haber botones en pantalla (Izquierda, Derecha, Salto) diseñados específicamente para ser usados en dispositivos móviles táctiles (Android).

### R3. Gráficos Basados en Imágenes
El juego debe intentar usar o generar assets de imágenes gratuitas para el jugador, los escenarios y los coleccionables, en lugar de usar simples figuras geométricas.

## Acceptance Criteria

### Verificación Programática y de Rendimiento
- [ ] Un script automatizado puede abrir el juego en un navegador (headless) sin registrar ningún error en la consola de JavaScript.
- [ ] Los botones táctiles están presentes en el DOM y capturan eventos táctiles (`touchstart`, `touchend`).

### Verificación Agente-como-Juez
- [ ] Un agente auditor independiente puede verificar visualmente (o a través del DOM) que los gráficos usados son imágenes y no figuras de un solo color.
- [ ] Un agente auditor certifica que la disposición de los controles es adecuada para una pantalla de tamaño móvil (ej. 360x800).

## Follow-up — 2026-08-27T18:57:26Z

# Teamwork Project Prompt — V2 (Iván's Birthday Gift Edition)

> Status: Launched
> Goal: Execute a massive creative overhaul of the existing platformer game based on user's full permissions.
> Requested team: Use a very large team of agents (including developers, creative directors, and testers).

This is a continuation of the platformer game in the working directory. The user wants to upgrade it from a basic prototype to a hilarious, high-quality birthday gift for their friend "Iván". The user has granted FULL creative freedom and permission to change anything without asking, provided it aligns with the core idea.

Working directory: c:\Users\SrJos\Downloads\Proyecto ivan
Integrity mode: development

## Requirements

### R1. Gráficos Mejorados y Realistas (Assets Externos)
Reemplazar los gráficos generados por código (pixel art básico) por assets de imagen externos mucho más elaborados, realistas y profesionales (deben ser gratuitos/libres de derechos). El ambiente debe seguir recordando a Mario, pero con mucha más calidad visual.

### R2. Enemigos Meme y Sonidos Graciosos (Easter Eggs)
Integrar la cultura de los memes de internet. Los enemigos (que se pueden aplastar) deben tener aspecto de memes famosos (por ejemplo, gatos meme). Añadir efectos de sonido graciosos de memes para los saltos, colisiones, daño o recolección de monedas. Incorporar easter eggs creativos a lo largo del nivel.

### R3. Pantalla de Recompensa Final (Para Iván)
Modificar el final del juego. Al llegar a la meta, en lugar de solo mostrar "Victoria", la pantalla debe mostrar un mensaje especial (ej. "¡Felicidades Iván! Terminado el juego.") y un botón o enlace muy claro que diga: «Terminado el juego. Pincha aquí para recibir la recompensa». Este enlace debe abrir una nueva pestaña hacia un video de YouTube (pon un enlace de YouTube de placeholder; el usuario lo cambiará por el video real de su regalo).

### R4. Expansión Creativa
El usuario ha pedido explicitamente que un "creativo/publicista" aporte ideas. Añadid libremente detalles divertidos, mensajes personalizados para "Iván" en el escenario, o cualquier locura creativa que haga el juego más divertido y memorable.

## Acceptance Criteria

### Verificación de Ejecución
- [ ] El juego sigue funcionando correctamente sin errores de consola en un navegador, y los controles táctiles/teclado no se han roto con la actualización.
- [ ] Los recursos externos (imágenes/audios) se cargan correctamente, manejando posibles errores de carga.

### Verificación Agente-como-Juez
- [ ] Un agente auditor verifica visual y auditivamente que hay elementos "meme" claramente identificables.
- [ ] Un agente auditor verifica que al ganar el juego aparece el botón con el texto exacto «Terminado el juego. Pincha aquí para recibir la recompensa» y que contiene un enlace `href` hacia youtube.

