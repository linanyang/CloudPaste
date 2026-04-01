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
    title: "Announcement",
    dontShowAgain: "Mark as read",
    gotIt: "Got it",
  },
  // Home gallery
  home: {
    title: "My Shares",
    subtitle: "View all your created shares",
    newShare: "New Share",
    loginRequired: "Login Required",
    loginHint: "Please login to view your shares",
    noShares: "No Shares",
    noSharesHint: "You haven't created any shares yet",
    createFirst: "Create Your First Share",
    fetchError: "Failed to fetch shares",
    loadMoreError: "Failed to load more",
  },
  time: {
    justNow: "Just now",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
  },
};
