/**
 * js/assets.js - Programmatic Pixel-Art Sprite Engine & Asset Pipeline
 *
 * V2 Iván's Birthday Gift Edition — Platformer Overhaul (M1)
 *
 * High-definition procedural pixel-art sprite generator and atlas manager with:
 * - Super Iván hero sprites (sunglasses, party cap, birthday sash)
 * - Internet meme enemy trio (Pop Cat, Doge, Grumpy Cat)
 * - 3D shaded environment tiles, beveled bricks, shimmering question blocks
 * - 4-frame rotating 3D gold coins & birthday cake bonus items
 * - Pre-rendered horizontal mirror caching (_flip) for 60 FPS rendering
 * - 100% synchronous readiness after init() with 0 network dependencies
 * - Dual canvas backing (HTMLCanvasElement in Browser / MemoryCanvas in Node.js)
 *
 * Compatible with Browser Window, Headless Chrome CDP, and Node.js.
 */
(function (global) {
  'use strict';

  // --- 1. COLOR PALETTES ---
  const PALETTES = {
    // Super Iván Hero Palette (14 distinct colors)
    ivan: {
      '.': null,              // Transparent (RGBA 0,0,0,0)
      'Y': '#FFD700',         // Bright Gold (Party hat pompom, birthday sash, belt buckle)
      'P': '#FF1493',         // Festive Magenta / Deep Pink (Party hat diagonal stripes)
      'C': '#00D8FF',         // Electric Cyan (Party hat main body cone)
      'H': '#3E2723',         // Espresso Brown (Stylish pompadour hair fringe)
      'S': '#FFCCA6',         // Warm Peach (Face skin tone & hands)
      'T': '#E59866',         // Peach Shadow / Jawline
      'K': '#000000',         // Pitch Black (Sunglasses frame, sneaker soles, outlines)
      'G': '#263238',         // Dark Smoke Grey (Sunglasses tinted lenses)
      'W': '#FFFFFF',         // Crisp White (Sunglasses specular glint, sneaker body)
      'R': '#E52521',         // Birthday Ruby Red (Party shirt/jacket body, shoe stripes)
      'A': '#990000',         // Crimson Shadow (Shirt folds & armpits)
      'L': '#1976D2',         // Denim Blue (Party jeans / trousers)
      'N': '#0D47A1'          // Deep Navy Shadow (Pants inseam)
    },
    // Legacy Mario Palette (Backward compatibility)
    mario: {
      '.': null,              // Transparent
      'R': '#E52521',         // Red
      'S': '#FDB813',         // Skin / Peach
      'B': '#6B3800',         // Dark Brown
      'L': '#0026FF',         // Blue
      'Y': '#FFD700',         // Yellow
      'W': '#FFFFFF',         // White
      'K': '#000000'          // Black
    },
    // Pop Cat Meme Palette
    popcat: {
      '.': null,              // Transparent
      'C': '#F5E6D3',         // Cream White Fur
      'W': '#FFFFFF',         // Pure White Muzzle / Glint
      'B': '#D4B896',         // Biscuit Tan Shading
      'P': '#FF94B8',         // Pink Inner Ears & Nose
      'R': '#D81B60',         // Deep Pink Mouth Rim
      'M': '#4A081A',         // Dark Red-Black Throat Cavity
      'K': '#1A120B',         // Dark Eyes & Contours
      'Y': '#FFC107'          // Amber Eye Gleam
    },
    // Legacy Goomba Palette (Backward compatibility)
    goomba: {
      '.': null,              // Transparent
      'D': '#8B2500',         // Dark Brown
      'C': '#B84418',         // Red-Brown
      'T': '#FCE0A8',         // Tan / Peach
      'K': '#000000',         // Black
      'W': '#FFFFFF'          // White
    },
    // Doge Meme Palette
    doge: {
      '.': null,              // Transparent
      'Y': '#E8A54B',         // Golden Tan Fur
      'O': '#B86F1B',         // Dark Ochre Shadow
      'L': '#FFF0D4',         // Light Cream Muzzle & Eyebrows
      'W': '#FFFFFF',         // White Catchlights
      'K': '#261505',         // Dark Nose & Eyes
      'P': '#FF8A80',         // Pink Ear/Tongue
      'D': '#7C4309'          // Ear Crease
    },
    // Grumpy Cat Meme Palette
    grumpy: {
      '.': null,              // Transparent
      'W': '#F5EFE6',         // Cream White Fur
      'M': '#563C2E',         // Seal-Point Brown Mask
      'D': '#382319',         // Deep Espresso Brown
      'B': '#00B0FF',         // Piercing Ice Blue Eyes
      'U': '#0069C0',         // Deep Blue Pupil Shadow
      'P': '#FF8DA1',         // Pink Nose Tip
      'K': '#140A06',         // Black Scowl Line
      'L': '#D2C4B8'          // Tan-Grey Belly Shadow
    },
    // 3D Collectible Coins
    coin: {
      '.': null,              // Transparent
      'Y': '#FFD700',         // Bright Royal Gold Face
      'O': '#FF9800',         // Warm Amber Bevel Rim
      'D': '#8D4F00',         // Deep Bronze Inner Shadow
      'W': '#FFFFFF',         // White Specular Highlight
      'w': '#FFFFFF',         // Lowercase White Specular
      'j': '#FFF59D',         // Bright Gold Sheen
      'K': '#3E1A00'          // Core Slot Dark Crevice
    },
    // Collectible Items (Birthday Cake & Special Items)
    cake: {
      '.': null,              // Transparent
      'p': '#FF80AB',         // Strawberry Cream Frosting Pink
      'P': '#E91E63',         // Raspberry Glaze Accent
      'S': '#FFE082',         // Golden Sponge Cake Crumb
      's': '#FFF59D',         // Light Fluffy Sponge Crumb
      'C': '#5D4037',         // Rich Chocolate Fudge Layer
      'd': '#3E2723',         // Deep Chocolate Drop Shadow
      'r': '#FF1744',         // Juicy Birthday Strawberry
      'g': '#76FF03',         // Strawberry Green Leaf
      'f': '#FF6D00',         // Candle Flame Core
      'l': '#FFD600',         // Candle Flame Outer Glow
      'b': '#2979FF',         // Festive Blue Candle Wax
      'w': '#FFFFFF',         // White Vanilla Whipped Cream
      'W': '#FFFFFF',         // Uppercase White
      'Y': '#FFD700',         // Gold
      'O': '#FF9800',         // Orange
      'K': '#3E1A00'          // Dark
    },
    // Environment & 3D Shaded Tiles
    tile: {
      '.': null,              // Transparent
      'L': '#A6F043',         // Specular Grass Blade Tip (Bright Lime)
      'H': '#55C72B',         // Vibrant Grass Highlight Green
      'G': '#2E8B18',         // Rich Mid Grass Green
      'g': '#184E10',         // Deep Grass Shadow / Root Edge
      'f': '#B86B28',         // Light Warm Sand / Soil Highlight
      'F': '#8A4513',         // Rich Terracotta Loam Body
      'E': '#4A2306',         // Deep Dark Subterranean Bedrock
      'p': '#D7CCC8',         // Pebble Light Specular / Mineral Fleck
      'q': '#5D4037',         // Pebble Dark Shadow
      'W': '#FFCC80',         // Specular Bevel Cream-Gold Highlight
      'b': '#E64A19',         // Upper Brick Face Bright Terracotta
      'B': '#A5350A',         // Mid Brick Body Red-Brown
      'd': '#6E1E02',         // Lower Brick Bevel Shadow
      'K': '#1A0802',         // Deep Recessed Mortar Line / Void
      'w': '#FFFFFF',         // Specular White Flash / Glint
      'j': '#FFF176',         // Shimmering Golden Gleam
      'Y': '#FFD700',         // Vivid Royal Gold Body
      'Q': '#FF9800',         // Deep Amber Gold Shadow Bevel
      'k': '#6B3800',         // 3D Glyph Drop Shadow / Rim Line
      's': '#ECEFF1',         // Specular Steel Bevel Highlight
      'U': '#90A4AE',         // Brushed Steel Face Plate
      'u': '#607D8B',         // Deep Steel Shadow
      'V': '#37474F',         // Rivet Recessed Cavity / Dark Border
      'v': '#FFFFFF',         // Rivet Specular Glint
      'i': '#E8F8E8',         // Specular Mint/White Glint Stripe
      'P': '#43D843',         // Bright Vivid Emerald Highlight
      'M': '#00A820',         // Rich Emerald Base Pipe Body
      'm': '#006B14',         // Deep Emerald Shadow
      'N': '#003808',         // Dark Ambient Occlusion Rim Shadow
      'X': '#011504',         // Inner Pipe Cavern Void
      'S': '#ECEFF1',         // Castle Stone Marble Capstone / Highlight
      'T': '#90A4AE',         // Castle Stone Ashlar Masonry
      't': '#455A64',         // Castle Stone Bevel Shadow
      'D': '#3E2723',         // Medieval Arched Door Dark Mahogany Wood
      'e': '#5D4037',         // Door Wood Plank Highlight
      'a': '#212121',         // Door Forged Iron Strap Hinge
      'r': '#FF1744',         // Birthday Ruby Red Bunting / Confetti / Berry
      'y': '#FFEA00',         // Birthday Gold Star Bunting / Flame
      'c': '#00E5FF',         // Birthday Cyan Confetti Sparkle
      'z': '#FF4081',         // Birthday Magenta Streamer / Frosting
      'O': '#FF9800',         // Birthday Candle Flame Orange / Gold Bevel
      'I': '#2979FF',         // Birthday Candle Blue Wax
      'C': '#4E2712'          // Castle Cake Chocolate Fudge Layer
    }
  };

  // --- 2. 16x16 PIXEL ART MATRICES ---
  const RAW_SPRITES = {
    // -------------------------------------------------------------------------
    // PLAYER: SUPER IVÁN (HERO)
    // -------------------------------------------------------------------------
    player: {
      idle: {
        palette: 'ivan',
        flip: true,
        data: [
          "................",
          ".......YY.......",
          "......PPPP......",
          ".....CCCCCC.....",
          "....PCPCPCPC....",
          "...HHHHHHHHH....",
          "...KKKKKKKKK....",
          "...KWGKKKWGK....",
          "....SSTTSSST....",
          "...RRRRYYRRR....",
          "..RRRRRYYRRRR...",
          ".SS.RRRRRR.SS...",
          "..SS.LLLL.SS....",
          "....LLNNLL......",
          "...WWR..WWR.....",
          "...KKK..KKK....."
        ]
      },
      run_1: {
        palette: 'ivan',
        flip: true,
        data: [
          "................",
          ".......YY.......",
          "......PPPP......",
          ".....CCCCCC.....",
          "....PCPCPCPC....",
          "...HHHHHHHHH....",
          "...KKKKKKKKK....",
          "...KWGKKKWGK....",
          "....SSTTSSST....",
          "...RRRRYYRRR....",
          "..RRRRRYYRRRR...",
          ".SS.RRRRRR......",
          "..SS.LLLLLL.....",
          "...LLLL...LL....",
          "..WWR....WWR....",
          ".KKK......KKK..."
        ]
      },
      run_2: {
        palette: 'ivan',
        flip: true,
        data: [
          "................",
          ".......YY.......",
          "......PPPP......",
          ".....CCCCCC.....",
          "....PCPCPCPC....",
          "...HHHHHHHHH....",
          "...KKKKKKKKK....",
          "...KWGKKKWGK....",
          "....SSTTSSST....",
          "...RRRRYYRRR....",
          "..RRRRRYYRRRR...",
          ".SS.RRRRRR.SS...",
          "..SS.LLLL.SS....",
          ".....LLLL.......",
          "....LLLLLL......",
          "....WWRWWR......"
        ]
      },
      run_3: {
        palette: 'ivan',
        flip: true,
        data: [
          "................",
          ".......YY.......",
          "......PPPP......",
          ".....CCCCCC.....",
          "....PCPCPCPC....",
          "...HHHHHHHHH....",
          "...KKKKKKKKK....",
          "...KWGKKKWGK....",
          "....SSTTSSST....",
          "...RRRRYYRRR....",
          "..RRRRRYYRRRR...",
          "......RRRRRR.SS.",
          ".....LLLLLL.SS..",
          "....LL...LLLL...",
          "....WWR....WWR..",
          "...KKK......KKK."
        ]
      },
      jump: {
        palette: 'ivan',
        flip: true,
        data: [
          "........YY..SS..",
          ".......PPPP.SS..",
          "......CCCCCCRR..",
          ".....PCPCPCPCR..",
          "....HHHHHHHHH...",
          "....KKKKKKKKK...",
          "....KWGKKKWGK...",
          ".....SSTTSSST...",
          "....RRRRYYRRRR..",
          "...RRRRRLLLLLLR.",
          "..SS.RRLLYYLLSS.",
          ".SSS.LLLLLL.....",
          ".SS.LLLLLLLL....",
          "...LLLL..LLLL...",
          "..WWR......WWR..",
          ".KKK........KKK."
        ]
      },
      skid: {
        palette: 'ivan',
        flip: true,
        data: [
          "................",
          ".......YY.......",
          "......PPPP......",
          ".....CCCCCC.....",
          "....PCPCPCPC....",
          "...HHHHHHHHH....",
          "...KKKKKKKKK....",
          "...KWGKKKWGK....",
          "....SSTTSSST....",
          "...RRRRRRRR.....",
          "..RRRRLLLLRR....",
          ".SS.LLYYYYLL.SS.",
          ".SSSLLLLLLLLSSS.",
          "..SSLLLLLLLLSS..",
          "..WWRR....WWRR..",
          ".KKKK......KKKK."
        ]
      },
      flag: {
        palette: 'ivan',
        flip: true,
        data: [
          "................",
          ".......YY.......",
          "......PPPP......",
          ".....CCCCCC.....",
          "....PCPCPCPC....",
          "...HHHHHHHHH....",
          "...KKKKKKKKK....",
          "...KWGKKKWGK....",
          "....SSTTSSST....",
          "...RRRRYYRRR....",
          "..RRRRRYYRRRR...",
          ".SSSRLYYLR......",
          ".SSSSLLLLL..SS..",
          "..SSLLLLLL.SSS..",
          "...WWRRWWR......",
          "..KKKKKKKK......"
        ]
      },
      die: {
        palette: 'ivan',
        flip: false,
        data: [
          "................",
          ".....YY.........",
          "....PPPP........",
          "...CCCCCC.......",
          "..PCPCPCPC......",
          "...HHHHHHHH.....",
          "..KKK...KKK.....",
          "...KWG.KWG......",
          "....STTTTS......",
          "...SSRRRRRRSS...",
          "..SSSSRRRRSSSS..",
          "..SS.RRLLRR.SS..",
          ".....RRYYRR.....",
          "...LLLL..LLLL...",
          "..WWRR....WWRR..",
          ".KKKK......KKKK."
        ]
      }
    },

    // -------------------------------------------------------------------------
    // ENEMIES: INTERNET MEME CATS & SHIBA INU
    // -------------------------------------------------------------------------
    enemy: {
      // Pop Cat (Default / Goomba Alias)
      walk_1: {
        palette: 'popcat',
        flip: false,
        data: [
          "..B........B....",
          ".BPC......CPB...",
          ".BPC......CPB...",
          ".BCCCC..CCCCB...",
          "BCCCCCCCCCCCCB..",
          "BCCCCCCCCCCCCB..",
          "BCKWWKCCKWWKCB..",
          "BCKWWKCCKWWKCB..",
          "BCCKKCCCCKKCCB..",
          "BCWWWWPWWWWCCB..",
          "BCWWWWKWWWWCCB..",
          ".BCCCCWWCCCCB...",
          "..BCCCCCCCCB....",
          "..WWCC..CCWW....",
          ".WWWW....WWWW...",
          ".KKKK....KKKK..."
        ]
      },
      walk_2: {
        palette: 'popcat',
        flip: false,
        data: [
          "..B........B....",
          ".BPC......CPB...",
          ".BPC......CPB...",
          ".BCCCCCCCCCCB...",
          "BCCCCCCCCCCCCB..",
          "BCKWWKCCKWWKCB..",
          "BCKWWKCCKWWKCB..",
          "BCCKKCCCCKKCCB..",
          "BCWW..RR..WWCB..",
          "BCW.RRMMRR.WCB..",
          "BCW.RMMMMR.WCB..",
          "BCW.RRMMRR.WCB..",
          ".BCC..RR..CCB...",
          "..BCCCCCCCCB....",
          "...WWCCWWCC.....",
          "..WWWWWWWW......"
        ]
      },
      squash: {
        palette: 'popcat',
        flip: false,
        data: [
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          ".B............B.",
          ".BPC........CPB.",
          "..BCCCCCCCCCCB..",
          ".BCKWWKCCKWWKCB.",
          ".BCKKKKCCKKKKCB.",
          "BCCC..RRRR..CCCB",
          "BCCC.RMMMMR.CCCB",
          "WWWWWWWWWWWWWWWW"
        ]
      },

      // Dedicated Pop Cat keys
      popcat_walk_1: {
        palette: 'popcat',
        flip: false,
        data: [
          "..B........B....",
          ".BPC......CPB...",
          ".BPC......CPB...",
          ".BCCCC..CCCCB...",
          "BCCCCCCCCCCCCB..",
          "BCCCCCCCCCCCCB..",
          "BCKWWKCCKWWKCB..",
          "BCKWWKCCKWWKCB..",
          "BCCKKCCCCKKCCB..",
          "BCWWWWPWWWWCCB..",
          "BCWWWWKWWWWCCB..",
          ".BCCCCWWCCCCB...",
          "..BCCCCCCCCB....",
          "..WWCC..CCWW....",
          ".WWWW....WWWW...",
          ".KKKK....KKKK..."
        ]
      },
      popcat_walk_2: {
        palette: 'popcat',
        flip: false,
        data: [
          "..B........B....",
          ".BPC......CPB...",
          ".BPC......CPB...",
          ".BCCCCCCCCCCB...",
          "BCCCCCCCCCCCCB..",
          "BCKWWKCCKWWKCB..",
          "BCKWWKCCKWWKCB..",
          "BCCKKCCCCKKCCB..",
          "BCWW..RR..WWCB..",
          "BCW.RRMMRR.WCB..",
          "BCW.RMMMMR.WCB..",
          "BCW.RRMMRR.WCB..",
          ".BCC..RR..CCB...",
          "..BCCCCCCCCB....",
          "...WWCCWWCC.....",
          "..WWWWWWWW......"
        ]
      },
      popcat_squash: {
        palette: 'popcat',
        flip: false,
        data: [
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          ".B............B.",
          ".BPC........CPB.",
          "..BCCCCCCCCCCB..",
          ".BCKWWKCCKWWKCB.",
          ".BCKKKKCCKKKKCB.",
          "BCCC..RRRR..CCCB",
          "BCCC.RMMMMR.CCCB",
          "WWWWWWWWWWWWWWWW"
        ]
      },

      // Doge (Kabosu the Shiba Inu)
      doge_walk_1: {
        palette: 'doge',
        flip: false,
        data: [
          "..O........O....",
          ".OPO......OPO...",
          ".OPYO....OYPO...",
          ".OYYYYYYYYYYO...",
          "OYYYYYYYYYYYYO..",
          "OY.LL.YYYY.LL.O.",
          "OYLKKLKYYKWWKO..",
          "OYLKKKLYYKWWKO..",
          "OYYLLLYYYLLLYO..",
          "OYYLLLLLLLLYYO..",
          "OYYLLKLLLKLLYO..",
          ".OYYLLKKKLLYYO..",
          "..OYYYYYYYYYO...",
          "...LYY....YYL...",
          "..LLYY....YYLL..",
          "..KKKK....KKKK.."
        ]
      },
      doge_walk_2: {
        palette: 'doge',
        flip: false,
        data: [
          "..O........O....",
          ".OPO......OPO...",
          ".OPYO....OYPO...",
          ".OYYYYYYYYYYO...",
          "OYYYYYYYYYYYYO..",
          "OY.LL.YYYY.LL.O.",
          "OYLKKLKYYKWWKO..",
          "OYLKKKLYYKWWKO..",
          "OYYLLLYYYLLLYO..",
          "OYYLLLPLLLLYYO..",
          "OYYLLKKKKLLYYO..",
          ".OYYLLKKKLLYYO..",
          "..OYYYYYYYYYO...",
          "....YYL..LYY....",
          "...YYLL..LLYY...",
          "...KKKK..KKKK..."
        ]
      },
      doge_squash: {
        palette: 'doge',
        flip: false,
        data: [
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          ".O............O.",
          ".OPO........OPO.",
          "..OYYYYYYYYYYO..",
          ".OYLKKLKYYKWWKO.",
          ".OYLKKKLYYKWWKO.",
          "OYYLLLLLLLLLLYYO",
          "OYYLLLPLLLLLLYYO",
          "KKKKKKKKKKKKKKKK"
        ]
      },

      // Grumpy Cat (Tardar Sauce)
      grumpy_walk_1: {
        palette: 'grumpy',
        flip: false,
        data: [
          "..D........D....",
          ".DMD......DMD...",
          ".DMWW....WWMD...",
          ".DMWWWWWWWWMD...",
          "DMMMMMMMMMMMMD..",
          "DMMMMMMMMMMMMD..",
          "DMMBBUDMMDUBBMD.",
          "DMMBKUDMMDUKBMD.",
          "DMMKKUDMMDUKKMD.",
          "DWWWWWPWWWWWWD..",
          "DWWWKKKKKKWWWD..",
          ".DWWKWWWWKWWD...",
          "..DWWWWWWWWWD...",
          "..WWLL....LLWW..",
          ".WWWW......WWWW.",
          ".DDDD......DDDD."
        ]
      },
      grumpy_walk_2: {
        palette: 'grumpy',
        flip: false,
        data: [
          "..D........D....",
          ".DMD......DMD...",
          ".DMWW....WWMD...",
          ".DMWWWWWWWWMD...",
          "DMMMMMMMMMMMMD..",
          "DMMMMMMMMMMMMD..",
          "DMMBBUDMMDUBBMD.",
          "DMMBKUDMMDUKBMD.",
          "DMMKKUDMMDUKKMD.",
          "DWWWWWPWWWWWWD..",
          "DWWWKKKKKKWWWD..",
          ".DWWKWWWWKWWD...",
          "..DWWWWWWWWWD...",
          "....WWLLLLWW....",
          "...WWWW..WWWW...",
          "...DDDD..DDDD..."
        ]
      },
      grumpy_squash: {
        palette: 'grumpy',
        flip: false,
        data: [
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          ".D............D.",
          ".DMD........DMD.",
          "..DMMMMMMMMMMD..",
          "DMMBBUDMMDUBBMD.",
          "DMMKKUDMMDUKKMD.",
          "DWWWWWPWWWWWWWD.",
          "DWWWKKKKKKKKWWWD",
          "DDDDDDDDDDDDDDDD"
        ]
      }
    },

    // -------------------------------------------------------------------------
    // ITEMS: 3D ROTATING GOLD COINS & BIRTHDAY CAKE
    // -------------------------------------------------------------------------
    item: {
      coin_1: {
        palette: 'coin',
        flip: false,
        data: [
          ".....OOOOOO.....",
          "...OOYYYYYYOO...",
          "..OYYYYwwYYYYO..",
          ".OYYYwwOODDYYYO.",
          ".OYYwwO...DDYYO.",
          "OYYww.......DDYY",
          "OYYww..KKK..DDYY",
          "OYYww..KKK..DDYY",
          "OYYww..KKK..DDYY",
          "OYYww..KKK..DDYY",
          "OYYww.......DDYY",
          ".OYYwwO...DDYYO.",
          ".OYYYwwOODDYYYO.",
          "..OYYYYwwYYYYO..",
          "...OOYYYYYYOO...",
          ".....OOOOOO....."
        ]
      },
      coin_2: {
        palette: 'coin',
        flip: false,
        data: [
          "......OOOO......",
          "....OOYYYYOO....",
          "...OYYwwYYDYO...",
          "..OYww..ODDYYO..",
          "..OYww.KODDYYO..",
          ".OYww..KKODDYYO.",
          ".OYww..KKODDYYO.",
          ".OYww..KKODDYYO.",
          ".OYww..KKODDYYO.",
          ".OYww..KKODDYYO.",
          ".OYww..KKODDYYO.",
          "..OYww.KODDYYO..",
          "..OYww..ODDYYO..",
          "...OYYwwYYDYO...",
          "....OOYYYYOO....",
          "......OOOO......"
        ]
      },
      coin_3: {
        palette: 'coin',
        flip: false,
        data: [
          ".......OO.......",
          "......OYYO......",
          ".....OYYDYO.....",
          ".....OYwwYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYKKYO.....",
          ".....OYwwYO.....",
          ".....OYYDYO.....",
          "......OYYO......",
          ".......OO......."
        ]
      },
      coin_4: {
        palette: 'coin',
        flip: false,
        data: [
          "......OOOO......",
          "....OOYYYYOO....",
          "...OYDYYwwYYO...",
          "..OYYDDO..wwYO..",
          "..OYYDDK.wwYO...",
          ".OYYDDOKK..wwYO.",
          ".OYYDDOKK..wwYO.",
          ".OYYDDOKK..wwYO.",
          ".OYYDDOKK..wwYO.",
          ".OYYDDOKK..wwYO.",
          ".OYYDDOKK..wwYO.",
          "..OYYDDK.wwYO...",
          "..OYYDDO..wwYO..",
          "...OYDYYwwYYO...",
          "....OOYYYYOO....",
          "......OOOO......"
        ]
      },
      cake: {
        palette: 'cake',
        flip: false,
        data: [
          ".......r........",
          "......grg.......",
          ".....wwwww......",
          "....wpppppw.....",
          "...wPPPPPPPw....",
          "..wwwwwwwwwww...",
          ".wSSSSSSSSSSSw..",
          "wSSSSSSSSSSSSSdw",
          "wCCCCCCCCCCCCCdw",
          "wSSSSSSSSSSSSSdw",
          "wsssssssssssssdw",
          "wCCCCCCCCCCCCCdw",
          "wSSSSSSSSSSSSSdw",
          "wsssssssssssssdw",
          "wwwwwwwwwwwwwwww",
          "................"
        ]
      },
      cake_slice: {
        palette: 'cake',
        flip: false,
        data: [
          ".......r........",
          "......grg.......",
          ".....wwwww......",
          "....wpppppw.....",
          "...wPPPPPPPw....",
          "..wwwwwwwwwww...",
          ".wSSSSSSSSSSSw..",
          "wSSSSSSSSSSSSSdw",
          "wCCCCCCCCCCCCCdw",
          "wSSSSSSSSSSSSSdw",
          "wsssssssssssssdw",
          "wCCCCCCCCCCCCCdw",
          "wSSSSSSSSSSSSSdw",
          "wsssssssssssssdw",
          "wwwwwwwwwwwwwwww",
          "................"
        ]
      }
    },

    // -------------------------------------------------------------------------
    // TILES: 3D SHADED TILES & CELEBRATORY BIRTHDAY PROPS
    // -------------------------------------------------------------------------
    tile: {
      ground: {
        palette: 'tile',
        flip: false,
        data: [
          "LLHHGLLHHGLLHHGL",
          "HHHHGGHHHHGGHHHH",
          "GGGGGgGGGGgGGGGG",
          "gfgfEggfgfEggfgf",
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEpFFEEEFqFFEEEp",
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEpFFEEEFqFFEEEp",
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEEEEEEEEEEEEEEE"
        ]
      },
      ground_filler: {
        palette: 'tile',
        flip: false,
        data: [
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEpFFEEEFqFFEEEp",
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEpFFEEEFqFFEEEp",
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEpFFEEEFqFFEEEp",
          "FFFFEFFFFFEFFFFE",
          "FFEEFFEEFFEEFFEE",
          "FFEFFFFEFFFEFFFF",
          "EEEEEEEEEEEEEEEE"
        ]
      },
      brick: {
        palette: 'tile',
        flip: false,
        data: [
          "WWWWWWWWWWWWWWWW",
          "Wbbbbbbbbbbbbbbd",
          "WBBBBBBBBBBBBBBd",
          "KKKKKKKKKKKKKKKK",
          "WbbbbbWdKWbbbbbW",
          "WBBBBBWdKWBBBBBW",
          "WddddbWdKWddddbW",
          "KKKKKKKKKKKKKKKK",
          "WWWWWWWWWWWWWWWW",
          "Wbbbbbbbbbbbbbbd",
          "WBBBBBBBBBBBBBBd",
          "KKKKKKKKKKKKKKKK",
          "WbbbbbWdKWbbbbbW",
          "WBBBBBWdKWBBBBBW",
          "WddddbWdKWddddbW",
          "KKKKKKKKKKKKKKKK"
        ]
      },
      question_1: {
        palette: 'tile',
        flip: false,
        data: [
          "WWWWWWWWWWWWWWWW",
          "WjjYYYYYYYYYYYYk",
          "WjQkkkkkkkkkkQQk",
          "WjQkYYYYYYYYkQQk",
          "WjQkYkkkkkYYkQQk",
          "WjQkkYQQQkYYkQQk",
          "WjQkkkQQQkYYkQQk",
          "WjQkQQQQkYYQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQQQQQQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQQQQQQkQQk",
          "WjQQkkkkkkkkkQQk",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      question_2: {
        palette: 'tile',
        flip: false,
        data: [
          "wwwwwwwwwwwwwwww",
          "wwjjYYYYYYYYYYYk",
          "wjQkkkkkkkkkkQQk",
          "wjQkwwwwwwwwkQQk",
          "wjQkwkkkkkwwkQQk",
          "wjQkkwwwwwYYkQQk",
          "wjQkkkQQQkYYkQQk",
          "wjQkQQQQkYYQkQQk",
          "wjQkQQQkYYQQkQQk",
          "wjQkQQQkYYQQkQQk",
          "wjQkQQQQQQQQkQQk",
          "wjQkQQQkYYQQkQQk",
          "wjQkQQQkYYQQkQQk",
          "wjQkQQQQQQQQkQQk",
          "wjQQkkkkkkkkkQQk",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      question_3: {
        palette: 'tile',
        flip: false,
        data: [
          "WWWWWWWWWWWWWWWW",
          "WjjjYYYYYYYYYYYk",
          "WjQkkkkkkkkkkQQk",
          "WjQkjjjjjjjjkQQk",
          "WjQkjkkkkkjjkQQk",
          "WjQkkjjjjjYYkQQk",
          "WjQkkkQQQkYYkQQk",
          "WjQkQQQQkYYQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQQQQQQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQkYYQQkQQk",
          "WjQkQQQQQQQQkQQk",
          "WjQQkkkkkkkkkQQk",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      empty: {
        palette: 'tile',
        flip: false,
        data: [
          "ssssssssssssssss",
          "sUUUUUUUUUUUUUUu",
          "sUvsUUUUUUUUvsUu",
          "sUVVUUUUUUUUVVUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUUUUUUUUUUUUUUu",
          "sUvsUUUUUUUUvsUu",
          "sUVVUUUUUUUUVVUu",
          "suuuuuuuuuuuuuuu",
          "VVVVVVVVVVVVVVVV"
        ]
      },
      pipe_tl: {
        palette: 'tile',
        flip: false,
        data: [
          "NNNNNNNNNNNNNNNN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NiPPMMmmmmmmmmmN",
          "NNNNNNNNNNNNNNNN"
        ]
      },
      pipe_tr: {
        palette: 'tile',
        flip: false,
        data: [
          "NNNNNNNNNNNNNNNN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "MMMMmmmmmNNNNmmN",
          "NNNNNNNNNNNNNNNN"
        ]
      },
      pipe_bl: {
        palette: 'tile',
        flip: false,
        data: [
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm.",
          ".NiPPMMmmmmmmmm."
        ]
      },
      pipe_br: {
        palette: 'tile',
        flip: false,
        data: [
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm.",
          ".MMMMmmmmmNNNmm."
        ]
      },
      flag: {
        palette: 'tile',
        flip: false,
        data: [
          "rrrrrryy........",
          "rrrrrrrrry......",
          "rrrrrrrrrrry....",
          "rrrrwrrrrrrrry..",
          "rrrrwwrrrrrrrrry",
          "rrrrwrrrrrrrry..",
          "rrrrrrrrrrry....",
          "rrrrrrrrry......",
          "rrrrrryy........",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................"
        ]
      },
      flagpole_top: {
        palette: 'tile',
        flip: false,
        data: [
          "......wwww......",
          ".....wYYYYw.....",
          "....wYYYYYYO....",
          "....wYYYYYYO....",
          ".....wYYYYO.....",
          "......OOOO......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......"
        ]
      },
      flagpole_shaft: {
        palette: 'tile',
        flip: false,
        data: [
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......",
          "......iPmM......"
        ]
      },
      castle_brick: {
        palette: 'tile',
        flip: false,
        data: [
          "SSSSSSSSSSSSSSSS",
          "STTTTTTTTTTTTTTt",
          "STTTrTTTTTyTTTTt",
          "SSSSSSSSSSSSSSSS",
          "STTTTTtSTTTTTTTt",
          "STTTTTtSTTTTTTTt",
          "STTcTTtSTTTzTTTt",
          "SSSSSSSSSSSSSSSS",
          "STTTTTTTTTTTTTTt",
          "STTTTTTTTTTTTTTt",
          "STTrTTTTTTTyTTTt",
          "SSSSSSSSSSSSSSSS",
          "STTTTTtSTTTTTTTt",
          "STTTTTtSTTTTTTTt",
          "STTTTTtSTTTTTTTt",
          "tttttttttttttttt"
        ]
      },
      castle_door: {
        palette: 'tile',
        flip: false,
        data: [
          "....TTTTTTTT....",
          "..TTKKKKKKKKTT..",
          ".TKKKKKKKKKKKKT.",
          "TKKKKKKKKKKKKKKT",
          "TKKKKKKKKKKKKKKT",
          "TKDaaDDDDDDaaDKT",
          "TKDaaDDDDDDaaDKT",
          "TKDDDDDDDDDDDDKT",
          "TKDDDYDDDDYDDDKT",
          "TKDDDYDDDDYDDDKT",
          "TKDDDDDDDDDDDDKT",
          "TKDaaDDDDDDaaDKT",
          "TKDaaDDDDDDaaDKT",
          "TKDDDDDDDDDDDDKT",
          "TKDDDDDDDDDDDDKT",
          "TKDDDDDDDDDDDDKT"
        ]
      },
      castle_battlement: {
        palette: 'tile',
        flip: false,
        data: [
          "...rrr..........",
          "...rrrrry.......",
          "...rrr..........",
          "...a............",
          "...a............",
          "SSSS...SSSS...SS",
          "STTt...STTt...ST",
          "STTt...STTt...ST",
          "STTt...STTt...ST",
          "SSSSSSSSSSSSSSSS",
          "STTTTTTTTTTTTTTt",
          "STTTTTTTTTTTTTTt",
          "STTTTTTTTTTTTTTt",
          "SSSSSSSSSSSSSSSS",
          "STTTTTtSTTTTTTTt",
          "tttttttttttttttt"
        ]
      },
      castle_cake: {
        palette: 'tile',
        flip: false,
        data: [
          ".......y........",
          ".......O........",
          ".......I........",
          ".....wwwww......",
          "....wzzzzzww....",
          "....wPzzzzPw....",
          "...wwwwwwwwww...",
          "..wzzzzzzzzzzw..",
          "..wPzzzzzzzzPw..",
          "..wYYYYYYYYYYw..",
          "..wCCCCCCCCCCw..",
          "..wYYYYYYYYYYw..",
          "..wYYYYYYYYYYw..",
          ".wwwwwwwwwwwwww.",
          ".wrrrrrrrrrrrrw.",
          "wwwwwwwwwwwwwwww"
        ]
      }
    }
  };

  // --- 3. COLOR PARSER HELPER ---
  function parseColorHex(str) {
    if (!str) return [0, 0, 0, 0];
    if (str.startsWith('#')) {
      if (str.length === 7) {
        return [
          parseInt(str.slice(1, 3), 16),
          parseInt(str.slice(3, 5), 16),
          parseInt(str.slice(5, 7), 16),
          255
        ];
      }
      if (str.length === 4) {
        return [
          parseInt(str[1] + str[1], 16),
          parseInt(str[2] + str[2], 16),
          parseInt(str[3] + str[3], 16),
          255
        ];
      }
    }
    if (str.startsWith('rgba')) {
      const parts = str.replace(/[rgba() ]/g, '').split(',');
      return [
        parseInt(parts[0], 10) || 0,
        parseInt(parts[1], 10) || 0,
        parseInt(parts[2], 10) || 0,
        Math.round((parseFloat(parts[3]) || 0) * 255)
      ];
    }
    return [0, 0, 0, 255];
  }

  // --- 4. HEADLESS / NODE.JS MEMORY CANVAS IMPLEMENTATION ---
  class MemoryContext2D {
    constructor(canvas) {
      this.canvas = canvas;
      this.fillStyle = '#000000';
      this.imageSmoothingEnabled = false;
      this._transformStack = [];
      this._matrix = [1, 0, 0, 1, 0, 0]; // [a, b, c, d, e, f]
    }

    save() {
      this._transformStack.push([...this._matrix]);
    }

    restore() {
      if (this._transformStack.length > 0) {
        this._matrix = this._transformStack.pop();
      }
    }

    translate(x, y) {
      this._matrix[4] += this._matrix[0] * x + this._matrix[2] * y;
      this._matrix[5] += this._matrix[1] * x + this._matrix[3] * y;
    }

    scale(sx, sy) {
      this._matrix[0] *= sx;
      this._matrix[1] *= sx;
      this._matrix[2] *= sy;
      this._matrix[3] *= sy;
    }

    fillRect(x, y, w, h) {
      const [r, g, b, a] = parseColorHex(this.fillStyle);
      const isIdentity = (
        this._matrix[0] === 1 && this._matrix[1] === 0 &&
        this._matrix[2] === 0 && this._matrix[3] === 1 &&
        this._matrix[4] === 0 && this._matrix[5] === 0
      );

      if (isIdentity) {
        const minX = Math.max(0, Math.floor(x));
        const maxX = Math.min(this.canvas.width, Math.floor(x + w));
        const minY = Math.max(0, Math.floor(y));
        const maxY = Math.min(this.canvas.height, Math.floor(y + h));

        for (let targetY = minY; targetY < maxY; targetY++) {
          for (let targetX = minX; targetX < maxX; targetX++) {
            const idx = (targetY * this.canvas.width + targetX) * 4;
            this.canvas.data[idx] = r;
            this.canvas.data[idx + 1] = g;
            this.canvas.data[idx + 2] = b;
            this.canvas.data[idx + 3] = a;
          }
        }
      } else {
        // Transform bounding box vertices
        const x0 = this._matrix[0] * x + this._matrix[2] * y + this._matrix[4];
        const y0 = this._matrix[1] * x + this._matrix[3] * y + this._matrix[5];
        const x1 = this._matrix[0] * (x + w) + this._matrix[2] * (y + h) + this._matrix[4];
        const y1 = this._matrix[1] * (x + w) + this._matrix[3] * (y + h) + this._matrix[5];

        const minX = Math.max(0, Math.floor(Math.min(x0, x1)));
        const maxX = Math.min(this.canvas.width, Math.ceil(Math.max(x0, x1)));
        const minY = Math.max(0, Math.floor(Math.min(y0, y1)));
        const maxY = Math.min(this.canvas.height, Math.ceil(Math.max(y0, y1)));

        for (let targetY = minY; targetY < maxY; targetY++) {
          for (let targetX = minX; targetX < maxX; targetX++) {
            const idx = (targetY * this.canvas.width + targetX) * 4;
            this.canvas.data[idx] = r;
            this.canvas.data[idx + 1] = g;
            this.canvas.data[idx + 2] = b;
            this.canvas.data[idx + 3] = a;
          }
        }
      }
    }

    drawImage(src, ...args) {
      if (!src) return;
      const srcCanvas = (src.canvas || src);
      const srcWidth = srcCanvas.width || 16;
      const srcHeight = srcCanvas.height || 16;
      const srcData = srcCanvas.data || (srcCanvas.getContext && srcCanvas.getContext('2d')?.getImageData?.(0, 0, srcWidth, srcHeight)?.data);

      if (!srcData) return;

      let sx = 0, sy = 0, sw = srcWidth, sh = srcHeight;
      let dx = 0, dy = 0, dw = srcWidth, dh = srcHeight;

      if (args.length === 2) {
        [dx, dy] = args;
        dw = srcWidth;
        dh = srcHeight;
      } else if (args.length === 4) {
        [dx, dy, dw, dh] = args;
      } else if (args.length >= 8) {
        [sx, sy, sw, sh, dx, dy, dw, dh] = args;
      }

      const isIdentity = (
        this._matrix[0] === 1 && this._matrix[1] === 0 &&
        this._matrix[2] === 0 && this._matrix[3] === 1 &&
        this._matrix[4] === 0 && this._matrix[5] === 0
      );

      for (let y = 0; y < dh; y++) {
        for (let x = 0; x < dw; x++) {
          const sampleX = Math.floor(sx + (x / dw) * sw);
          const sampleY = Math.floor(sy + (y / dh) * sh);

          if (sampleX >= 0 && sampleX < srcWidth && sampleY >= 0 && sampleY < srcHeight) {
            const srcIdx = (sampleY * srcWidth + sampleX) * 4;
            const sa = srcData[srcIdx + 3];
            if (sa === 0) continue; // Skip transparent pixels

            const sr = srcData[srcIdx];
            const sg = srcData[srcIdx + 1];
            const sb = srcData[srcIdx + 2];

            let targetX, targetY;
            if (isIdentity) {
              targetX = dx + x;
              targetY = dy + y;
            } else {
              const centerX = dx + x + 0.5;
              const centerY = dy + y + 0.5;
              const tx = this._matrix[0] * centerX + this._matrix[2] * centerY + this._matrix[4];
              const ty = this._matrix[1] * centerX + this._matrix[3] * centerY + this._matrix[5];
              targetX = Math.floor(tx);
              targetY = Math.floor(ty);
            }

            if (targetX >= 0 && targetX < this.canvas.width && targetY >= 0 && targetY < this.canvas.height) {
              const dstIdx = (targetY * this.canvas.width + targetX) * 4;
              this.canvas.data[dstIdx] = sr;
              this.canvas.data[dstIdx + 1] = sg;
              this.canvas.data[dstIdx + 2] = sb;
              this.canvas.data[dstIdx + 3] = sa;
            }
          }
        }
      }
    }

    getImageData(sx, sy, sw, sh) {
      const sub = new Uint8ClampedArray(sw * sh * 4);
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const srcX = sx + x;
          const srcY = sy + y;
          const dstIdx = (y * sw + x) * 4;
          if (srcX >= 0 && srcX < this.canvas.width && srcY >= 0 && srcY < this.canvas.height) {
            const srcIdx = (srcY * this.canvas.width + srcX) * 4;
            sub[dstIdx] = this.canvas.data[srcIdx];
            sub[dstIdx + 1] = this.canvas.data[srcIdx + 1];
            sub[dstIdx + 2] = this.canvas.data[srcIdx + 2];
            sub[dstIdx + 3] = this.canvas.data[srcIdx + 3];
          }
        }
      }
      return { data: sub, width: sw, height: sh };
    }

    clearRect(x, y, w, h) {
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const targetX = x + px;
          const targetY = y + py;
          if (targetX >= 0 && targetX < this.canvas.width && targetY >= 0 && targetY < this.canvas.height) {
            const idx = (targetY * this.canvas.width + targetX) * 4;
            this.canvas.data[idx] = 0;
            this.canvas.data[idx + 1] = 0;
            this.canvas.data[idx + 2] = 0;
            this.canvas.data[idx + 3] = 0;
          }
        }
      }
    }
  }

  class MemoryCanvas {
    constructor(w, h) {
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
      this._ctx = new MemoryContext2D(this);
    }

    getContext(type) {
      if (type === '2d') return this._ctx;
      return null;
    }

    toDataURL() {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  }

  // --- 5. CANVAS CREATION & RASTERIZATION UTILITIES ---
  function createOffscreenCanvas(w, h) {
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      try {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (ctx) return c;
      } catch (_) {
        // Fallback to MemoryCanvas if DOM environment lacks functional 2D context
      }
    }
    return new MemoryCanvas(w, h);
  }

  function rasterizeMatrix(matrixData, paletteMap) {
    const canvas = createOffscreenCanvas(16, 16);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < 16; r++) {
      const row = matrixData[r] || '................';
      for (let c = 0; c < 16; c++) {
        const char = row[c] || '.';
        const color = paletteMap[char];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(c, r, 1, 1);
        }
      }
    }
    return canvas;
  }

  function createFlippedCanvas(sourceCanvas) {
    const canvas = createOffscreenCanvas(16, 16);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(16, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
    return canvas;
  }

  function createFallbackSprite() {
    const canvas = createOffscreenCanvas(16, 16);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Magenta (#FF00FF) and Black (#000000) checkerboard
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const isMagenta = (r < 8 && c < 8) || (r >= 8 && c >= 8);
        ctx.fillStyle = isMagenta ? '#FF00FF' : '#000000';
        ctx.fillRect(c, r, 1, 1);
      }
    }
    return canvas;
  }

  // --- 6. CATEGORY & SPRITE ALIAS NORMALIZATION ---
  const CATEGORY_ALIASES = {
    'mario': 'player',
    'player': 'player',
    'ivan': 'player',
    'super_ivan': 'player',
    'hero': 'player',
    'enemy': 'enemy',
    'enemies': 'enemy',
    'goomba': 'enemy',
    'popcat': 'enemy',
    'doge': 'enemy',
    'grumpy': 'enemy',
    'grumpycat': 'enemy',
    'item': 'item',
    'items': 'item',
    'coin': 'item',
    'coins': 'item',
    'collectible': 'item',
    'collectibles': 'item',
    'cake': 'item',
    'tile': 'tile',
    'tiles': 'tile',
    'environment': 'tile'
  };

  const SPRITE_ALIASES = {
    player: {
      'dead': 'die',
      'die': 'die',
      'mario': 'idle',
      'ivan': 'idle',
      'walk_1': 'run_1',
      'walk_2': 'run_2',
      'walk_3': 'run_3'
    },
    enemy: {
      'goomba_walk_1': 'walk_1',
      'goomba_walk_2': 'walk_2',
      'goomba_squash': 'squash',
      'squashed': 'squash',
      'walk1': 'walk_1',
      'walk2': 'walk_2',
      'popcat_1': 'walk_1',
      'popcat_2': 'walk_2',
      'popcat_walk_1': 'walk_1',
      'popcat_walk_2': 'walk_2',
      'popcat_squash': 'squash'
    },
    item: {
      'coin1': 'coin_1',
      'coin2': 'coin_2',
      'coin3': 'coin_3',
      'coin4': 'coin_4',
      'gold_coin': 'coin_1',
      'birthday_cake': 'cake',
      'cake_slice': 'cake'
    },
    tile: {
      'question_empty': 'empty',
      'empty_block': 'empty',
      'pole_top': 'flagpole_top',
      'pole_shaft': 'flagpole_shaft',
      'flag_cloth': 'flag',
      'groundfiller': 'ground_filler',
      'dirt': 'ground_filler',
      'castle': 'castle_brick',
      'door': 'castle_door'
    }
  };

  function resolveCategory(cat) {
    if (!cat) return 'tile';
    const lower = String(cat).toLowerCase();
    return Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, lower) ? CATEGORY_ALIASES[lower] : lower;
  }

  function resolveSpriteName(cat, name, rawCat) {
    if (!name) return '';
    const lower = String(name).toLowerCase();
    const isFlip = lower.endsWith('_flip');
    const base = isFlip ? lower.slice(0, -5) : lower;

    let resolvedBase = base;

    // Contextual meme sub-type resolution
    if (rawCat) {
      const rawCatLower = String(rawCat).toLowerCase();
      if (rawCatLower === 'doge') {
        if (base === 'walk_1' || base === 'walk1') resolvedBase = 'doge_walk_1';
        else if (base === 'walk_2' || base === 'walk2') resolvedBase = 'doge_walk_2';
        else if (base === 'squash' || base === 'squashed') resolvedBase = 'doge_squash';
      } else if (rawCatLower === 'grumpy' || rawCatLower === 'grumpycat') {
        if (base === 'walk_1' || base === 'walk1') resolvedBase = 'grumpy_walk_1';
        else if (base === 'walk_2' || base === 'walk2') resolvedBase = 'grumpy_walk_2';
        else if (base === 'squash' || base === 'squashed') resolvedBase = 'grumpy_squash';
      }
    }

    const aliases = Object.prototype.hasOwnProperty.call(SPRITE_ALIASES, cat) ? SPRITE_ALIASES[cat] : null;
    if (aliases && Object.prototype.hasOwnProperty.call(aliases, resolvedBase)) {
      resolvedBase = aliases[resolvedBase];
    }

    return isFlip ? resolvedBase + '_flip' : resolvedBase;
  }

  // --- 7. PUBLIC GAMEASSETS API ---
  const GameAssets = {
    isReady: false,
    sprites: {},
    fallbackSprite: null,
    PALETTES: PALETTES,
    RAW_SPRITES: RAW_SPRITES,

    /**
     * Initializes all pixel-art sprite canvases synchronously and returns a Promise.
     * Guaranteed 0 network calls, 0 delay, 100% complete assets.
     */
    async init() {
      if (this.isReady) return;

      this.fallbackSprite = createFallbackSprite();
      this.sprites = {
        player: {},
        enemy: {},
        item: {},
        tile: {}
      };

      for (const [categoryKey, categorySprites] of Object.entries(RAW_SPRITES)) {
        if (!this.sprites[categoryKey]) {
          this.sprites[categoryKey] = {};
        }

        for (const [spriteName, spriteDef] of Object.entries(categorySprites)) {
          const palette = PALETTES[spriteDef.palette] || {};
          const canvas = rasterizeMatrix(spriteDef.data, palette);
          this.sprites[categoryKey][spriteName] = canvas;

          // Pre-generate horizontal mirror for directional sprites
          if (spriteDef.flip) {
            this.sprites[categoryKey][spriteName + '_flip'] = createFlippedCanvas(canvas);
          }
        }
      }

      this.isReady = true;
      return Promise.resolve();
    },

    /**
     * Retrieves an off-screen HTMLCanvasElement / MemoryCanvas by category and name.
     * If the sprite is missing, returns the fallback checkerboard sprite (never null).
     */
    getSprite(category, name) {
      if (category === null || category === undefined || name === null || name === undefined) {
        return this.fallbackSprite || createFallbackSprite();
      }

      const cat = resolveCategory(category);
      const spr = resolveSpriteName(cat, name, category);

      if (Object.prototype.hasOwnProperty.call(this.sprites, cat) &&
          this.sprites[cat] &&
          Object.prototype.hasOwnProperty.call(this.sprites[cat], spr)) {
        return this.sprites[cat][spr];
      }

      // Check across all categories as a secondary fallback
      for (const c of Object.keys(this.sprites)) {
        if (Object.prototype.hasOwnProperty.call(this.sprites[c], spr)) {
          return this.sprites[c][spr];
        }
      }

      return this.fallbackSprite || createFallbackSprite();
    },

    /**
     * High-performance canvas drawing method.
     * Utilizes pre-flipped cached canvases when flipX is true for zero-transform overhead.
     */
    drawSprite(ctx, category, name, x, y, width, height, flipX = false) {
      if (!ctx || typeof ctx.drawImage !== 'function') return;

      const cat = resolveCategory(category);
      const spr = resolveSpriteName(cat, name, category);
      const targetW = (width !== undefined && width !== null) ? width : 16;
      const targetH = (height !== undefined && height !== null) ? height : 16;
      const drawX = Math.round(x);
      const drawY = Math.round(y);

      let sprite = null;
      if (flipX) {
        // Fast path: use pre-flipped mirror canvas
        const flipName = spr.endsWith('_flip') ? spr : spr + '_flip';
        sprite = this.sprites[cat]?.[flipName];
      }

      if (!sprite) {
        sprite = this.getSprite(cat, spr);
        if (flipX) {
          // Dynamic transform fallback if pre-flipped sprite is unavailable
          ctx.save();
          ctx.translate(drawX + targetW, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(sprite, 0, 0, targetW, targetH);
          ctx.restore();
          return;
        }
      }

      ctx.drawImage(sprite, drawX, drawY, targetW, targetH);
    },

    /**
     * Helper to create an offscreen canvas for rendering or testing.
     */
    createCanvas(w, h) {
      return createOffscreenCanvas(w, h);
    }
  };

  // --- 8. ENVIRONMENT EXPORTS ---
  const targetScope = typeof window !== 'undefined'
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : global);

  targetScope.GameAssets = GameAssets;

  if (typeof window !== 'undefined') {
    GameAssets.init();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAssets;
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));
