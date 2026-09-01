import { PlaygroundErrorBoundary } from "./PlaygroundErrorBoundary";
import { PlaygroundTabs } from "./PlaygroundTabs";

export function PlaygroundApp(): React.JSX.Element {
  return (
    <PlaygroundErrorBoundary>
      <PlaygroundTabs />
    </PlaygroundErrorBoundary>
  );
}
