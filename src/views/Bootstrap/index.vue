<script setup lang="ts">
import { Icon } from "@iconify/vue";
import HSelectTree from "@/components/SelectTree/index.vue";
import HAppLayout from "@/layouts/HAppLayout/index.vue";
import { useBootstrap } from "./hook";

const {
  activeNoteId,
  clearSearch,
  createNewNote,
  deleteCurrentNote,
  draft,
  folderTreeNodes,
  formatNoteTime,
  getNoteDescription,
  keyword,
  loadingNotes,
  moveCurrentNoteToFolder,
  noteCountText,
  notes,
  saveCurrentNote,
  saving,
  searchCurrentNotes,
  selectNote,
  selectedNote,
  statusMessage,
} = useBootstrap();
</script>

<template>
  <HAppLayout>
    <div class="h_bootstrap">
      <section class="h_bootstrap_notes_panel">
        <header class="h_bootstrap_notes_header">
          <div>
            <h1>Notes</h1>
            <p>{{ noteCountText }}</p>
          </div>
        </header>

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
          <button type="button">
            <Icon icon="lucide:folder" />
            <span>分类 / 目录</span>
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
              <span>{{ getNoteDescription(note) }}</span>
            </button>
          </template>
        </div>
      </section>

      <section class="h_bootstrap_editor_panel">
        <template v-if="selectedNote">
          <header class="h_bootstrap_editor_header">
            <div class="h_bootstrap_editor_tools">
              <button type="button" title="保存" :disabled="saving" @click="saveCurrentNote">
                <Icon icon="lucide:save" />
              </button>
              <button type="button" title="删除" @click="deleteCurrentNote">
                <Icon icon="lucide:trash-2" />
              </button>
              <button type="button" title="只读" @click="draft.readonly = !draft.readonly">
                <Icon :icon="draft.readonly ? 'lucide:lock' : 'lucide:unlock'" />
              </button>
              <span></span>
              <button type="button" title="筛选">
                <Icon icon="lucide:funnel" />
              </button>
              <button type="button" title="更多">
                <Icon icon="lucide:ellipsis" />
              </button>
            </div>
          </header>

          <main class="h_bootstrap_editor_body">
            <div class="h_bootstrap_editor_topline">
              <HSelectTree
                v-model="draft.folderId"
                :nodes="folderTreeNodes.slice(2)"
                root-label="根目录"
                empty-text="暂无目录"
                @select="moveCurrentNoteToFolder(draft.folderId)"
              />
              <span>{{ saving ? '保存中...' : '自动保存关闭' }}</span>
            </div>

            <input v-model="draft.title" class="h_bootstrap_title_input" placeholder="未命名笔记" />
            <input v-model="draft.describe" class="h_bootstrap_desc_input" placeholder="描述 / 摘要" />

            <textarea
              v-model="draft.content"
              class="h_bootstrap_content_input"
              :readonly="draft.readonly"
              placeholder="开始记录..."
            ></textarea>
          </main>
        </template>

        <div v-else class="h_bootstrap_editor_empty">
          <Icon icon="lucide:book-open-text" />
          <strong>选择或新建一条笔记</strong>
          <span>从左侧列表选择笔记后开始编辑。</span>
        </div>

        <div v-if="statusMessage" class="h_bootstrap_status">{{ statusMessage }}</div>
      </section>
    </div>
  </HAppLayout>
</template>

<style lang="scss" scoped src="./index.scss"></style>
