import { Col, Flex, Row } from "antd";
import type { ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";

export type PanelPageProps = { children: ReactNode };

/** パネル構成型の画面枠。操作は各パネルが持つ。 */
export function PanelPage({ children }: PanelPageProps) {
  const { panel: { pageGutter, betweenPanels }, panelLayout: { preferredMinWidth } } = useDesignValues();
  // Col の幅には左右の gutter が含まれるため、本文に確保する幅に加える。
  const columnWidth = `max(min(100%, ${preferredMinWidth + pageGutter}px), 66.6666667%)`;
  return (
    <Row data-screen-type="panels" gutter={[pageGutter, pageGutter]}>
      <Col style={{ flex: "0 0 auto", width: columnWidth }}>
        <Flex data-panel-column="" vertical gap={betweenPanels}>{children}</Flex>
      </Col>
    </Row>
  );
}
