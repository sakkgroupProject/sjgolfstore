import { NextResponse } from "next/server";
import { uploadToImageKit } from "@/lib/imagekit";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "/uploads");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const result = await uploadToImageKit(file, {
      folder,
      fileName: file.name,
    });

    return NextResponse.json({
      ok: true,
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
