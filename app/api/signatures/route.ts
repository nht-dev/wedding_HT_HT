import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const signaturesFile = path.join(process.cwd(), "data", "signatures.json");

type Signature = {
  id: number;
  data: string;
  x: number;
  y: number;
  scale: number;
};

function configured() {
  return Boolean(supabaseUrl && supabaseKey);
}

async function readLocalSignatures(): Promise<Signature[]> {
  try {
    const file = await readFile(signaturesFile, "utf8");
    const result = JSON.parse(file) as { signatures?: Signature[] };
    return result.signatures ?? [];
  } catch {
    return [];
  }
}

async function writeLocalSignature(signature: Omit<Signature, "id">) {
  const signatures = await readLocalSignatures();
  const saved = { id: Date.now(), ...signature };
  await writeFile(
    signaturesFile,
    JSON.stringify({ signatures: [...signatures, saved] }, null, 2),
    "utf8"
  );
  return saved;
}

export async function GET() {
  if (!configured()) {
    return NextResponse.json({ signatures: await readLocalSignatures(), configured: false });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/signatures?select=id,data,x,y,scale&order=created_at.asc`,
    {
      headers: {
        apikey: supabaseKey as string,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Không thể tải chữ ký." }, { status: 502 });
  }

  return NextResponse.json({ signatures: await response.json(), configured: true });
}

export async function POST(request: Request) {
  if (!configured()) {
    const body = await request.json();
    const signature = await writeLocalSignature({
      data: body.data,
      x: body.x,
      y: body.y,
      scale: body.scale,
    });
    return NextResponse.json({ signature }, { status: 201 });
  }

  const body = await request.json();
  const response = await fetch(`${supabaseUrl}/rest/v1/signatures`, {
    method: "POST",
    headers: {
      apikey: supabaseKey as string,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      data: body.data,
      x: body.x,
      y: body.y,
      scale: body.scale,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Không thể lưu chữ ký." }, { status: 502 });
  }

  const [signature] = await response.json();
  return NextResponse.json({ signature }, { status: 201 });
}
