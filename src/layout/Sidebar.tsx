// サイドメニュー（雛形antd-adminのSider。992px未満ではDrawer）。上にロゴと名前、中にメニュー、下に利用者の欄。
// メニューの項目（menus）、今のパス（pathname）、
// 移る処理（onNavigate）、開閉の状態、アイコンの名前とlucideのアイコンの対応（iconFor）、利用者の欄（account）は使う側が渡す。
import { Menu, Layout, theme, Flex, Grid, Drawer, Button } from "antd";
import { useEffect, useMemo, useState } from "react";
import { CircleDashed, PanelLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MenuProps } from "antd";
import { UserMenu } from "./UserMenu";
import type { UserMenuUser } from "./UserMenu";
import { menuPathFor } from "./menu";
import type { MenuItem as MenuItemType } from "./menu";
import { useDesignValues } from "../theme/designValues";
import type { DesignValues } from "../theme/designValues";
import "./Sidebar.css";

const { Sider } = Layout;

type AntMenuItem = Required<MenuProps>["items"][number];
type BuildMenuResult = {
  items: AntMenuItem[];
  keyToPath: Record<string, string>;
  pathToKeyChain: Record<string, string[]>;
};

/** メニューのアイコンの名前から、lucideのアイコンを返す。対応がなければ undefined（丸の破線のアイコンを出す） */
export type MenuIconFor = (icon: string) => LucideIcon | undefined;

function renderMenuIcon(iconFor: MenuIconFor, icon: string | null, size: number) {
  const Icon = (icon && iconFor(icon)) || CircleDashed;
  return <Icon size={size} />;
}

function buildMenuItems(
  menus: MenuItemType[],
  iconFor: MenuIconFor,
  token: ReturnType<typeof theme.useToken>["token"],
  frame: DesignValues["frame"],
  collapsed: boolean,
  iconSize: number,
  parentKeys: string[] = [],
): BuildMenuResult {
  const sorted = menus.filter((m) => !m.hidden).sort((a, b) => a.sort - b.sort);
  const keyToPath: Record<string, string> = {};
  const pathToKeyChain: Record<string, string[]> = {};
  const items: AntMenuItem[] = [];

  for (const menu of sorted) {
    // メニューの名前は、使う側が渡したものをそのまま出す
    const label = menu.name;
    const key = menu.id;

    if (menu.kind === "group") {
      const built = buildMenuItems(menu.children, iconFor, token, frame, collapsed, iconSize, parentKeys);
      Object.assign(keyToPath, built.keyToPath);
      Object.assign(pathToKeyChain, built.pathToKeyChain);
      if (built.items.length > 0) {
        // 見出しの色: 25%は暗い背景で読めないため、antdのメニューの見出しの既定と同じ段にする
        items.push({
          type: "group",
          key,
          label: collapsed ? (
            <span
              style={{
                width: "100%",
                display: "inline-flex",
                justifyContent: "center",
              }}
            >
              <span
                aria-label={String(label)}
                style={{
                  width: frame.groupDotSize,
                  height: frame.groupDotSize,
                  borderRadius: "50%",
                  background: token.colorTextTertiary,
                  display: "inline-block",
                }}
              />
            </span>
          ) : (
            <span
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextTertiary,
              }}
            >
              {label}
            </span>
          ),
          children: built.items,
        });
      }
      continue;
    }

    const nextParents = [...parentKeys, key];
    keyToPath[key] = menu.path;
    const existing = pathToKeyChain[menu.path];
    if (!existing || nextParents.length > existing.length) {
      pathToKeyChain[menu.path] = nextParents;
    }

    let children: AntMenuItem[] | undefined;
    if (menu.children?.length) {
      const built = buildMenuItems(menu.children, iconFor, token, frame, collapsed, iconSize, nextParents);
      Object.assign(keyToPath, built.keyToPath);
      Object.assign(pathToKeyChain, built.pathToKeyChain);
      children = built.items.length ? built.items : undefined;
    }

    items.push({
      key,
      label,
      icon: renderMenuIcon(iconFor, menu.icon, iconSize),
      children,
    });
  }

  return { items, keyToPath, pathToKeyChain };
}

export type SidebarProps = {
  menus: MenuItemType[];
  /** 今のパス（メニューの選んだ状態を決める） */
  pathname: string;
  /** メニューの項目を押したときに、その項目のパスへ移る */
  onNavigate: (path: string) => void;
  iconFor: MenuIconFor;
  brandName: string;
  /** ロゴの画像。渡さなければロゴを出さず、畳んだときは開閉のボタンを常に出す */
  logoSrc?: string;
  /** 992px以上では畳んだ状態、992px未満ではDrawerを開いた状態（雛形と同じく1つの値を兼ねる） */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  /** 下の利用者の欄。onOpen は欄を押したときの処理（992px未満では、先にDrawerを閉じる） */
  account: { user: UserMenuUser | null; label: string; selected: boolean; onOpen: () => void };
};

export function Sidebar({
  menus,
  pathname,
  onNavigate,
  iconFor,
  brandName,
  logoSrc,
  collapsed,
  setCollapsed: setSidebarCollapsed,
  toggle: toggleSidebar,
  account,
}: SidebarProps) {
  const { token } = theme.useToken();
  const { frame } = useDesignValues();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const mobileOpen = collapsed;
  const builtMenu = useMemo(
    () => buildMenuItems(menus, iconFor, token, frame, !isMobile && collapsed, token.size),
    [menus, iconFor, token, frame, isMobile, collapsed, token.size],
  );
  const { selectedKey, routeOpenKeys } = useMemo(() => {
    // 詳細の画面でも、もとの一覧のメニューを選んだ状態にする
    const menuPath = menuPathFor(pathname, Object.keys(builtMenu.pathToKeyChain));
    const chain = (menuPath && builtMenu.pathToKeyChain[menuPath]) || [];
    return { selectedKey: chain.at(-1), routeOpenKeys: chain.slice(0, -1) };
  }, [builtMenu, pathname]);
  const routeOpenKeysSig = routeOpenKeys.join("\0");
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isMobile, setSidebarCollapsed]);

  /** Merge open keys required by the route with any submenu the user already expanded. */
  useEffect(() => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      for (const k of routeOpenKeys) next.add(k);
      return [...next];
    });
  }, [pathname, routeOpenKeysSig]);

  // 利用者の欄を押すと、使う側の基本情報の画面へ移る
  const openAccount = () => {
    if (isMobile) {
      setSidebarCollapsed(false);
    }
    account.onOpen();
  };

  const sidebarContent = (isCollapsed: boolean, omitBrandToggle = false) => (
    <Flex
      vertical
      style={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <Flex
        vertical
        justify="center"
        align={isCollapsed ? "center" : "stretch"}
        style={{
          paddingBlock: token.paddingSM,
          /* Collapsed rail is narrow: keep horizontal padding minimal so the brand box / icons are not clipped by Sider overflow. */
          paddingInline: isCollapsed ? token.paddingXXS : token.paddingSM,
          minHeight: frame.brandRowMinHeight,
          flexShrink: 0,
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Flex
          align="center"
          gap={token.marginSM}
          style={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            /* Collapsed: outer row already has paddingSM; extra inline padding would clip the brand box. */
            paddingInline: isCollapsed ? 0 : token.paddingXS,
            minHeight: frame.brandBoxSize,
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          {isCollapsed ? (
            <div
              className={logoSrc ? "sidebar-collapsed-brand" : "sidebar-collapsed-brand sidebar-collapsed-brand--noLogo"}
              style={{ width: `min(${frame.brandBoxSize}px, 100%)`, borderRadius: token.borderRadiusLG }}
            >
              {logoSrc ? (
                <div className="sidebar-collapsed-brand__logoLayer">
                  <img
                    src={logoSrc}
                    alt="logo"
                    width={frame.logoSize}
                    height={frame.logoSize}
                    style={{
                      borderRadius: token.borderRadius,
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : null}
              <div className="sidebar-collapsed-brand__toggleLayer">
                <Button
                  type="text"
                  size="small"
                  className="sidebar-collapsed-brand__toggle"
                  onClick={toggleSidebar}
                  icon={<PanelLeft size={token.size} />}
                  aria-label="サイドメニューの開閉"
                />
              </div>
            </div>
          ) : (
            <>
              <Flex
                align="center"
                gap={token.marginSM}
                style={{
                  minWidth: 0,
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="logo"
                    width={frame.logoSize}
                    height={frame.logoSize}
                    style={{
                      borderRadius: token.borderRadius,
                      display: "block",
                      flexShrink: 0,
                      objectFit: "contain",
                    }}
                  />
                ) : null}
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: token.fontWeightStrong,
                    fontSize: token.fontSizeLG,
                    textTransform: "uppercase",
                  }}
                >
                  {brandName}
                </div>
              </Flex>
              {!omitBrandToggle ? (
                <Button
                  type="text"
                  size="small"
                  onClick={toggleSidebar}
                  icon={<PanelLeft size={token.size} />}
                  aria-label="サイドメニューの開閉"
                  style={{ flexShrink: 0 }}
                />
              ) : null}
            </>
          )}
        </Flex>
      </Flex>
      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys as string[])}
        items={builtMenu.items}
        getPopupContainer={() => document.body}
        onClick={({ key }) => {
          const path = builtMenu.keyToPath[String(key)];
          if (!path) return;
          if (isMobile) {
            setSidebarCollapsed(false);
          }
          onNavigate(path);
        }}
        style={{
          borderRight: "none",
          flex: 1,
          minWidth: 0,
          maxWidth: "100%",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
          overflowY: "auto",
          background: "transparent",
        }}
      />
      <UserMenu
        collapsed={isCollapsed}
        user={account.user}
        label={account.label}
        selected={account.selected}
        onOpen={openAccount}
      />
    </Flex>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        placement="left"
        onClose={() => setSidebarCollapsed(false)}
        size={frame.drawerWidth}
        styles={{
          body: {
            padding: 0,
            background: token.colorBgLayout,
            overflow: "hidden",
            maxWidth: "100%",
            boxSizing: "border-box",
          },
          header: { display: "none" },
          mask: { opacity: frame.drawerMaskOpacity },
        }}
      >
        {sidebarContent(false, true)}
      </Drawer>
    );
  }

  return (
    <Sider
      key={collapsed ? "collapsed" : "expanded"}
      theme="light"
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={frame.sidebarWidth}
      collapsedWidth={frame.sidebarCollapsedWidth}
      breakpoint="lg"
      onBreakpoint={(broken) => {
        if (broken) {
          setSidebarCollapsed(false);
        }
      }}
      style={{
        borderRight: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        background: token.colorBgLayout,
        alignSelf: "stretch",
        minHeight: "100vh",
        overflow: "visible",
      }}
    >
      {sidebarContent(collapsed)}
    </Sider>
  );
}
