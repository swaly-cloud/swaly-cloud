/**
 * Exemple d'utilisation du client WordPress
 * Pour tester la connexion et les opérations
 */

const WordPressClient = require('./wordpress-client');
require('dotenv').config();

async function runExamples() {
  const wpClient = new WordPressClient();

  // 1. Connecter un site WordPress
  console.log('\n=== 1. Connexion à un site WordPress ===\n');

  const connectionResult = await wpClient.connectSite(
    'site-azzabioptic',
    'https://azzabioptic.com',
    process.env.WORDPRESS_TOKEN_AZZABIOPTIC,
    'Azzabioptic'
  );

  console.log('Résultat:', connectionResult);

  if (!connectionResult.success) {
    console.error('Impossible de se connecter. Vérifiez:');
    console.error('- Le token dans WORDPRESS_TOKEN_AZZABIOPTIC');
    console.error('- L\'URL du site: https://azzabioptic.com');
    console.error('- La connexion Internet');
    process.exit(1);
  }

  // 2. Lister les sites connectés
  console.log('\n=== 2. Sites connectés ===\n');
  const sites = wpClient.listConnectedSites();
  console.log('Sites:', JSON.stringify(sites, null, 2));

  // 3. Récupérer les posts
  console.log('\n=== 3. Récupération des posts ===\n');
  try {
    const posts = await wpClient.getPosts('site-azzabioptic', {
      page: 1,
      perPage: 5
    });
    console.log(`Trouvé ${posts.length} posts`);
    posts.slice(0, 2).forEach(post => {
      console.log(`- [${post.id}] ${post.title.rendered}`);
    });
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // 4. Récupérer les catégories
  console.log('\n=== 4. Récupération des catégories ===\n');
  try {
    const categories = await wpClient.getCategories('site-azzabioptic');
    console.log(`Trouvé ${categories.length} catégories`);
    categories.slice(0, 3).forEach(cat => {
      console.log(`- [${cat.id}] ${cat.name}`);
    });
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // 5. Créer un post (en brouillon)
  console.log('\n=== 5. Création d\'un post (brouillon) ===\n');
  try {
    const newPost = await wpClient.createPost('site-azzabioptic', {
      title: `Post de test - ${new Date().toISOString()}`,
      content: '<p>Ceci est un post de test créé via l\'API MCP.</p>',
      excerpt: 'Un post de test',
      status: 'draft'
    });
    console.log(`✓ Post créé avec ID: ${newPost.id}`);
    console.log(`   Titre: ${newPost.title.rendered}`);
    console.log(`   Statut: ${newPost.status}`);
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // 6. Récupérer un post spécifique
  console.log('\n=== 6. Récupération d\'un post spécifique ===\n');
  try {
    const posts = await wpClient.getPosts('site-azzabioptic', { perPage: 1 });
    if (posts.length > 0) {
      const post = await wpClient.getPost('site-azzabioptic', posts[0].id);
      console.log(`Titre: ${post.title.rendered}`);
      console.log(`Contenu: ${post.content.rendered.substring(0, 100)}...`);
      console.log(`Auteur ID: ${post.author}`);
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // 7. Récupérer les pages
  console.log('\n=== 7. Récupération des pages ===\n');
  try {
    const pages = await wpClient.getPages('site-azzabioptic');
    console.log(`Trouvé ${pages.length} pages`);
    pages.slice(0, 3).forEach(page => {
      console.log(`- [${page.id}] ${page.title.rendered}`);
    });
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  console.log('\n✓ Exemples terminés\n');
}

// Exécuter les exemples
runExamples().catch(error => {
  console.error('Erreur générale:', error);
  process.exit(1);
});
