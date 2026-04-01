/**
 * 首页展示服务API
 * 获取近期创建的文本分享和文件分享
 */

import { get } from "../client";

/**
 * 获取首页分享列表
 * @param {Object} options - 查询选项
 * @param {number} [options.limit=20] - 返回数量限制
 * @param {string} [options.type='all'] - 分享类型 (all, paste, file)
 * @returns {Promise<Object>} 分享列表
 */
export function getHomeShares({ limit = 20, type = "all" } = {}) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  if (type && type !== "all") {
    params.append("type", type);
  }
  return get(`/home/shares?${params.toString()}`);
}
