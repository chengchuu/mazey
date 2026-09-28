import type { ReactNode } from "react";

export interface ExamplePanelProps {
  id: string;
  labelledBy: string;
  active: boolean;
  children: ReactNode;
}

export function ExamplePanel({
  id,
  labelledBy,
  active,
  children,
}: ExamplePanelProps): React.JSX.Element {
  return (
    <div
      id={id}
      className={`tab-pane fade${active ? " show active" : ""}`}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={0}
      hidden={!active}
    >
      {children}
    </div>
  );
}
