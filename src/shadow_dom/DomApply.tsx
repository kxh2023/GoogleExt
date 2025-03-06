import React from "react";
import { ShadowDom } from "./ShadowDom";
import SidePanel from "../components/SidePanel";

export function DomApply(): React.ReactElement | null {
  /*
  const [parentElement] = React.useState(() => {
    const el = document.getElementById("panel-outer-main");
    console.log("Found panel-outer-main:", el);
    return el;
  });
  */

  const [parentElement] = React.useState(() => document.body);

  return parentElement ? (
    <ShadowDom parentElement={parentElement}>
      <SidePanel />
    </ShadowDom>
  ) : (
    <div>Error: panel-outer-main not found</div>
  );
}
