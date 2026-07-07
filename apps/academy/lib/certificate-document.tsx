import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";
import { CERT_LOGO_WHITE } from "./certificate-logo";

/* ══════════════════════════════════════════════════════════════════════════
   Certificat de réussite Access Academy — @react-pdf/renderer.
   A4 paysage. Adaptation à la charte Digital Access d'un certificat corporate :
   vague d'en-tête en dégradé signature (violet→cyan), bande latérale navy
   portant le logo officiel (blanc) + un médaillon or à rubans, grand titre
   sérif, nom manuscrit souligné d'un filet dégradé, doubles signatures
   (Formateur / Direction), sceau officiel + QR de vérification.
   Toute la vectorisation vit dans UN Svg pleine page (les dégradés y sont
   définis une fois) ; le texte, le logo et le QR sont des calques absolus.
   ══════════════════════════════════════════════════════════════════════════ */

const C = {
  violet: "#5B3FA8",
  blueRoyal: "#2B5CC6",
  blueVif: "#1E8FE1",
  cyan: "#00BCD4",
  navy: "#14142A",
  navyLight: "#1A1A2E",
  muted: "#6B7280",
  faint: "#9CA3AF",
  gold: "#B0852B",
  goldMid: "#C79A3B",
  goldLight: "#D8B45A",
  line: "#E7E7EF",
  paper: "#FFFFFF",
  bandLabel: "#8CA0C8",
};

export interface CertificateData {
  name: string;
  courseTitle: string;
  dateStr: string;
  code: string;
  verifyUrl: string;
  qrDataUrl: string;
  instructor?: string | null;
}

const s = StyleSheet.create({
  page: { backgroundColor: C.paper, position: "relative" },
  bg: { position: "absolute", top: 0, left: 0 },

  logoWrap: {
    position: "absolute",
    top: 36,
    left: 0,
    width: 186,
    alignItems: "center",
  },
  logo: { width: 100, height: 82 },
  bandLabel: {
    position: "absolute",
    top: 462,
    left: 0,
    width: 186,
    textAlign: "center",
    fontFamily: "Helvetica",
    fontSize: 8,
    letterSpacing: 3,
    color: C.bandLabel,
  },

  content: {
    position: "absolute",
    top: 150,
    left: 210,
    width: 612,
    alignItems: "center",
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 50,
    letterSpacing: 9,
    color: C.navy,
  },
  subtitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    letterSpacing: 11,
    color: C.blueVif,
    marginTop: 12,
  },
  eyebrow: {
    fontFamily: "Helvetica",
    fontSize: 11,
    letterSpacing: 4,
    color: C.muted,
    marginTop: 30,
  },
  name: {
    fontFamily: "Times-Italic",
    fontSize: 44,
    color: C.navy,
    marginTop: 14,
  },
  mention: {
    fontFamily: "Times-Roman",
    fontSize: 14,
    color: C.muted,
    marginTop: 20,
  },
  course: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    color: C.navy,
    marginTop: 9,
    textAlign: "center",
    maxWidth: 540,
    lineHeight: 1.3,
  },

  sig: { position: "absolute", bottom: 74, alignItems: "center" },
  sigName: {
    fontFamily: "Times-Italic",
    fontSize: 19,
    color: C.navy,
  },
  sigLine: { marginTop: 8, height: 1, width: "100%", backgroundColor: C.navy },
  sigRole: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    letterSpacing: 2,
    color: C.muted,
    marginTop: 7,
  },

  centerRow: {
    position: "absolute",
    bottom: 60,
    left: 210,
    width: 612,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  badge: { alignItems: "center" },
  badgeCaption: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    letterSpacing: 2,
    color: C.muted,
    marginTop: 5,
  },
  qr: { width: 54, height: 54 },

  meta: {
    position: "absolute",
    bottom: 22,
    left: 210,
    width: 612,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: { fontFamily: "Helvetica", fontSize: 9.5, color: C.muted },
  metaCode: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    letterSpacing: 1,
    color: C.navy,
  },
});

/** Fond vectoriel pleine page : vagues, bande navy, guilloché, médaillon or. */
function Background() {
  const guilloche = [
    "M14,150 C54,138 94,162 134,150 C154,144 166,156 172,150",
    "M14,164 C54,152 94,176 134,164 C154,158 166,170 172,164",
    "M14,178 C54,166 94,190 134,178 C154,172 166,184 172,178",
    "M14,192 C54,180 94,204 134,192 C154,186 166,198 172,192",
    "M14,206 C54,194 94,218 134,206 C154,200 166,212 172,206",
    "M14,220 C54,208 94,232 134,220 C154,214 166,226 172,220",
    "M14,234 C54,222 94,246 134,234 C154,228 166,240 172,234",
    "M14,248 C54,236 94,260 134,248 C154,242 166,254 172,248",
    "M14,368 C54,356 94,380 134,368 C154,362 166,374 172,368",
    "M14,382 C54,370 94,394 134,382 C154,376 166,388 172,382",
    "M14,396 C54,384 94,408 134,396 C154,390 166,402 172,396",
    "M14,410 C54,398 94,422 134,410 C154,404 166,416 172,410",
    "M14,424 C54,412 94,436 134,424 C154,418 166,430 172,424",
    "M14,438 C54,426 94,450 134,438 C154,432 166,444 172,438",
    "M14,452 C54,440 94,464 134,452 C154,446 166,458 172,452",
    "M14,466 C54,454 94,478 134,466 C154,460 166,472 172,466",
  ];
  const crans = [
    "M93,272 L93,284",
    "M93,360 L93,372",
    "M43,322 L55,322",
    "M131,322 L143,322",
    "M58,287 L66,295",
    "M120,349 L128,357",
    "M128,287 L120,295",
    "M66,349 L58,357",
  ];
  return (
    <Svg width={842} height={595} viewBox="0 0 842 595" style={s.bg}>
      <Defs>
        <LinearGradient id="daSig" x1="0" y1="0" x2="1" y2="0.55">
          <Stop offset="0" stopColor={C.violet} />
          <Stop offset="0.38" stopColor={C.blueRoyal} />
          <Stop offset="0.72" stopColor={C.blueVif} />
          <Stop offset="1" stopColor={C.cyan} />
        </LinearGradient>
        <LinearGradient id="daSigV" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.violet} />
          <Stop offset="0.5" stopColor={C.blueVif} />
          <Stop offset="1" stopColor={C.cyan} />
        </LinearGradient>
        <LinearGradient id="daNavy" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.navyLight} />
          <Stop offset="1" stopColor={C.navy} />
        </LinearGradient>
        <LinearGradient id="daGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.goldLight} />
          <Stop offset="0.5" stopColor={C.goldMid} />
          <Stop offset="1" stopColor={C.gold} />
        </LinearGradient>
        <LinearGradient id="daGoldR" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.goldMid} />
          <Stop offset="1" stopColor={C.gold} />
        </LinearGradient>
      </Defs>

      {/* Vague d'en-tête : dégradé signature (héros) */}
      <Path
        d="M0,0 L842,0 L842,86 C700,150 560,150 402,116 C250,84 150,150 0,132 Z"
        fill="url(#daSig)"
      />
      {/* Vague navy secondaire sous le dégradé */}
      <Path
        d="M0,132 C150,150 250,84 402,116 C560,150 700,150 842,86 L842,104 C700,168 560,168 402,134 C250,102 150,168 0,150 Z"
        fill="url(#daNavy)"
        opacity={0.9}
      />
      {/* Filet cyan longeant la vague */}
      <Path
        d="M0,150 C150,168 250,102 402,134 C560,168 700,168 842,104"
        fill="none"
        stroke={C.cyan}
        strokeWidth={2.4}
        opacity={0.85}
      />

      {/* Filet baseline (bas, pleine largeur, sous le contenu) */}
      <Rect x={186} y={589} width={656} height={6} fill="url(#daSig)" />

      {/* Bande verticale gauche (navy) + filet signature */}
      <Rect x={0} y={0} width={186} height={595} fill="url(#daNavy)" />
      <Rect x={186} y={0} width={3} height={595} fill="url(#daSigV)" />

      {/* Guilloché sur la bande */}
      {guilloche.map((d, i) => (
        <Path
          key={`g${i}`}
          d={d}
          fill="none"
          stroke={C.cyan}
          strokeWidth={0.6}
          opacity={0.16}
        />
      ))}

      {/* Médaillon or à rubans */}
      <Path d="M70,352 L100,352 L88,410 L74,398 Z" fill="url(#daGoldR)" />
      <Path d="M116,352 L86,352 L98,410 L112,398 Z" fill="url(#daGoldR)" />
      <Path d="M70,352 L100,352 L88,392 L74,380 Z" fill="#9C7526" />
      <Path d="M116,352 L86,352 L98,392 L112,380 Z" fill="#9C7526" />
      <Circle cx={93} cy={322} r={46} fill="url(#daGold)" />
      <Circle cx={93} cy={322} r={46} fill="none" stroke="#8C6820" strokeWidth={1.5} />
      {crans.map((d, i) => (
        <Path key={`c${i}`} d={d} stroke={C.gold} strokeWidth={3} />
      ))}
      <Circle cx={93} cy={322} r={36} fill="url(#daGold)" stroke="#8C6820" strokeWidth={1} />
      <Circle cx={93} cy={322} r={30} fill="none" stroke="#FCE7B8" strokeWidth={1.4} opacity={0.85} />
      <Circle cx={93} cy={322} r={30} fill="none" stroke="#8C6820" strokeWidth={0.8} />
      <Path
        d="M93,300 L99,317 L117,317 L102,328 L108,346 L93,335 L78,346 L84,328 L69,317 L87,317 Z"
        fill={C.violet}
      />
      <Path
        d="M93,306 L97,318 L110,318 L100,326 L104,338 L93,330 L82,338 L86,326 L76,318 L89,318 Z"
        fill="#FCE7B8"
        opacity={0.9}
      />
    </Svg>
  );
}

/** Filet dégradé signature (sous le titre). */
function GradientRule() {
  return (
    <Svg width={190} height={3} style={{ marginTop: 15 }}>
      <Defs>
        <LinearGradient id="ruleG" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={C.violet} />
          <Stop offset="0.5" stopColor={C.blueRoyal} />
          <Stop offset="1" stopColor={C.cyan} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={190} height={3} rx={1.5} fill="url(#ruleG)" />
    </Svg>
  );
}

/** Filet dégradé fondu (souligné du nom). */
function NameUnderline() {
  return (
    <Svg width={300} height={2} style={{ marginTop: 14 }}>
      <Defs>
        <LinearGradient id="fadeG" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={C.blueRoyal} stopOpacity={0} />
          <Stop offset="0.5" stopColor={C.blueRoyal} stopOpacity={1} />
          <Stop offset="1" stopColor={C.blueRoyal} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={300} height={2} fill="url(#fadeG)" />
    </Svg>
  );
}

/** Sceau officiel (anneau + étoile en dégradé signature). */
function Seal() {
  return (
    <Svg width={60} height={60} viewBox="0 0 70 70">
      <Defs>
        <LinearGradient id="sealG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.violet} />
          <Stop offset="0.5" stopColor={C.blueVif} />
          <Stop offset="1" stopColor={C.cyan} />
        </LinearGradient>
      </Defs>
      <Circle cx={35} cy={35} r={33} fill="none" stroke="url(#sealG)" strokeWidth={2} />
      <Circle cx={35} cy={35} r={27} fill="none" stroke={C.line} strokeWidth={1} />
      <Path
        d="M35,18 L39,30 L52,30 L41,38 L45,50 L35,42 L25,50 L29,38 L18,30 L31,30 Z"
        fill="url(#sealG)"
      />
    </Svg>
  );
}

export function CertificateDocument(data: CertificateData) {
  let verifyHost = "academy.digitalaccess.ci/verify";
  try {
    verifyHost = `${new URL(data.verifyUrl).host}/verify`;
  } catch {
    /* garde la valeur par défaut */
  }

  return (
    <Document
      title={`Certificat — ${data.courseTitle}`}
      author="Access Academy — Digital Access"
      subject={`Certificat de réussite de ${data.name}`}
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        <Background />

        {/* Logo officiel (blanc) sur la bande navy */}
        <View style={s.logoWrap}>
          <Image src={CERT_LOGO_WHITE} style={s.logo} />
        </View>
        <Text style={s.bandLabel}>ACCESS ACADEMY</Text>

        {/* En-tête + contenu */}
        <View style={s.content}>
          <Text style={s.title}>CERTIFICAT</Text>
          <Text style={s.subtitle}>DE RÉUSSITE</Text>
          <GradientRule />

          <Text style={s.eyebrow}>CE CERTIFICAT EST FIÈREMENT DÉCERNÉ À</Text>
          <Text style={s.name}>{data.name}</Text>
          <NameUnderline />

          <Text style={s.mention}>pour avoir complété avec succès la formation</Text>
          <Text style={s.course}>{data.courseTitle}</Text>
        </View>

        {/* Signature gauche : Formateur */}
        <View style={[s.sig, { left: 210, width: 176 }]}>
          <Text style={s.sigName}>{data.instructor ?? "Access Academy"}</Text>
          <View style={s.sigLine} />
          <Text style={s.sigRole}>FORMATEUR</Text>
        </View>

        {/* Sceau officiel + QR (centrés entre les deux signatures) */}
        <View style={s.centerRow}>
          <View style={[s.badge, { marginRight: 30 }]}>
            <Seal />
            <Text style={s.badgeCaption}>SCEAU OFFICIEL</Text>
          </View>
          <View style={s.badge}>
            {data.qrDataUrl ? <Image src={data.qrDataUrl} style={s.qr} /> : null}
            <Text style={s.badgeCaption}>VÉRIFIER</Text>
          </View>
        </View>

        {/* Signature droite : Direction */}
        <View style={[s.sig, { right: 32, width: 186 }]}>
          <Text style={s.sigName}>Access Academy</Text>
          <View style={s.sigLine} />
          <Text style={s.sigRole}>DIRECTION</Text>
        </View>

        {/* Métadonnées */}
        <View style={s.meta}>
          <Text style={s.metaText}>Délivré le {data.dateStr}</Text>
          <Text style={s.metaCode}>Code : {data.code}</Text>
          <Text style={s.metaText}>{verifyHost}</Text>
        </View>
      </Page>
    </Document>
  );
}
