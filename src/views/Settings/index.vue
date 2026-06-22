<template>
  <div class="h_settings" @keydown="captureShortcut">
    <header class="h_settings_header" @mousedown.left="startDragWindow">
      <div>
        <h1 class="h_settings_title">设置中心</h1>
        <p class="h_settings_subtitle">主题、快捷键与系统设置 · {{ appVersionText }}</p>
      </div>

      <div class="h_settings_header_actions" @mousedown.stop>
        <span class="h_settings_version">{{ appVersionText }}</span>
        <button class="h_settings_secondary" type="button" :disabled="saving" @click.stop="resetSettings">重置默认配置</button>
        <button class="h_settings_close" type="button" @click.stop="closeWindow">×</button>
      </div>
    </header>

    <main class="h_settings_main">
      <aside class="h_settings_nav">
        <button :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'theme' }]" type="button" @click="activeDrawer = 'theme'">
          <HThemedIcon icon="lucide:palette" :active="activeDrawer === 'theme'" />
          <span>
            <strong>主题设置</strong>
            <em>界面颜色方案</em>
          </span>
        </button>
        <button :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'startup' }]" type="button" @click="activeDrawer = 'startup'">
          <HThemedIcon icon="lucide:power" :active="activeDrawer === 'startup'" />
          <span>
            <strong>启动设置</strong>
            <em>开机自启动</em>
          </span>
        </button>
        <button :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'mainShortcut' }]" type="button" @click="activeDrawer = 'mainShortcut'">
          <HThemedIcon icon="lucide:keyboard" :active="activeDrawer === 'mainShortcut'" />
          <span>
            <strong>主窗口快捷键</strong>
            <em>显示或隐藏主窗口</em>
          </span>
        </button>
        <button :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'searchShortcut' }]" type="button" @click="activeDrawer = 'searchShortcut'">
          <HThemedIcon icon="lucide:search" :active="activeDrawer === 'searchShortcut'" />
          <span>
            <strong>搜索快捷键</strong>
            <em>快速打开搜索</em>
          </span>
        </button>
        <button :class="['h_settings_nav_item', { h_settings_nav_item_active: activeDrawer === 'folders' }]" type="button" @click="activeDrawer = 'folders'">
          <HThemedIcon icon="lucide:folder-tree" :active="activeDrawer === 'folders'" />
          <span>
            <strong>分类 / 文件夹</strong>
            <em>管理笔记目录</em>
          </span>
        </button>
      </aside>

      <section class="h_settings_content">
        <div v-if="errorMessage" class="h_settings_message h_settings_message_error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="h_settings_message h_settings_message_success">{{ successMessage }}</div>

        <article v-if="activeDrawer === 'theme'" class="h_settings_drawer">
          <div class="h_settings_drawer_header">
            <span class="h_settings_drawer_badge">Theme</span>
            <h2>主题设置</h2>
            <p>选择一套主题色，确认后立即更新界面。</p>
          </div>

          <div class="h_settings_theme_grid">
            <button
              v-for="themeOption in themeOptions"
              :key="themeOption.value"
              :class="[
                'h_settings_theme_card',
                `h_settings_theme_card_${themeOption.value}`,
                { h_settings_theme_card_active: themeDraft === themeOption.value },
              ]"
              type="button"
              @click="themeDraft = themeOption.value"
            >
              <span class="h_settings_theme_preview"></span>
              <strong>{{ themeOption.label }}</strong>
              <em>{{ themeDraft === themeOption.value ? "当前选择" : "点击选择" }}</em>
            </button>
          </div>

          <button class="h_settings_primary" type="button" :disabled="saving" @click="confirmTheme">{{ saving ? "更新中" : "确认更新" }}</button>
        </article>

        <article v-else-if="activeDrawer === 'startup'" class="h_settings_drawer">
          <div class="h_settings_drawer_header">
            <span class="h_settings_drawer_badge">Startup</span>
            <h2>启动设置</h2>
            <p>管理应用是否随系统开机自动启动。</p>
          </div>

          <div class="h_settings_setting_card">
            <div>
              <strong>开机自启动</strong>
              <p>开启后，系统启动时会自动运行 Creeper Notes。</p>
            </div>
            <label class="h_settings_switch">
              <input v-if="config" v-model="config.auto_start_enabled" type="checkbox" />
              <span></span>
            </label>
          </div>

          <button class="h_settings_primary" type="button" :disabled="saving" @click="saveStartupSettings">{{ saving ? "保存中" : "保存启动设置" }}</button>
        </article>

        <article v-else-if="activeDrawer === 'mainShortcut'" class="h_settings_drawer">
          <div class="h_settings_drawer_header">
            <span class="h_settings_drawer_badge">Shortcut</span>
            <h2>主窗口快捷键</h2>
            <p>点击录入区域后，直接按下组合键。</p>
          </div>

          <button v-if="config" :class="['h_settings_shortcut_capture', { h_settings_shortcut_capture_active: listeningShortcutField === 'toggle_shortcut' }]" type="button" @click="startListenShortcut('toggle_shortcut')">
            <span>显示 / 隐藏主窗口</span>
            <strong>{{ listeningShortcutField === "toggle_shortcut" ? "按下快捷键，Esc 取消" : config.toggle_shortcut }}</strong>
          </button>

          <button class="h_settings_primary" type="button" :disabled="saving" @click="saveConfig">{{ saving ? "保存中" : "保存快捷键" }}</button>
        </article>

        <article v-else-if="activeDrawer === 'searchShortcut'" class="h_settings_drawer">
          <div class="h_settings_drawer_header">
            <span class="h_settings_drawer_badge">Shortcut</span>
            <h2>搜索快捷键</h2>
            <p>设置快速打开搜索窗口的全局快捷键。</p>
          </div>

          <button v-if="config" :class="['h_settings_shortcut_capture', { h_settings_shortcut_capture_active: listeningShortcutField === 'search_shortcut' }]" type="button" @click="startListenShortcut('search_shortcut')">
            <span>打开 / 隐藏搜索窗口</span>
            <strong>{{ listeningShortcutField === "search_shortcut" ? "按下快捷键，Esc 取消" : config.search_shortcut }}</strong>
          </button>

          <button class="h_settings_primary" type="button" :disabled="saving" @click="saveConfig">{{ saving ? "保存中" : "保存快捷键" }}</button>
        </article>

        <article v-else class="h_settings_drawer">
          <div class="h_settings_drawer_header">
            <span class="h_settings_drawer_badge">Folder</span>
            <h2>分类 / 文件夹</h2>
            <p>管理笔记保存目录，新建笔记时可以选择对应分类。</p>
          </div>

          <div class="h_settings_folder_form">
            <input v-model="folderName" class="h_settings_control" placeholder="分类名称" />
            <HSelectTree v-model="folderParentId" :nodes="folderTreeNodes" root-label="根目录" empty-text="暂无分类" />
            <button class="h_settings_primary" type="button" @click="createRootFolder">新增分类</button>
          </div>

          <div v-if="isEditingFolder" class="h_settings_folder_form">
            <input v-model="editingFolderName" class="h_settings_control" placeholder="分类名称" />
            <HSelectTree v-model="editingFolderParentId" :nodes="folderTreeNodes" root-label="根目录" empty-text="暂无分类" />
            <button class="h_settings_primary" type="button" @click="saveEditFolder">保存编辑</button>
            <button class="h_settings_secondary" type="button" @click="cancelEditFolder">取消</button>
          </div>

          <div class="h_settings_folder_tree_card">
            <HTree
              :nodes="folderTreeNodes"
              show-actions
              empty-text="暂无分类"
              @delete="removeFolderByNode"
              @edit="startEditFolder"
            />
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import HSelectTree from "@/components/SelectTree/index.vue";
import HThemedIcon from "@/components/ThemedIcon/index.vue";
import HTree from "@/components/Tree/index.vue";
import "./index.scss";
import { useHSettings } from "./hook";

const {
  activeDrawer,
  appVersionText,
  cancelEditFolder,
  captureShortcut,
  closeWindow,
  config,
  confirmTheme,
  createRootFolder,
  editingFolderName,
  editingFolderParentId,
  errorMessage,
  folderName,
  folderParentId,
  folderTreeNodes,
  isEditingFolder,
  listeningShortcutField,
  removeFolderByNode,
  resetSettings,
  saveConfig,
  saveEditFolder,
  saveStartupSettings,
  saving,
  startDragWindow,
  startEditFolder,
  startListenShortcut,
  successMessage,
  themeDraft,
  themeOptions,
} = useHSettings();
</script>
