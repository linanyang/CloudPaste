/**
 * 公开分享服务API
 * 无需认证的公开接口
 */

import { get } from "../client";

/**
 * 获取最近的公开分享列表（文本 + 文件）
 * @param {number} [limit=20] - 返回数量限制
 * @returns {Promise<Object>} 分享列表
 */
export async function getRecentShares(limit = 20) {
  return get(`public/recent-shares?limit=${limit}`);
}
