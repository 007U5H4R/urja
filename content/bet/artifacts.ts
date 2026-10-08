/**
 * /bet/artifacts (TASK-32, EXE49): the written deliverables behind the prototype, one line each.
 * The Claude artifacts are private until the user shares them; the repo docs are public on GitHub.
 * The page states no research claim, so it has no source list, only ARTIFACTS_NOTE.
 */

export type ArtifactAccess = "shared" | "public";

export interface Artifact {
  id: string;
  title: string;
  /** One line: what it is. */
  description: string;
  format: string;
  /** https, on one of ARTIFACTS_ALLOWED_HOSTS (tested). */
  href: string;
  access: ArtifactAccess;
}

export const ARTIFACTS_ALLOWED_HOSTS = ["claude.ai", "github.com"] as const;

/** The status note each card shows. */
export const ARTIFACTS_ACCESS: Readonly<Record<ArtifactAccess, string>> = {
  shared: "Opens if shared with you",
  public: "Public",
};

/** The screen-reader cue on every link that opens a new tab. */
export const NEW_TAB_CUE = "(opens in a new tab)";

const REPO = "https://github.com/007U5H4R/urja/blob/main";

export const ARTIFACTS: readonly Artifact[] = [
  {
    id: "strategy",
    title: "Strategy doc",
    description: "Written answers to the brief's 7 questions.",
    format: "Document · Claude artifact",
    href: "https://claude.ai/code/artifact/7ca81168-46a7-4162-b641-d15605612d2c",
    access: "shared",
  },
  {
    id: "prd",
    title: "PRD",
    description: "The build spec: F1–F7 with acceptance criteria.",
    format: "Document · Claude artifact",
    href: "https://claude.ai/code/artifact/abaf6423-af39-4b33-96cd-183451b992b3",
    access: "shared",
  },
  {
    id: "deck",
    title: "Slide deck",
    description: "21 slides for the presentation, with a live-demo path.",
    format: "Slides · Claude artifact",
    href: "https://claude.ai/artifact/HJDpH4pfSCNyjrH8GwfWuX",
    access: "shared",
  },
  {
    id: "research",
    title: "Research report",
    description: "110 sources, mostly snippet-level and unverified.",
    format: "Markdown · GitHub",
    href: `${REPO}/docs/bet/research-report.md`,
    access: "public",
  },
  {
    id: "bet-spec",
    title: "Bet spec",
    description: "The frozen numbers and copy the prototype uses.",
    format: "Markdown · GitHub",
    href: `${REPO}/docs/bet/bet-spec.md`,
    access: "public",
  },
  {
    id: "decisions",
    title: "Decisions log",
    description: "Every build decision, numbered, with its reason.",
    format: "Markdown · GitHub",
    href: `${REPO}/decisions.md`,
    access: "public",
  },
];

/** The page's one-line note, in place of a source list. */
export const ARTIFACTS_NOTE = {
  text: "Research figures are unverified; see the research report.",
  linkText: "the research report",
  href: ARTIFACTS.find((a) => a.id === "research")!.href,
} as const;
