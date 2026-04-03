<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { usePasteService } from "@/modules/paste/services/pasteService.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useSiteConfigStore } from "@/stores/siteConfigStore.js";
import { useGlobalMessage } from "@/composables/core/useGlobalMessage.js";
import { formatDateTime, formatRelativeTime, isExpired as isExpiredUtil } from "@/utils/timeUtils.js";
import { getRemainingViews as getRemainingViewsUtil } from "@/utils/fileUtils.js";
import { useCreatorBadge } from "@/composables/admin-management/useCreatorBadge.js";
import {
  IconPlus,
  IconDocumentText,
  IconLockClosed,
  IconGlobeAlt,
  IconEyeOff,
  IconError,
  IconEye,
  IconCalendar,
  IconUser,
  IconRefresh,
  IconSearch,
  IconChevronRight,
  IconChevronLeft,
} from "@/components/icons";
import { createLogger } from "@/utils/logger.js";

const log = createLogger("HomeView");
const router = useRouter();
const { t } = useI18n();
const { showSuccess, showError } = useGlobalMessage();
const pasteService = usePasteService();
const authStore = useAuthStore();
const siteConfigStore = useSiteConfigStore();
const { getCreatorText } = useCreatorBadge();

// Props
const props = defineProps({
  darkMode: {
    type: Boolean,
    default: false,
  },
});

// State
const pastes = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(12);
const totalCount = ref(0);
const hasMore = ref(false);

// Computed
const canCreate = computed(() => {
  return authStore.isAdmin || (authStore.isKeyUser && authStore.hasTextSharePermission);
});

const isEmpty = computed(() => !loading.value && pastes.value.length === 0);

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

// Methods
const fetchPastes = async (resetPage = false) => {
  if (resetPage) {
    currentPage.value = 1;
  }

  loading.value = true;
  error.value = null;

  try {
    const offset = (currentPage.value - 1) * pageSize.value;
    const result = await pasteService.getPastes({
      limit: pageSize.value,
      offset,
      search: searchQuery.value || undefined,
    });

    pastes.value = result.items || [];
    totalCount.value = result.pagination?.total || 0;
    hasMore.value = result.pagination?.hasMore || false;
  } catch (err) {
    log.error("获取分享列表失败:", err);
    error.value = err.message || "获取分享列表失败";
    // 如果是权限问题，不显示错误，直接显示空状态
    if (err.message?.includes("无权")) {
      error.value = null;
      pastes.value = [];
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchPastes(true);
};

const handleClearSearch = () => {
  searchQuery.value = "";
  fetchPastes(true);
};

const handleRefresh = () => {
  fetchPastes();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchPastes();
};

const handleCreateNew = () => {
  router.push("/editor");
};

const handleViewPaste = (slug) => {
  router.push(`/paste/${slug}`);
};

const handleEditPaste = (slug) => {
  router.push(`/editor?slug=${slug}`);
};

const truncateContent = (text, maxLength = 200) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const isExpired = (expiresAt) => {
  return expiresAt ? isExpiredUtil(expiresAt) : false;
};

const getRemainingViews = (paste) => {
  return getRemainingViewsUtil(paste);
};

// Lifecycle
onMounted(async () => {
  // 等待认证状态初始化
  if (!authStore.initialized) {
    await authStore.initialize();
  }
  
  // 只有在有权限的情况下才获取列表
  if (authStore.isAdmin || (authStore.isKeyUser && authStore.hasTextManagePermission)) {
    await fetchPastes();
  } else {
    loading.value = false;
  }
});

// Watch for auth changes
watch(
  () => authStore.isAuthenticated,
  async (newVal) => {
    if (newVal && (authStore.isAdmin || (authStore.isKeyUser && authStore.hasTextManagePermission))) {
      await fetchPastes();
    }
  }
);
</script>

<template>
  <div class="home-view min-h-[calc(100vh-4rem)] flex flex-col">
    <!-- Hero Section -->
    <div
      class="hero-section relative overflow-hidden"
      :class="darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-primary-50 via-white to-blue-50'"
    >
      <!-- Decorative Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          :class="darkMode ? 'bg-primary-500' : 'bg-primary-300'"
        ></div>
        <div
          class="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          :class="darkMode ? 'bg-blue-500' : 'bg-blue-200'"
        ></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div class="text-center">
          <!-- Title -->
          <h1
            class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            :class="darkMode ? 'text-white' : 'text-gray-900'"
          >
            {{ siteConfigStore.siteTitle || 'CloudPaste' }}
          </h1>
          
          <!-- Subtitle -->
          <p
            class="text-lg sm:text-xl max-w-2xl mx-auto mb-8"
            :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
          >
            {{ $t('pageTitle.homeSubtitle') }} — 高效分享，安全存储
          </p>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              v-if="canCreate"
              @click="handleCreateNew"
              class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              :class="darkMode ? 'bg-primary-600 hover:bg-primary-500' : 'bg-primary-600 hover:bg-primary-700'"
            >
              <IconPlus size="md" class="mr-2" />
              创建新分享
            </button>
            
            <button
              @click="handleRefresh"
              class="inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium transition-all duration-200"
              :class="darkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'"
            >
              <IconRefresh size="md" class="mr-2" />
              刷新列表
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search Bar -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索分享..."
              class="w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2"
              :class="darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500'"
              @keyup.enter="handleSearch"
            />
            <IconSearch
              size="md"
              class="absolute left-3 top-1/2 -translate-y-1/2"
              :class="darkMode ? 'text-gray-400' : 'text-gray-400'"
            />
            <button
              v-if="searchQuery"
              @click="handleClearSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span class="sr-only">清除搜索</span>
              ×
            </button>
          </div>
          <button
            @click="handleSearch"
            class="px-6 py-3 rounded-xl font-medium transition-all duration-200"
            :class="darkMode 
              ? 'bg-primary-600 text-white hover:bg-primary-500' 
              : 'bg-primary-600 text-white hover:bg-primary-700'"
          >
            搜索
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="flex flex-col items-center">
          <div
            class="w-12 h-12 border-4 rounded-full animate-spin mb-4"
            :class="darkMode 
              ? 'border-gray-700 border-t-primary-500' 
              : 'border-gray-200 border-t-primary-600'"
          ></div>
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'">加载中...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex items-center justify-center py-20"
      >
        <div class="text-center">
          <IconError size="xl" class="mx-auto mb-4 text-red-500" />
          <p class="mb-4" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">{{ error }}</p>
          <button
            @click="handleRefresh"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="darkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            重试
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="isEmpty"
        class="flex items-center justify-center py-20"
      >
        <div class="text-center max-w-md">
          <div
            class="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            :class="darkMode ? 'bg-gray-800' : 'bg-gray-100'"
          >
            <IconDocumentText size="xl" :class="darkMode ? 'text-gray-500' : 'text-gray-400'" />
          </div>
          <h3
            class="text-xl font-semibold mb-2"
            :class="darkMode ? 'text-white' : 'text-gray-900'"
          >
            暂无分享
          </h3>
          <p
            class="mb-6"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            {{ canCreate ? '点击下方按钮创建你的第一个分享' : '当前没有可访问的分享内容' }}
          </p>
          <button
            v-if="canCreate"
            @click="handleCreateNew"
            class="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-white transition-all duration-200"
            :class="darkMode ? 'bg-primary-600 hover:bg-primary-500' : 'bg-primary-600 hover:bg-primary-700'"
          >
            <IconPlus size="md" class="mr-2" />
            创建分享
          </button>
        </div>
      </div>

      <!-- Paste Grid -->
      <div v-else>
        <!-- Stats Bar -->
        <div
          class="flex items-center justify-between mb-6 px-4 py-3 rounded-xl"
          :class="darkMode ? 'bg-gray-800/50' : 'bg-gray-50'"
        >
          <span
            class="text-sm"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            共 {{ totalCount }} 条分享
          </span>
          <span
            v-if="searchQuery"
            class="text-sm"
            :class="darkMode ? 'text-primary-400' : 'text-primary-600'"
          >
            搜索: "{{ searchQuery }}"
          </span>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <article
            v-for="paste in pastes"
            :key="paste.id"
            class="paste-card group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden"
            :class="[
              darkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' 
                : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-xl',
              isExpired(paste.expires_at) ? 'opacity-60' : ''
            ]"
            @click="handleViewPaste(paste.slug)"
            tabindex="0"
            role="button"
            :aria-label="`查看分享: ${paste.title || paste.slug}`"
          >
            <!-- Card Header -->
            <div class="px-4 pt-4 pb-2">
              <div class="flex items-start justify-between gap-2 mb-2">
                <!-- Title -->
                <h3
                  class="text-base font-semibold truncate flex-1"
                  :class="isExpired(paste.expires_at)
                    ? 'text-red-500 dark:text-red-400'
                    : darkMode ? 'text-white' : 'text-gray-900'"
                  :title="paste.title || paste.slug"
                >
                  {{ paste.title || paste.slug }}
                </h3>

                <!-- Status Icons -->
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <!-- Password -->
                  <span
                    v-if="paste.has_password"
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full"
                    :class="darkMode ? 'bg-amber-500/20' : 'bg-amber-50'"
                    title="密码保护"
                  >
                    <IconLockClosed size="sm" :class="darkMode ? 'text-amber-400' : 'text-amber-600'" />
                  </span>

                  <!-- Visibility -->
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full"
                    :class="paste.is_public
                      ? (darkMode ? 'bg-green-500/20' : 'bg-green-50')
                      : (darkMode ? 'bg-gray-700' : 'bg-gray-100')"
                    :title="paste.is_public ? '公开' : '私密'"
                  >
                    <IconGlobeAlt v-if="paste.is_public" size="sm" :class="darkMode ? 'text-green-400' : 'text-green-600'" />
                    <IconEyeOff v-else size="sm" :class="darkMode ? 'text-gray-400' : 'text-gray-500'" />
                  </span>

                  <!-- Expired -->
                  <span
                    v-if="isExpired(paste.expires_at)"
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30"
                    title="已过期"
                  >
                    <IconError size="sm" class="text-red-500 dark:text-red-400" />
                  </span>
                </div>
              </div>

              <!-- Content Preview -->
              <p
                class="text-sm line-clamp-3 leading-relaxed"
                :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
              >
                {{ truncateContent(paste.content, 150) }}
              </p>
            </div>

            <!-- Card Footer -->
            <div
              class="px-4 py-3 mt-auto border-t"
              :class="darkMode ? 'border-gray-700/50' : 'border-gray-100'"
            >
              <div class="flex items-center justify-between text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                <!-- Left: Creator -->
                <span class="flex items-center gap-1 truncate max-w-[50%]">
                  <IconUser size="xs" />
                  <span class="truncate">{{ getCreatorText(paste.created_by, paste.key_name) }}</span>
                </span>

                <!-- Right: Time -->
                <span class="flex items-center gap-1 flex-shrink-0">
                  <IconCalendar size="xs" />
                  <time :datetime="paste.created_at" :title="formatDateTime(paste.created_at)">
                    {{ formatRelativeTime(paste.created_at) }}
                  </time>
                </span>
              </div>
            </div>

            <!-- Hover Overlay -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            >
              <div class="absolute bottom-4 left-4 right-4">
                <span
                  class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-primary-600/90 backdrop-blur-sm"
                >
                  点击查看
                  <IconChevronRight size="sm" class="ml-1" />
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-2 mt-8"
        >
          <button
            :disabled="currentPage === 1"
            @click.stop="handlePageChange(currentPage - 1)"
            class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'"
          >
            <IconChevronLeft size="md" />
          </button>

          <div class="flex items-center gap-1">
            <button
              v-for="page in [...Array(Math.min(5, totalPages)).keys()].map(i => Math.max(1, currentPage - 2) + i).filter(p => p <= totalPages)"
              :key="page"
              @click.stop="handlePageChange(page)"
              class="w-10 h-10 rounded-lg font-medium transition-colors"
              :class="page === currentPage
                ? (darkMode ? 'bg-primary-600 text-white' : 'bg-primary-600 text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')"
            >
              {{ page }}
            </button>
          </div>

          <button
            :disabled="currentPage === totalPages"
            @click.stop="handlePageChange(currentPage + 1)"
            class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'"
          >
            <IconChevronRight size="md" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card hover effect */
.paste-card {
  transform: translateY(0);
}

.paste-card:hover {
  transform: translateY(-2px);
}

/* Keyboard focus */
.paste-card:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--color-primary-500);
}
</style>
