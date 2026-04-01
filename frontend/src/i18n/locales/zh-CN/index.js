import admin from "./admin.js";
import common from "./common.js";
import fileView from "./fileView.js";
import markdown from "./markdown.js";
import mount from "./mount.js";
import upload from "./upload.js";
import fileBasket from "./fileBasket.js";
import search from "./search.js";
import pwa from "./pwa.js";
import gallery from "./gallery.js";

export default {
  ...admin,
  ...common,
  ...fileView,
  ...markdown,
  ...mount,
  ...upload,
  ...fileBasket,
  ...search,
  ...pwa,
  ...gallery,
  announcement: {
    title: "公告",
    dontShowAgain: "不再提示",
    gotIt: "我知道了",
  },
  // 首页展示
  home: {
    title: "我的分享",
    subtitle: "查看您创建的所有分享",
    newShare: "新建分享",
    loginRequired: "需要登录",
    loginHint: "请登录后查看您的分享记录",
    noShares: "暂无分享",
    noSharesHint: "您还没有创建任何分享",
    createFirst: "创建第一个分享",
    fetchError: "获取分享列表失败",
    loadMoreError: "加载更多失败",
  },
  time: {
    justNow: "刚刚",
    minutesAgo: "分钟前",
    hoursAgo: "小时前",
    daysAgo: "天前",
  },
};
