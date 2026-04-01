import { ApiStatus, UserType, DbTables } from "../constants/index.js";
import { jsonOk } from "../utils/common.js";
import { resolvePrincipal } from "../security/helpers/principal.js";
import { useRepositories } from "../utils/repositories.js";
import { getEncryptionSecret } from "../utils/environmentUtils.js";
import { NotFoundError } from "../http/errors.js";

/**
 * 首页展示路由
 * 获取公开分享列表用于首页展示
 */

// 可选解析当前访问者身份
const resolveOptionalPrincipal = (c) => {
  try {
    const identity = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN, UserType.API_KEY], allowGuest: true });
    return identity;
  } catch (e) {
    return null;
  }
};

export const registerHomeRoutes = (router) => {
  /**
   * 获取首页分享列表
   * GET /api/home/shares
   * 返回公开的文本分享和文件分享
   */
  router.get("/api/home/shares", async (c) => {
    const db = c.env.DB;
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const type = c.req.query("type") || "all"; // all, paste, file
    const identity = resolveOptionalPrincipal(c);

    const results = [];

    // 获取文本分享
    const shouldFetchPastes = type === "all" || type === "paste";
    if (shouldFetchPastes) {
      try {
        let pastesConditions = [];
        let pastesParams = [];

        // 非管理员/API用户只能看公开分享或自己创建的
        if (!identity?.isAdmin) {
          if (identity?.type === UserType.API_KEY && identity?.userId) {
            pastesConditions.push("(is_public = 1 OR created_by = ?)");
            pastesParams.push(`apikey:${identity.userId}`);
          } else {
            pastesConditions.push("is_public = 1");
          }
        }

        const whereClause = pastesConditions.length > 0 ? `WHERE ${pastesConditions.join(" AND ")}` : "";
        const pasteResults = await db.prepare(`
          SELECT id, slug, title, remark, created_at, views, expires_at, max_views, is_public, password IS NOT NULL as has_password, created_by
          FROM ${DbTables.PASTES}
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ?
        `).bind(...pastesParams, limit).all();

        for (const paste of pasteResults.results || []) {
          // 检查是否过期
          if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
            continue;
          }
          
          results.push({
            id: paste.id,
            slug: paste.slug,
            type: "paste",
            title: paste.title || "无标题",
            remark: paste.remark || "",
            createdAt: paste.created_at,
            views: paste.views || 0,
            isPublic: paste.is_public === 1,
            hasPassword: !!paste.has_password,
          });
        }
      } catch (error) {
        console.error("获取文本分享失败:", error);
      }
    }

    // 获取文件分享
    const shouldFetchFiles = type === "all" || type === "file";
    if (shouldFetchFiles) {
      try {
        let filesConditions = [];
        let filesParams = [];

        // 非管理员/API用户只能看公开分享或自己创建的
        if (!identity?.isAdmin) {
          if (identity?.type === UserType.API_KEY && identity?.userId) {
            // API用户可以看到自己创建的
            filesConditions.push("created_by = ?");
            filesParams.push(`apikey:${identity.userId}`);
          } else {
            // 匿名用户暂不显示文件（files表没有is_public字段）
          }
        }

        if (filesConditions.length > 0 || identity?.isAdmin || identity?.type === UserType.API_KEY) {
          const whereClause = filesConditions.length > 0 ? `WHERE ${filesConditions.join(" AND ")}` : "";
          const fileResults = await db.prepare(`
            SELECT id, slug, filename, mimetype, size, created_at, views, expires_at, max_views, created_by, password
            FROM ${DbTables.FILES}
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ?
          `).bind(...filesParams, limit).all();

          for (const file of fileResults.results || []) {
            // 检查是否过期
            if (file.expires_at && new Date(file.expires_at) < new Date()) {
              continue;
            }
            
            const isImage = file.mimetype?.startsWith("image/");
            const isVideo = file.mimetype?.startsWith("video/");
            const isAudio = file.mimetype?.startsWith("audio/");
            
            results.push({
              id: file.id,
              slug: file.slug,
              type: "file",
              title: file.filename,
              mimetype: file.mimetype,
              size: file.size,
              createdAt: file.created_at,
              views: file.views || 0,
              hasPassword: !!file.password,
              category: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "document",
            });
          }
        }
      } catch (error) {
        console.error("获取文件分享失败:", error);
      }
    }

    // 按创建时间排序
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 限制返回数量
    const limitedResults = results.slice(0, limit);

    return jsonOk(c, {
      results: limitedResults,
      total: limitedResults.length,
      hasMore: results.length > limit,
    }, "获取成功");
  });
};
