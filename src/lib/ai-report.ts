import { DISCLAIMER } from "./constants";
import { formatPercent, latestValue, riskLabel } from "./format";
import type { Country, MacroRegime, Observation, RiskScore } from "./types";

interface ReportOptions {
  useOpenAI?: boolean;
}

function deterministicReport(country: Country, observations: Observation[], scores: RiskScore, regime: MacroRegime) {
  const gdp = latestValue(observations, "GDP_GROWTH");
  const cpi = latestValue(observations, "CPI");
  const unemployment = latestValue(observations, "UNEMPLOYMENT");
  const policyRate = latestValue(observations, "POLICY_RATE");
  const fiscalBalance = latestValue(observations, "FISCAL_BALANCE");
  const currentAccount = latestValue(observations, "CURRENT_ACCOUNT");
  const timestamp = observations.at(-1)?.lastUpdated ?? "No timestamp available";

  return [
    `Executive summary: ${country.name} is classified as ${regime.regime.toLowerCase()} with ${Math.round(
      regime.confidence * 100
    )}% confidence. Overall macro risk is ${riskLabel(scores.overallRisk).toLowerCase()} at ${scores.overallRisk}/100.`,
    `Growth outlook: Latest real GDP growth is ${formatPercent(gdp)}. The growth-momentum risk score is ${scores.growthMomentum}/100, so the dashboard treats weak growth as ${
      scores.growthMomentum >= 55 ? "an active watch item" : "contained for now"
    }.`,
    `Inflation outlook: CPI inflation is ${formatPercent(cpi)} versus a ${formatPercent(country.inflationTarget)} policy target. Inflation-pressure risk is ${scores.inflationPressure}/100.`,
    `Labor-market outlook: Unemployment is ${formatPercent(unemployment)}. Labor conditions are interpreted together with growth and wage pressure, not as a standalone forecast.`,
    `Monetary-policy outlook: The policy-rate proxy is ${formatPercent(policyRate)}. Monetary-tightness risk is ${scores.monetaryTightness}/100, reflecting the real-rate and yield-curve signals in the demo cache.`,
    `Fiscal risk: The fiscal-balance proxy is ${formatPercent(fiscalBalance)} of GDP and the fiscal-stress score is ${scores.fiscalStress}/100.`,
    `External vulnerability: The current-account proxy is ${formatPercent(currentAccount)} of GDP and the external-vulnerability score is ${scores.externalVulnerability}/100.`,
    `Key risks: The highest risk buckets are intended to guide research triage, not trading decisions. Missing or stale indicators should be reviewed before relying on the signal.`,
    `Data limitations: This report is generated from retrieved or demo-cache indicators only. Data timestamp: ${timestamp}. ${DISCLAIMER}`
  ].join("\n\n");
}

function buildPrompt(country: Country, observations: Observation[], scores: RiskScore, regime: MacroRegime) {
  const compactIndicators = ["GDP_GROWTH", "CPI", "UNEMPLOYMENT", "POLICY_RATE", "DEBT_GDP", "FISCAL_BALANCE", "CURRENT_ACCOUNT"]
    .map((indicatorId) => `${indicatorId}: ${latestValue(observations, indicatorId) ?? "missing"}`)
    .join("\n");

  return `Write a concise macroeconomic country outlook for ${country.name}.
Use only these indicators and scores. Mention missing data clearly. Do not give investment advice.

Indicators:
${compactIndicators}

Scores:
${JSON.stringify(scores, null, 2)}

Regime:
${regime.regime} - ${regime.explanation}

Required sections: Executive summary, Growth outlook, Inflation outlook, Labor market, Monetary policy, Fiscal risk, External vulnerability, Key risks, Data limitations, Disclaimer.`;
}

function extractOpenAIText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: string }> }> };

  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  return record.output?.flatMap((item) => item.content?.map((content) => content.text).filter(Boolean) ?? []).join("\n");
}

export async function generateCountryReport(
  country: Country,
  observations: Observation[],
  scores: RiskScore,
  regime: MacroRegime,
  options: ReportOptions = {}
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || options.useOpenAI === false) {
    return deterministicReport(country, observations, scores, regime);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: buildPrompt(country, observations, scores, regime),
        max_output_tokens: 900
      })
    });

    if (!response.ok) {
      return deterministicReport(country, observations, scores, regime);
    }

    const text = extractOpenAIText(await response.json());
    return text?.trim() || deterministicReport(country, observations, scores, regime);
  } catch {
    return deterministicReport(country, observations, scores, regime);
  }
}
