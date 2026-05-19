const axios = require('axios');

class WordPressClient {
  constructor() {
    this.sites = new Map();
  }

  /**
   * Connect to a WordPress site with JWT authentication
   */
  async connectSite(siteId, siteUrl, jwtToken, siteName = null) {
    try {
      // Validate the connection by fetching site info
      const response = await this.makeRequest(siteUrl, '/wp-json/wp/v2/settings', jwtToken);

      const siteInfo = {
        id: siteId,
        name: siteName || response.title || siteId,
        url: siteUrl,
        jwtToken: jwtToken,
        title: response.title,
        description: response.description,
        connectedAt: new Date().toISOString()
      };

      this.sites.set(siteId, siteInfo);
      return {
        success: true,
        message: `Successfully connected to ${siteInfo.name}`,
        siteInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Get all connected sites (without JWT tokens in response)
   */
  listConnectedSites() {
    const sites = Array.from(this.sites.values()).map(site => {
      const { jwtToken, ...safeInfo } = site;
      return safeInfo;
    });
    return sites;
  }

  /**
   * Get posts from a connected site
   */
  async getPosts(siteId, options = {}) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.perPage) params.append('per_page', options.perPage);
    if (options.search) params.append('search', options.search);
    if (options.status) params.append('status', options.status);

    const url = `/wp-json/wp/v2/posts?${params.toString()}`;
    return this.makeRequest(site.url, url, site.jwtToken);
  }

  /**
   * Get a specific post
   */
  async getPost(siteId, postId) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    return this.makeRequest(site.url, `/wp-json/wp/v2/posts/${postId}`, site.jwtToken);
  }

  /**
   * Create a new post
   */
  async createPost(siteId, postData) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const data = {
      title: postData.title,
      content: postData.content,
      status: postData.status || 'draft',
      ...(postData.excerpt && { excerpt: postData.excerpt }),
      ...(postData.categories && { categories: postData.categories }),
      ...(postData.tags && { tags: postData.tags })
    };

    return this.makeRequest(
      site.url,
      '/wp-json/wp/v2/posts',
      site.jwtToken,
      'POST',
      data
    );
  }

  /**
   * Update an existing post
   */
  async updatePost(siteId, postId, postData) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const data = {};
    if (postData.title) data.title = postData.title;
    if (postData.content) data.content = postData.content;
    if (postData.status) data.status = postData.status;
    if (postData.excerpt !== undefined) data.excerpt = postData.excerpt;
    if (postData.categories) data.categories = postData.categories;
    if (postData.tags) data.tags = postData.tags;

    return this.makeRequest(
      site.url,
      `/wp-json/wp/v2/posts/${postId}`,
      site.jwtToken,
      'POST',
      data
    );
  }

  /**
   * Delete a post
   */
  async deletePost(siteId, postId, force = false) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const params = force ? '?force=true' : '';
    return this.makeRequest(
      site.url,
      `/wp-json/wp/v2/posts/${postId}${params}`,
      site.jwtToken,
      'DELETE'
    );
  }

  /**
   * Get pages
   */
  async getPages(siteId, options = {}) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.perPage) params.append('per_page', options.perPage);

    const url = `/wp-json/wp/v2/pages?${params.toString()}`;
    return this.makeRequest(site.url, url, site.jwtToken);
  }

  /**
   * Get categories
   */
  async getCategories(siteId) {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    return this.makeRequest(site.url, '/wp-json/wp/v2/categories', site.jwtToken);
  }

  /**
   * Make HTTP request to WordPress API
   */
  async makeRequest(baseUrl, endpoint, jwtToken, method = 'GET', data = null) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`WordPress API Error: ${errorMessage}`);
    }
  }

  /**
   * Disconnect a site
   */
  disconnectSite(siteId) {
    const existed = this.sites.has(siteId);
    if (existed) {
      this.sites.delete(siteId);
    }
    return {
      success: existed,
      message: existed ? `Site ${siteId} disconnected` : `Site ${siteId} not found`
    };
  }
}

module.exports = WordPressClient;
