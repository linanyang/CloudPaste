/**
 * 公开分享列表路由
 * 无需认证，返回最近的公开分享（文本 + 文件），供首页展示
 */

import { jsonOk } from "../utils/common.js";
import { useRepositories } from "../utils/repositories.js";
import { DbTables } from "../constants/index.js";

/**
 * 查询最近公开分享
 * - 文本分享：is_public=1 且未过期
 * - 文件分享：无密码保护、未过期
 */
const registerPublicSharesRoutes = (router) => {
  router.get("/api/public/recent-shares", async (c) => {
    const db = c.env.DB;
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 20, 1), 100);
    const repositoryFactory = useRepositories(c);
    const pasteRepo = repositoryFactory.getPasteRepository();
    const fileRepo = repositoryFactory.getFileRepository();

    // 并行查询文本和文件
    const [pastes, files] = await Promise.all([
      // 最近公开文本分享（排除内容，只取摘要信息）
      db.prepare(
        `SELECT id, slug, title, remark, views, created_at, max_views,
                CASE WHEN password IS NOT NULL AND password != '' THEN 1 ELSE 0 END AS has_password
         FROM ${DbTables.PASTES}
         WHERE is_public = 1
           AND (expires_at IS NULL OR expires_at > datetime('now'))
         ORDER BY created_at DESC
         LIMIT ?`
      ).bind(limit).all(),

      // 最近文件分享（无密码保护、未过期）
      db.prepare(
        `SELECT f.id, f.slug, f.filename, f.size, f.mimetype, f.views,
                f.remark, f.created_at, f.max_views,
                CASE WHEN f.password IS NOT NULL AND f.password != '' THEN 1 ELSE 0 END AS has_password
         FROM ${DbTables.FILES} f
         WHERE (f.password IS NULL OR f.password = '')
           AND (f.expires_at IS NULL OR f.expires_at > datetime('now'))
         ORDER BY f.created_at DESC
         LIMIT ?`
      ).bind(limit).all(),
    ]);

    const textShares = (pastes.results || []).map((p) => ({
      type: "text",
      slug: p.slug,
      title: p.title || null,
      remark: p.remark || null,
      views: p.views || 0,
      maxViews: p.max_views || null,
      hasPassword: !!p.has_password,
      createdAt: p.created_at,
    }));

    const fileShares = (files.results || []).map((f) => ({
      type: "file",
      slug: f.slug,
      filename: f.filename,
      size: f.size || 0,
      mimetype: f.mimetype || "application/octet-stream",
      views: f.views || 0,
      maxViews: f.max_views || null,
      hasPassword: !!f.has_password,
      remark: f.remark || null,
      createdAt: f.created_at,
    }));

    // 合并并按时间排序
    const all = [...textShares, ...fileShares].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return jsonOk(
      c,
      {
        results: all.slice(0, limit),
        pagination: {
          limit,
          total: all.length,
        },
      },
      "获取成功"
    );
  });
};

export { registerPublicSharesRoutes };
export default { registerPublicSharesRoutes };
