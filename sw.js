/* Service Worker：讓 App 加到手機主畫面後可以離線使用。
   只有在用「網址」開啟時才會生效（https 或 localhost），
   在電腦上用 file:// 雙擊開啟時瀏覽器不會啟動它，不影響使用。

   改了 index.html 或字庫之後，把下面的 v1 改成 v2、v3…
   手機才會抓到新版本（否則會一直用舊的快取）。*/

const CACHE = 'jlpt-vocab-v6';

const FILES = [
  './',
  './index.html',
  './manifest.json',
  './data/words.js',
  './data/grammar.js',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // 個別加入：少一個檔案（例如還沒產生 grammar.js）也不會整批失敗
      .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      // 有快取就先給快取（離線也能開），同時去背景更新
      const net = fetch(e.request)
        .then(res => {
          if(res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
