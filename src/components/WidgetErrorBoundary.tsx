import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Isolates one live widget so its crash doesn't blank the whole page. */
export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[widget:${this.props.name}] crashed:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="mb-2">{this.props.name} couldn't load.</p>
          <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false })}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
