import { Component } from "react";

import type { ErrorInfo, ReactNode } from "react";

export interface PlaygroundErrorBoundaryProps {
  children: ReactNode;
}

interface PlaygroundErrorBoundaryState {
  failed: boolean;
}

export class PlaygroundErrorBoundary extends Component<
  PlaygroundErrorBoundaryProps,
  PlaygroundErrorBoundaryState
> {
  public state: PlaygroundErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): PlaygroundErrorBoundaryState {
    return { failed: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Mazey playground render failed.", error, info);
  }

  public render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="alert alert-danger" role="alert">
          The interactive playground could not be loaded. Reload the page or use
          the <a href="../api/">API documentation</a>.
        </div>
      );
    }
    return this.props.children;
  }
}
