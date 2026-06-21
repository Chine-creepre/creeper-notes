export const MESSAGE_VISIBLE_DURATION = 1800;

export const SETTINGS_MESSAGES = {
  success: {
    saved: "保存成功",
    reset: "已重置为默认配置",
    folderCreated: "新增分类成功",
    folderUpdated: "编辑分类成功",
    folderDeleted: "删除分类成功",
  },
  error: {
    default: "操作失败，请重试",
    invalidHotkey: "快捷键格式不合法，请重新设置",
    hotkeyRegistered: "快捷键已被占用，请更换组合键",
    missingRequiredKey: "参数缺失，请刷新设置页后重试",
    folderHasChildren: "该分类下存在子分类，不能删除",
    folderHasNotes: "该分类下存在笔记，不能删除",
    duplicateFolderName: "同级分类不能重名",
  },
} as const;

export const SETTINGS_ERROR_MESSAGE_RULES: Array<{
  keyword: string;
  message: string;
}> = [
  {
    keyword: "Invalid hotkey format",
    message: SETTINGS_MESSAGES.error.invalidHotkey,
  },
  {
    keyword: "already registered",
    message: SETTINGS_MESSAGES.error.hotkeyRegistered,
  },
  {
    keyword: "missing required key",
    message: SETTINGS_MESSAGES.error.missingRequiredKey,
  },
  {
    keyword: "folder has child folders",
    message: SETTINGS_MESSAGES.error.folderHasChildren,
  },
  {
    keyword: "folder has notes",
    message: SETTINGS_MESSAGES.error.folderHasNotes,
  },
  {
    keyword: "sibling folder name already exists",
    message: SETTINGS_MESSAGES.error.duplicateFolderName,
  },
];
