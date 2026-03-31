import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="emptyStatePage">
      <div className="emptyPanel">
        <p className="eyebrow">Missing presentation</p>
        <h1>That presentation could not be found.</h1>
        <p>Check the slug, or return to the dashboard to choose an available presentation.</p>
        <Link href="/" className="ghostButton">Back to dashboard</Link>
      </div>
    </main>
  );
}
