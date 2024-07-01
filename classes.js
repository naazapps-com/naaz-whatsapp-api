const { Client, WhatsWebURL } = require("whatsapp-web.js");
const {
  WebCache,
  VersionResolveError,
} = require("whatsapp-web.js/src/webCache/WebCache");
const path = require("path");
const fs = require("fs");
const {
  createWebCache,
} = require("whatsapp-web.js/src/webCache/WebCacheFactory");

class WhatsAppWebClient extends Client {
  async initWebVersionCache() {
    const { type: webCacheType, ...webCacheOptions } =
      this.options.webVersionCache;
    let webCache;
    if (webCacheType === "local") {
      webCache = new LocalWebCache(webCacheOptions);
    } else {
      webCache = createWebCache(webCacheType, webCacheOptions);
    }

    const requestedVersion = this.options.webVersion;
    const versionContent = await webCache.resolve(requestedVersion);

    if (versionContent) {
      await this.pupPage.setRequestInterception(true);
      this.pupPage.on("request", async (req) => {
        if (req.url() === WhatsWebURL) {
          req.respond({
            status: 200,
            contentType: "text/html",
            body: versionContent,
          });
        } else {
          req.continue();
        }
      });
    } else {
      this.pupPage.on("response", async (res) => {
        if (res.ok() && res.url() === WhatsWebURL) {
          await webCache.persist(await res.text());
        }
      });
    }
  }
}

/**
 * LocalWebCache - Fetches a WhatsApp Web version from a local file store
 * @param {object} options - options
 * @param {string} options.path - Path to the directory where cached versions are saved, default is: "./.wwebjs_cache/"
 * @param {boolean} options.strict - If true, will throw an error if the requested version can't be fetched. If false, will resolve to the latest version.
 */
class LocalWebCache extends WebCache {
  constructor(options = {}) {
    super();

    this.path = options.path || "./.wwebjs_cache/";
    this.strict = options.strict || false;
  }

  async resolve(version) {
    const filePath = path.join(this.path, `${version}.html`);

    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      if (this.strict)
        throw new VersionResolveError(
          `Couldn't load version ${version} from the cache`
        );
      return null;
    }
  }

  // L'erreur
  //   async persist(indexHtml) {
  //     // extract version from index (e.g. manifest-2.2206.9.json -> 2.2206.9)
  //     const version = indexHtml.match(/manifest-([\d\\.]+)\.json/)[1];
  //     if (!version) return;

  //     const filePath = path.join(this.path, `${version}.html`);
  //     fs.mkdirSync(this.path, { recursive: true });
  //     fs.writeFileSync(filePath, indexHtml);
  //   }

  // La correction
  async persist(indexHtml) {
    // extract version from index (e.g. manifest-2.2206.9.json -> 2.2206.9)
    if (indexHtml.match(/manifest-([\d\\.]+)\.json/) != null) {
      const version = indexHtml.match(/manifest-([\d\\.]+)\.json/)[1];
      if (!version) return;

      const filePath = path.join(this.path, `${version}.html`);
      fs.mkdirSync(this.path, { recursive: true });
      fs.writeFileSync(filePath, indexHtml);
    }
  }
}

module.exports = {
  WhatsAppWebClient,
};