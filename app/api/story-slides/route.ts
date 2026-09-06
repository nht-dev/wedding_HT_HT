import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const SLIDE_FOLDERS = ["slide1", "slide2", "slide3"] as const;
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

export async function GET() {
  try {
    const slides = await Promise.all(
      SLIDE_FOLDERS.map(async (folder) => {
        const directory = path.join(process.cwd(), "public", "pictures", folder);
        const files = await readdir(directory, { withFileTypes: true });

        return files
          .filter(
            (file) =>
              file.isFile() && IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase())
          )
          .map((file) => `/pictures/${folder}/${encodeURIComponent(file.name)}`)
          .sort((first, second) => first.localeCompare(second));
      })
    );

    return NextResponse.json({ slides });
  } catch {
    return NextResponse.json({ slides: [[], [], []] }, { status: 500 });
  }
}
