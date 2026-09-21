"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ImageKitUploadButton } from "@/components/admin/imagekit-upload";

export function MediaUploadField({
  name,
  initialUrls,
  multiple = false,
  folder = "/uploads",
  buttonLabel = "Upload image",
}: {
  name: string;
  initialUrls?: string[];
  multiple?: boolean;
  folder?: string;
  buttonLabel?: string;
}) {
  const [urls, setUrls] = useState<string[]>(() => (initialUrls ?? []).filter(Boolean));

  const value = useMemo(() => urls.join("\n"), [urls]);

  const handleUploaded = (newUrls: string[]) => {
    setUrls((prev) => {
      const merged = multiple ? [...prev, ...newUrls] : newUrls;
      return Array.from(new Set(merged.filter(Boolean)));
    });
  };

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input type={multiple ? "hidden" : "hidden"} name={name} value={value} readOnly />
      {urls.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {urls.map((url, index) => (
            <div key={`${url}-${index}`} className="relative overflow-hidden rounded-sm border border-[#e2e6e2] bg-[#f8faf8]">
              <div className="relative aspect-[4/3] bg-[#eef1ee]">
                <Image src={url} alt={`Uploaded media ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 240px" className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[0.6rem] font-medium text-white hover:bg-black"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-[#d9ddd9] bg-[#fafbfa] px-4 py-8 text-center text-sm text-ink-soft">
          No image uploaded yet.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <ImageKitUploadButton
          targetName={name}
          multiple={multiple}
          buttonLabel={buttonLabel}
          folder={folder}
          onUrlsUploaded={handleUploaded}
        />
      </div>
    </div>
  );
}
