<template>
  <div class="h_settings">
    <header class="h_settings_header" @mousedown.left="startDragWindow">
      <div>
        <h1 class="h_settings_title">设置</h1>
        <p class="h_settings_subtitle">主题、快捷键和分类管理</p>
      </div>

      <button class="h_settings_close" type="button" @click="closeWindow">关闭</button>
    </header>

    <main class="h_settings_main">
      <aside class="h_settings_nav">
        <button
          :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'theme' }]"
          type="button"
          @click="activeDrawer = 'theme'"
        >
          主题设置
        </button>
        <button
          :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'mainShortcut' }]"
          type="button"
          @click="activeDrawer = 'mainShortcut'"
        >
          主窗口快捷键
        </button>
        <button
          :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'searchShortcut' }]"
          type="button"
          @click="activeDrawer = 'searchShortcut'"
        >
          搜索快捷键
        </button>
        <button
          :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'folders' }]"
          type="button"
          @click="activeDrawer = 'folders'"
        >
          分类 / 文件夹
        </button>
      </aside>

      <section class="h_settings_content">
        <div v-if="activeDrawer === 'theme'" class="h_settings_panel">
          <h2 class="h_settings_panel_title">主题设置</h2>
          <label class="h_settings_field">
            <span>主题</span>
            <select v-if="config" v-model="config.theme" class="h_settings_control">
              <option value="system">跟随系统</option>
              <option value="light">亮色</option>
              <option value="dark">暗色</option>
            </select>
          </label>
          <label class="h_settings_checkbox">
            <input v-if="config" v-model="config.auto_start_enabled" type="checkbox" />
            <span>开机自启动</span>
          </label>
          <button class="h_settings_primary" type="button" :disabled="saving" @click="saveConfig">
            {{ saving ? "保存中" : "保存设置" }}
          </button>
        </div>

        <div v-else-if="activeDrawer === 'mainShortcut'" class="h_settings_panel">
          <h2 class="h_settings_panel_title">主窗口快捷键</h2>
          <label class="h_settings_field">
            <span>显示 / 隐藏主窗口</span>
            <input
              v-if="config"
              v-model="config.toggle_shortcut"
              class="h_settings_control"
              placeholder="CommandOrControl+N"
            />
          </label>
          <p class="h_settings_tip">保存后 Rust 端会立即重新注册快捷键。</p>
          <button class="h_settings_primary" type="button" :disabled="saving" @click="saveConfig">
            {{ saving ? "保存中" : "保存快捷键" }}
          </button>
        </div>

        <div v-else-if="activeDrawer === 'searchShortcut'" class="h_settings_panel">
          <h2 class="h_settings_panel_title">搜索快捷键</h2>
          <label class="h_settings_field">
            <span>打开 / 隐藏搜索窗口</span>
            <input
              v-if="config"
              v-model="config.search_shortcut"
              class="h_settings_control"
              placeholder="CommandOrControl+Shift+F"
            />
          </label>
          <p class="h_settings_tip">格式需要符合 Tauri global shortcut 解析规则。</p>
          <button class="h_settings_primary" type="button" :disabled="saving" @click="saveConfig">
            {{ saving ? "保存中" : "保存快捷键" }}
          </button>
        </div>

        <div v-else class="h_settings_panel">
          <h2 class="h_settings_panel_title">分类 / 文件夹</h2>

          <div class="h_settings_folder_form">
            <input v-model="folderName" class="h_settings_control" placeholder="分类名称" />
            <select v-model="folderParentId" class="h_settings_control">
              <option :value="null">根目录</option>
              <option v-for="folder in flatFolders" :key="folder.id" :value="folder.id">
                {{ `${'　'.repeat(folder.level)}${folder.name}` }}
              </option>
            </select>
            <button class="h_settings_primary" type="button" @click="createRootFolder">新增</button>
          </div>

          <div class="h_settings_folder_list">
            <div v-if="!flatFolders.length" class="h_settings_empty">暂无分类。</div>
            <div v-for="folder in flatFolders" :key="folder.id" class="h_settings_folder_item">
              <span :style="{ paddingLeft: `${folder.level * 16}px` }">{{ folder.name }}</span>
              <button class="h_settings_danger" type="button" @click="removeFolder(folder.id)">删除</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import "./index.scss";
import { useHSettings } from "./hook";

const {
  activeDrawer,
  closeWindow,
  config,
  createRootFolder,
  flatFolders,
  folderName,
  folderParentId,
  removeFolder,
  saveConfig,
  saving,
  startDragWindow,
} = useHSettings();
</script>
