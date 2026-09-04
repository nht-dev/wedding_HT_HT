import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const audioDirectory = path.join(process.cwd(), "public", "audio");
    const files = await readdir(audioDirectory, { withFileTypes: true });
    const tracks = files
      .filter((file) => file.isFile() && path.extname(file.name).toLowerCase() === ".mp3")
      .map((file) => `/audio/${encodeURIComponent(file.name)}`)
      .sort((first, second) => first.localeCompare(second));

    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] }, { status: 500 });
  }
}
