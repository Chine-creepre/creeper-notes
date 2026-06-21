export interface HTreeNode {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  editable?: boolean;
  deletable?: boolean;
  raw?: unknown;
  children?: HTreeNode[];
}

export type HTreeSelectedKey = string | null;
