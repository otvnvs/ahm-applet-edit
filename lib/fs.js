const enc = encodeURIComponent;

// In-memory cache dictionary matching structure: "directory::query" -> Array of matches
const searchCache = new Map();
let searchDebounceTimeout = null;

export const FsService = {
  // Lists basic files and directories from backend
  async list(path) {
    const res = await fetch(`/api/fs/list?path=${enc(path)}`);
    if (!res.ok) throw new Error('Failed to list files');
    const data = await res.json();
    return (data.files || []).sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name));
  },

  async read(path) {
    const res = await fetch(`/api/fs/read?path=${enc(path)}`);
    if (!res.ok) throw new Error('Failed to read file');
    return await res.text();
  },

  async write(path, content) {
    const res = await fetch(`/api/fs/write?path=${enc(path)}`, {
      method: 'POST',
      headers: {
        'X-Export-Data': enc(content),
        'Content-Type': 'text/plain'
      }
    });
    if (!res.ok) throw new Error('Failed to write file');
    return await res.json();
  },

  async mkdir(path) {
    const res = await fetch(`/api/fs/mkdir?path=${enc(path)}&recursive=true`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to create directory');
    return await res.json();
  },

  async delete(path) {
    const res = await fetch(`/api/fs/delete?path=${enc(path)}&recursive=true`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete asset');
    return await res.json();
  },

  /**
   * Performs an asynchronous debounced, cached, recursive background search
   * @param {Object} options Configuration parameters
   * @param {string} options.term The search query string
   * @param {string} options.baseDir Directory to crawl from
   * @param {Function} options.onCacheHit Instant callback if cached results exist
   * @param {Function} options.onComplete Final callback when fresh crawl finishes
   */
  searchRecursiveDebounced({ term, baseDir, onCacheHit, onComplete }) {
    clearTimeout(searchDebounceTimeout);
    const query = term.trim().toLowerCase();

    if (!query) {
      onComplete([]);
      return;
    }

    const cacheKey = `${baseDir}::${query}`;

    // 1. Immediate Cache Hit checking
    if (searchCache.has(cacheKey)) {
      onCacheHit(searchCache.get(cacheKey));
    }

    // 2. Debounce and initiate asynchronous tree crawl background engine
    searchDebounceTimeout = setTimeout(async () => {
      const matches = [];

      const crawl = async (currentDir) => {
        try {
          const contents = await this.list(currentDir);
          for (const item of contents) {
            const itemPath = currentDir ? `${currentDir}/${item.name}` : item.name;

            if (item.name.toLowerCase().includes(query)) {
              matches.push({
                name: item.name,
                isDirectory: item.isDirectory,
                relativePath: itemPath
              });
            }
            if (item.isDirectory) {
              await crawl(itemPath);
            }
          }
        } catch (err) {
          console.warn("Crawl structural error path skipped:", currentDir, err);
        }
      };

      await crawl(baseDir);

      // Save to map dictionary registry
      searchCache.set(cacheKey, matches);
      
      // Send back results via callback hook closure 
      onComplete(matches, cacheKey);
    }, 350);
  },

  // Manual hook to drop existing registry records if assets change externally
  clearCache() {
    searchCache.clear();
  }
};

