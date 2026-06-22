<template>
  <div class="h_search">
    <section class="h_search_panel">
      <main class="h_search_body">
        <div class="h_search_input_card" @mousedown.left="startDragWindow">
          <Icon class="h_search_input_icon" icon="lucide:search" />
          <input
            ref="inputRef"
            v-model="keyword"
            class="h_search_input"
            placeholder="输入关键词搜索笔记"
            @mousedown.stop
            @keydown.enter="selectActiveSuggestion"
            @keydown.escape="closeSearch"
            @keydown.up.prevent="moveActiveSuggestion(-1)"
            @keydown.down.prevent="moveActiveSuggestion(1)"
          />
          <span class="h_search_shortcut">Enter 打开</span>
          <button class="h_search_close" type="button" @mousedown.stop @click.stop="closeSearch">
            <Icon icon="lucide:x" />
          </button>
        </div>

        <div v-if="hasKeyword" class="h_search_meta">
          <span v-if="searching">正在搜索…</span>
          <span v-else-if="hasSuggestions">找到 {{ suggestions.length }} 条结果</span>
          <span v-else-if="isEmptyResult">没有匹配内容</span>
          <span v-else>支持标题、描述和正文搜索</span>

          <span>↑↓ 选择 · Esc 关闭</span>
        </div>

        <div v-if="hasKeyword" class="h_search_popup">
          <div v-if="hasSuggestions" class="h_search_results">
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
              <HThemedIcon icon="lucide:file-text" :active="index === activeIndex" />
              <span class="h_search_result_content">
                <strong>{{ suggestion.title }}</strong>
                <em>{{ suggestion.describe || suggestion.content || "打开这条笔记" }}</em>
              </span>
              <span class="h_search_result_action">
                <Icon icon="lucide:corner-down-left" />
              </span>
            </button>
          </div>

          <div v-else-if="isEmptyResult" class="h_search_empty">
            <HThemedIcon icon="lucide:file-x-2" />
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
import HThemedIcon from "@/components/ThemedIcon/index.vue";
import "./index.scss";
import { useHSearch } from "./hook";

const {
  activeIndex,
  closeSearch,
  hasKeyword,
  hasSuggestions,
  inputRef,
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
