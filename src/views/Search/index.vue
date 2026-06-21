<template>
  <div class="h_search">
    <section class="h_search_panel">
      <header class="h_search_header" @mousedown.left="startDragWindow">
        <div class="h_search_brand">
          <span class="h_search_brand_icon">
            <Icon icon="lucide:search" />
          </span>
          <div>
            <h1>快速搜索</h1>
            <p>搜索笔记、想法和待办</p>
          </div>
        </div>

        <button class="h_search_close" type="button" @mousedown.stop @click.stop="closeSearch">
          <Icon icon="lucide:x" />
        </button>
      </header>

      <main class="h_search_body">
        <div class="h_search_input_card">
          <Icon class="h_search_input_icon" icon="lucide:sparkles" />
          <input
            ref="inputRef"
            v-model="keyword"
            class="h_search_input"
            placeholder="输入关键词搜索笔记"
            @keydown.enter="selectActiveSuggestion"
            @keydown.escape="closeSearch"
            @keydown.up.prevent="moveActiveSuggestion(-1)"
            @keydown.down.prevent="moveActiveSuggestion(1)"
          />
          <span class="h_search_shortcut">Enter 打开</span>
        </div>

        <div class="h_search_meta">
          <span v-if="searching">正在搜索…</span>
          <span v-else-if="hasSuggestions">找到 {{ suggestions.length }} 条结果</span>
          <span v-else-if="hasKeyword">未找到匹配结果</span>
          <span v-else>支持标题、描述和正文搜索</span>

          <span>↑↓ 选择 · Esc 关闭</span>
        </div>

        <div class="h_search_results">
          <button
            v-for="(suggestion, index) in suggestions"
            :key="suggestion.id"
            :class="[
              'h_search_result',
              { h_search_result_active: index === activeIndex },
            ]"
            type="button"
            @mouseenter="activeIndex = index"
            @click="selectSuggestion(suggestion)"
          >
            <span class="h_search_result_icon">
              <Icon icon="lucide:file-text" />
            </span>
            <span class="h_search_result_content">
              <strong>{{ suggestion.title }}</strong>
              <em>{{ suggestion.describe || suggestion.content || "打开这条笔记" }}</em>
            </span>
            <span class="h_search_result_action">
              <Icon icon="lucide:corner-down-left" />
            </span>
          </button>

          <div v-if="isEmptyInitial" class="h_search_empty">
            <Icon icon="lucide:scan-search" />
            <strong>开始搜索</strong>
            <span>输入关键词后会显示匹配的笔记。</span>
          </div>

          <div v-else-if="isEmptyResult" class="h_search_empty">
            <Icon icon="lucide:file-x-2" />
            <strong>没有找到结果</strong>
            <span>换一个关键词试试。</span>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import "./index.scss";
import { useHSearch } from "./hook";

const {
  activeIndex,
  closeSearch,
  hasKeyword,
  hasSuggestions,
  inputRef,
  isEmptyInitial,
  isEmptyResult,
  keyword,
  moveActiveSuggestion,
  searching,
  selectActiveSuggestion,
  selectSuggestion,
  startDragWindow,
  suggestions,
} = useHSearch();
</script>
