// Kalima — copie pour l'utilisation hors connexion (« service worker »)
// ---------------------------------------------------------------------------
// Ce petit programme est installé par le navigateur quand Kalima est ouvert
// depuis le site (https://…/kalima/). Il garde une copie de la page et de ses
// icônes ; quand il n'y a pas de connexion, c'est cette copie qui s'ouvre.
// Règle : « le réseau d'abord ». Avec une connexion, la page est toujours
// reprise du site (donc les mises à jour arrivent aussitôt) et la copie est
// renouvelée ; sans connexion, la dernière copie est servie.
// Les documents (PDF, ODT…) ne passent jamais par ici : ils sont lus
// directement sur l'appareil, et Kalima garde sa propre mémoire de lecture.

const CACHE = "kalima-v1";                        // nom de la copie (changer le numéro force une copie neuve)
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest",
                  "./icone-180.png", "./icone-192.png", "./icone-512.png"];

// installation : copie de la page et des icônes
self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

// activation : suppression des copies d'anciennes versions de ce programme
self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys()
    .then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

// chaque demande du navigateur : le réseau d'abord, la copie si le réseau manque
self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  ev.respondWith(
    fetch(req)
      .then(rep => {
        if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
        return rep;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
        .then(r => r || Response.error()))
  );
});
