/**
 * Full V2 Tile & Item matrix test including flagpole and celebratory items
 */
const PALETTES = {
  tile: {
    '.': null,              // Transparent
    // Foliage & Grass
    'L': '#A6F043',         // Bright Grass Specular Blade Tip
    'H': '#55C72B',         // Vibrant Grass Highlight Green
    'G': '#2E8B18',         // Rich Mid Grass Green
    'g': '#184E10',         // Deep Grass Shadow / Root Edge
    // Soil, Strata & Loam
    'f': '#B86B28',         // Light Warm Sand / Soil Highlight
    'F': '#8A4513',         // Rich Terracotta Loam Body
    'E': '#4A2306',         // Deep Dark Subterranean Bedrock
    'p': '#D7CCC8',         // Pebble Light Specular / Mineral Fleck
    'q': '#5D4037',         // Pebble Dark Shadow
    // 3D Beveled Bricks
    'W': '#FFCC80',         // Specular Bevel Cream-Gold Highlight
    'b': '#E64A19',         // Upper Brick Face Bright Terracotta
    'B': '#A5350A',         // Mid Brick Body Red-Brown
    'd': '#6E1E02',         // Lower Brick Bevel Shadow
    'K': '#1A0802',         // Deep Recessed Mortar Line / Void
    // Shiny Metallic Gold Question Block
    'w': '#FFFFFF',         // Specular White Flash
    'j': '#FFF176',         // Shimmering Golden Gleam
    'Y': '#FFD700',         // Vivid Royal Gold Body
    'Q': '#FF9800',         // Deep Amber Gold Shadow Bevel
    'k': '#6B3800',         // 3D Glyph Drop Shadow / Rim Line
    // Empty Steel & Industrial Rivet Block
    's': '#ECEFF1',         // Specular Steel Bevel Highlight
    'U': '#90A4AE',         // Brushed Steel Face Plate
    'u': '#607D8B',         // Deep Steel Shadow
    'V': '#37474F',         // Rivet Recessed Cavity
    'v': '#FFFFFF',         // Rivet Specular Glint
    // Glossy Emerald Warp Pipes
    'i': '#E8F8E8',         // Specular Mint/White Glint Stripe
    'P': '#43D843',         // Bright Vivid Emerald Highlight
    'M': '#00A820',         // Rich Emerald Base Pipe Body
    'm': '#006B14',         // Deep Emerald Shadow
    'N': '#003808',         // Dark Ambient Occlusion Rim Shadow
    'X': '#011504',         // Inner Pipe Cavern Void
    // Celebratory Birthday Castle & Festive Accents
    'S': '#ECEFF1',         // Castle Stone Marble Capstone
    'T': '#90A4AE',         // Castle Stone Ashlar Masonry
    't': '#455A64',         // Castle Stone Bevel Shadow
    'D': '#3E2723',         // Medieval Arched Door Dark Wood
    'e': '#5D4037',         // Door Wood Plank Highlight
    'a': '#212121',         // Door Forged Iron Strap Hinge
    'r': '#FF1744',         // Birthday Ruby Red Bunting / Strawberry
    'y': '#FFEA00',         // Birthday Gold Star Bunting / Flame
    'c': '#00E5FF',         // Birthday Cyan Confetti Sparkle
    'z': '#FF4081',         // Birthday Magenta Streamer / Frosting
    'O': '#FF9800',         // Birthday Candle Flame Orange / Gold Bevel
    'I': '#2979FF',         // Birthday Candle Blue Wax
    'C': '#4E2712'          // Castle Cake Chocolate Fudge Layer
  },
  item: {
    '.': null,              // Transparent
    // 3D Gold Coins
    'w': '#FFFFFF',         // Specular White Sparkle
    'j': '#FFF59D',         // Bright Gold Sheen
    'Y': '#FFD700',         // Royal Gold Face
    'O': '#FF9800',         // Warm Amber Bevel Rim
    'D': '#8D4F00',         // Deep Bronze Inner Shadow
    'K': '#3E1A00',         // Core Slot Dark Crevice
    // Birthday Cake Bonus Slice
    'p': '#FF80AB',         // Strawberry Cream Frosting Pink
    'P': '#E91E63',         // Raspberry Glaze
    'S': '#FFE082',         // Golden Sponge Cake Crumb
    's': '#FFF59D',         // Light Fluffy Sponge Crumb
    'C': '#5D4037',         // Rich Chocolate Fudge Layer
    'd': '#3E2723',         // Deep Chocolate Shadow
    'r': '#FF1744',         // Juicy Birthday Strawberry
    'g': '#76FF03',         // Strawberry Green Stem
    'f': '#FF6D00',         // Candle Flame Core
    'l': '#FFD600',         // Candle Flame Outer Glow
    'b': '#2979FF'          // Festive Blue Candle Wax
  }
};

const ALL_TILES = {
  ground: [
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
  ],
  ground_filler: [
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
  ],
  brick: [
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
  ],
  question_1: [
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
  ],
  question_2: [
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
  ],
  question_3: [
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
  ],
  empty: [
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
  ],
  pipe_tl: [
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
  ],
  pipe_tr: [
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
  ],
  pipe_bl: [
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
  ],
  pipe_br: [
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
  ],
  castle_brick: [
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
  ],
  castle_door: [
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
  ],
  castle_battlement: [
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
  ],
  castle_cake: [
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
  ],
  flag: [
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
  ],
  flagpole_top: [
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
  ],
  flagpole_shaft: [
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
};

let errors = [];
for (const [key, data] of Object.entries(ALL_TILES)) {
  if (data.length !== 16) errors.push(`Tile ${key} has ${data.length} rows`);
  const colorSet = new Set();
  let opaque = 0;
  for (let r = 0; r < 16; r++) {
    const row = data[r];
    if (row.length !== 16) errors.push(`Tile ${key} row ${r} length ${row.length} ("${row}")`);
    for (let c = 0; c < 16; c++) {
      const ch = row[c];
      if (PALETTES.tile[ch] === undefined) {
        errors.push(`Tile ${key} char '${ch}' not in palette`);
      } else if (PALETTES.tile[ch] !== null) {
        opaque++;
        colorSet.add(PALETTES.tile[ch]);
      }
    }
  }
  console.log(`✓ Tile ${key}: ${opaque} opaque px, ${colorSet.size} unique colors`);
}

if (errors.length > 0) {
  console.error('Errors:', errors);
  process.exit(1);
} else {
  console.log('All tiles verified with 0 errors!');
}
