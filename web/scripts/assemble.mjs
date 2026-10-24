import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [engine,server,page,style,client]=await Promise.all(['app/engine.mjs','app/server.mjs','app/page.html','app/style.css','app/client.js'].map(p=>readFile(new URL(p,root),'utf8')));
const constants='const ENGINE_SOURCE='+JSON.stringify(engine)+';\nconst PAGE='+JSON.stringify(page)+';\nconst STYLE='+JSON.stringify(style)+';\nconst CLIENT='+JSON.stringify(client)+';\n';
await writeFile(new URL('worker/index.js',root),engine+'\n'+constants+'\n'+server);
console.log('Assembled Edge Lab worker');
