const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
  '.png':'image/png','.jpg':'image/jpeg','.md':'text/markdown; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(f,(e,d)=>{
    if(e){ res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {'Content-Type': types[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(d);
  });
}).listen(8790,'127.0.0.1',()=>console.log('FL5 serving at http://localhost:8790'));
