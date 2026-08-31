// Générateur ZIP minimal (méthode « stored », sans compression) — suffisant pour
// livrer une arborescence de dossiers vides + quelques fichiers texte.
// Écrit en pur Node : Compress-Archive (PowerShell) perd les dossiers vides.

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

/** Date/heure MS-DOS (fixe : ZIP reproductible). */
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1; // 2026-01-01

/**
 * @param {{name:string, data?:Buffer|string, dir?:boolean}[]} entries
 *   `dir:true` → dossier (le nom reçoit automatiquement un « / » final).
 * @returns {Buffer} archive ZIP
 */
export function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const e of entries) {
    const isDir = !!e.dir;
    const rawName = isDir ? (e.name.endsWith("/") ? e.name : e.name + "/") : e.name;
    const name = Buffer.from(rawName, "utf8");
    const data = isDir ? Buffer.alloc(0) : Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data ?? "", "utf8");
    const crc = isDir ? 0 : crc32(data);

    // En-tête local (30 octets + nom)
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // version nécessaire
    lh.writeUInt16LE(0x0800, 6); // drapeau : nom de fichier en UTF-8
    lh.writeUInt16LE(0, 8); // méthode : stored
    lh.writeUInt16LE(DOS_TIME, 10);
    lh.writeUInt16LE(DOS_DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, name, data);

    // Entrée du répertoire central (46 octets + nom)
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); // version d'écriture
    ch.writeUInt16LE(20, 6); // version nécessaire
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(DOS_TIME, 12);
    ch.writeUInt16LE(DOS_DATE, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(data.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt16LE(0, 30); // extra
    ch.writeUInt16LE(0, 32); // commentaire
    ch.writeUInt16LE(0, 34); // disque
    ch.writeUInt16LE(0, 36); // attributs internes
    ch.writeUInt32LE(isDir ? 0x10 : 0x20, 38); // attributs externes (0x10 = dossier)
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, name);

    offset += lh.length + name.length + data.length;
  }

  const central = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, central, eocd]);
}
