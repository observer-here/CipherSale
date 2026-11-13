import { NextResponse } from "next/server";
import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";

export async function POST(req: Request) {
  const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
  const secret = process.env.PRIMUS_APP_SECRET;
  if (!appId || !secret) {
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_PRIMUS_APP_ID and PRIMUS_APP_SECRET on the server" },
      { status: 400 },
    );
  }
  const { request } = (await req.json()) as { request?: string };
  if (!request) return NextResponse.json({ error: "Missing request" }, { status: 400 });
  const sdk = new PrimusZKTLS();
  await sdk.init(appId, secret);
  const signed = await sdk.sign(request);
  return NextResponse.json({ signed });
}
