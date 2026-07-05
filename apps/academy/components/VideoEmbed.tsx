import { cn } from "@da/ui";

/** Convertit une URL YouTube / Vimeo en URL d'embed (nocookie pour YouTube). */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (u.hostname.includes("youtube-nocookie.com") && u.pathname.startsWith("/embed/")) {
      return url;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Lecteur vidéo responsive (16:9) — embed YouTube/Vimeo. */
export function VideoEmbed({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const embed = toEmbedUrl(url);
  if (!embed) {
    return (
      <div
        className={cn(
          "grid aspect-video place-items-center rounded-2xl bg-surface-dark text-white/60",
          className,
        )}
      >
        Vidéo indisponible
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-2xl bg-surface-dark shadow-brand-lg",
        className,
      )}
    >
      <iframe
        src={embed}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
