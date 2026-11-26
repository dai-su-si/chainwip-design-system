import { Children, type ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";
import "./PanelGroup.css";

// 狭い列にパネルを詰め込まず、グループの利用可能幅で折り返す。
const MIN_PANEL_WIDTH_PX = 260;

export type PanelGroupProps = {
  /** 並べるパネルの数の上限。幅が足りない場合は自動で折り返す。 */
  columns?: 2 | 3;
  children: ReactNode;
};

/** 同じ行に並ぶパネルの高さを揃え、狭い画面では折り返す。 */
export function PanelGroup({ columns = 2, children }: PanelGroupProps) {
  const { betweenPanels } = useDesignValues().panel;
  const minWidth = `min(100%, max(${MIN_PANEL_WIDTH_PX}px, calc((100% - ${betweenPanels * (columns - 1)}px) / ${columns})))`;
  return (
    <div
      data-panel-group=""
      style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`, gap: betweenPanels }}
    >
      {Children.map(children, (child) => child == null || typeof child === "boolean" ? null : (
        <div data-panel-group-item="">{child}</div>
      ))}
    </div>
  );
}
