const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Unexpected error on idle client', err));

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id      SERIAL PRIMARY KEY,
        wc_id   INTEGER,
        brand   TEXT NOT NULL,
        name    TEXT NOT NULL,
        cat     TEXT NOT NULL,
        genre   TEXT NOT NULL,
        price   NUMERIC NOT NULL,
        img     TEXT DEFAULT '',
        description TEXT DEFAULT '',
        accent  TEXT DEFAULT '#D4AF37',
        is_new  BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS orders (
        ref     TEXT PRIMARY KEY,
        data    JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS appointments (
        ref     TEXT PRIMARY KEY,
        data    JSONB NOT NULL
      );
    `);

    const count = await client.query('SELECT COUNT(*) as n FROM products');
    if (parseInt(count.rows[0].n) === 0) {
      const SEED = [
        { wc_id: null, brand: 'FENDI', name: 'FE40140U Acétate', cat: 'soleil', genre: 'femme', price: 1790, img: 'https://pretavoir.us/cdn/shop/files/fendi-ff-diamonds-fe40140u-56n-hd-1_800x.jpg?v=1740410082', description: 'Monture acétate oversize au style iconique FF. Verres fumés gradient, protection UV400. Finitions dorées signature Fendi.', accent: '#D4AF37', is_new: true },
        { wc_id: null, brand: 'TOM FORD', name: 'Wyatt Tortue Havane', cat: 'soleil', genre: 'homme', price: 1650, img: 'https://pretavoir.us/cdn/shop/products/tom-ford-wyatt-tf871-52f-hd-3_800x.jpg?v=1622128254', description: 'Lunette pilote en acétate écaille havane. Verres marron dégradé, logo T doré sur les branches. Élégance masculine intemporelle.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'CELINE', name: 'Triomphe CL40282U', cat: 'soleil', genre: 'femme', price: 1890, img: 'https://pretavoir.co.uk/cdn/shop/files/celine-cl40282u-01a-hd-2_800x.jpg?v=1709739547', description: 'Forme rectangulaire sculptée en acétate noir. Verres gris, logo Triomphe gravé sur chaque branche. Pièce maîtresse de la maison Celine.', accent: '#D4AF37', is_new: true },
        { wc_id: null, brand: 'PERSOL', name: '649 Original Havana', cat: 'soleil', genre: 'homme', price: 1290, img: 'https://pretavoir.co.uk/cdn/shop/products/persol-0649-24-31-hd-3_800x.jpg?v=1611918887', description: 'Modèle iconique né en 1957, inspiré des conducteurs de tramway turinois. Acétate havane, verres cristal brun.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'RAY-BAN', name: 'Wayfarer RB2140', cat: 'soleil', genre: 'unisexe', price: 690, img: 'https://pretavoir.co.uk/cdn/shop/products/ray-ban-2140-901-hd-2_1024x.jpg?v=1611919254', description: 'Le Wayfarer original depuis 1956. Acétate noir mat, verres G-15 verts. Porté par les plus grandes icônes culturelles.', accent: '#D4AF37', is_new: false },
        { wc_id: null, brand: 'JOW&BRO', name: 'DJ9082 Vintage Écaille', cat: 'vue', genre: 'homme', price: 390, img: 'https://picsum.photos/seed/jow-bro-vintage/400/500', description: 'Monture optique en acétate écaille vintage. Design rétro années 70, légèreté remarquable.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'DIOR', name: 'DiorSignature S11I', cat: 'soleil', genre: 'femme', price: 1990, img: 'https://pretavoir.us/cdn/shop/files/diorsignature-s11i-14a1-hd-3_800x.jpg?v=1720454479', description: 'Silhouette géométrique audacieuse signée Dior. Monture métal noire, verres fumés miroir. L\'audace couture portée au visage.', accent: '#D4AF37', is_new: true },
        { wc_id: null, brand: 'SILHOUETTE', name: 'TMA Icon 5290', cat: 'vue', genre: 'homme', price: 1390, img: 'https://picsum.photos/seed/silhouette-titanium/400/500', description: 'Monture titane ultra-légère (1,8g) sans vis ni charnières. Design autrichien primé, confort exceptionnel.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'MIU MIU', name: 'MU 04ZS Round', cat: 'soleil', genre: 'femme', price: 1490, img: 'https://pretavoir.us/cdn/shop/files/miu-miu-mu-04zs-1ab5s0-hd-3_800x.jpg?v=1707743749', description: 'Lunette ronde oversize en acétate noir brillant. Verres gris dégradé, ornements cristaux sur les branches.', accent: '#D4AF37', is_new: true },
        { wc_id: null, brand: 'VAKAY', name: 'Breeze Bois & Acétate', cat: 'vue', genre: 'unisexe', price: 1490, img: 'https://picsum.photos/seed/vakay-wood/400/500', description: 'Monture éco-responsable alliant bois naturel et acétate. Chaque paire est unique. Fabrication artisanale.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'BELLA', name: 'Radiant Hazelnut', cat: 'lentilles', genre: 'femme', price: 140, img: 'https://picsum.photos/seed/bella-contact/400/500', description: 'Lentilles de couleur noisette naturel, port mensuel. Formule hydratante 38% eau. Regard intense et authentique.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'CARRERA', name: '8867 Pilote Métal', cat: 'vue', genre: 'homme', price: 590, img: 'https://picsum.photos/seed/carrera-metal/400/500', description: 'Monture pilote en métal brossé gunmetal. Légèreté et robustesse, nez ajustable. Style sport-luxe.', accent: '#D4AF37', is_new: false },
        { wc_id: null, brand: 'PRADA', name: 'PR 17WS Marble Black', cat: 'soleil', genre: 'femme', price: 1750, img: 'https://pretavoir.co.uk/cdn/shop/products/prada-pr-17ws-11n09t-hd-3_800x.jpg?v=1686582774', description: 'Monture cat-eye en acétate effet marbre noir. Verres gris foncé, logo triangulaire Prada doré.', accent: '#D4AF37', is_new: true },
        { wc_id: null, brand: 'MARC JACOBS', name: 'MJ1033S Bold', cat: 'soleil', genre: 'femme', price: 950, img: 'https://picsum.photos/seed/marc-jacobs-bold/400/500', description: 'Monture audacieuse oversize en acétate bleu nuit. Verres miroir argenté, lignes graphiques contemporaines.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'CARRERA', name: 'Grand Prix 3 Femme', cat: 'vue', genre: 'femme', price: 690, img: 'https://picsum.photos/seed/carrera-femme/400/500', description: 'Monture optique fine en métal rosé. Inspirée du sport automobile, design épuré et féminin.', accent: '#F5D547', is_new: false },
        { wc_id: null, brand: 'RAY-BAN', name: 'Aviator RB3025 Or', cat: 'soleil', genre: 'homme', price: 750, img: 'https://pretavoir.us/cdn/shop/products/ray-ban-aviator-large-metal-rb-3025-0013m-hd-3_800x.jpg?v=1687521942', description: 'L\'aviateur original depuis 1937, né pour les pilotes de l\'US Air Force. Métal doré, verres G-15 verts.', accent: '#D4AF37', is_new: false },
      ];

      for (const p of SEED) {
        await client.query(
          'INSERT INTO products (wc_id, brand, name, cat, genre, price, img, description, accent, is_new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [p.wc_id, p.brand, p.name, p.cat, p.genre, p.price, p.img, p.description, p.accent, p.is_new]
        );
      }
      console.log('Database seeded with', SEED.length, 'products');
    }
  } finally {
    client.release();
  }
}

async function readDB() {
  const productsRes = await pool.query('SELECT id, wc_id, brand, name, cat, genre, price, img, description, accent, is_new FROM products ORDER BY id');
  const ordersRes = await pool.query('SELECT data FROM orders ORDER BY (data->>\'created_at\') DESC');
  const appointmentsRes = await pool.query('SELECT data FROM appointments ORDER BY (data->>\'created_at\') DESC');

  return {
    products: productsRes.rows.map(p => ({ ...p, is_new: Boolean(p.is_new) })),
    orders: ordersRes.rows.map(r => r.data),
    appointments: appointmentsRes.rows.map(r => r.data),
  };
}

async function writeDB(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM products');
    const insertProduct = 'INSERT INTO products (wc_id, brand, name, cat, genre, price, img, description, accent, is_new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
    for (const p of data.products) {
      await client.query(insertProduct, [
        p.wc_id || null,
        p.brand,
        p.name,
        p.cat,
        p.genre,
        p.price,
        p.img || '',
        p.description || '',
        p.accent || '#D4AF37',
        Boolean(p.is_new),
      ]);
    }

    await client.query('DELETE FROM orders');
    const insertOrder = 'INSERT INTO orders (ref, data) VALUES ($1, $2)';
    for (const o of data.orders) {
      await client.query(insertOrder, [o.ref, JSON.stringify(o)]);
    }

    await client.query('DELETE FROM appointments');
    const insertAppt = 'INSERT INTO appointments (ref, data) VALUES ($1, $2)';
    for (const a of data.appointments) {
      await client.query(insertAppt, [a.ref, JSON.stringify(a)]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

initDB().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

console.log('PostgreSQL database ready');

module.exports = { readDB, writeDB };
