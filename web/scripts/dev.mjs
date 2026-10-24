import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
spawnSync(process.execPath,['scripts/assemble.mjs'],{stdio:'inherit'});
const worker=(await import(pathToFileURL(process.cwd()+'/worker/index.js'))).default;
http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-development');const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});const reply=await worker.fetch(request,{ODDS_API_KEY:process.env.ODDS_API_KEY});res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));}catch{res.writeHead(500);res.end('Local server error');}}).listen(Number(process.env.PORT||process.argv[process.argv.indexOf('--port')+1])||3000,'0.0.0.0',()=>console.log('Edge Lab dev server ready'));
