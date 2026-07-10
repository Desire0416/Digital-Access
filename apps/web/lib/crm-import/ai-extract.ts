import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  ORG_TYPE_VALUES,
  AUDIT_SEVERITY_VALUES,
  AUDIT_CATEGORY_VALUES,
} from "@/lib/crm-types";
import { ImportError } from "./errors";
import type {
  ExtractedProspect,
  ExtractedOrganization,
  ExtractedProspectInfo,
  ExtractedAudit,
  ExtractedFinding,
} from "./types";

/* ══════════════════════════════════════════════════════════════════════════
   Extraction structurée d'un document d'audit Digital Access (FR) via Claude,
   en « tool use » forcé : le modèle DOIT renvoyer un JSON conforme au schéma.
   Le résultat est ensuite normalisé (enums, longueurs). Aucune écriture en base
   ici — la création est gardée + re-validée dans crm-import-actions.
   ══════════════════════════════════════════════════════════════════════════ */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TEXT = 60_000;

const nullableStr = { type: ["string", "null"] as const };

const TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    organization: {
      type: "object" as const,
      description: "L'organisation auditée (le prospect).",
      properties: {
        name: { type: "string", description: "Nom de l'organisation (ex. École d'Architecture d'Abidjan)." },
        legalName: nullableStr,
        organizationType: { type: "string", enum: [...ORG_TYPE_VALUES], description: "Type le plus proche." },
        sector: { ...nullableStr, description: "Secteur d'activité (ex. Enseignement supérieur)." },
        website: { ...nullableStr, description: "URL du site principal (ex. https://eaa.ci)." },
        email: nullableStr,
        phone: nullableStr,
        city: { ...nullableStr, description: "Ville (ex. Abidjan)." },
        country: nullableStr,
      },
      required: ["name", "organizationType"],
    },
    prospect: {
      type: "object" as const,
      properties: {
        mainObservedNeed: { ...nullableStr, description: "Besoin principal observé, résumé de la synthèse." },
        digitalMaturity: { type: ["string", "null"] as const, enum: ["faible", "moyenne", "bonne", "avancée", null], description: "Maturité numérique estimée." },
        recommendedOffer: { ...nullableStr, description: "Offre Digital Access recommandée si mentionnée." },
        estimatedPotential: { type: ["integer", "null"] as const, description: "Potentiel estimé en FCFA si mentionné." },
      },
    },
    audit: {
      type: "object" as const,
      properties: {
        reference: { ...nullableStr, description: "Référence du document (ex. DA-AUD-EAA-CLIENT-2026-03)." },
        title: { type: "string", description: "Titre de l'audit." },
        auditType: { ...nullableStr, description: "Type d'audit (ex. Présence institutionnelle)." },
        summary: { ...nullableStr, description: "Synthèse exécutive." },
        methodology: { ...nullableStr, description: "Périmètre / méthodologie de l'analyse." },
        digitalImportanceStatement: nullableStr,
        overallSeverity: { type: "string", enum: [...AUDIT_SEVERITY_VALUES], description: "Gravité globale." },
        auditDate: { ...nullableStr, description: "Date de l'audit au format YYYY-MM-DD si détectée." },
        findings: {
          type: "array" as const,
          description: "Les constats / axes d'amélioration, un par item.",
          items: {
            type: "object" as const,
            properties: {
              title: { type: "string", description: "Intitulé du constat." },
              category: { type: "string", enum: [...AUDIT_CATEGORY_VALUES], description: "Catégorie la plus proche." },
              severity: { type: "string", enum: [...AUDIT_SEVERITY_VALUES], description: "Gravité (Très élevée→CRITICAL, Élevée→MAJOR, Moyenne→MODERATE, Faible→LOW)." },
              description: nullableStr,
              businessImpact: { ...nullableStr, description: "Enjeu principal / impact métier." },
              userImpact: nullableStr,
              recommendation: { ...nullableStr, description: "Action recommandée." },
              affectedPageUrl: { ...nullableStr, description: "URL de la page concernée si citée." },
              evidenceText: { ...nullableStr, description: "Élément vérifié / preuve (annexe)." },
            },
            required: ["title", "category", "severity"],
          },
        },
      },
      required: ["title", "overallSeverity", "findings"],
    },
  },
  required: ["organization", "prospect", "audit"],
};

const SYSTEM = `Tu es un assistant d'extraction pour le CRM de Digital Access (agence web à Abidjan, Côte d'Ivoire).
On te fournit le TEXTE d'un document d'audit de présence numérique (en français) réalisé pour un prospect.
Ta tâche : extraire fidèlement les informations et appeler l'outil "enregistrer_prospect" avec le JSON conforme.
Règles :
- N'invente RIEN. Si une information est absente, laisse le champ vide/null (n'hallucine pas d'email, de téléphone ou de montant).
- L'organisation auditée est LE PROSPECT (ex. l'école auditée), PAS Digital Access. Ignore les coordonnées de Digital Access.
- Mappe la gravité française vers l'enum : "Très élevée"→CRITICAL, "Élevée"→MAJOR, "Moyenne"→MODERATE, "Faible"→LOW.
- Choisis la catégorie la plus proche pour chaque constat (ex. admissions→ENROLLMENT, conversion candidat→CONVERSION, pages de démo/image→INSTITUTIONAL_IMAGE, FAQ/contenu→CONTENT, référencement→SEO).
- Un constat par axe d'amélioration. Rattache l'URL de la page concernée (annexe) et l'action recommandée au bon constat quand c'est possible.
- mainObservedNeed = un résumé actionnable du besoin (2–3 phrases).
- Réponds en français dans les champs texte.`;

/** Extrait la structure prospect/organisation/audit d'un texte d'audit via Claude. */
export async function extractProspectFromText(text: string): Promise<ExtractedProspect> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ImportError("AI_KEY_MISSING", "ANTHROPIC_API_KEY manquante.");

  const client = new Anthropic({ apiKey });
  let resp: Anthropic.Message;
  try {
    resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools: [
        {
          name: "enregistrer_prospect",
          description: "Enregistre le prospect, son organisation et l'audit structuré extraits du document.",
          input_schema: TOOL_SCHEMA as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "enregistrer_prospect" },
      messages: [
        { role: "user", content: `Voici le texte du document d'audit à structurer :\n\n<document>\n${text.slice(0, MAX_TEXT)}\n</document>` },
      ],
    });
  } catch (e) {
    throw new ImportError("AI_FAILED", (e as Error).message);
  }

  const toolUse = resp.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!toolUse) throw new ImportError("AI_NO_OUTPUT", "Aucune sortie structurée.");

  return normalize(toolUse.input as Record<string, unknown>);
}

/* ── Normalisation défensive (le schéma guide déjà le modèle) ─────────────── */

const s = (v: unknown, max: number): string | undefined => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t.slice(0, max) : undefined;
};
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);

function normalize(raw: Record<string, unknown>): ExtractedProspect {
  const o = (raw.organization ?? {}) as Record<string, unknown>;
  const p = (raw.prospect ?? {}) as Record<string, unknown>;
  const a = (raw.audit ?? {}) as Record<string, unknown>;

  const organization: ExtractedOrganization = {
    name: s(o.name, 120) ?? "Organisation à nommer",
    legalName: s(o.legalName, 160),
    organizationType: oneOf(o.organizationType, ORG_TYPE_VALUES, "OTHER"),
    sector: s(o.sector, 120),
    website: s(o.website, 200),
    email: s(o.email, 160),
    phone: s(o.phone, 40),
    city: s(o.city, 80),
    country: s(o.country, 80),
  };

  const maturity = s(p.digitalMaturity, 40)?.toLowerCase();
  const prospect: ExtractedProspectInfo = {
    mainObservedNeed: s(p.mainObservedNeed, 500),
    digitalMaturity: ["faible", "moyenne", "bonne", "avancée"].includes(maturity ?? "") ? maturity : undefined,
    recommendedOffer: s(p.recommendedOffer, 200),
    estimatedPotential:
      typeof p.estimatedPotential === "number" && Number.isFinite(p.estimatedPotential) && p.estimatedPotential >= 0
        ? Math.round(p.estimatedPotential)
        : undefined,
  };

  const rawFindings = Array.isArray(a.findings) ? a.findings : [];
  const findings: ExtractedFinding[] = rawFindings.slice(0, 30).map((f) => {
    const fo = (f ?? {}) as Record<string, unknown>;
    return {
      title: s(fo.title, 200) ?? "Constat",
      category: oneOf(fo.category, AUDIT_CATEGORY_VALUES, "UX"),
      severity: oneOf(fo.severity, AUDIT_SEVERITY_VALUES, "MODERATE"),
      description: s(fo.description, 2000),
      businessImpact: s(fo.businessImpact, 500),
      userImpact: s(fo.userImpact, 500),
      recommendation: s(fo.recommendation, 1000),
      affectedPageUrl: s(fo.affectedPageUrl, 300),
      evidenceText: s(fo.evidenceText, 1000),
    };
  });

  const audit: ExtractedAudit = {
    reference: s(a.reference, 80),
    title: s(a.title, 200) ?? `Audit — ${organization.name}`,
    auditType: s(a.auditType, 120),
    summary: s(a.summary, 4000),
    methodology: s(a.methodology, 2000),
    digitalImportanceStatement: s(a.digitalImportanceStatement, 2000),
    overallSeverity: oneOf(a.overallSeverity, AUDIT_SEVERITY_VALUES, "MODERATE"),
    auditDate: s(a.auditDate, 30),
    findings,
  };

  return { organization, prospect, audit };
}
