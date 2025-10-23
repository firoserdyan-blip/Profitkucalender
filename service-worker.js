const CACHE_NAME = 'profitku-calendar-v1.1.0'; // Ganti versi untuk memaksa update
const urlsToCache = [
  '/', // Harus ada untuk menangani root path
  './index.html',
  './logo.png',
  './manifest.json',
  // Tambahkan file CSS/JS/Aset lain yang Anda miliki
];

// Instalasi Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache. Caching assets...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache assets:', err);
      })
  );
});

// Aktivasi Service Worker: Membersihkan cache lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Request: Ini adalah bagian perbaikan 404
self.addEventListener('fetch', event => {
  // Hanya proses GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika aset ditemukan di cache, kembalikan response cache
        if (response) {
          return response;
        }

        // Jika tidak di cache, coba fetch dari jaringan
        return fetch(event.request).catch(error => {
          // *** LOGIKA PERBAIKAN 404 UTAMA DI SINI ***
          // Jika fetch gagal (karena offline) dan ini adalah permintaan navigasi
          // (mencari halaman HTML), kembalikan index.html dari cache.
          
          const requestUrl = new URL(event.request.url);

          // Cek apakah request adalah untuk halaman HTML (navigasi) dan bukan aset lain
          if (event.request.mode === 'navigate' || 
              (event.request.destination === 'document')) {
             
              console.log('Fetch failed during navigation (likely offline). Serving index.html from cache.');
              
              // Coba ambil index.html dari cache
              return caches.match('./index.html');
          }
          
          // Untuk request non-navigasi yang gagal, kembalikan error
          throw error;
        });
      })
  );
});
