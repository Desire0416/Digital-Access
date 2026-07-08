import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Intégration vidéo : YouTube (nocookie), Vimeo, ou fichier direct (mp4/webm).
   Ratio 16:9 fluide, chargement paresseux. Aucune dépendance externe.
   ══════════════════════════════════════════════════════════════════════════ */

function parse(url: string): { kind: "youtube" | "vimeo" | "file" | "unknown"; src: string } {
  const u = url.trim();
  // YouTube
  const yt =
    u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) ??
    u.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  // Vimeo
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}` };
  // Fichier direct
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return { kind: "file", src: u };
  return { kind: "unknown", src: u };
}

export function VideoEmbed({ url, title, className }: { url: string; title?: string; className?: string }) {
  const { kind, src } = parse(url);

  if (kind === "file") {
    return (
      <div className={cn("overflow-hidden rounded-2xl bg-black shadow-brand", className)}>
        <video controls preload="metadata" className="aspect-video w-full" src={src}>
          <track kind="captions" />
        </video>
      </div>
    );
  }

  if (kind === "unknown") {
    // N'autoriser que http(s) : jamais de href javascript:/data: issu du contenu.
    const isSafeLink = /^https?:\/\//i.test(src);
    if (!isSafeLink) {
      return (
        <div
          className={cn(
            "flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10 bg-navy/60 text-sm font-medium text-white/60",
            className,
          )}
        >
          Ressource vidéo indisponible
        </div>
      );
    }
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10 bg-navy/60 text-sm font-medium text-white/80 transition-colors hover:text-white",
          className,
        )}
      >
        Ouvrir la ressource vidéo ↗
      </a>
    );
  }

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-brand", className)}>
      <iframe
        src={src}
        title={title ?? "Vidéo de la leçon"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
