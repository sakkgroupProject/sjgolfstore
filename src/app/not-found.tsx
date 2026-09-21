import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-4xl md:text-5xl">This fairway does not exist</h1>
      <p className="max-w-md text-sm text-ink-soft">
        The page you are looking for has moved or never existed. Try the shop, or search for what you need.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">Shop all equipment</Link>
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </div>
  );
}
