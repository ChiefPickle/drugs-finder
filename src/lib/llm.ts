import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { Drug, DrugInfo, DrugEnrichment } from "@/types/drug";

export type LLMProvider = "openai" | "anthropic";

export function resolveLLMProvider(): LLMProvider | null {
  const configured = process.env.LLM_PROVIDER?.toLowerCase();
  if (configured === "openai" || configured === "anthropic") return configured;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function buildPrompt(drug: Drug, locale: "he" | "en"): string {
  const language = locale === "he" ? "Hebrew" : "English";
  return `You are a clinical assistant helping Israeli physicians.
Provide concise, accurate information about this prescription drug from the Israeli formulary.
Respond in ${language}. Use plain language suitable for quick reference during prescribing.

Drug name: ${drug.name}
Manufacturer: ${drug.manufacturer || "unknown"}
Package size: ${drug.packageSize}
Formulary code: ${drug.code}

Return JSON only with these exact keys:
{
  "summary": "2-3 sentence overview",
  "indications": "main indications",
  "dosage": "typical adult dosing (note if approximate)",
  "warnings": "key contraindications, interactions, or monitoring"
}`;
}

export async function generateDrugInfo(
  drug: Drug,
  locale: "he" | "en" = "en"
): Promise<Omit<DrugInfo, "drugId" | "generatedAt">> {
  const provider = resolveLLMProvider();
  if (!provider) {
    throw new Error("No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  const prompt = buildPrompt(drug, locale);
  const systemMessage =
    "You are a medical reference assistant. Always respond with valid JSON only. Include a disclaimer that info is for reference and not a substitute for clinical judgment.";

  let content: string;

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemMessage,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content.find((part) => part.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty LLM response");
    content = block.text;
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    content = completion.choices[0]?.message?.content || "";
    if (!content) throw new Error("Empty LLM response");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content) as Omit<
    DrugInfo,
    "drugId" | "generatedAt"
  >;

  return {
    summary: parsed.summary || "",
    indications: parsed.indications || "",
    dosage: parsed.dosage || "",
    warnings: parsed.warnings || "",
  };
}

export function getLLMStatusMessage(): string {
  const provider = resolveLLMProvider();
  if (!provider) {
    return "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local to enable AI drug summaries.";
  }
  return `Using ${provider === "anthropic" ? "Claude" : "OpenAI"} for drug summaries.`;
}

function buildEnrichmentPrompt(drug: Drug, locale: "he" | "en"): string {
  const language = locale === "he" ? "Hebrew" : "English";
  return `You are a clinical assistant helping Israeli physicians.
Extract structured prescribing reference data for this formulary drug.
Respond in ${language}.

Drug name: ${drug.name}
Manufacturer: ${drug.manufacturer || "unknown"}
Package size: ${drug.packageSize}
Formulary code: ${drug.code}

Return JSON only with these exact keys:
{
  "form": "dosage form e.g. tablet, capsule, syrup",
  "strength": "active ingredient strength e.g. 500 mg",
  "shortDescription": "one concise clinical sentence for formulary selection"
}`;
}

async function callLLMJson(
  prompt: string,
  systemMessage: string
): Promise<string> {
  const provider = resolveLLMProvider();
  if (!provider) {
    throw new Error("No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemMessage,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((part) => part.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty LLM response");
    return block.text;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  const content = completion.choices[0]?.message?.content || "";
  if (!content) throw new Error("Empty LLM response");
  return content;
}

export async function generateDrugEnrichment(
  drug: Drug,
  locale: "he" | "en" = "en"
): Promise<Omit<DrugEnrichment, "drugId" | "updatedAt">> {
  const prompt = buildEnrichmentPrompt(drug, locale);
  const systemMessage =
    "You are a medical reference assistant. Always respond with valid JSON only.";
  const content = await callLLMJson(prompt, systemMessage);
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content) as {
    form?: string;
    strength?: string;
    shortDescription?: string;
  };

  return {
    form: parsed.form || "",
    strength: parsed.strength || "",
    shortDescription: parsed.shortDescription || "",
    locale,
    source: "llm",
  };
}
