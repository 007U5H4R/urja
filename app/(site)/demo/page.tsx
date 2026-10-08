import type { Metadata } from "next";
import { DemoGuide } from "@/components/demo/DemoGuide";
import { getDemoView } from "@/content/demo";
import { demoMetadata } from "@/lib/metadata";
import "@/components/demo/demo.css";

// TASK-33 (EXE49): the guided demo "Start the demo" opens on Why Urja. Static; not a nav destination.
export const metadata: Metadata = demoMetadata();

export default function DemoPage() {
  return <DemoGuide view={getDemoView()} />;
}
