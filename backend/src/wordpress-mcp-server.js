/**
 * WordPress MCP Server
 * Intégration avec Jason (Model Context Protocol)
 */

const WordPressClient = require('./wordpress-client');
require('dotenv').config();

class WordPressMCPServer {
  constructor() {
    this.wpClient = new WordPressClient();
    this.config = this.loadConfig();
    this.initializeSites();
  }

  /**
   * Charger la configuration depuis wordpress-config.json
   */
  loadConfig() {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(__dirname, 'wordpress-config.json');

      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load wordpress-config.json:', error.message);
    }
    return { sites: [] };
  }

  /**
   * Initialiser les connexions aux sites configurés
   */
  async initializeSites() {
    for (const site of this.config.sites) {
      const tokenEnvVar = site.jwtTokenEnvVar;
      const token = process.env[tokenEnvVar];

      if (token) {
        try {
          await this.wpClient.connectSite(
            site.id,
            site.url,
            token,
            site.name
          );
          console.log(`✓ Connected to ${site.name}`);
        } catch (error) {
          console.error(`✗ Failed to connect to ${site.name}:`, error.message);
        }
      } else {
        console.warn(`⚠ Missing environment variable: ${tokenEnvVar}`);
      }
    }
  }

  /**
   * Implémenter les ressources MCP
   */
  async handleResource(uri) {
    const parts = uri.split('/');

    if (uri === 'wordpress://sites') {
      return {
        uri,
        contents: [
          {
            mimeType: 'application/json',
            text: JSON.stringify(this.wpClient.listConnectedSites(), null, 2)
          }
        ]
      };
    }

    if (parts[0] === 'wordpress:' && parts[2] === 'posts') {
      const siteId = parts[3];
      try {
        const posts = await this.wpClient.getPosts(siteId);
        return {
          uri,
          contents: [
            {
              mimeType: 'application/json',
              text: JSON.stringify(posts, null, 2)
            }
          ]
        };
      } catch (error) {
        return { error: error.message };
      }
    }

    if (parts[0] === 'wordpress:' && parts[2] === 'pages') {
      const siteId = parts[3];
      try {
        const pages = await this.wpClient.getPages(siteId);
        return {
          uri,
          contents: [
            {
              mimeType: 'application/json',
              text: JSON.stringify(pages, null, 2)
            }
          ]
        };
      } catch (error) {
        return { error: error.message };
      }
    }

    return { error: 'Resource not found' };
  }

  /**
   * Implémenter les outils MCP
   */
  async handleToolCall(name, args) {
    try {
      switch (name) {
        case 'connect_wordpress_site':
          return await this.wpClient.connectSite(
            args.siteId || `site-${Date.now()}`,
            args.siteUrl,
            args.jwtToken,
            args.siteName
          );

        case 'list_connected_sites':
          return {
            success: true,
            sites: this.wpClient.listConnectedSites()
          };

        case 'get_posts':
          return await this.wpClient.getPosts(args.siteId, {
            page: args.page,
            perPage: args.perPage,
            search: args.search
          });

        case 'get_post':
          return await this.wpClient.getPost(args.siteId, args.postId);

        case 'create_post':
          return await this.wpClient.createPost(args.siteId, {
            title: args.title,
            content: args.content,
            excerpt: args.excerpt,
            status: args.status,
            categories: args.categories,
            tags: args.tags
          });

        case 'update_post':
          return await this.wpClient.updatePost(args.siteId, args.postId, {
            title: args.title,
            content: args.content,
            status: args.status
          });

        case 'delete_post':
          return await this.wpClient.deletePost(
            args.siteId,
            args.postId,
            args.force
          );

        case 'get_pages':
          return await this.wpClient.getPages(args.siteId, {
            page: args.page
          });

        case 'get_categories':
          return await this.wpClient.getCategories(args.siteId);

        case 'disconnect_site':
          return this.wpClient.disconnectSite(args.siteId);

        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      return {
        error: error.message,
        tool: name,
        args: args
      };
    }
  }

  /**
   * Démarrer le serveur MCP
   */
  async start() {
    console.log('🚀 WordPress MCP Server starting...');
    console.log(`📍 Connected sites: ${this.wpClient.listConnectedSites().length}`);
    return this;
  }
}

// Export pour utilisation dans d'autres modules
module.exports = WordPressMCPServer;

// Si exécuté directement, démarrer le serveur
if (require.main === module) {
  const server = new WordPressMCPServer();
  server.start().then(() => {
    console.log('✓ WordPress MCP Server is ready');
  }).catch(error => {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  });
}
