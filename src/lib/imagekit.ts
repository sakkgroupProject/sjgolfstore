import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

export function getImageKitClient() {
  const missing = [
    !process.env.IMAGEKIT_PUBLIC_KEY,
    !process.env.IMAGEKIT_PRIVATE_KEY,
    !process.env.IMAGEKIT_URL_ENDPOINT,
  ].some(Boolean);

  if (missing) {
    throw new Error("ImageKit environment variables are missing. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.");
  }

  return imagekit;
}

export async function uploadToImageKit(
  file: File | Blob,
  options: { folder?: string; fileName?: string } = {},
) {
  const client = getImageKitClient();
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const result = await client.upload({
    file: fileBuffer,
    fileName: options.fileName || `upload-${Date.now()}`,
    folder: options.folder || "/uploads",
    useUniqueFileName: true,
    tags: ["sj-golf-store"],
  });

  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
    width: result.width,
    height: result.height,
  };
}

export function imageKitUrl(path: string, transformations?: Record<string, string | number>) {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";
  if (!endpoint) return path;

  const url = new URL(path, endpoint);
  if (transformations) {
    Object.entries(transformations).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}
