import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve('static-dist')
const output = path.resolve('sites-dist/dist')
fs.rmSync(path.resolve('sites-dist'), { recursive: true, force: true })
fs.mkdirSync(path.join(output, '.openai'), { recursive: true })

const files = {}
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full)
    else {
      let route = '/' + path.relative(source, full).replaceAll(path.sep, '/')
      if (route === '/static.html') route = '/'
      files[route] = fs.readFileSync(full).toString('base64')
    }
  }
}
collect(source)

const worker = `const files=${JSON.stringify(files)};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
function decode(value){const raw=atob(value);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes}
export default {async fetch(request){const url=new URL(request.url);const key=files[url.pathname]?url.pathname:'/';const ext=key==='/'?'.html':key.slice(key.lastIndexOf('.'));return new Response(decode(files[key]),{headers:{'content-type':types[ext]||'application/octet-stream','cache-control':key==='/'?'public, max-age=300':'public, max-age=31536000, immutable'}})}};
`
fs.writeFileSync(path.join(output, 'index.js'), worker)
fs.copyFileSync('.openai/hosting.json', path.join(output, '.openai', 'hosting.json'))
