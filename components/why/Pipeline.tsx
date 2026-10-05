import type { PipeNode } from "@/content/why";

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const word = (n: number) => WORDS[n] ?? String(n);
const exists = (n: number) => `${word(n)} ${n === 1 ? "part exists" : "parts exist"}`;
const isNew = (n: number) => `${word(n)} ${n === 1 ? "is" : "are"} new`;

/** Chapter 04's pipeline (final/why.html lines 209–216): glowing nodes, thin connectors; only the new part is lit. */
export function Pipeline({ nodes }: { nodes: readonly PipeNode[] }) {
  const fresh = nodes.filter((n) => n.isNew).length;
  const exist = nodes.length - fresh;
  return (
    <ol
      className="pipe"
      aria-label={`From the truck to the owner’s WhatsApp: ${exists(exist)}, ${isNew(fresh)}`}
    >
      {nodes.map((n) => (
        <li key={n.name} className={n.isNew ? "node new" : "node"}>
          <span className="st">{n.isNew ? "new" : "exists"}</span>
          <b>{n.name}</b>
          <small>{n.detail}</small>
        </li>
      ))}
    </ol>
  );
}
