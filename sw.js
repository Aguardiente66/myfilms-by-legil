// Mise en mémoire de l'application pour qu'elle s'ouvre sans réseau.
// Pour forcer une mise à jour chez tous les appareils, changer V.
// Seuls les caches « myfilms- » sont gérés ici : d'autres sites du même compte partagent le même espace de stockage.
const V = 'myfilms-v1', IMG = 'myfilms-img-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n.indexOf('myfilms-') === 0 && n !== V && n !== IMG).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    // Page et fichiers de l'application : copie immédiate, mise à jour en arrière-plan.
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
      const net = fetch(r).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
  } else if (u.hostname === 'image.tmdb.org') {
    // Affiches : gardées après le premier affichage pour rester visibles hors ligne.
    e.respondWith(caches.open(IMG).then(c => c.match(r).then(hit => hit || fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    }))));
  }
});
