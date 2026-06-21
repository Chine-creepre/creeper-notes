<script setup lang="ts">
import { Icon } from "@iconify/vue";
import HMarkdownEditor from "@/components/MarkdownEditor/index.vue";
import HSelectTree from "@/components/SelectTree/index.vue";
import HAppLayout from "@/layouts/HAppLayout/index.vue";
import { openSettingsWindow } from "@/request/apis/config";
import { useBootstrap } from "./hook";

const {
  activeNoteId,
  appVersionText,
  clearSearch,
  createNewNote,
  deleteCurrentNote,
  draft,
  formatNoteTime,
  getNoteDescription,
  hasDraftChanged,
  keyword,
  loadingNotes,
  newNoteFolderId,
  newNoteFolderTreeNodes,
  noteEditorState,
  notes,
  saveCurrentNote,
  saving,
  searchCurrentNotes,
  selectNewNoteFolder,
  selectNote,
  selectedNote,
  statusMessage,
  windowTitle,
} = useBootstrap();

const openSettingsPage = async (): Promise<void> => {
  try {
    await openSettingsWindow();
  } catch (error) {
    console.error("open settings window failed", error);
  }
};
</script>

<template>
  <HAppLayout :title="windowTitle" :title-right-text="appVersionText">
    <div class="h_bootstrap">
      <section class="h_bootstrap_notes_panel">
        <div class="h_bootstrap_search">
          <Icon icon="lucide:search" />
          <input
            v-model="keyword"
            placeholder="搜索..."
            @keydown.enter="searchCurrentNotes"
          />
          <button v-if="keyword" type="button" @click="clearSearch">
            <Icon icon="lucide:x" />
          </button>
        </div>

        <div class="h_bootstrap_quick_actions">
          <button class="h_bootstrap_quick_action_active" type="button" @click="createNewNote">
            <Icon icon="lucide:plus" />
            <span>新建笔记</span>
          </button>

          <HSelectTree
            v-model="newNoteFolderId"
            :nodes="newNoteFolderTreeNodes"
            root-label="根目录"
            empty-text="暂无目录"
            trigger-icon="lucide:folder"
            @select="selectNewNoteFolder"
          />

          <button class="h_bootstrap_settings_entry" type="button" title="设置" @click="openSettingsPage">
            <Icon icon="lucide:settings" />
          </button>
        </div>

        <div class="h_bootstrap_note_list">
          <div v-if="loadingNotes" class="h_bootstrap_empty">加载中...</div>
          <div v-else-if="!notes.length" class="h_bootstrap_empty">暂无笔记</div>

          <template v-else>
            <button
              v-for="note in notes"
              :key="note.id"
              :class="['h_bootstrap_note_item', { h_bootstrap_note_item_active: note.id === activeNoteId }]"
              type="button"
              @click="selectNote(note)"
            >
              <strong>{{ note.title }}</strong>
              <em>{{ formatNoteTime(note.updated_at) }} · {{ note.folder?.name || '根目录' }}</em>

              <span v-if="note.id === activeNoteId" class="h_bootstrap_note_actions" @click.stop>
                <button class="h_bootstrap_note_action_save" type="button" title="保存" :disabled="saving || !hasDraftChanged" @click="saveCurrentNote">
                  <Icon icon="lucide:save" />
                </button>
                <button class="h_bootstrap_note_action_delete" type="button" title="删除" @click="deleteCurrentNote">
                  <Icon icon="lucide:trash-2" />
                </button>
                <button :class="['h_bootstrap_note_action_readonly', { h_bootstrap_note_action_readonly_active: draft.readonly }]" type="button" title="只读" @click="draft.readonly = !draft.readonly">
                  <Icon :icon="draft.readonly ? 'lucide:lock' : 'lucide:unlock'" />
                </button>
              </span>

              <span>{{ getNoteDescription(note) }}</span>
            </button>
          </template>
        </div>
      </section>

      <section class="h_bootstrap_editor_panel">
        <template v-if="selectedNote">
          <main class="h_bootstrap_editor_body">
            <div class="h_bootstrap_note_header">
              <div class="h_bootstrap_note_fields">
                <input v-model="draft.title" class="h_bootstrap_title_input" placeholder="未命名笔记" />
                <input v-model="draft.describe" class="h_bootstrap_desc_input" placeholder="描述 / 摘要" />
              </div>
            </div>

            <HMarkdownEditor
              v-model="draft.content"
              :dirty="hasDraftChanged"
              :readonly="draft.readonly"
              @save="saveCurrentNote"
            />
          </main>
        </template>

        <div v-else class="h_bootstrap_editor_empty">
          <Icon icon="lucide:book-open-text" />
          <strong>选择或新建一条笔记</strong>
          <span>从左侧列表选择笔记后开始编辑。</span>
        </div>

        <div v-if="statusMessage" :class="['h_bootstrap_status', `h_bootstrap_status_${noteEditorState}`]">{{ statusMessage }}</div>
      </section>
    </div>
  </HAppLayout>
</template>

<style lang="scss" scoped src="./index.scss"></style>
