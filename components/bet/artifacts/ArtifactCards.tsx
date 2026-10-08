import { StatusChip } from "@/components/ui/StatusChip";
import { ARTIFACTS_ACCESS, type Artifact } from "@/content/bet/artifacts";
import { ExternalLink } from "./ExternalLink";

export interface ArtifactCardsProps {
  artifacts: readonly Artifact[];
}

/**
 * TASK-32 (EXE49): one card per deliverable: its title, one line, its format, who can open it, and
 * a link that opens in a new tab. A Claude artifact opens only once the user has shared it.
 */
export function ArtifactCards({ artifacts }: ArtifactCardsProps) {
  return (
    <ul className="bet-artifact-list">
      {artifacts.map((a) => (
        <li key={a.id} className="panel bet-artifact">
          <h2>{a.title}</h2>
          <p className="bet-artifact-line">{a.description}</p>
          <p className="bet-artifact-meta">
            <span className="bet-artifact-format">{a.format}</span>
            <StatusChip tone={a.access === "public" ? "ok" : "wait"}>{ARTIFACTS_ACCESS[a.access]}</StatusChip>
          </p>
          <ExternalLink href={a.href} className="btn btn-line bet-artifact-link">
            Open the {a.title.toLowerCase().replace(/^prd$/, "PRD")}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
