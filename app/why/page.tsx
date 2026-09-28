import type { Metadata } from "next";
import { WhyEssay } from "@/components/why/WhyEssay";
import { quotes } from "@/content/field-notes";
import { getWhyView, WHY_TITLE } from "@/content/why";
import "@/components/why/why.css";

// TKT-08: final/why.html. TKT-09 adds the full Open Graph and Twitter set.
export const metadata: Metadata = {
  title: { absolute: WHY_TITLE },
};

export default function WhyPage() {
  return <WhyEssay view={getWhyView()} quotes={quotes} />;
}
