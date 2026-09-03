import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const rsvpsFile = path.join(process.cwd(), "data", "rsvps.json");
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type Wish = {
  id: number;
  name: string;
  attendance: string;
  guests: string;
  message: string;
};

function configured() {
  return Boolean(supabaseUrl && supabaseKey);
}

async function readWishes(): Promise<Wish[]> {
  try {
    const file = await readFile(rsvpsFile, "utf8");
    return (JSON.parse(file) as { wishes?: Wish[] }).wishes ?? [];
  } catch {
    return [];
  }
}

async function saveWish(data: Omit<Wish, "id">) {
  const wishes = await readWishes();
  const wish = { id: Date.now(), ...data };
  await writeFile(
    rsvpsFile,
    JSON.stringify({ wishes: [...wishes, wish] }, null, 2),
    "utf8"
  );
  return wish;
}

async function readSupabaseWishes(): Promise<Wish[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rsvps?select=id,name,attendance,guests,message&order=created_at.asc`,
    {
      headers: {
        apikey: supabaseKey as string,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Unable to load RSVP wishes");
  return response.json();
}

export async function GET() {
  try {
    const wishes = configured() ? await readSupabaseWishes() : await readWishes();
    return NextResponse.json({ wishes });
  } catch {
    return NextResponse.json({ error: "Không thể tải lời chúc." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    const data = await request.json();
    const wishData = {
      name: String(data.name ?? ""),
      attendance: String(data.attendance ?? ""),
      guests: String(data.guests ?? "1"),
      message: String(data.message ?? ""),
    };
    let wish: Wish;

    if (configured()) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rsvps`, {
        method: "POST",
        headers: {
          apikey: supabaseKey as string,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(wishData),
      });
      if (!response.ok) throw new Error("Unable to save RSVP wish");
      [wish] = await response.json();
    } else {
      wish = await saveWish(wishData);
    }

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => undefined);
    }

    return NextResponse.json({ saved: true, wish });
  } catch {
    return NextResponse.json(
      { error: "Không thể gửi xác nhận lúc này." },
      { status: 500 }
    );
  }
}
