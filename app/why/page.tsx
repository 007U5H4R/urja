import type { Metadata } from "next";
import { WhyEssay } from "@/components/why/WhyEssay";
import { quotes } from "@/content/field-notes";
import { getWhyView } from "@/content/why";
import { whyMetadata } from "@/lib/metadata";
import "@/components/why/why.css";

// TKT-08: final/why.html. TKT-09: the §9 title plus the full Open Graph and Twitter set.
export const metadata: Metadata = whyMetadata();

export default function WhyPage() {
  return <WhyEssay view={getWhyView()} quotes={quotes} />;
}
