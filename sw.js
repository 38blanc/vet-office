/* VET Office service worker: eerst netwerk (altijd de nieuwste versie), offline uit de cache */
const V = 'vo-v22';
const FILES = ['./', 'index.html', 'rules.js', 'office-core.js', 'office-pdf.js', 'office-app.js', 'office-views.js', 'office-cloud.js', 'office-extra.js', 'office-v3.js', 'office-dexxter.js', 'office-dx2.js', 'office-dx3.js', 'office-dx4.js', 'office-dx5.js', 'office-v4.js', 'offerte.html', 'office-start.js', 'vet-update.js', 'vet-slot.js', 'pdfjs.min.js', 'pdfjs.worker.min.js', 'logo-app.png', 'vet-sync.js', 'jspdf.umd.min.js', 'qrcode.js', 'jszip.min.js', 'fonts.js', 'logo-factuur.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).catch(() => {})); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r.ok) { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
