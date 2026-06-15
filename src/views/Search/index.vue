<template>
  <div class="h_search">
    <div class="h_search_panel">
      <input
        ref="inputRef"
        v-model="keyword"
        class="h_search_input"
        placeholder="搜索笔记、想法和待办"
        @keydown.enter="selectActiveSuggestion"
        @keydown.escape="closeSearch"
        @keydown.up.prevent="moveActiveSuggestion(-1)"
        @keydown.down.prevent="moveActiveSuggestion(1)"
      />

      <div class="h_search_suggestions">
        <button
          v-for="(suggestion, index) in suggestions"
          :key="suggestion.id"
          :class="[
            'h_search_suggestion',
            { h_search_suggestion_active: index === activeIndex },
          ]"
          type="button"
          @mouseenter="activeIndex = index"
          @click="selectSuggestion(suggestion)"
        >
          <span class="h_search_suggestion_title">{{ suggestion.title }}</span>
          <span class="h_search_suggestion_description">
            {{ suggestion.describe || suggestion.content || "打开这条笔记" }}
          </span>
        </button>

        <div v-if="!suggestions.length" class="h_search_empty">
          输入关键词后显示匹配结果，按 Enter 打开选中项。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "./index.scss";
import { useHSearch } from "./hook";

const {
  activeIndex,
  closeSearch,
  inputRef,
  keyword,
  moveActiveSuggestion,
  selectActiveSuggestion,
  selectSuggestion,
  suggestions,
} = useHSearch();
</script>
