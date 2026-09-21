"use client";

import { useRef, useState } from "react";

export function ImageKitUploadButton({
  targetName,
  buttonLabel = "Upload image",
  multiple = false,
  appendMode = false,
  folder = "/uploads",
  onUrlsUploaded,
}: {
  targetName: string;
  buttonLabel?: string;
  multiple?: boolean;
  appendMode?: boolean;
  folder?: string;
  onUrlsUploaded?: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const applyUploadedUrls = (urls: string[]) => {
    if (onUrlsUploaded) {
      onUrlsUploaded(urls);
      return;
    }

    const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${targetName}"]`);
    if (!field) return;

    const existing = field.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const merged = Array.from(new Set([...existing, ...urls])).filter(Boolean);
    field.value = appendMode || multiple ? merged.join("\n") : urls[0] ?? "";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok || !result?.url) {
          throw new Error(result?.error || "Image upload failed");
        }

        uploadedUrls.push(result.url);
      }

      applyUploadedUrls(uploadedUrls);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn btn-light px-3 py-2 text-[0.65rem]"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : buttonLabel}
      </button>
    </>
  );
}
