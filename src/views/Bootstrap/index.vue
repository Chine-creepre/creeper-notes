<script setup lang="ts">
import { Icon } from "@iconify/vue";
import HTree from "@/components/Tree/index.vue";
import HSelectTree from "@/components/SelectTree/index.vue";
import HAppLayout from "@/layouts/HAppLayout/index.vue";
import { useBootstrap } from "./hook";

const {
  activeFolderKey,
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
  selectFolder,
  selectNote,
  selectedNote,
  statusMessage,
} = useBootstrap();
</script>

<template>
  <HAppLayout>
    <div class="h_bootstrap">
      <aside class="h_bootstrap_sidebar">
        <div class="h_bootstrap_brand">
          <span class="h_bootstrap_brand_icon">
            <Icon icon="lucide:notebook-tabs" />
          </span>
          <div>
            <strong>Creeper Notes</strong>
            <em>本地笔记系统</em>
          </div>
        </div>

        <div class="h_bootstrap_sidebar_section">
          <div class="h_bootstrap_sidebar_title">
            <span>目录</span>
            <button type="button" title="刷新目录" @click="loadFolders">
              <Icon icon="lucide:refresh-cw" />
            </button>
          </div>

          <div class="h_bootstrap_tree_card">
            <HTree
              :nodes="folderTreeNodes"
              :selected-key="activeFolderKey"
              empty-text="暂无目录"
              @select="selectFolder"
            />
          </div>
        </div>
      </aside>

      <section class="h_bootstrap_notes">
        <header class="h_bootstrap_notes_header">
          <div>
            <h1>笔记</h1>
            <p>{{ noteCountText }}</p>
          </div>

          <button class="h_bootstrap_primary" type="button" @click="createNewNote">
            <Icon icon="lucide:plus" />
            <span>新建</span>
          </button>
        </header>

        <div class="h_bootstrap_search">
          <Icon icon="lucide:search" />
          <input
            v-model="keyword"
            placeholder="搜索当前笔记"
            @keydown.enter="searchCurrentNotes"
          />
          <button v-if="keyword" type="button" @click="clearSearch">
            <Icon icon="lucide:x" />
          </button>
        </div>

        <div class="h_bootstrap_note_list">
          <div v-if="loadingNotes" class="h_bootstrap_empty">加载中...</div>
          <div v-else-if="!notes.length" class="h_bootstrap_empty">暂无笔记</div>

          <button
            v-for="note in notes"
            v-else
            :key="note.id"
            :class="['h_bootstrap_note_item', { h_bootstrap_note_item_active: note.id === activeNoteId }]"
            type="button"
            @click="selectNote(note)"
          >
            <span class="h_bootstrap_note_icon">
              <Icon icon="lucide:file-text" />
            </span>
            <span class="h_bootstrap_note_content">
              <strong>{{ note.title }}</strong>
              <em>{{ getNoteDescription(note) }}</em>
              <small>{{ formatNoteTime(note.updated_at) }}</small>
            </span>
          </button>
        </div>
      </section>

      <section class="h_bootstrap_editor">
        <template v-if="selectedNote">
          <header class="h_bootstrap_editor_header">
            <div>
              <span class="h_bootstrap_editor_badge">Editor</span>
              <h2>{{ draft.title || '未命名笔记' }}</h2>
            </div>

            <div class="h_bootstrap_editor_actions">
              <button class="h_bootstrap_secondary" type="button" :disabled="saving" @click="saveCurrentNote">
                <Icon icon="lucide:save" />
                <span>{{ saving ? '保存中' : '保存' }}</span>
              </button>
              <button class="h_bootstrap_danger" type="button" @click="deleteCurrentNote">
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          </header>

          <main class="h_bootstrap_editor_body">
            <input v-model="draft.title" class="h_bootstrap_title_input" placeholder="标题" />
            <input v-model="draft.describe" class="h_bootstrap_desc_input" placeholder="描述" />

            <div class="h_bootstrap_editor_meta">
              <label class="h_bootstrap_readonly">
                <input v-model="draft.readonly" type="checkbox" />
                <span></span>
                <em>只读</em>
              </label>

              <HSelectTree
                v-model="draft.folderId"
                :nodes="folderTreeNodes.slice(2)"
                root-label="根目录"
                empty-text="暂无目录"
                @select="moveCurrentNoteToFolder(draft.folderId)"
              />
            </div>

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
          <span>左侧选择目录，中间选择笔记后开始编辑。</span>
        </div>

        <div v-if="statusMessage" class="h_bootstrap_status">{{ statusMessage }}</div>
      </section>
    </div>
  </HAppLayout>
</template>

<style lang="scss" scoped src="./index.scss"></style>
