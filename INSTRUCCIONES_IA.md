# 📖 MASTER CONTEXT & INSTRUCTIONS FOR INCOMING AI AGENTS

> **Proyecto:** Super Iván & Pac-Man Arcade Hub (Regalo de Cumpleaños para Iván)
> **Directorio Local:** `C:\Users\SrJos\Downloads\Proyecto ivan`
> **Estado:** 100% Funcional — Hub Dual (Modo Historia Super Ibon Bros + Pac-Man) con Menú Principal, Enlace Real de YouTube y soporte táctil móvil.

---

## 🎯 1. OBJETIVO PRINCIPAL DEL PROYECTO
El usuario está creando un regalo sorpresa interactivo para su amigo **Iván**.
El proyecto es una web de juegos arcade retro que funciona tanto en PC como en navegadores móviles Android (con controles táctiles en pantalla):

1. **Menú Principal (`#main-menu`):** Un selector arcade con dos modos seleccionables:
   - 🍄 **Modo historia Super Ibon Bros:** Videojuego de plataformas estilo Mario pero personalizado con temática de cumpleaños y memes.
   - 🟡 **Pac-Man:** Arcade clásico de laberinto y fantasmas adaptado de la carpeta `Juego de pacman`.
2. **Recompensa Final de Iván (Modo Mario):**
   - Al llegar al final del nivel de plataformas (tocar la bandera y entrar al castillo), el juego muestra una ventana modal festiva (`#victory-modal`).
   - Contiene un botón dorado con el texto exacto:
     `Terminado el juego. Pincha aquí para recibir la recompensa`
   - **Enlace de YouTube Configurado:** Abre en una nueva pestaña el vídeo real del usuario: `https://youtu.be/sYDEll4pP7M` (un vídeo donde el usuario le da el regalo envuelto a Iván).

---

## 🗺️ 2. MAPA DE ARCHIVOS Y ARQUITECTURA

```
c:/Users/SrJos/Downloads/Proyecto ivan/
├── index.html                  # Hub principal: contiene el #main-menu, el #game-container (Mario) y el #arcade-cabinet (Pacman)
├── css/
│   ├── style.css               # Estilos globales, menú principal, viewport 360x800 móvil, controles táctiles y modal de victoria
│   └── pacman.css              # Estilos del mueble arcade de Pac-Man, tablero de puntuación y D-Pad virtual
├── js/
│   ├── assets.js               # Motor procedural de sprites (Super Iván con gafas Deal-With-It, Pop Cat, Doge, Grumpy Cat, bloques 3D)
│   ├── audio.js                # Sintetizador Web Audio API (Boing salto, Ka-Ching anime, POP PopCat, Sad Trombone muerte, Fanfarria cumpleaños)
│   ├── input.js                # Controlador multitáctil (#btn-left, #btn-right, #btn-jump) y teclado
│   ├── physics.js              # Motor de físicas AABB con coyote time (85ms) y jump buffering (100ms)
│   ├── entities.js             # Clases de Player, MemeEnemy (PopCat, Doge, GrumpyCat), monedas, confeti y textos flotantes
│   ├── level.js                # Definición del nivel 1-1, pancartas de cumpleaños y cámara
│   ├── game.js                 # GameManager del juego de Mario, bucle 60 FPS, vibración háptica (navigator.vibrate) y modal de victoria
│   └── pacman/                 # Módulo de Pac-Man integrado
│       ├── audio.js            # Sonidos arcade de Pac-Man y sirena
│       ├── game.js             # Motor de juego de Pac-Man (exporta window.initPacmanGame y window.PacmanGame)
│       ├── ghosts.js           # IA de los 4 fantasmas (Blinky, Pinky, Inky, Clyde)
│       ├── map.js              # Matriz del laberinto original 28x31
│       ├── pacman.js           # Jugador Pac-Man y cálculo de giros
│       └── particles.js        # Sistema de partículas neón y puntuaciones flotantes
├── assets/                     # Recursos adicionales (ej. QR code de Pac-Man)
└── test/                       # Suites de pruebas automáticas (Headless Chrome CDP y Tiers 1 a 4)
```

---

## ⚙️ 3. CÓMO FUNCIONA EL SISTEMA DE CAMBIO DE JUEGO (HUB SWITCHER)
En `index.html`, al final del `<body>`, existe un script de control:
* **Estado inicial:** Muestra `#main-menu` y oculta `#game-container` y `#arcade-cabinet`.
* **Clic en "Modo historia Super Ibon Bros" (`#btn-select-mario`):**
  - Oculta el menú, muestra `#game-container`, muestra el botón `◀ MENÚ` (`#btn-return-menu`).
  - Lanza/reanuda el juego de Mario llamando a `window.Game.init()`.
* **Clic en "Pac-Man" (`#btn-select-pacman`):**
  - Oculta el menú, muestra `#arcade-cabinet`, muestra el botón `◀ MENÚ`.
  - Lanza/reanuda Pac-Man llamando a `window.initPacmanGame()`.
* **Clic en `◀ MENÚ` (`#btn-return-menu`):**
  - Pausa/detiene los bucles y sonidos de ambos juegos y regresa a la pantalla de selección principal.
* **Acceso directo por URL:**
  - `index.html#mario` o `index.html?game=mario` abre directamente el juego de Mario.
  - `index.html#pacman` o `index.html?game=pacman` abre directamente el Pac-Man.

---

## 📱 4. DETALLES TÉCNICOS IMPORTANTES
1. **Controles Móviles (Android):**
   - El juego de Mario usa `#touch-controls` con botones circulares (`#btn-left`, `#btn-right`, `#btn-jump`) ubicados ergonómicamente en la zona de los pulgares.
   - Pac-Man usa un D-Pad virtual (`#virtual-dpad`) con botones direccionales.
   - Ambos juegos admiten eventos táctiles nativos (`touchstart`, `touchmove`, `touchend`) con `preventDefault()` para evitar scroll accidental en smartphones.
2. **Vibración Háptica:**
   - Implementada mediante `navigator.vibrate` en `js/game.js` para saltos, recolección de monedas, destrucción de bloques y victoria.
3. **Cero Dependencias Externas de Red:**
   - Todos los gráficos de Mario y Pac-Man se dibujan mediante Canvas 2D / proceduralmente en código.
   - Todos los sonidos se sintetizan mediante la `Web Audio API` nativa del navegador.

---

## 🚀 5. INSTRUCCIONES PARA LA SIGUIENTE IA (POSIBLES TAREAS FUTURAS)
Si el usuario pide nuevas mejoras o modificaciones, sigue estas reglas:

* **Si pide empaquetar a APK de Android:**
  - Todos los archivos son HTML5/JS/CSS estáticos puros. Se pueden empaquetar directamente en un proyecto Android WebView nativo o con Capacitor/Cordova sin necesidad de servidor backend.
* **Si pide cambiar el vídeo de felicitación:**
  - El enlace está en `index.html` en la etiqueta `<a id="reward-btn" href="...">`.
* **Si pide añadir más niveles o mundos:**
  - Para Mario: modificar `js/level.js` (añadiendo arrays para World 1-2, etc.) y coordinar con `js/game.js`.
  - Para Pac-Man: la lógica de progresión de niveles ya está implementada en `js/pacman/game.js` (`this.level++` incrementa la velocidad y disminuye el tiempo de energizer según la tabla oficial de Namco).
* **Si pide ejecutar tests de validación:**
  - Ejecutar en terminal: `node test/headless_validator.mjs` (comprueba navegación en Chrome sin errores de consola) y `node test/test_tier1_features.mjs`.

---
*Este documento fue generado automáticamente como traspaso maestro del proyecto.*
