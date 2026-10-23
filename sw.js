/* Service worker dell'app Rugby Parco Sempione: la fa funzionare anche senza internet.
   L'app è un solo file (index.html, con caratteri e stemma già dentro), quindi basta
   tenerne una copia.
   Strategia "prima la rete": con internet si scarica sempre la versione nuova, così gli
   aggiornamenti arrivano subito come prima; senza internet si apre l'ultima copia salvata. */
const CACHE = "rps-v1";
const FILE = ["./", "./index.html", "./manifest.webmanifest",
  "./icone/icona-192.png", "./icone/icona-512.png", "./icone/icona-maskable-512.png", "./icone/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  const salvata = () => caches.match(r, { ignoreSearch: true })
    .then(c => c || (r.mode === "navigate" ? caches.match("./index.html") : undefined));
  const rete = fetch(r).then(risp => {
    if (risp.ok) { const copia = risp.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
    return risp;
  });
  // campo con poco segnale: se la rete non risponde entro 4 secondi si apre la copia salvata
  // (la versione nuova intanto finisce di scaricarsi e sarà pronta la volta dopo)
  const attesa = new Promise(ok => setTimeout(ok, 4000)).then(salvata);
  e.respondWith(
    Promise.race([rete, attesa.then(c => c || rete)])
      .catch(() => salvata().then(c => c || Response.error()))
  );
  e.waitUntil(rete.catch(() => {}));
});
