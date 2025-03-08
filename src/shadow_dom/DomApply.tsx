import React from "react";
import { ShadowDom } from "./ShadowDom";
import SidePanel from "../components/SidePanel";

export function DomApply(): React.ReactElement | null {
  // Use document.body or a more specific element if needed
  const [parentElement] = React.useState(() => document.body);

  return parentElement ? (
    <ShadowDom parentElement={parentElement}>
      <SidePanel />
    </ShadowDom>
  ) : (
    <div>Error: Parent element not found</div>
  );
}
