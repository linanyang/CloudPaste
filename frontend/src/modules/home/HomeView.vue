<template>
  <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl w-full pt-8 sm:pt-12 pb-20 space-y-10">
    <!-- 分享概览 -->
    <div>
      <h2 class="text-lg sm:text-xl font-semibold mb-4">{{ $t("home.overview") }}</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          :class="[
            'rounded-xl p-4 sm:p-5 transition-colors',
            darkMode ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-token-1',
          ]"
        >
          <div class="text-2xl sm:text-3xl font-bold mb-1" :class="darkMode ? 'text-primary-400' : 'text-primary-600'">
            {{ stat.value }}
          </div>
          <div class="text-xs sm:text-sm opacity-60">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 最近分享 -->
    <div>
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg sm:text-xl font-semibold">{{ $t("home.recentShares") }}</h2>
        <button
          v-if="!loading"
          class="text-sm px-3 py-1.5 rounded-md transition-colors"
          :class="darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'"
          @click="loadShares"
        >
          <svg class="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ $t("home.refresh") }}
        </button>
      </div>

      <!-- 加载骨架 -->
      <div v-if="loading && shares.length === 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="i in 6"
          :key="'sk-' + i"
          :class="[
            'rounded-xl p-5 animate-pulse',
            darkMode ? 'bg-gray-800/60' : 'bg-gray-100',
          ]"
        >
          <div class="h-4 rounded w-3/4 mb-3" :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'"></div>
          <div class="h-3 rounded w-1/2" :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="shares.length === 0"
        :class="[
          'text-center py-16 rounded-xl border-2 border-dashed',
          darkMode ? 'border-gray-700' : 'border-gray-200',
        ]"
      >
        <svg class="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p class="text-sm opacity-50">{{ $t("home.noShares") }}</p>
      </div>

      <!-- 分享卡片列表 -->
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="share in shares"
          :key="share.type + '-' + share.slug"
          @click="goToShare(share)"
          :class="[
            'group relative block rounded-xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer',
            'hover:shadow-token-2 hover:-translate-y-0.5',
            darkMode
              ? 'bg-gray-800/60 border-gray-700/50 hover:border-gray-600'
              : 'bg-white border-gray-100 hover:border-gray-200',
          ]"
        >
          <!-- 快捷操作按钮：编辑 / 删除（右上角悬浮） -->
          <div class="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <button
              v-if="share.type === 'text'"
              type="button"
              :title="$t('common.edit') || '编辑'"
              class="p-1.5 rounded-full transition-all duration-150 opacity-60 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              :class="darkMode ? 'text-gray-400 hover:text-primary-400 hover:bg-gray-700/70' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'"
              @click.stop.prevent="openPasswordGate(share, 'edit')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              type="button"
              :title="$t('common.delete') || '删除'"
              class="p-1.5 rounded-full transition-all duration-150 opacity-60 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              :class="darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700/70' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'"
              @click.stop.prevent="openPasswordGate(share, 'delete')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
          <!-- 类型徽标 + 文件名 -->
          <div class="flex items-center gap-3 mb-3">
            <div
              :class="[
                'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold',
                share.type === 'text'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
              ]"
            >
              <!-- 文本图标 -->
              <svg v-if="share.type === 'text'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <!-- 文件图标 -->
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
            </div>
            <span
              class="text-sm font-medium truncate"
              :title="share.type === 'text' ? (share.title || share.remark || share.slug) : share.filename"
            >
              {{ share.type === 'text' ? (share.title || share.remark || share.slug) : share.filename }}
            </span>
          </div>

          <!-- 内容预览框 -->
          <div
            :class="[
              'rounded-lg px-3 py-2.5 mb-3 min-h-[3rem] flex items-start text-sm leading-relaxed line-clamp-2',
              darkMode ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-600',
            ]"
          >
            {{ share.remark || (share.type === 'text' ? share.slug : share.filename) }}
          </div>

          <!-- 元信息行 -->
          <div class="flex items-center gap-3 text-xs opacity-50">
            <!-- 文件大小 -->
            <span v-if="share.type === 'file'" class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
              </svg>
              {{ formatSize(share.size) }}
            </span>
            <!-- 浏览量 -->
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              {{ share.views }}
              <span v-if="share.maxViews">/{{ share.maxViews }}</span>
            </span>
            <!-- 密码保护 -->
            <span v-if="share.hasPassword" class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </span>
            <!-- 时间 -->
            <span class="ml-auto">{{ formatTime(share.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码验证弹窗（密码保护内容的快捷编辑/删除前置校验） -->
    <div v-if="pwdGate.visible" class="fixed inset-0 z-50 flex items-center justify-center px-4" @click.self="closePasswordGate">
      <div class="absolute inset-0 bg-black/50"></div>
      <div
        class="relative w-full max-w-sm rounded-xl p-6 shadow-xl"
        :class="darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'"
      >
        <h3 class="text-base font-semibold mb-1">
          {{ pwdGate.action === 'edit' ? ($t('common.edit') || '编辑') : ($t('common.delete') || '删除') }}
        </h3>
        <p class="text-xs opacity-60 mb-4 break-all">
          {{ $t('home.passwordProtected') || '该内容受密码保护，请输入访问密码以继续' }}
        </p>
        <input
          v-model="pwdGate.password"
          type="password"
          class="form-input w-full mb-4"
          :placeholder="$t('paste.passwordPlaceholder') || '请输入密码'"
          @keyup.enter="confirmPasswordGate"
        />
        <p v-if="pwdGate.error" class="text-xs text-red-500 mb-3">{{ pwdGate.error }}</p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-md text-sm transition-colors"
            :class="darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'"
            @click="closePasswordGate"
          >
            {{ $t('common.cancel') || '取消' }}
          </button>
          <button
            type="button"
            :disabled="pwdGate.loading"
            class="px-3 py-1.5 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-60 transition-colors"
            @click="confirmPasswordGate"
          >
            {{ pwdGate.loading ? ($t('common.loading') || '处理中…') : ($t('common.confirm') || '确认') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 悬浮操作按钮 (FAB) -->
    <div class="fixed right-5 bottom-5 sm:right-8 sm:bottom-8 flex flex-col gap-3 z-40">
      <!-- 文本分享按钮 -->
      <router-link
        to="/editor"
        :title="$t('home.createText')"
        :class="[
          'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
          'hover:scale-110 active:scale-95',
          darkMode
            ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-900/30'
            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/30',
        ]"
      >
        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </router-link>
      <!-- 文件上传按钮 -->
      <router-link
        to="/upload"
        :title="$t('home.uploadFile')"
        :class="[
          'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
          'hover:scale-110 active:scale-95',
          darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-900/30 border border-gray-600'
            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-gray-300/50 border border-gray-200',
        ]"
      >
        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useThemeMode } from "@/composables/core/useThemeMode.js";
import { getRecentShares } from "@/api/services/publicService.js";
import { getPaste, batchDeletePastes } from "@/api/services/pasteService.js";
import { batchDeleteFiles, verifyFilePassword } from "@/api/services/fileService.js";

const { t } = useI18n();
const { isDarkMode: darkMode } = useThemeMode();
const router = useRouter();

const shares = ref([]);
const loading = ref(true);
const error = ref(null);

const textCount = computed(() => shares.value.filter((s) => s.type === "text").length);
const fileCount = computed(() => shares.value.filter((s) => s.type === "file").length);
const totalViews = computed(() => shares.value.reduce((acc, s) => acc + (s.views || 0), 0));

const stats = computed(() => [
  { label: t("home.statTextShares"), value: textCount.value },
  { label: t("home.statFileShares"), value: fileCount.value },
  { label: t("home.statTotalShares"), value: shares.value.length },
  { label: t("home.statTotalViews"), value: totalViews.value },
]);

function getShareUrl(share) {
  if (share.type === "text") return `/paste/${share.slug}`;
  return `/file/${share.slug}`;
}

function goToShare(share) {
  router.push(getShareUrl(share));
}

// ===== 密码门 + 快捷编辑/删除 =====
const pwdGate = reactive({
  visible: false,
  loading: false,
  error: "",
  password: "",
  share: null,
  action: null, // 'edit' | 'delete'
});

function openPasswordGate(share, action) {
  // 公开内容：编辑直接跳编辑器；删除需一次确认
  if (!share.hasPassword) {
    if (action === "edit") {
      startEdit(share);
    } else {
      doDelete(share);
    }
    return;
  }
  pwdGate.visible = true;
  pwdGate.error = "";
  pwdGate.password = "";
  pwdGate.share = share;
  pwdGate.action = action;
}

function closePasswordGate() {
  pwdGate.visible = false;
  pwdGate.loading = false;
  pwdGate.share = null;
  pwdGate.action = null;
}

async function confirmPasswordGate() {
  if (!pwdGate.password || !pwdGate.share) return;
  pwdGate.loading = true;
  pwdGate.error = "";
  const share = pwdGate.share;
  const action = pwdGate.action;
  try {
    // 通过公开接口验证密码：GET/POST /paste/:slug 携带密码
    if (share.type === "text") {
      await getPaste(share.slug, pwdGate.password);
    } else {
      await verifyFilePassword(share.slug, pwdGate.password);
    }
    closePasswordGate();
    if (action === "edit") {
      startEdit(share, pwdGate.password);
    } else {
      doDelete(share);
    }
  } catch (e) {
    pwdGate.error = e?.message || "密码错误或验证失败";
  } finally {
    pwdGate.loading = false;
  }
}

function startEdit(share, password = "") {
  if (share.type !== "text") return;
  const query = { edit: share.slug };
  if (password) query.pwd = password;
  router.push({ path: "/editor", query });
}

async function doDelete(share) {
  const label = share.type === "text" ? share.title || share.slug : share.filename;
  if (!window.confirm(`${t("common.delete") || "删除"}「${label}」？${t("home.deleteConfirm") || "此操作不可恢复。"}`)) {
    return;
  }
  try {
    if (share.type === "text") {
      await batchDeletePastes([share.id]);
    } else {
      await batchDeleteFiles([share.id], "both");
    }
    showResult(true, `${t("common.delete") || "删除"}「${label}」成功`);
    await loadShares();
  } catch (e) {
    // 401/403：未登录或无管理权限
    showResult(false, e?.status === 401 || e?.response?.status === 401
      ? t("home.needLoginToDelete") || "请先登录管理员账号或使用具有管理权限的 API 密钥后再删除"
      : (e?.message || t("common.deleteFailed") || "删除失败"));
  }
}

function showResult(ok, msg) {
  window.alert(msg);
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${val} ${units[i]}`;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return t("home.justNow");
  if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t("home.minutesAgo")}`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t("home.hoursAgo")}`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} ${t("home.daysAgo")}`;

  return date.toLocaleDateString();
}

async function loadShares() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getRecentShares(30);
    shares.value = res?.data?.results || res?.results || [];
  } catch (e) {
    console.error("Failed to load recent shares:", e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadShares();
});
</script>
