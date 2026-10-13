import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {handleApi} from '../src/api.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web');
async function loadEnv(){
 for(const n of ['.env','.env.local']){
  try{const s=await fs.readFile(new URL(`../${n}`,import.meta.url),'utf8');for(const l of s.split(/\r?\n/)){
   const m=l.match(/^([A-Z][A-Z_0-9]*)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
  }}catch{/* file optional */}
 }
}
await loadEnv();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname.startsWith('/api/')){
   const body=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>4096){res.writeHead(413);res.end();return;}body.push(c);}
   const response=await handleApi(new Request(`http://localhost${req.url}`,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(body)}),process.env);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  let p=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);
  if(p.includes('\0')||p.includes('\\')||p.split('/').includes('..')){res.writeHead(403);res.end();return;}
  const final=path.resolve(root,'.'+p);if(!final.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const data=await fs.readFile(final);res.writeHead(200,{'Content-Type':types[path.extname(final)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
const port=Number(process.env.PORT)||8787;server.listen(port,'0.0.0.0',()=>console.log(`LAYC Panta AI: http://localhost:${port}`));
