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
  G,
} from "@react-pdf/renderer";
import { CERT_LOGO_COLOR } from "./certificate-logo";

/* ══════════════════════════════════════════════════════════════════════════
   Certificat de réussite Access Academy — @react-pdf/renderer.
   A4 paysage. Logo officiel Digital Access embarqué (data URI). Typographie
   sérif de cérémonie (Times, intégrée → aucune police externe, robuste en
   serverless). Cadre double filet or, sceau médaillon, filigrane, QR.
   ══════════════════════════════════════════════════════════════════════════ */

const C = {
  violet: "#5B3FA8",
  blueRoyal: "#2B5CC6",
  cyan: "#00BCD4",
  navy: "#14142A",
  muted: "#6B7280",
  faint: "#9CA3AF",
  gold: "#B0852B",
  goldLight: "#D8B45A",
  paper: "#FFFFFF",
  line: "#E7E7EF",
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
  page: {
    backgroundColor: C.paper,
    padding: 20,
    fontFamily: "Times-Roman",
    color: C.navy,
    position: "relative",
  },
  outer: {
    flexGrow: 1,
    borderWidth: 2,
    borderColor: C.gold,
    borderRadius: 4,
    position: "relative",
  },
  inner: {
    flexGrow: 1,
    margin: 5,
    borderWidth: 0.8,
    borderColor: C.line,
    borderRadius: 2,
    paddingTop: 30,
    paddingBottom: 22,
    paddingHorizontal: 52,
    alignItems: "center",
    position: "relative",
  },
  topBar: { position: "absolute", top: 0, left: 0, right: 0 },
  logo: { width: 104, height: 86, marginBottom: 4 },
  eyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    letterSpacing: 6,
    color: C.gold,
    marginTop: 4,
  },
  lead: {
    fontFamily: "Times-Italic",
    fontSize: 12,
    color: C.muted,
    marginTop: 22,
  },
  name: {
    fontFamily: "Times-Bold",
    fontSize: 40,
    color: C.navy,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  ruleWrap: { marginTop: 8, marginBottom: 4 },
  courseIntro: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    color: C.muted,
    marginTop: 20,
  },
  course: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    color: C.navy,
    marginTop: 7,
    textAlign: "center",
    maxWidth: 520,
    lineHeight: 1.25,
  },
  footer: {
    position: "absolute",
    left: 52,
    right: 52,
    bottom: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  fCol: { width: 200 },
  fLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: C.faint,
    marginBottom: 3,
  },
  fValue: { fontFamily: "Times-Bold", fontSize: 11.5, color: C.navy },
  sigLine: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.navy,
    paddingTop: 4,
    width: 168,
  },
  sigName: { fontFamily: "Times-Bold", fontSize: 11, color: C.navy },
  sigRole: { fontFamily: "Helvetica", fontSize: 7.5, color: C.muted, marginTop: 2 },
  sealWrap: { alignItems: "center", width: 130 },
  sealCaption: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 1.5,
    color: C.gold,
    marginTop: 5,
  },
  qrWrap: { alignItems: "center", width: 200 },
  qr: { width: 68, height: 68 },
  qrCode: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.navy, marginTop: 4, letterSpacing: 1 },
  qrHint: { fontFamily: "Helvetica", fontSize: 6.5, color: C.faint, marginTop: 2, textAlign: "center" },
});

/** Grand filigrane en dégradé très pâle (monogramme stylisé) derrière le contenu. */
function Watermark() {
  return (
    <View style={{ position: "absolute", top: 96, left: 0, right: 0, alignItems: "center" }}>
      <Svg width={260} height={260} viewBox="0 0 100 100" style={{ opacity: 0.05 }}>
        <Path
          d="M30 22 L30 78 L52 78 C70 78 80 66 80 50 C80 34 70 22 52 22 Z M42 34 L52 34 C62 34 68 41 68 50 C68 59 62 66 52 66 L42 66 Z"
          fill={C.blueRoyal}
        />
        <Path d="M50 74 L64 40 L78 74 L70 74 L64 58 L58 74 Z" fill={C.violet} />
      </Svg>
    </View>
  );
}

/** Sceau médaillon or + dégradé, étoile centrale. */
function Seal({ size = 78 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.violet} />
          <Stop offset="0.5" stopColor={C.blueRoyal} />
          <Stop offset="1" stopColor={C.cyan} />
        </LinearGradient>
      </Defs>
      {/* anneau or extérieur */}
      <Circle cx="50" cy="50" r="47" fill="none" stroke={C.gold} strokeWidth="1.5" />
      <Circle cx="50" cy="50" r="43" fill="none" stroke={C.goldLight} strokeWidth="0.7" />
      {/* disque dégradé */}
      <Circle cx="50" cy="50" r="37" fill="url(#sealGrad)" />
      <Circle cx="50" cy="50" r="37" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity={0.45} />
      {/* étoile 5 branches */}
      <Path
        d="M50 27 L56.2 42.8 L73 44 L60 54.8 L64.3 71 L50 61.5 L35.7 71 L40 54.8 L27 44 L43.8 42.8 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/** Ornement d'angle (petit chevron dégradé). */
function Corner({ style, flip }: { style: object; flip?: boolean }) {
  return (
    <View style={{ position: "absolute", ...style }}>
      <Svg width={26} height={26} viewBox="0 0 26 26">
        <Defs>
          <LinearGradient id="cornerGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.violet} />
            <Stop offset="1" stopColor={C.cyan} />
          </LinearGradient>
        </Defs>
        <G transform={flip ? "scale(-1,1) translate(-26,0)" : undefined}>
          <Path d="M2 2 L14 2 M2 2 L2 14" stroke="url(#cornerGrad)" strokeWidth="2" fill="none" />
        </G>
      </Svg>
    </View>
  );
}

export function CertificateDocument(data: CertificateData) {
  return (
    <Document
      title={`Certificat — ${data.courseTitle}`}
      author="Access Academy — Digital Access"
      subject={`Certificat de réussite de ${data.name}`}
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Barre dégradée supérieure */}
        <View style={s.topBar}>
          <Svg width={842} height={10} viewBox="0 0 842 10">
            <Defs>
              <LinearGradient id="topGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={C.violet} />
                <Stop offset="0.5" stopColor={C.blueRoyal} />
                <Stop offset="1" stopColor={C.cyan} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="842" height="10" fill="url(#topGrad)" />
          </Svg>
        </View>

        <View style={s.outer}>
          <View style={s.inner}>
            <Watermark />

            {/* Ornements d'angle */}
            <Corner style={{ top: 10, left: 10 }} />
            <Corner style={{ top: 10, right: 10 }} flip />

            {/* Logo officiel */}
            <Image src={CERT_LOGO_COLOR} style={s.logo} />

            <Text style={s.eyebrow}>CERTIFICAT DE RÉUSSITE</Text>

            <Text style={s.lead}>Ce certificat est fièrement décerné à</Text>
            <Text style={s.name}>{data.name}</Text>
            <View style={s.ruleWrap}>
              <Svg width={260} height={5} viewBox="0 0 260 5">
                <Defs>
                  <LinearGradient id="ruleGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={C.violet} />
                    <Stop offset="0.5" stopColor={C.blueRoyal} />
                    <Stop offset="1" stopColor={C.cyan} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="1.5" width="260" height="2.4" rx="1.2" fill="url(#ruleGrad)" />
                <Circle cx="6" cy="2.7" r="2.4" fill={C.violet} />
                <Circle cx="254" cy="2.7" r="2.4" fill={C.cyan} />
              </Svg>
            </View>

            <Text style={s.courseIntro}>pour avoir complété avec succès la formation</Text>
            <Text style={s.course}>{data.courseTitle}</Text>

            {/* Pied : date / signature — sceau — QR */}
            <View style={s.footer}>
              <View style={s.fCol}>
                <Text style={s.fLabel}>DÉLIVRÉ LE</Text>
                <Text style={s.fValue}>{data.dateStr}</Text>
                <View style={s.sigLine}>
                  <Text style={s.sigName}>{data.instructor ?? "Access Academy"}</Text>
                  <Text style={s.sigRole}>Formateur · Access Academy</Text>
                </View>
              </View>

              <View style={s.sealWrap}>
                <Seal />
                <Text style={s.sealCaption}>SCEAU OFFICIEL</Text>
              </View>

              <View style={s.qrWrap}>
                {data.qrDataUrl ? <Image src={data.qrDataUrl} style={s.qr} /> : null}
                <Text style={s.qrCode}>{data.code}</Text>
                <Text style={s.qrHint}>
                  Vérifiez l&apos;authenticité sur{"\n"}academy.digitalaccess.ci/verify
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
