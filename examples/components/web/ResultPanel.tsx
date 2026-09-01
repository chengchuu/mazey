import type { ReactNode } from "react";

export interface ResultPanelProps {
  children: ReactNode;
}

export function ResultPanel({ children }: ResultPanelProps): React.JSX.Element {
  return (
    <div
      className="playground-output mt-3"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </div>
  );
}
