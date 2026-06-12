import { NextResponse } from "next/server";
import { getDataSourceHealth } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getDataSourceHealth());
}
