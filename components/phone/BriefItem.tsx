import Link from "next/link";
import type { BriefItemCopy } from "@/lib/brief/template";
import type { Lang } from "@/lib/data/types";
import { Confidence } from "@/components/ui/Confidence";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";

/** One flagged trip on the brief (final/brief.html `a.panel.item`); the whole card opens the trip. */
export function BriefItem({ item, lang, first }: { item: BriefItemCopy; lang: Lang; first: boolean }) {
  return (
    <Link className={first ? "panel item first" : "panel item"} href={item.href}>
      <Plate plate={item.plate} />
      <Money className="amt" tone="loss" inr={item.inr} />
      <span className="txt">{item.text}</span>
      <span className="foot">
        <Confidence level={item.confidence} lang={lang} />
        <span>{item.status}</span>
        <span className="go">
          <span>{item.go}</span>
          <Icon name="right" />
        </span>
      </span>
    </Link>
  );
}
