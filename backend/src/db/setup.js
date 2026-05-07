const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../db.json');

const SEED_PRODUCTS = [
  { id:1,  brand:'FENDI',       name:'FE40140U Acétate',       cat:'soleil',    genre:'femme',   price:1790, img:'https://pretavoir.us/cdn/shop/files/fendi-ff-diamonds-fe40140u-56n-hd-1_800x.jpg?v=1740410082', accent:'#D4AF37', is_new:true },
  { id:2,  brand:'TOM FORD',    name:'Wyatt Tortue Havane',    cat:'soleil',    genre:'homme',   price:1650, img:'https://pretavoir.us/cdn/shop/products/tom-ford-wyatt-tf871-52f-hd-3_800x.jpg?v=1622128254',   accent:'#F5D547', is_new:false },
  { id:3,  brand:'CELINE',      name:'Triomphe CL40282U',      cat:'soleil',    genre:'femme',   price:1890, img:'https://pretavoir.co.uk/cdn/shop/files/celine-cl40282u-01a-hd-2_800x.jpg?v=1709739547',        accent:'#D4AF37', is_new:true },
  { id:4,  brand:'PERSOL',      name:'649 Original Havana',    cat:'soleil',    genre:'homme',   price:1290, img:'https://pretavoir.co.uk/cdn/shop/products/persol-0649-24-31-hd-3_800x.jpg?v=1611918887',       accent:'#F5D547', is_new:false },
  { id:5,  brand:'RAY-BAN',     name:'Wayfarer RB2140',        cat:'soleil',    genre:'unisexe', price:690,  img:'https://pretavoir.co.uk/cdn/shop/products/ray-ban-2140-901-hd-2_1024x.jpg?v=1611919254',       accent:'#D4AF37', is_new:false },
  { id:6,  brand:'JOW&BRO',    name:'DJ9082 Vintage Écaille', cat:'vue',       genre:'homme',   price:390,  img:'https://picsum.photos/seed/jow-bro-vintage/400/500',    accent:'#F5D547', is_new:false },
  { id:7,  brand:'DIOR',        name:'DiorSignature S11I',     cat:'soleil',    genre:'femme',   price:1990, img:'https://pretavoir.us/cdn/shop/files/diorsignature-s11i-14a1-hd-3_800x.jpg?v=1720454479',       accent:'#D4AF37', is_new:true },
  { id:8,  brand:'SILHOUETTE',  name:'TMA Icon 5290',          cat:'vue',       genre:'homme',   price:1390, img:'https://picsum.photos/seed/silhouette-titanium/400/500', accent:'#F5D547', is_new:false },
  { id:9,  brand:'MIU MIU',     name:'MU 04ZS Round',          cat:'soleil',    genre:'femme',   price:1490, img:'https://pretavoir.us/cdn/shop/files/miu-miu-mu-04zs-1ab5s0-hd-3_800x.jpg?v=1707743749',       accent:'#D4AF37', is_new:true },
  { id:10, brand:'VAKAY',       name:'Breeze Bois & Acétate',  cat:'vue',       genre:'unisexe', price:1490, img:'https://picsum.photos/seed/vakay-wood/400/500',          accent:'#F5D547', is_new:false },
  { id:11, brand:'BELLA',       name:'Radiant Hazelnut',       cat:'lentilles', genre:'femme',   price:140,  img:'https://picsum.photos/seed/bella-contact/400/500',       accent:'#F5D547', is_new:false },
  { id:12, brand:'CARRERA',     name:'8867 Pilote Métal',      cat:'vue',       genre:'homme',   price:590,  img:'https://picsum.photos/seed/carrera-metal/400/500',       accent:'#D4AF37', is_new:false },
  { id:13, brand:'PRADA',       name:'PR 17WS Marble Black',   cat:'soleil',    genre:'femme',   price:1750, img:'https://pretavoir.co.uk/cdn/shop/products/prada-pr-17ws-11n09t-hd-3_800x.jpg?v=1686582774',   accent:'#D4AF37', is_new:true },
  { id:14, brand:'MARC JACOBS', name:'MJ1033S Bold',           cat:'soleil',    genre:'femme',   price:950,  img:'https://picsum.photos/seed/marc-jacobs-bold/400/500',    accent:'#F5D547', is_new:false },
  { id:15, brand:'CARRERA',     name:'Grand Prix 3 Femme',     cat:'vue',       genre:'femme',   price:690,  img:'https://picsum.photos/seed/carrera-femme/400/500',       accent:'#F5D547', is_new:false },
  { id:16, brand:'RAY-BAN',     name:'Aviator RB3025 Or',      cat:'soleil',    genre:'homme',   price:750,  img:'https://pretavoir.us/cdn/shop/products/ray-ban-aviator-large-metal-rb-3025-0013m-hd-3_800x.jpg?v=1687521942', accent:'#D4AF37', is_new:false },
];

// Initialize database file
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const data = { products: SEED_PRODUCTS, orders: [], appointments: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log('Database initialized at', DB_PATH);
  }
}

// Read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err.message);
    return { products: [], orders: [], appointments: [] };
  }
}

// Write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing database:', err.message);
  }
}

initDB();

module.exports = { readDB, writeDB };
