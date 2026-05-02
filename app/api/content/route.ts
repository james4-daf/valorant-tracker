import { NextResponse } from "next/server";

import { getContent, RiotApiError } from "@/lib/riot/client";
import { riotErrorHttpStatus } from "@/lib/riot/http-status";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shard = searchParams.get("shard")?.trim() ?? "na";
  const locale = searchParams.get("locale")?.trim() ?? "en-US";

  try {
    const content = await getContent(shard, locale);
    return NextResponse.json(content);
  } catch (e) {
    if (e instanceof RiotApiError) {
      const status = riotErrorHttpStatus(e.status);
      return NextResponse.json(
        { error: e.message, detail: e.body },
        { status },
      );
    }
    throw e;
  }
}
