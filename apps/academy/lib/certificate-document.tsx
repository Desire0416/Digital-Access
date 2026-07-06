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
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";

/* ══════════════════════════════════════════════════════════════════════════
   Certificat de réussite Access Academy — @react-pdf/renderer.
   A4 paysage, police intégrée (Helvetica), dégradé signature via SVG, QR de
   vérification. Aucune police externe (robuste en serverless).
   ══════════════════════════════════════════════════════════════════════════ */

const C = {
  violet: "#5B3FA8",
  blueRoyal: "#2B5CC6",
  cyan: "#00BCD4",
  navy: "#1A1A2E",
  muted: "#6B7280",
  faint: "#9CA3AF",
  gold: "#B8862F",
  paper: "#FFFFFF",
  soft: "#F7F7FB",
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
    paddingVertical: 30,
    paddingHorizontal: 34,
    fontFamily: "Helvetica",
    color: C.navy,
    position: "relative",
  },
  frame: {
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 6,
    paddingTop: 34,
    paddingBottom: 26,
    paddingHorizontal: 44,
    position: "relative",
  },
  // barre dégradée haute (posée en absolu via SVG)
  topBar: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  brandText: { marginLeft: 12 },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    letterSpacing: 3,
    color: C.navy,
  },
  brandSub: {
    fontSize: 7.5,
    letterSpacing: 2.4,
    color: C.violet,
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },
  eyebrow: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 11,
    letterSpacing: 6,
    color: C.gold,
    fontFamily: "Helvetica-Bold",
  },
  title: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 30,
    letterSpacing: 1,
    color: C.navy,
    fontFamily: "Helvetica-Bold",
  },
  lead: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 11,
    color: C.muted,
  },
  name: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 34,
    color: C.violet,
    fontFamily: "Helvetica-Bold",
  },
  nameRule: { alignItems: "center", marginTop: 6 },
  courseIntro: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 11,
    color: C.muted,
  },
  course: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 16,
    color: C.navy,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 26,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  fCol: { width: 190 },
  fLabel: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: C.faint,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  fValue: { fontSize: 10.5, color: C.navy, fontFamily: "Helvetica-Bold" },
  sigLine: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.navy,
    paddingTop: 4,
    width: 160,
  },
  sigName: { fontSize: 10, color: C.navy, fontFamily: "Helvetica-Bold" },
  sigRole: { fontSize: 7.5, color: C.muted, marginTop: 1 },
  qrWrap: { alignItems: "center", width: 120 },
  qr: { width: 72, height: 72 },
  qrCode: { fontSize: 8, color: C.navy, fontFamily: "Helvetica-Bold", marginTop: 4 },
  qrHint: { fontSize: 6.5, color: C.faint, marginTop: 2, textAlign: "center" },
});

/** Monogramme DA stylisé (dégradé) — rendu SVG natif react-pdf. */
function Seal({ size = 46 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.violet} />
          <Stop offset="0.5" stopColor={C.blueRoyal} />
          <Stop offset="1" stopColor={C.cyan} />
        </LinearGradient>
      </Defs>
      <Rect x="2" y="2" width="96" height="96" rx="26" fill="url(#sealGrad)" />
      {/* "D" ouvert */}
      <Path
        d="M30 26 L30 74 L50 74 C66 74 74 64 74 50 C74 36 66 26 50 26 Z M42 38 L50 38 C58 38 62 43 62 50 C62 57 58 62 50 62 L42 62 Z"
        fill="#FFFFFF"
      />
      {/* pic "A" */}
      <Path d="M52 70 L62 44 L72 70 L66 70 L62 58 L58 70 Z" fill="#FFFFFF" opacity={0.92} />
    </Svg>
  );
}

export function CertificateDocument(data: CertificateData) {
  return (
    <Document
      title={`Certificat — ${data.courseTitle}`}
      author="Access Academy"
      subject={`Certificat de réussite de ${data.name}`}
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Barre dégradée supérieure */}
        <View style={s.topBar}>
          <Svg width={842} height={30} viewBox="0 0 842 30">
            <Defs>
              <LinearGradient id="topGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={C.violet} />
                <Stop offset="0.5" stopColor={C.blueRoyal} />
                <Stop offset="1" stopColor={C.cyan} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="842" height="8" fill="url(#topGrad)" />
          </Svg>
        </View>

        <View style={s.frame}>
          {/* En-tête marque */}
          <View style={s.header}>
            <Seal />
            <View style={s.brandText}>
              <Text style={s.brandName}>ACCESS ACADEMY</Text>
              <Text style={s.brandSub}>UN PRODUIT DIGITAL ACCESS</Text>
            </View>
          </View>

          <Text style={s.eyebrow}>CERTIFICAT DE RÉUSSITE</Text>
          <Text style={s.title}>Formation certifiée</Text>

          <Text style={s.lead}>Ce certificat atteste que</Text>
          <Text style={s.name}>{data.name}</Text>
          <View style={s.nameRule}>
            <Svg width={220} height={4} viewBox="0 0 220 4">
              <Defs>
                <LinearGradient id="ruleGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={C.violet} />
                  <Stop offset="1" stopColor={C.cyan} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="220" height="4" rx="2" fill="url(#ruleGrad)" />
            </Svg>
          </View>

          <Text style={s.courseIntro}>a complété avec succès la formation</Text>
          <Text style={s.course}>{data.courseTitle}</Text>

          {/* Pied : date / signature — sceau — QR */}
          <View style={s.footer}>
            <View style={s.fCol}>
              <Text style={s.fLabel}>DÉLIVRÉ LE</Text>
              <Text style={s.fValue}>{data.dateStr}</Text>
              <View style={s.sigLine}>
                <Text style={s.sigName}>{data.instructor ?? "Access Academy"}</Text>
                <Text style={s.sigRole}>Formateur — Access Academy</Text>
              </View>
            </View>

            <View style={{ alignItems: "center", width: 120 }}>
              <Seal size={40} />
              <Text style={{ fontSize: 7, color: C.faint, marginTop: 4, letterSpacing: 1 }}>
                SCEAU OFFICIEL
              </Text>
            </View>

            <View style={s.qrWrap}>
              {data.qrDataUrl ? <Image src={data.qrDataUrl} style={s.qr} /> : null}
              <Text style={s.qrCode}>{data.code}</Text>
              <Text style={s.qrHint}>Vérifiez sur{"\n"}academy.digitalaccess.ci/verify</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
