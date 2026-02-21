const https = require('https');
const http = require('http');
const fs = require('fs');

const sites = JSON.parse(fs.readFileSync('sites.json', 'utf8'));

function ping(site) {
  return new Promise((resolve) => {
    const url = new URL(site.url);
    const lib = url.protocol === 'https:' ? https : http;
    const start = Date.now();

    const req = lib.request(
      { hostname: url.hostname, path: url.pathname || '/', method: 'HEAD', timeout: 8000 },
      (res) => {
        const ms = Date.now() - start;
        resolve({ name: site.name, url: site.url, online: res.statusCode < 500, ms });
      }
    );

    req.on('timeout', () => { req.destroy(); });
    req.on('error', () => { resolve({ name: site.name, url: site.url, online: false, ms: null }); });
    req.end();
  });
}

(async () => {
  const results = await Promise.all(sites.map(ping));
  const output = { checkedAt: new Date().toISOString(), sites: results };
  fs.writeFileSync('status.json', JSON.stringify(output, null, 2));
  console.log('Done:', results.map(r => `${r.name}: ${r.online}`).join(', '));
})();
