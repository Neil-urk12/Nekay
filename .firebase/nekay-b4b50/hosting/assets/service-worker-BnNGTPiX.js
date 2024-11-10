const n="my-app-cache-v1",r=["/","/index.html","/manifest.json","/style.css","/main.js","/assets/melody.gif","/assets/melody2.gif","/assets/melody3.gif","/assets/melodykiss.png","/assets/sleepingmelody.png","/assets/bgsky.jpg","/assets/sunsetbg.jpg","/assets/moonbg.gif","/chart-line-solid.svg","/journal.svg","/taskIcon.svg","/vite.svg","/img/icons/safari-pinned-tab.svg","/__/firebase/init.js","/offline.html"];self.addEventListener("install",e=>{e.waitUntil(caches.open(n).then(s=>(console.log("Opened cache"),Promise.all(r.map(async a=>s.add(a).catch(t=>{console.error("Error caching",a,t)})))))),self.clients.matchAll().then(s=>{s.forEach(a=>{a.postMessage({type:"init-indexeddb"})})})});self.addEventListener("fetch",e=>{if(e.request.url.includes("firestore.googleapis.com")){e.respondWith(fetch(e.request));return}e.respondWith(caches.match(e.request).then(s=>{if(s)return s;const a=e.request.clone();return fetch(a).then(t=>{if(!t||t.status!==200||t.type!=="basic")return t;const i=t.clone();return caches.open(n).then(c=>{c.put(e.request,i)}),t})}))});self.addEventListener("activate",e=>{const s=[n];e.waitUntil(caches.keys().then(a=>Promise.all(a.map(t=>{if(s.indexOf(t)===-1)return caches.delete(t)}))))});self.addEventListener("sync",e=>{e.tag==="sync-tasks"&&e.waitUntil(o())});async function o(){try{const e=await l();await Promise.all(e.map(s=>d(s))),await f()}catch(e){console.error("Error syncing tasks:",e)}}async function l(){return await indexedDBService.getPendingSyncItems("tasks")}async function d(e){try{await h(e),await indexedDBService.updateSyncStatus("tasks",e.id,"synced")}catch(s){throw await indexedDBService.updateSyncStatus("tasks",e.id,"failed"),s}}async function f(){const e=await indexedDBService.getAllItems("tasks");await Promise.all(e.map(s=>{if(s.syncStatus==="synced")return indexedDBService.deleteItem("tasks",s.id)}))}async function h(e){console.log("Syncing task with server:",e)}
