import Link from "next/link";

// The 404 page (technical-plan §3.3, TKT-03), in the ported page-head style.
export default function NotFound() {
  return (
    <main className="wrap" id="main">
      <section className="pagehead" aria-labelledby="h1">
        <div>
          <p className="greet">Page not found</p>
          <h1 className="verdict" id="h1">
            There’s no page at this address.
          </h1>
          {/* Not in .controls: the page head hides those on the phone. */}
          <Link className="btn btn-line mt-5" href="/">
            Back to Today
          </Link>
        </div>
      </section>
    </main>
  );
}
