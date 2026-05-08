const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.DB_PATH || path.join(__dirname, '../..');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'azzabi.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id      INTEGER PRIMARY KEY,
    wc_id   INTEGER,
    brand   TEXT NOT NULL,
    name    TEXT NOT NULL,
    cat     TEXT NOT NULL,
    genre   TEXT NOT NULL,
    price   REAL NOT NULL,
    img     TEXT DEFAULT '',
    desc    TEXT DEFAULT '',
    accent  TEXT DEFAULT '#D4AF37',
    is_new  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    ref  TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appointments (
    ref  TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

const SEED = [
  { id:1,  wc_id:null, brand:'FENDI',       name:'FE40140U Acétate',       cat:'soleil',    genre:'femme',   price:1790, img:'https://pretavoir.us/cdn/shop/files/fendi-ff-diamonds-fe40140u-56n-hd-1_800x.jpg?v=1740410082', desc:'Monture acétate oversize au style iconique FF. Verres fumés gradient, protection UV400. Finitions dorées signature Fendi.', accent:'#D4AF37', is_new:1 },
  { id:2,  wc_id:null, brand:'TOM FORD',    name:'Wyatt Tortue Havane',    cat:'soleil',    genre:'homme',   price:1650, img:'https://pretavoir.us/cdn/shop/products/tom-ford-wyatt-tf871-52f-hd-3_800x.jpg?v=1622128254',   desc:'Lunette pilote en acétate écaille havane. Verres marron dégradé, logo T doré sur les branches. Élégance masculine intemporelle.', accent:'#F5D547', is_new:0 },
  { id:3,  wc_id:null, brand:'CELINE',      name:'Triomphe CL40282U',      cat:'soleil',    genre:'femme',   price:1890, img:'https://pretavoir.co.uk/cdn/shop/files/celine-cl40282u-01a-hd-2_800x.jpg?v=1709739547',        desc:'Forme rectangulaire sculptée en acétate noir. Verres gris, logo Triomphe gravé sur chaque branche. Pièce maîtresse de la maison Celine.', accent:'#D4AF37', is_new:1 },
  { id:4,  wc_id:null, brand:'PERSOL',      name:'649 Original Havana',    cat:'soleil',    genre:'homme',   price:1290, img:'https://pretavoir.co.uk/cdn/shop/products/persol-0649-24-31-hd-3_800x.jpg?v=1611918887',       desc:'Modèle iconique né en 1957, inspiré des conducteurs de tramway turinois. Acétate havane, verres cristal brun.', accent:'#F5D547', is_new:0 },
  { id:5,  wc_id:null, brand:'RAY-BAN',     name:'Wayfarer RB2140',        cat:'soleil',    genre:'unisexe', price:690,  img:'https://pretavoir.co.uk/cdn/shop/products/ray-ban-2140-901-hd-2_1024x.jpg?v=1611919254',       desc:'Le Wayfarer original depuis 1956. Acétate noir mat, verres G-15 verts. Porté par les plus grandes icônes culturelles.', accent:'#D4AF37', is_new:0 },
  { id:6,  wc_id:null, brand:'JOW&BRO',    name:'DJ9082 Vintage Écaille', cat:'vue',       genre:'homme',   price:390,  img:'https://picsum.photos/seed/jow-bro-vintage/400/500',    desc:'Monture optique en acétate écaille vintage. Design rétro années 70, légèreté remarquable.', accent:'#F5D547', is_new:0 },
  { id:7,  wc_id:null, brand:'DIOR',        name:'DiorSignature S11I',     cat:'soleil',    genre:'femme',   price:1990, img:'https://pretavoir.us/cdn/shop/files/diorsignature-s11i-14a1-hd-3_800x.jpg?v=1720454479',       desc:'Silhouette géométrique audacieuse signée Dior. Monture métal noire, verres fumés miroir. L\'audace couture portée au visage.', accent:'#D4AF37', is_new:1 },
  { id:8,  wc_id:null, brand:'SILHOUETTE',  name:'TMA Icon 5290',          cat:'vue',       genre:'homme',   price:1390, img:'https://picsum.photos/seed/silhouette-titanium/400/500', desc:'Monture titane ultra-légère (1,8g) sans vis ni charnières. Design autrichien primé, confort exceptionnel.', accent:'#F5D547', is_new:0 },
  { id:9,  wc_id:null, brand:'MIU MIU',     name:'MU 04ZS Round',          cat:'soleil',    genre:'femme',   price:1490, img:'https://pretavoir.us/cdn/shop/files/miu-miu-mu-04zs-1ab5s0-hd-3_800x.jpg?v=1707743749',       desc:'Lunette ronde oversize en acétate noir brillant. Verres gris dégradé, ornements cristaux sur les branches.', accent:'#D4AF37', is_new:1 },
  { id:10, wc_id:null, brand:'VAKAY',       name:'Breeze Bois & Acétate',  cat:'vue',       genre:'unisexe', price:1490, img:'https://picsum.photos/seed/vakay-wood/400/500',          desc:'Monture éco-responsable alliant bois naturel et acétate. Chaque paire est unique. Fabrication artisanale.', accent:'#F5D547', is_new:0 },
  { id:11, wc_id:null, brand:'BELLA',       name:'Radiant Hazelnut',       cat:'lentilles', genre:'femme',   price:140,  img:'https://picsum.photos/seed/bella-contact/400/500',       desc:'Lentilles de couleur noisette naturel, port mensuel. Formule hydratante 38% eau. Regard intense et authentique.', accent:'#F5D547', is_new:0 },
  { id:12, wc_id:null, brand:'CARRERA',     name:'8867 Pilote Métal',      cat:'vue',       genre:'homme',   price:590,  img:'https://picsum.photos/seed/carrera-metal/400/500',       desc:'Monture pilote en métal brossé gunmetal. Légèreté et robustesse, nez ajustable. Style sport-luxe.', accent:'#D4AF37', is_new:0 },
  { id:13, wc_id:null, brand:'PRADA',       name:'PR 17WS Marble Black',   cat:'soleil',    genre:'femme',   price:1750, img:'https://pretavoir.co.uk/cdn/shop/products/prada-pr-17ws-11n09t-hd-3_800x.jpg?v=1686582774',   desc:'Monture cat-eye en acétate effet marbre noir. Verres gris foncé, logo triangulaire Prada doré.', accent:'#D4AF37', is_new:1 },
  { id:14, wc_id:null, brand:'MARC JACOBS', name:'MJ1033S Bold',           cat:'soleil',    genre:'femme',   price:950,  img:'https://picsum.photos/seed/marc-jacobs-bold/400/500',    desc:'Monture audacieuse oversize en acétate bleu nuit. Verres miroir argenté, lignes graphiques contemporaines.', accent:'#F5D547', is_new:0 },
  { id:15, wc_id:null, brand:'CARRERA',     name:'Grand Prix 3 Femme',     cat:'vue',       genre:'femme',   price:690,  img:'https://picsum.photos/seed/carrera-femme/400/500',       desc:'Monture optique fine en métal rosé. Inspirée du sport automobile, design épuré et féminin.', accent:'#F5D547', is_new:0 },
  { id:16, wc_id:null, brand:'RAY-BAN',     name:'Aviator RB3025 Or',      cat:'soleil',    genre:'homme',   price:750,  img:'https://pretavoir.us/cdn/shop/products/ray-ban-aviator-large-metal-rb-3025-0013m-hd-3_800x.jpg?v=1687521942', desc:'L\'aviateur original depuis 1937, né pour les pilotes de l\'US Air Force. Métal doré, verres G-15 verts.', accent:'#D4AF37', is_new:0 },
];

const count = db.prepare('SELECT COUNT(*) as n FROM products').get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, wc_id, brand, name, cat, genre, price, img, desc, accent, is_new)
    VALUES (@id, @wc_id, @brand, @name, @cat, @genre, @price, @img, @desc, @accent, @is_new)
  `);
  const insertMany = db.transaction(rows => rows.forEach(r => insert.run(r)));
  insertMany(SEED);
  console.log('Database seeded with', SEED.length, 'products');
}

function readDB() {
  const products = db.prepare('SELECT * FROM products').all().map(p => ({ ...p, is_new: !!p.is_new }));
  const orders = db.prepare('SELECT data FROM orders ORDER BY rowid DESC').all().map(r => JSON.parse(r.data));
  const appointments = db.prepare('SELECT data FROM appointments ORDER BY rowid DESC').all().map(r => JSON.parse(r.data));
  return { products, orders, appointments };
}

function writeDB(data) {
  db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    const ins = db.prepare(`
      INSERT INTO products (id, wc_id, brand, name, cat, genre, price, img, desc, accent, is_new)
      VALUES (@id, @wc_id, @brand, @name, @cat, @genre, @price, @img, @desc, @accent, @is_new)
    `);
    for (const p of data.products) {
      ins.run({ wc_id: null, img: '', desc: '', accent: '#D4AF37', is_new: 0, ...p, is_new: p.is_new ? 1 : 0 });
    }

    db.prepare('DELETE FROM orders').run();
    const insO = db.prepare('INSERT INTO orders (ref, data) VALUES (?, ?)');
    for (const o of data.orders) insO.run(o.ref, JSON.stringify(o));

    db.prepare('DELETE FROM appointments').run();
    const insA = db.prepare('INSERT INTO appointments (ref, data) VALUES (?, ?)');
    for (const a of data.appointments) insA.run(a.ref, JSON.stringify(a));
  })();
}

console.log('SQLite database ready at', path.join(DB_DIR, 'azzabi.db'));

module.exports = { readDB, writeDB };
