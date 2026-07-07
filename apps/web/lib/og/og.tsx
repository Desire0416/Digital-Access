import { ImageResponse } from "next/og";
import { JAKARTA_BOLD_B64, JAKARTA_MEDIUM_B64, LOGO_WHITE_DATA_URI } from "./fonts";

/* ══════════════════════════════════════════════════════════════════════════
   Gabarit d'image OpenGraph brandé Digital Access (1200×630) pour le partage
   de liens. Rendu via next/og (Satori) : flexbox uniquement, styles inline.
   Polices Plus Jakarta Sans (700/500) + logo officiel embarqués en base64
   (voir fonts.ts) → rendu fiable en runtime Node, sans fetch ni accès disque.
   Le domaine de pied de page est paramétrable (réutilisé web + academy).
   ══════════════════════════════════════════════════════════════════════════ */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const SIGNATURE =
  "linear-gradient(135deg, #5B3FA8 0%, #2B5CC6 38%, #1E8FE1 70%, #00BCD4 100%)";
const DEFAULT_DOMAIN = "digitalaccess.ci";

const fonts = [
  { name: "Jakarta", data: Buffer.from(JAKARTA_BOLD_B64, "base64"), weight: 700 as const, style: "normal" as const },
  { name: "Jakarta", data: Buffer.from(JAKARTA_MEDIUM_B64, "base64"), weight: 500 as const, style: "normal" as const },
];

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export interface OgContent {
  eyebrow?: string;
  title: string;
  description?: string;
  footer?: string;
  badge?: string;
}

export function renderOgImage(content: OgContent): ImageResponse {
  const title = clamp(content.title, 92);
  const description = content.description ? clamp(content.description, 150) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#14142A",
          padding: "58px 72px",
          position: "relative",
          fontFamily: "Jakarta",
        }}
      >
        {/* Barre dégradée supérieure */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, backgroundImage: SIGNATURE, display: "flex" }} />
        {/* Halos dégradés */}
        <div style={{ position: "absolute", top: -180, right: -150, width: 560, height: 560, borderRadius: 9999, backgroundImage: "radial-gradient(circle at center, rgba(30,143,225,0.42), rgba(20,20,42,0) 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -170, left: -130, width: 440, height: 440, borderRadius: 9999, backgroundImage: "radial-gradient(circle at center, rgba(124,58,237,0.34), rgba(20,20,42,0) 70%)", display: "flex" }} />

        {/* En-tête : logo officiel */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={LOGO_WHITE_DATA_URI} width={116} height={96} style={{ objectFit: "contain" }} />
        </div>

        {/* Corps : eyebrow + titre + description */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {content.eyebrow ? (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 44,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderRadius: 9999,
                  backgroundImage: SIGNATURE,
                  color: "#FFFFFF",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {content.eyebrow.toUpperCase()}
              </div>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.1,
              color: "#FFFFFF",
              marginTop: content.eyebrow ? 24 : 0,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          {description ? (
            <div style={{ display: "flex", fontWeight: 500, fontSize: 28, lineHeight: 1.35, color: "#AEB6C6", marginTop: 22, maxWidth: 1010 }}>
              {description}
            </div>
          ) : null}
        </div>

        {/* Pied : domaine + accent */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontWeight: 700, fontSize: 27, color: "#8B93A7" }}>
            {content.footer ?? DEFAULT_DOMAIN}
          </div>
          {content.badge ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 46,
                paddingLeft: 22,
                paddingRight: 22,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#E7EAF1",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {content.badge}
            </div>
          ) : (
            <div style={{ display: "flex", height: 12, width: 190, borderRadius: 8, backgroundImage: SIGNATURE }} />
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
