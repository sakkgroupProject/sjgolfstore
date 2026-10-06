"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import { contactAction } from "@/app/actions/marketing";
import { ImageKitUploadButton } from "@/components/admin/imagekit-upload";
import { useSearchParams } from "next/navigation";

const PRODUCT_TYPES = [
  { id: "Caps", label: "Caps", minQty: 50 },
  { id: "Golf Balls", label: "Golf Balls", minQty: 100 },
  { id: "Bucket Hats", label: "Bucket Hats", minQty: 50 },
  { id: "Kick Back", label: "Kick Back", minQty: 10 },
  { id: "Head Covers", label: "Head Covers", minQty: 10 },
  { id: "Iron Covers", label: "Iron Covers", minQty: 10 },
  { id: "Putter Covers", label: "Putter Covers", minQty: 10 },
];

function QuotationFormInner() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(contactAction, null);
  const [productType, setProductType] = useState(PRODUCT_TYPES[0].id);
  const [quantity, setQuantity] = useState<number | "">(PRODUCT_TYPES[0].minQty);
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    const modelParam = searchParams.get("model");
    const imageParam = searchParams.get("image");

    if (typeParam) {
      const match = PRODUCT_TYPES.find((t) => t.id.toLowerCase() === typeParam.toLowerCase());
      if (match) {
        setProductType(match.id);
        setQuantity(match.minQty);
        setIsLocked(true);
      }
    }
    if (modelParam) {
      setModel(modelParam);
    }
    if (imageParam) {
      setProductImageUrl(imageParam);
    }
  }, [searchParams]);

  const selectedType = PRODUCT_TYPES.find((t) => t.id === productType) || PRODUCT_TYPES[0];

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = PRODUCT_TYPES.find((t) => t.id === e.target.value);
    if (newType) {
      setProductType(newType.id);
      if (Number(quantity) < newType.minQty) {
        setQuantity(newType.minQty);
      }
    }
  };

  const compiledMessage = `
Quantity: ${quantity}
Model: ${model}
Color: ${color}
Logo URL: ${logoUrl || "No logo uploaded"}
Additional Notes: ${notes}
  `.trim();

  const fieldError = (name: string) => state?.errors?.[name];
  
  return (
    <div className="flex flex-col gap-8">
      {productImageUrl && model ? (
        <div className="flex items-center gap-5 rounded-xl border border-forest/10 bg-forest/5 p-4 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white border border-line">
            <img src={productImageUrl} alt={model} className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft">Requesting bulk quote for</p>
            <h3 className="mt-0.5 text-xl font-medium text-forest">{model}</h3>
          </div>
        </div>
      ) : null}

      <form action={action} className="grid gap-6 sm:grid-cols-2">
      <div>
        <label className="label mb-2 block">Full Name</label>
        <input name="name" className="field" autoComplete="name" required maxLength={80} />
        {fieldError("name") ? <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p> : null}
      </div>
      <div>
        <label className="label mb-2 block">Email Address</label>
        <input name="email" type="email" className="field" autoComplete="email" required />
        {fieldError("email") ? <p className="mt-1 text-xs text-red-600">{fieldError("email")}</p> : null}
      </div>

      <div>
        <label className="label mb-2 block">Product Type</label>
        <select disabled={isLocked} name="subject" value={`Quotation: ${productType}`} onChange={(e) => {
           const val = e.target.value.replace("Quotation: ", "");
           const event = { target: { value: val } } as any;
           handleTypeChange(event);
        }} className={`field ${isLocked ? "bg-gray-50 text-ink-soft cursor-not-allowed" : "bg-white"}`}>
          {PRODUCT_TYPES.map((t) => (
            <option key={t.id} value={`Quotation: ${t.id}`}>{t.label}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="label mb-2 block">
          Quantity <span className="text-xs text-ink-soft font-normal">(Min: {selectedType.minQty})</span>
        </label>
        <input 
          type="number" 
          min={selectedType.minQty}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
          className="field" 
          required
        />
      </div>

      <div>
        <label className="label mb-2 block">Model / Style</label>
        <input required value={model} onChange={(e) => setModel(e.target.value)} type="text" className="field" placeholder="e.g. Blade, Mallet" />
      </div>

      <div>
        <label className="label mb-2 block">Color Preferences</label>
        <select required value={color} onChange={(e) => setColor(e.target.value)} className="field bg-white">
          <option value="" disabled>Select a color</option>
          <option value="White">White</option>
          <option value="Black">Black</option>
          <option value="Navy">Navy</option>
          <option value="Red">Red</option>
          <option value="Yellow">Yellow</option>
          <option value="Green">Green</option>
          <option value="Custom">Custom / Multiple (Specify in Notes)</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="label mb-2 block">Club / Event Logo Upload</label>
        <div 
          className={`flex flex-col items-center justify-center w-full min-h-[140px] rounded-lg border-2 border-dashed border-[#d9ddd9] bg-[#f8faf8] p-6 text-center transition hover:bg-[#f1f4f1] ${logoUrl ? "" : "cursor-pointer"}`}
          onClick={(e) => {
            if (!logoUrl) {
              const btn = e.currentTarget.querySelector('button');
              if (btn && e.target !== btn) btn.click();
            }
          }}
        >
          {logoUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-20 w-32">
                <img src={logoUrl} alt="Uploaded logo preview" className="h-full w-full object-contain" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-forest font-medium">Logo uploaded successfully!</span>
                <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <>
              <svg className="mb-3 h-8 w-8 text-ink-soft opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="mb-4 text-sm text-ink-soft">Upload your club or event logo in high resolution (PNG, JPG)</p>
              <ImageKitUploadButton 
                targetName="logoUpload" 
                buttonLabel="Select Logo File" 
                folder="/custom-orders"
                onUrlsUploaded={(urls) => setLogoUrl(urls[0])}
              />
            </>
          )}
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="label mb-2 block">Additional Notes</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="field" placeholder="Any extra details?" />
      </div>

      <input type="hidden" name="message" value={compiledMessage} />

      {state ? (
        <p className={`sm:col-span-2 px-3 py-2 text-sm ${state.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
      <button disabled={pending || Number(quantity) < selectedType.minQty} className="btn btn-dark sm:col-span-2 sm:w-auto sm:px-10">
        {pending ? "Submitting..." : "Request Quotation"}
      </button>
    </form>
    </div>
  );
}

export function QuotationForm() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-ink-soft">Loading form...</div>}>
      <QuotationFormInner />
    </Suspense>
  );
}
