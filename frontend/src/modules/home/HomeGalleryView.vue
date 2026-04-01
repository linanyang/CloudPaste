<template>
  <div class="home-gallery-container mx-auto px-3 sm:px-6 flex-1 flex flex-col pt-4 sm:pt-6 w-full max-w-full sm:max-w-7xl">
    <!-- 页面标题 -->
    <div class="header mb-4 border-b pb-3" :class="props.darkMode ? 'border-gray-700' : 'border-gray-200'">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-xl font-semibold">{{ $t("home.title") || "我的分享" }}</h2>
          <p class="text-sm mt-1" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'">
            {{ $t("home.subtitle") || "查看您创建的所有分享" }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="refreshShares"
            :disabled="loading"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5"
            :class="props.darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'"
          >
            <IconRefresh :class="{ 'animate-spin': loading }" size="sm" />
            {{ $t("common.refresh") || "刷新" }}
          </button>
          <router-link
            to="/editor"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5"
            :class="props.darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'"
          >
            <IconPlus size="sm" />
            {{ $t("home.newShare") || "新建分享" }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 未登录提示 -->
    <div v-if="!isAuthenticated && !loading" class="flex-1 flex items-center justify-center">
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :class="props.darkMode ? 'bg-gray-800' : 'bg-gray-100'">
          <IconLockClosed size="xl" :class="props.darkMode ? 'text-gray-500' : 'text-gray-400'" />
        </div>
        <h3 class="text-lg font-medium mb-2">{{ $t("home.loginRequired") || "需要登录" }}</h3>
        <p class="text-sm mb-4" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'">
          {{ $t("home.loginHint") || "请登录后查看您的分享记录" }}
        </p>
        <router-link
          to="/admin/login"
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="props.darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'"
        >
          {{ $t("nav.admin") || "登录" }}
        </router-link>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center py-12">
        <IconRefresh class="animate-spin mx-auto mb-3" size="xl" :class="props.darkMode ? 'text-primary-400' : 'text-primary-500'" />
        <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'">{{ $t("common.loading") || "加载中..." }}</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="shares.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :class="props.darkMode ? 'bg-gray-800' : 'bg-gray-100'">
          <IconDocument :class="props.darkMode ? 'text-gray-500' : 'text-gray-400'" size="xl" />
        </div>
        <h3 class="text-lg font-medium mb-2">{{ $t("home.noShares") || "暂无分享" }}</h3>
        <p class="text-sm mb-4" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'">
          {{ $t("home.noSharesHint") || "您还没有创建任何分享" }}
        </p>
        <router-link
          to="/editor"
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="props.darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'"
        >
          {{ $t("home.createFirst") || "创建第一个分享" }}
        </router-link>
      </div>
    </div>

    <!-- 分享卡片网格 -->
    <div v-else class="flex-1">
      <!-- 分类筛选 -->
      <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          @click="currentFilter = filter.value"
          class="px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors"
          :class="currentFilter === filter.value 
            ? (props.darkMode ? 'bg-primary-600 text-white' : 'bg-primary-500 text-white')
            : (props.darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- 瀑布流卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="share in filteredShares"
          :key="share.id"
          @click="openShare(share)"
          class="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg"
          :class="props.darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50 shadow-sm'"
        >
          <!-- 卡片预览区 -->
          <div class="aspect-video relative overflow-hidden">
            <!-- 文件类型预览 -->
            <template v-if="share.type === 'file'">
              <img
                v-if="share.category === 'image'"
                :src="getFilePreviewUrl(share)"
                :alt="share.title"
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                @error="handleImageError"
              />
              <div
                v-else-if="share.category === 'video'"
                class="w-full h-full flex items-center justify-center"
                :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-100'"
              >
                <IconVideo size="3xl" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'" />
              </div>
              <div
                v-else-if="share.category === 'audio'"
                class="w-full h-full flex items-center justify-center"
                :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-100'"
              >
                <IconMusic size="3xl" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'" />
              </div>
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-100'"
              >
                <IconDocument size="3xl" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'" />
              </div>
            </template>
            
            <!-- 文本类型预览 -->
            <template v-else>
              <div
                class="w-full h-full flex items-center justify-center p-4"
                :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-100'"
              >
                <div class="text-center">
                  <IconDocumentText size="3xl" class="mx-auto mb-2" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'" />
                  <p class="text-xs truncate max-w-full" :class="props.darkMode ? 'text-gray-500' : 'text-gray-400'">
                    {{ share.title || '无标题' }}
                  </p>
                </div>
              </div>
            </template>

            <!-- 密码保护标识 -->
            <div
              v-if="share.hasPassword"
              class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
              :class="props.darkMode ? 'bg-gray-900/70 text-yellow-400' : 'bg-white/80 text-yellow-600'"
            >
              <IconLockClosed size="xs" />
              {{ $t("common.protected") || "加密" }}
            </div>

            <!-- 类型标签 -->
            <div
              class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
              :class="getTypeBadgeClass(share)"
            >
              <IconDocument v-if="share.type === 'paste'" size="xs" />
              <IconFile v-else size="xs" />
              {{ share.type === 'paste' ? ($t("common.text") || "文本") : ($t("common.file") || "文件") }}
            </div>
          </div>

          <!-- 卡片信息区 -->
          <div class="p-3">
            <h3 class="font-medium text-sm truncate mb-1">{{ share.title || $t("common.untitled") || "无标题" }}</h3>
            <div class="flex items-center justify-between text-xs" :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'">
              <span class="flex items-center gap-1">
                <IconEye size="xs" />
                {{ share.views || 0 }}
              </span>
              <span>{{ formatDate(share.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="text-center py-6">
        <button
          @click="loadMore"
          :disabled="loadingMore"
          class="px-6 py-2 text-sm rounded-lg transition-colors"
          :class="props.darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'"
        >
          <IconRefresh v-if="loadingMore" class="animate-spin mr-1.5" size="xs" />
          {{ loadingMore ? ($t("common.loading") || "加载中...") : ($t("common.loadMore") || "加载更多") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/api";
import { useGlobalMessage } from "@/composables/core/useGlobalMessage";
import { createLogger } from "@/utils/logger";
import {
  IconRefresh,
  IconPlus,
  IconLockClosed,
  IconDocument,
  IconDocumentText,
  IconFile,
  IconEye,
  IconVideo,
  IconMusic,
} from "@/components/icons";

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const log = createLogger("HomeGallery");
const { showError } = useGlobalMessage();

// Props
const props = defineProps({
  darkMode: {
    type: Boolean,
    default: false,
  },
});

// State
const loading = ref(false);
const loadingMore = ref(false);
const shares = ref([]);
const hasMore = ref(false);
const currentFilter = ref("all");

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);

const filterOptions = computed(() => [
  { value: "all", label: t("common.all") || "全部" },
  { value: "paste", label: t("common.text") || "文本" },
  { value: "image", label: t("common.image") || "图片" },
  { value: "video", label: t("common.video") || "视频" },
  { value: "audio", label: t("common.audio") || "音频" },
  { value: "document", label: t("common.document") || "文档" },
]);

const filteredShares = computed(() => {
  if (currentFilter.value === "all") return shares.value;
  if (currentFilter.value === "paste") return shares.value.filter(s => s.type === "paste");
  return shares.value.filter(s => s.type === "file" && s.category === currentFilter.value);
});

// Methods
const fetchShares = async (limit = 20) => {
  try {
    loading.value = true;
    const response = await api.home.getHomeShares({ limit, type: "all" });
    
    if (response?.success && response?.data) {
      shares.value = response.data.results || [];
      hasMore.value = response.data.hasMore || false;
    }
  } catch (error) {
    log.error("获取分享列表失败:", error);
    showError(t("home.fetchError") || "获取分享列表失败");
  } finally {
    loading.value = false;
  }
};

const refreshShares = () => {
  fetchShares();
};

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;
  
  try {
    loadingMore.value = true;
    const response = await api.home.getHomeShares({ 
      limit: 20, 
      type: "all" 
    });
    
    if (response?.success && response?.data?.results) {
      // 追加新数据，去重
      const existingIds = new Set(shares.value.map(s => s.id));
      const newShares = response.data.results.filter(s => !existingIds.has(s.id));
      shares.value = [...shares.value, ...newShares];
      hasMore.value = response.data.hasMore || false;
    }
  } catch (error) {
    log.error("加载更多失败:", error);
    showError(t("home.loadMoreError") || "加载更多失败");
  } finally {
    loadingMore.value = false;
  }
};

const openShare = (share) => {
  if (share.type === "paste") {
    router.push(`/paste/${share.slug}`);
  } else {
    router.push(`/file/${share.slug}`);
  }
};

const getFilePreviewUrl = (share) => {
  // 返回文件预览URL，这里需要根据实际API调整
  return `/api/share/get/${share.slug}`;
};

const handleImageError = (event) => {
  // 图片加载失败时显示默认图标
  event.target.style.display = "none";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60000) return t("time.justNow") || "刚刚";
  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t("time.minutesAgo") || "分钟前"}`;
  // 小于24小时
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t("time.hoursAgo") || "小时前"}`;
  // 小于7天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} ${t("time.daysAgo") || "天前"}`;
  
  // 其他显示日期
  return date.toLocaleDateString();
};

const getTypeBadgeClass = (share) => {
  if (share.type === "paste") {
    return props.darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-700";
  }
  
  switch (share.category) {
    case "image":
      return props.darkMode ? "bg-green-900/70 text-green-300" : "bg-green-100 text-green-700";
    case "video":
      return props.darkMode ? "bg-purple-900/70 text-purple-300" : "bg-purple-100 text-purple-700";
    case "audio":
      return props.darkMode ? "bg-pink-900/70 text-pink-300" : "bg-pink-100 text-pink-700";
    default:
      return props.darkMode ? "bg-gray-900/70 text-gray-300" : "bg-gray-100 text-gray-700";
  }
};

// Lifecycle
onMounted(() => {
  if (isAuthenticated.value) {
    fetchShares();
  }
});
</script>

<style scoped>
.home-gallery-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片悬停效果 */
.group:hover .aspect-video img {
  transform: scale(1.05);
}

/* 滚动条美化 */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
