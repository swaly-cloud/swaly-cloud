const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../azzabi.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY,
    brand       TEXT NOT NULL,
    name        TEXT NOT NULL,
    cat         TEXT NOT NULL,
    genre       TEXT NOT NULL,
    price       INTEGER NOT NULL,
    img         TEXT,
    accent      TEXT,
    is_new      INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ref         TEXT UNIQUE NOT NULL,
    cart        TEXT NOT NULL,
    delivery    TEXT NOT NULL,
    boutique    TEXT,
    contact     TEXT NOT NULL,
    payment     TEXT NOT NULL,
    total       INTEGER NOT NULL,
    status      TEXT DEFAULT 'confirmé',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ref         TEXT UNIQUE NOT NULL,
    service     TEXT NOT NULL,
    boutique    TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    note        TEXT,
    status      TEXT DEFAULT 'confirmé',
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

// Seed products if empty
const count = db.prepare('SELECT COUNT(*) as n FROM products').get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, brand, name, cat, genre, price, img, accent, is_new)
    VALUES (@id, @brand, @name, @cat, @genre, @price, @img, @accent, @is_new)
  `);
  const seedMany = db.transaction(products => {
    for (const p of products) insert.run(p);
  });
  seedMany([
    { id:1,  brand:'FENDI',       name:'FE40140U Acétate',       cat:'soleil',    genre:'femme',   price:1790, img:'https://pretavoir.us/cdn/shop/files/fendi-ff-diamonds-fe40140u-56n-hd-1_800x.jpg?v=1740410082', accent:'#D4AF37', is_new:1 },
    { id:2,  brand:'TOM FORD',    name:'Wyatt Tortue Havane',    cat:'soleil',    genre:'homme',   price:1650, img:'https://pretavoir.us/cdn/shop/products/tom-ford-wyatt-tf871-52f-hd-3_800x.jpg?v=1622128254',   accent:'#F5D547', is_new:0 },
    { id:3,  brand:'CELINE',      name:'Triomphe CL40282U',      cat:'soleil',    genre:'femme',   price:1890, img:'https://pretavoir.co.uk/cdn/shop/files/celine-cl40282u-01a-hd-2_800x.jpg?v=1709739547',        accent:'#D4AF37', is_new:1 },
    { id:4,  brand:'PERSOL',      name:'649 Original Havana',    cat:'soleil',    genre:'homme',   price:1290, img:'https://pretavoir.co.uk/cdn/shop/products/persol-0649-24-31-hd-3_800x.jpg?v=1611918887',       accent:'#F5D547', is_new:0 },
    { id:5,  brand:'RAY-BAN',     name:'Wayfarer RB2140',        cat:'soleil',    genre:'unisexe', price:690,  img:'https://pretavoir.co.uk/cdn/shop/products/ray-ban-2140-901-hd-2_1024x.jpg?v=1611919254',       accent:'#D4AF37', is_new:0 },
    { id:6,  brand:'JOW&BRO',    name:'DJ9082 Vintage Écaille', cat:'vue',       genre:'homme',   price:390,  img:'https://picsum.photos/seed/jow-bro-vintage/400/500',  accent:'#F5D547', is_new:0 },
    { id:7,  brand:'DIOR',        name:'DiorSignature S11I',     cat:'soleil',    genre:'femme',   price:1990, img:'https://pretavoir.us/cdn/shop/files/diorsignature-s11i-14a1-hd-3_800x.jpg?v=1720454479',       accent:'#D4AF37', is_new:1 },
    { id:8,  brand:'SILHOUETTE',  name:'TMA Icon 5290',          cat:'vue',       genre:'homme',   price:1390, img:'https://picsum.photos/seed/silhouette-titanium/400/500', accent:'#F5D547', is_new:0 },
    { id:9,  brand:'MIU MIU',     name:'MU 04ZS Round',          cat:'soleil',    genre:'femme',   price:1490, img:'https://pretavoir.us/cdn/shop/files/miu-miu-mu-04zs-1ab5s0-hd-3_800x.jpg?v=1707743749',       accent:'#D4AF37', is_new:1 },
    { id:10, brand:'VAKAY',       name:'Breeze Bois & Acétate',  cat:'vue',       genre:'unisexe', price:1490, img:'https://picsum.photos/seed/vakay-wood/400/500',        accent:'#F5D547', is_new:0 },
    { id:11, brand:'BELLA',       name:'Radiant Hazelnut',       cat:'lentilles', genre:'femme',   price:140,  img:'https://picsum.photos/seed/bella-contact/400/500',     accent:'#F5D547', is_new:0 },
    { id:12, brand:'CARRERA',     name:'8867 Pilote Métal',      cat:'vue',       genre:'homme',   price:590,  img:'https://picsum.photos/seed/carrera-metal/400/500',     accent:'#D4AF37', is_new:0 },
    { id:13, brand:'PRADA',       name:'PR 17WS Marble Black',   cat:'soleil',    genre:'femme',   price:1750, img:'https://pretavoir.co.uk/cdn/shop/products/prada-pr-17ws-11n09t-hd-3_800x.jpg?v=1686582774',   accent:'#D4AF37', is_new:1 },
    { id:14, brand:'MARC JACOBS', name:'MJ1033S Bold',           cat:'soleil',    genre:'femme',   price:950,  img:'https://picsum.photos/seed/marc-jacobs-bold/400/500',  accent:'#F5D547', is_new:0 },
    { id:15, brand:'CARRERA',     name:'Grand Prix 3 Femme',     cat:'vue',       genre:'femme',   price:690,  img:'https://picsum.photos/seed/carrera-femme/400/500',     accent:'#F5D547', is_new:0 },
    { id:16, brand:'RAY-BAN',     name:'Aviator RB3025 Or',      cat:'soleil',    genre:'homme',   price:750,  img:'https://pretavoir.us/cdn/shop/products/ray-ban-aviator-large-metal-rb-3025-0013m-hd-3_800x.jpg?v=1687521942', accent:'#D4AF37', is_new:0 },
  ]);
}

module.exports = db;
