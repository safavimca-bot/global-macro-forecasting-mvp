import type { Country, Indicator } from "./types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Global Macro Outlook AI";

export const COUNTRIES: Country[] = [
  {
    code: "US",
    wbCode: "USA",
    name: "United States",
    region: "North America",
    incomeGroup: "High income",
    currency: "USD",
    centralBank: "Federal Reserve",
    inflationTarget: 2,
    commodityExposure: "mixed"
  },
  {
    code: "CA",
    wbCode: "CAN",
    name: "Canada",
    region: "North America",
    incomeGroup: "High income",
    currency: "CAD",
    centralBank: "Bank of Canada",
    inflationTarget: 2,
    commodityExposure: "exporter"
  },
  {
    code: "EA",
    wbCode: "EMU",
    name: "Euro Area",
    region: "Europe",
    incomeGroup: "High income",
    currency: "EUR",
    centralBank: "European Central Bank",
    inflationTarget: 2,
    commodityExposure: "importer"
  },
  {
    code: "CN",
    wbCode: "CHN",
    name: "China",
    region: "East Asia",
    incomeGroup: "Upper middle income",
    currency: "CNY",
    centralBank: "People's Bank of China",
    inflationTarget: 3,
    commodityExposure: "importer"
  },
  {
    code: "JP",
    wbCode: "JPN",
    name: "Japan",
    region: "East Asia",
    incomeGroup: "High income",
    currency: "JPY",
    centralBank: "Bank of Japan",
    inflationTarget: 2,
    commodityExposure: "importer"
  },
  {
    code: "GB",
    wbCode: "GBR",
    name: "United Kingdom",
    region: "Europe",
    incomeGroup: "High income",
    currency: "GBP",
    centralBank: "Bank of England",
    inflationTarget: 2,
    commodityExposure: "importer"
  },
  {
    code: "DE",
    wbCode: "DEU",
    name: "Germany",
    region: "Europe",
    incomeGroup: "High income",
    currency: "EUR",
    centralBank: "European Central Bank",
    inflationTarget: 2,
    commodityExposure: "importer"
  },
  {
    code: "IN",
    wbCode: "IND",
    name: "India",
    region: "South Asia",
    incomeGroup: "Lower middle income",
    currency: "INR",
    centralBank: "Reserve Bank of India",
    inflationTarget: 4,
    commodityExposure: "importer"
  },
  {
    code: "BR",
    wbCode: "BRA",
    name: "Brazil",
    region: "Latin America",
    incomeGroup: "Upper middle income",
    currency: "BRL",
    centralBank: "Central Bank of Brazil",
    inflationTarget: 3,
    commodityExposure: "exporter"
  },
  {
    code: "MX",
    wbCode: "MEX",
    name: "Mexico",
    region: "Latin America",
    incomeGroup: "Upper middle income",
    currency: "MXN",
    centralBank: "Bank of Mexico",
    inflationTarget: 3,
    commodityExposure: "mixed"
  }
];

export const INDICATORS: Indicator[] = [
  {
    id: "GDP_GROWTH",
    name: "Real GDP growth",
    category: "growth",
    unit: "% y/y",
    frequency: "annual",
    source: "World Bank / national sources",
    description: "Real output growth, used as the main growth momentum anchor."
  },
  {
    id: "CPI",
    name: "Headline CPI inflation",
    category: "inflation",
    unit: "% y/y",
    frequency: "monthly",
    source: "BLS, FRED, World Bank, demo cache",
    description: "Headline consumer price inflation."
  },
  {
    id: "UNEMPLOYMENT",
    name: "Unemployment rate",
    category: "labor",
    unit: "%",
    frequency: "monthly",
    source: "BLS, FRED, World Bank, demo cache",
    description: "Labor-market slack indicator."
  },
  {
    id: "POLICY_RATE",
    name: "Policy rate",
    category: "monetary",
    unit: "%",
    frequency: "monthly",
    source: "Central banks, FRED, demo cache",
    description: "Primary short-term central bank policy rate."
  },
  {
    id: "YIELD_10Y",
    name: "10-year government yield",
    category: "market",
    unit: "%",
    frequency: "monthly",
    source: "FRED, market data, demo cache",
    description: "Long-term sovereign interest-rate signal."
  },
  {
    id: "DEBT_GDP",
    name: "Government debt-to-GDP",
    category: "fiscal",
    unit: "% of GDP",
    frequency: "annual",
    source: "World Bank / IMF / demo cache",
    description: "General government debt burden."
  },
  {
    id: "FISCAL_BALANCE",
    name: "Fiscal balance",
    category: "fiscal",
    unit: "% of GDP",
    frequency: "annual",
    source: "IMF / World Bank / demo cache",
    description: "Government budget balance as a share of GDP."
  },
  {
    id: "CURRENT_ACCOUNT",
    name: "Current account balance",
    category: "external",
    unit: "% of GDP",
    frequency: "annual",
    source: "World Bank / IMF / demo cache",
    description: "External funding balance."
  },
  {
    id: "FX_USD",
    name: "FX rate versus USD",
    category: "external",
    unit: "index",
    frequency: "monthly",
    source: "Central banks / market data / demo cache",
    description: "Currency level indexed to 100 at the start of the demo window."
  },
  {
    id: "OIL",
    name: "Crude oil",
    category: "commodity",
    unit: "USD/bbl",
    frequency: "monthly",
    source: "EIA / demo cache",
    description: "Oil price proxy used for energy shock analysis."
  },
  {
    id: "GAS",
    name: "Natural gas",
    category: "commodity",
    unit: "index",
    frequency: "monthly",
    source: "EIA / demo cache",
    description: "Natural gas price proxy."
  },
  {
    id: "COPPER",
    name: "Copper",
    category: "commodity",
    unit: "index",
    frequency: "monthly",
    source: "Market data / demo cache",
    description: "Industrial metals cycle proxy."
  },
  {
    id: "FOOD",
    name: "Food commodity index",
    category: "commodity",
    unit: "index",
    frequency: "monthly",
    source: "World Bank pink sheet / demo cache",
    description: "Food input cost pressure proxy."
  },
  {
    id: "WAGE_GROWTH",
    name: "Wage growth",
    category: "labor",
    unit: "% y/y",
    frequency: "monthly",
    source: "BLS / national sources / demo cache",
    description: "Nominal wage growth proxy."
  },
  {
    id: "CREDIT_GROWTH",
    name: "Private credit growth",
    category: "credit",
    unit: "% y/y",
    frequency: "quarterly",
    source: "BIS / national sources / demo cache",
    description: "Credit impulse and leverage-cycle proxy."
  },
  {
    id: "NPL",
    name: "Non-performing loans",
    category: "credit",
    unit: "% of loans",
    frequency: "annual",
    source: "World Bank / demo cache",
    description: "Banking-system asset-quality proxy."
  },
  {
    id: "RESERVES",
    name: "FX reserves",
    category: "external",
    unit: "index",
    frequency: "monthly",
    source: "IMF / national sources / demo cache",
    description: "Foreign-exchange reserve adequacy proxy."
  },
  {
    id: "EXTERNAL_DEBT",
    name: "External debt",
    category: "external",
    unit: "% of GDP",
    frequency: "annual",
    source: "World Bank / demo cache",
    description: "External liability burden proxy."
  }
];

export const DISCLAIMER =
  "Forecasts, classifications, and risk scores are for research, education, and decision-support only. They are not investment, legal, tax, or financial advice.";

export function getCountry(code: string) {
  return COUNTRIES.find((country) => country.code.toLowerCase() === code.toLowerCase());
}

export function getIndicator(id: string) {
  return INDICATORS.find((indicator) => indicator.id === id);
}
