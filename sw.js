const CACHE_NAME='aljezur-trip-v3fix-2026-05-27';
const ASSETS=['./','./index.html','./manifest.webmanifest','./assets/style.css','./assets/app.js','./assets/data.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url); if(url.origin!==self.location.origin) return; e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{if(e.request.method==='GET'&&resp&&resp.status===200){const copy=resp.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));} return resp;}).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):cached)));});
