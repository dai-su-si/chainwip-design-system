import { Col, Flex, Row } from "antd";
import type { ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";

export type PanelPageProps = { children: ReactNode };

/** パネル構成型の画面枠。操作は各パネルが持つ。 */
export function PanelPage({ children }: PanelPageProps) {
  const { pageGutter, betweenPanels } = useDesignValues().panel;
  return (
    <Row data-screen-type="panels" gutter={[pageGutter, pageGutter]}>
      <Col xs={24} xl={16}>
        <Flex data-panel-column="" vertical gap={betweenPanels}>{children}</Flex>
      </Col>
    </Row>
  );
}
