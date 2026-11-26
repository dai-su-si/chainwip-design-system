import { createRoot } from "react-dom/client";
import "@fontsource-variable/noto-sans-jp";
import { DataTable, ThemeProvider, useColumnKinds } from "chainwip-design-system";
function Fixture() {
  const kinds = useColumnKinds();
  return (
    <div data-table-width-fixture="" style={{ width: 272, maxWidth: "100%", margin: "24px auto" }}>
      <DataTable
        rowKey="name"
        size="small"
        pagination={false}
        columns={[
          { ...kinds.long, title: "技術名", dataIndex: "name" },
          { ...kinds.short, title: "期間", dataIndex: "duration" },
        ]}
        dataSource={[
          { name: "Oracle Database", duration: "2年5ヶ月" },
          { name: "シェルスクリプト", duration: "10ヶ月" },
          { name: "ソフトウェア詳細設計", duration: "2年5ヶ月" },
        ]}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<ThemeProvider darkMode={false}><Fixture /></ThemeProvider>);
