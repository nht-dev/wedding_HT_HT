import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const rsvpsFile = path.join(process.cwd(), "data", "rsvps.json");

type Wish = {
  id: number;
  name: string;
  attendance: string;
  guests: string;
  message: string;
};

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

export async function GET() {
  return NextResponse.json({ wishes: await readWishes() });
}

export async function POST(request: Request) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    const data = await request.json();
    const wish = await saveWish({
      name: String(data.name ?? ""),
      attendance: String(data.attendance ?? ""),
      guests: String(data.guests ?? "1"),
      message: String(data.message ?? ""),
    });

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
