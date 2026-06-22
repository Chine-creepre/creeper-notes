<script setup lang="ts">
import { Icon } from "@iconify/vue";
import HButton from "@/components/Button/index.vue";
import HInput from "@/components/Input/index.vue";
import HMarkdownEditor from "@/components/MarkdownEditor/index.vue";
import HModal from "@/components/Modal/index.vue";
import HSelectTree from "@/components/SelectTree/index.vue";
import HTextarea from "@/components/Textarea/index.vue";
import HAppLayout from "@/layouts/HAppLayout/index.vue";
import { useBootstrap } from "./hook";

const {
  activeFolderId,
  activeNoteId,
  appVersionText,
  deleteCurrentNote,
  draft,
  folderTreeNodes,
  formatNoteTime,
  getNoteDescription,
  hasDraftChanged,
  isNoteMetaConfirmDisabled,
  loadingNotes,
  markdownEditorMode,
  noteMetaDraft,
  noteMetaModalTitle,
  noteMetaModalVisible,
  notes,
  openCreateNoteModal,
  openEditNoteMetaModal,
  saveCurrentNote,
  saving,
  selectFolder,
  selectNote,
  selectedNote,
  submitNoteMetaModal,
  toggleCurrentNoteReadonly,
  windowTitle,
} = useBootstrap();
</script>

<template>
  <HAppLayout :title="windowTitle" :title-right-text="appVersionText">
    <template #title-right>
      <HButton variant="ghost" size="sm" @click="openCreateNoteModal">
        <Icon icon="lucide:plus" />
        <span>新建笔记</span>
      </HButton>
    </template>

    <div class="h_bootstrap">
      <section class="h_bootstrap_notes_panel">
        <div class="h_bootstrap_quick_actions">
          <HSelectTree
            v-model="activeFolderId"
            :nodes="folderTreeNodes"
            root-label="根目录"
            empty-text="暂无目录"
            trigger-icon="lucide:folder"
            @select="selectFolder"
          />
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
                <button class="h_bootstrap_note_action_edit" type="button" title="编辑名称和摘要" :disabled="saving" @click="openEditNoteMetaModal(note)">
                  <Icon icon="lucide:pencil" />
                </button>
                <button class="h_bootstrap_note_action_delete" type="button" title="删除" @click="deleteCurrentNote">
                  <Icon icon="lucide:trash-2" />
                </button>
                <button :class="['h_bootstrap_note_action_readonly', { h_bootstrap_note_action_readonly_active: draft.readonly }]" type="button" title="只读" :disabled="saving" @click="toggleCurrentNoteReadonly">
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
            <HMarkdownEditor
              v-model="draft.content"
              v-model:mode="markdownEditorMode"
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
      </section>
    </div>

    <HModal
      v-model="noteMetaModalVisible"
      :title="noteMetaModalTitle"
      :confirm-disabled="isNoteMetaConfirmDisabled"
      @confirm="submitNoteMetaModal"
    >
      <form class="h_bootstrap_note_meta_form" @submit.prevent="submitNoteMetaModal">
        <label>
          <span>名称 <em>*</em></span>
          <HInput v-model="noteMetaDraft.title" placeholder="请输入笔记名称" autocomplete="off" />
        </label>
        <label>
          <span>摘要</span>
          <HTextarea v-model="noteMetaDraft.describe" placeholder="请输入笔记摘要" />
        </label>
      </form>
    </HModal>
  </HAppLayout>
</template>

<style lang="scss" scoped src="./index.scss"></style>
