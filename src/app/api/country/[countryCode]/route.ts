import { NextResponse } from "next/server";
import { getCountryMacroView } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { countryCode: string } }) {
  const view = await getCountryMacroView(params.countryCode, { useOpenAI: false });

  if (!view) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  return NextResponse.json(view);
}
