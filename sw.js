/* 人生管理系统 Service Worker —— 支持离线打开、秒开，配合"添加到主屏幕"像 App 使用 */
const CACHE = 'life-os-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  // 页面导航：优先网络，失败回退缓存（保证内容更新 + 离线可用）
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { cachePut(req, r.clone()); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // 其他资源：缓存优先，未命中走网络并写入缓存
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(r => {
        if (r && r.status === 200 && (r.type === 'basic' || r.type === 'cors')) cachePut(req, r.clone());
        return r;
      });
    })
  );
});

function cachePut(req, res) {
  if (!res) return;
  caches.open(CACHE).then(c => c.put(req, res)).catch(() => {});
}
