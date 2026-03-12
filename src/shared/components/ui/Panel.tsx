import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
}

export function Panel({ children }: PanelProps) {
  return <div className="ui-panel">{children}</div>;
}
