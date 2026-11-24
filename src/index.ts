// chainwip-design-system の入口。使う側は "chainwip-design-system" からだけ import する（中のファイルの場所は変わりうる）。

// テーマ
export { ThemeProvider } from "./theme/ThemeProvider";
export type { ThemeProviderProps } from "./theme/ThemeProvider";
export { Theme as ThemeIcon } from "./icons/Theme";

// 画面の枠
export { AppShell } from "./layout/AppShell";
export type { AppShellProps } from "./layout/AppShell";
export { Sidebar } from "./layout/Sidebar";
export type { SidebarProps, MenuIconFor } from "./layout/Sidebar";
export { Header } from "./layout/Header";
export type { HeaderProps, RenderCrumbLink } from "./layout/Header";
export { UserMenu } from "./layout/UserMenu";
export type { UserMenuProps, UserMenuUser } from "./layout/UserMenu";
export { normalizeAppPath, menuPathFor } from "./layout/menu";
export type { MenuItem, Crumb } from "./layout/menu";

// 標準の一覧管理画面
export { ManagedListPage } from "./list/ManagedListPage";
export type {
  ManagedListPageProps,
  ManagedListColumn,
  ManagedListData,
  ManagedListFilter,
  ManagedListRowAction,
  ManagedListSort,
} from "./list/ManagedListPage";

// 既存の一覧部品
export { DataTable } from "./list/DataTable";
export type { DataTableProps } from "./list/DataTable";
export { DataTableEmpty } from "./list/DataTableEmpty";
export { DataTableSkeleton } from "./list/DataTableSkeleton";
export type { DataTableSkeletonProps } from "./list/DataTableSkeleton";
export { ACTIONS_COLUMN_PRIORITY, useColumnKinds, useMinTableWidth } from "./list/columnKinds";
export { rowOpenColumn } from "./list/rowOpenColumn";
export { PillTag, PillTagList } from "./list/PillTag";
export type { PillTagItem } from "./list/PillTag";
export { AddButton } from "./list/AddButton";
export type { AddButtonProps } from "./list/AddButton";

// パネル構成型の画面枠とパネル
export { PanelPage } from "./edit/PanelPage";
export type { PanelPageProps } from "./edit/PanelPage";
export { HeadedCard } from "./edit/HeadedCard";
export type { HeadedCardProps } from "./edit/HeadedCard";
export { ActionPanel } from "./edit/ActionPanel";
export type { ActionPanelProps, ActionItem } from "./edit/ActionPanel";
export { PanelSaveButton } from "./edit/PanelSaveButton";
export { BaseFormModal } from "./edit/FormModal";
export type { BaseFormModalProps } from "./edit/FormModal";
export { useFormDialog } from "./edit/useFormDialog";
export type { FormDialog } from "./edit/useFormDialog";

// 欄
// 原子の欄（入力のパネルの中身は、この12種類を上から並べるだけで作る）
export { TextField, TextAreaField, CheckField, DateField, NumberField, DisplayField } from "./fields/basicFields";
export type {
  TextFieldProps,
  TextAreaFieldProps,
  CheckFieldProps,
  DateFieldProps,
  NumberFieldProps,
  DisplayFieldProps,
} from "./fields/basicFields";
export { SelectField } from "./fields/SelectField";
export type { SelectFieldProps, SelectOption, CheckColumns, CheckColumnCount } from "./fields/SelectField";
export { RangeField, RangeListField } from "./fields/rangeFields";
export type {
  RangeFieldProps,
  RangeSide,
  RangeCheck,
  RangeListFieldProps,
  RangeListSide,
  RangeRow,
} from "./fields/rangeFields";
export { TagCloudField, ImageChoiceField } from "./fields/choiceFields";
export type { TagCloudFieldProps, TagCloudAdapter, ImageChoiceFieldProps } from "./fields/choiceFields";
export { WordListField } from "./fields/WordListField";
export type { WordListFieldProps } from "./fields/WordListField";
export type { FieldBaseProps, ControlKind, ControlOptions, PickerOptions } from "./fields/fieldBase";
// 欄の中身の部品（原子の欄が中で使う。Form.Item の外で値を持つときにも使える）
export { TagCloud } from "./fields/TagCloud";
export type { TagCloudProps, TagOption, TagOptionGroup } from "./fields/TagCloud";
export { ImageChoiceCards } from "./fields/ImageChoiceCards";
export { requiredMark } from "./fields/RequiredMark";
export type { ImageChoiceCardsProps, ImageChoice } from "./fields/ImageChoiceCards";

// 知らせ
export { errorText, notifyLifecycle, NOTICE_TEXT } from "./feedback/notify";
export type { MutationLifecycle, NoticeTexts } from "./feedback/notify";
export { LoadError, loadErrorText, loadingText } from "./feedback/LoadError";
export type { LoadErrorProps } from "./feedback/LoadError";
export { ProgressModal, atLeastMin, PROGRESS_MIN_MS } from "./feedback/ProgressModal";
export type { ProgressModalProps, ProgressItem, ProgressStatus } from "./feedback/ProgressModal";
export { useDialog, useConfirmDanger, useNotice } from "./feedback/dialogs";
export type { DeleteConfirm, DangerConfirm } from "./feedback/dialogs";
export { useGuideDialog, GuideContent } from "./feedback/GuideDialog";
export type { Guide } from "./feedback/GuideDialog";
