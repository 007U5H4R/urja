/**
 * A static skeleton of Today (final/states.html, loading): a heading, the verdict,
 * the ledger bar and two eyes rows. No shimmer, no figures. Decorative only.
 *
 * Used by the ?state=loading specimen. Today has no route loading.tsx on purpose:
 * any loading boundary above the page makes Next stream its fallback first and ship
 * the prerendered page inside <div hidden> until an inline script swaps it in (LCP,
 * and no content without scripts); at app/loading.tsx it would also turn /trips'
 * 307 into a client redirect and hide /message's and /brief's first paint (TC-027).
 */
export function TodaySkeleton() {
  return (
    <div aria-hidden="true" aria-busy="true" data-skeleton="today">
      <span className="sk" style={{ width: "38%", height: 12 }}></span>
      <span className="sk" style={{ width: "90%", height: 28, marginTop: 14 }}></span>
      <span className="sk" style={{ width: "62%", height: 28, marginTop: 8 }}></span>
      <span className="sk" style={{ width: "100%", height: 10, marginTop: 20 }}></span>
      <div className="sk-rows">
        <div className="sk-row">
          <span className="sk dot"></span>
          <span className="sk pl"></span>
          <span className="sk ln"></span>
          <span className="sk am"></span>
          <span className="sk ln2"></span>
        </div>
        <div className="sk-row">
          <span className="sk dot"></span>
          <span className="sk pl"></span>
          <span className="sk ln"></span>
          <span className="sk am"></span>
          <span className="sk ln2" style={{ width: "64%" }}></span>
        </div>
      </div>
    </div>
  );
}
