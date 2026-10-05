"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches a failed load of the scene wrapper's chunk (next/dynamic throws it into render), so a
 * network blip keeps the poster instead of taking the Today page to its error screen.
 */
export class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
