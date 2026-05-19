# Configuration WordPress MCP pour Jason

## 📋 Vue d'ensemble

Ce système MCP (Model Context Protocol) vous permet de connecter et gérer plusieurs sites WordPress à partir de Jason. Il utilise l'authentification JWT pour se connecter de manière sécurisée.

## 🔒 Sécurité - **IMPORTANT**

### ⚠️ Ne jamais stocker les tokens JWT en clair dans le code

Les tokens JWT contiennent des données sensibles et ne doivent **JAMAIS** être:
- Stockés dans les fichiers de code
- Commités dans Git
- Exposés en clair dans les logs
- Partagés sans chiffrement

### ✅ Bonnes pratiques pour les tokens

1. **Variables d'environnement** (Recommandé)
```bash
export WORDPRESS_TOKEN_AZZABIOPTIC="votre_token_ici"
```

2. **Fichier .env** (local uniquement, ne pas commiter)
```env
WORDPRESS_TOKEN_AZZABIOPTIC=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
WORDPRESS_TOKEN_SITE2=autre_token...
```

3. **Gestionnaire de secrets**
- AWS Secrets Manager
- Vault
- 1Password
- Bitwarden

## 📁 Structure des fichiers

```
backend/src/
├── mcp-wordpress.json          # Configuration MCP (ressources et outils)
├── wordpress-client.js         # Client Node.js pour l'API WordPress
├── wordpress-config.example.json # Exemple de configuration
└── WORDPRESS_SETUP.md          # Ce fichier
```

## 🔧 Configuration

### 1. Copier le fichier de configuration d'exemple

```bash
cp backend/src/wordpress-config.example.json backend/src/wordpress-config.json
```

### 2. Ajouter les tokens d'authentification

Créez un fichier `.env` dans le dossier `backend/`:

```bash
# backend/.env
WORDPRESS_TOKEN_AZZABIOPTIC=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F6emFiaW9wdGljLmNvbSIsImlhdCI6MTc3OTIzMDMyNCwiZXhwIjoxNzc5ODM1MTI0LCJ1c2VyX2lkIjoxLCJqdGkiOiJ0UFdWeGsxMGN0OWRpOElQRDFrcnRIUThRbzlGZ05tUyJ9.6eU3M0ATBME7KjF2_r26F14K0sYvOyJX62ECmzZKM3Y
```

### 3. Mettre à jour `.gitignore`

Assurez-vous que `.env` est ignoré:

```bash
# backend/.gitignore
.env
.env.local
.env.*.local
```

## 💻 Utilisation

### Connexion à un site WordPress

```javascript
const WordPressClient = require('./wordpress-client');

const wpClient = new WordPressClient();

// Connecter un site
await wpClient.connectSite(
  'site-azzabioptic',
  'https://azzabioptic.com',
  process.env.WORDPRESS_TOKEN_AZZABIOPTIC,
  'Azzabioptic'
);
```

### Récupérer les posts

```javascript
// Lister les posts (avec pagination)
const posts = await wpClient.getPosts('site-azzabioptic', {
  page: 1,
  perPage: 10,
  search: 'mon terme'
});
```

### Créer un post

```javascript
const newPost = await wpClient.createPost('site-azzabioptic', {
  title: 'Mon titre',
  content: '<p>Contenu du post</p>',
  excerpt: 'Résumé',
  status: 'draft', // ou 'publish'
  categories: [1, 2],
  tags: ['tag1', 'tag2']
});
```

### Mettre à jour un post

```javascript
await wpClient.updatePost('site-azzabioptic', 123, {
  title: 'Nouveau titre',
  content: 'Nouveau contenu',
  status: 'publish'
});
```

### Supprimer un post

```javascript
// Envoyer à la corbeille
await wpClient.deletePost('site-azzabioptic', 123);

// Supprimer définitivement
await wpClient.deletePost('site-azzabioptic', 123, true);
```

## 🔑 Décoder le JWT (pour référence)

Si vous voulez vérifier les informations dans votre token:

```bash
node -e "
const jwt = require('jsonwebtoken');
const token = process.env.WORDPRESS_TOKEN_AZZABIOPTIC;
console.log(jwt.decode(token, {complete: true}));
"
```

**Votre token contient:**
- `iss`: https://azzabioptic.com
- `iat`: 1779230324 (émis le 25/05/2026)
- `exp`: 1779835124 (expire le 01/06/2026)
- `user_id`: 1 (ID administrateur)
- `jti`: tPWVxk10ct9di8IPD1krtHQ8Qo9FgNmS (Token ID)

⚠️ **Attention**: Votre token expire le **1er juin 2026**. Vous devrez en générer un nouveau après cette date.

## 📚 Outils disponibles dans Jason

Une fois configuré, les outils suivants seront disponibles:

- `connect_wordpress_site` - Connecter un nouveau site
- `get_posts` - Récupérer les posts
- `get_post` - Récupérer un post spécifique
- `create_post` - Créer un post
- `update_post` - Mettre à jour un post
- `delete_post` - Supprimer un post
- `get_pages` - Récupérer les pages
- `get_categories` - Récupérer les catégories
- `list_connected_sites` - Lister les sites connectés
- `disconnect_site` - Déconnecter un site

## 🐛 Dépannage

### Erreur: "Invalid token"

Vérifiez que:
1. Le token est correct et complet
2. Le token n'a pas expiré
3. Le token est dans une variable d'environnement correctement nommée

### Erreur: "Site not found"

Assurez-vous que le `siteId` utilisé correspond à la configuration de connexion.

### Erreur de CORS ou de connexion

Vérifiez que:
1. L'URL du site WordPress est correcte
2. L'API REST WordPress est activée sur le site
3. Les pare-feu/VPN ne bloquent pas la connexion

## 📞 Support WordPress REST API

Documentation officielle:
- https://developer.wordpress.org/rest-api/
- https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/

## ✨ Prochaines étapes

1. Ajouter les tokens dans les variables d'environnement
2. Tester la connexion au premier site
3. Ajouter d'autres sites WordPress si nécessaire
4. Intégrer les outils dans Jason
