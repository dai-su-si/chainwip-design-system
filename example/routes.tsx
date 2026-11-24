import { BookOpen, Info, SquarePen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { MenuItem } from "chainwip-design-system";
import { AboutPage } from "./AboutPage";
import { BooksPage } from "./BooksPage";
import { FieldsPage } from "./FieldsPage";
import { ManagedBooksPage } from "./ManagedBooksPage";

export const booksPath = "/books";
export const aboutPath = "/about";
export const managedBooksPath = "/managed-books";

type RouteContext = { url: URL; navigate: (path: string, replace?: boolean) => void };
type Route = { path: string; label: string; icon: LucideIcon; render: (context: RouteContext) => ReactNode };

export const routes: readonly Route[] = [
  { path: booksPath, label: "図書", icon: BookOpen, render: () => <BooksPage /> },
  { path: aboutPath, label: "この例について", icon: Info, render: ({ navigate }) => <AboutPage onOpenBooks={() => navigate(booksPath)} /> },
  { path: "/fields", label: "入力の例", icon: SquarePen, render: () => <FieldsPage /> },
  {
    path: managedBooksPath,
    label: "標準一覧",
    icon: BookOpen,
    render: ({ url, navigate }) => (
      <ManagedBooksPage scenarioParam={url.searchParams.get("state")} onRetry={() => navigate(managedBooksPath, true)} />
    ),
  },
];

export const menus: MenuItem[] = routes.map(({ path, label }, index) => ({
  id: path,
  kind: "item",
  name: label,
  path,
  icon: path,
  permissions: null,
  sort: index,
  hidden: false,
  children: null,
}));

export function routeFor(path: string) {
  return routes.find((route) => route.path === path);
}

export function iconFor(path: string) {
  return routeFor(path)?.icon;
}
