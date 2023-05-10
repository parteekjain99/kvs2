// var multer  = require('multer');
// var AWS = require('aws-sdk');
// var storage = multer.memoryStorage({
//     destination: function(req, file, callback) {
//         callback(null, '');
//     }
// });
const controller = require("../controllers/auth");
const validate = require("../controllers/auth.validate");
const AuthController = require("../controllers/auth");
const express = require("express");
const router = express.Router();
require("../../config/passport");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
const trimRequest = require("trim-request");

router.post(
  "/checkEmailAvailability",
  trimRequest.all,
  validate.checkEmailAvailability,
  controller.checkEmailAvailability
);

router.post(
  "/createroom",
  trimRequest.all,
  // validate.checkEmailAvailability,
  controller.createroom
);


router.post(
  "/checkuser",
  trimRequest.all,
  controller.checkuser
);


router.post("/help", trimRequest.all, controller.help);

router.post("/groups", trimRequest.all, controller.groups);

router.post(
  "/uploadgroupPosts/:group_id",
  trimRequest.all,
  controller.uploadgroupPosts
);

router.post("/addmember", trimRequest.all, controller.addmember);

router.get("/groupListing", trimRequest.all, controller.groupListing);

router.get("/getallroom", trimRequest.all, controller.getallroom);

router.get(
  "/commentListingbyPostId",
  trimRequest.all,
  controller.commentListingbyPostId
);

router.get(
  "/getnotificationListing",
  trimRequest.all,
  validate.blockUser,
  controller.getnotificationListing
);

router.get(
  "/getSubscriptionPlan",
  trimRequest.all,
  controller.getSubscriptionPlan
);

router.get("/groupdetails", trimRequest.all, controller.groupdetails);

router.patch(
  "/leaveGroup",
  trimRequest.all,
  validate.blockUser,
  controller.leaveGroup
);

router.patch(
  "/updateNotificationStatus",
  trimRequest.all,
  validate.blockUser,
  controller.updateNotificationStatus
);

router.patch(
  "/updateNotificationByUserid",
  trimRequest.all,
  validate.blockUser,
  controller.updateNotificationStatusbyNotificationid
);

router.post(
  "/savedbyPostId",
  trimRequest.all,
  // validate.blockUser,
  controller.savedbyPostId
);

router.get("/getFaq", trimRequest.all, controller.getFaq);

/*
 * Verify email route
 */
router.get("/verifyEmail/:token", trimRequest.all, controller.verifyEmail);

/*
 * Forgot password email generation route
 */
router.post(
  "/sendForgotPasswordEmail",
  trimRequest.all,
  controller.sendForgotPasswordEmail
);

router.get("/walkThrough", trimRequest.all, controller.walkThrough);

router.get("/serch", trimRequest.all, validate.search, controller.serch);

router.get(
  "/recentsearch",
  trimRequest.all,
  // validate.search,
  controller.recentsearch
);

router.get(
  "/getPostbyId",
  trimRequest.all,
  // validate.search,
  controller.getAllPostsbyId
);

router.delete(
  "/removers/:recentId",
  trimRequest.all,
  // validate.search,
  controller.removeRecentSerch
);

router.delete(
  "/removeAllRecentSerch",
  trimRequest.all,
  // validate.search,
  controller.removeAllRecentSerch
);

router.delete(
  "/deleteGroup",
  trimRequest.all,
  // validate.search,
  controller.deleteGroup
);

router.post(
  "/recentvisit/:serchId",
  trimRequest.all,
  // validate.blockUser,
  controller.recentvisit
);

router.get(
  "/getallrecentVisit",
  trimRequest.all,
  validate.blockUser,
  controller.getallrecentVisit
);

router.get(
  "/groupCatagory",
  trimRequest.all,
  //  validate.blockUser,
  controller.groupCatagory
);

router.post(
  "/blockUser",
  trimRequest.all,
  validate.blockUser,
  controller.blockUser
);

router.post(
  "/followUser",
  trimRequest.all,
  validate.blockUser,
  controller.followUser
);

router.post(
  "/reportPost",
  trimRequest.all,
  validate.blockUser,
  controller.reportPost
);
router.post(
  "/reportGroup",
  trimRequest.all,
  validate.blockUser,
  controller.reportGroup
);

router.post("/uploadMedia", trimRequest.all, controller.uploadMedia);

router.get(
  "/followingListing",
  trimRequest.all,
  validate.blockUser,
  controller.followingListing
);

router.get(
  "/SavedPostListing",
  trimRequest.all,
  // validate.blockUser,
  controller.SavedPostListing
);

router.get(
  "/PostreportresonListing",
  trimRequest.all,
  // validate.blockUser,
  controller.PostreportresonListing
);

router.get(
  "/followersListing",
  trimRequest.all,
  validate.blockUser,
  controller.followersListing
);

router.get(
  "/requirmentListing",
  trimRequest.all,
  validate.blockUser,
  controller.RequirmentListing
);

router.get(
  "/BussinessRequirmentDetails",
  trimRequest.all,
  validate.blockUser,
  controller.BussinessRequirmentDetails
);

router.patch(
  "/unfollowUser",
  trimRequest.all,
  validate.blockUser,
  controller.unfollowUser
);

router.patch(
  "/unBlockUser",
  trimRequest.all,
  validate.blockUser,
  controller.unBlockUser
);

router.post("/report", trimRequest.all, validate.blockUser, controller.report);

router.post(
  "/businessRequirment",
  trimRequest.all,
  validate.blockUser,
  controller.businessRequirment
);

router.get(
  "/reportresonListing",
  trimRequest.all,
  // validate.getAllPosts,
  controller.reportresonListing
);

router.post(
  "/uploadPosts",
  trimRequest.all,
  // validate.uploadPosts,
  controller.uploadPosts
);

// router.patch("/uploadMultipleImage", trimRequest.all,
// // validate.uploadPosts,
// controller.uploadMultipleImage);

/*
 * Register route
 */
router.post(
  "/register",
  trimRequest.all,
  // validate.register,
  controller.register
);

// router.post("/signup", controller.signup);
/*
 * Login route
 */
router.post("/login", trimRequest.all, validate.login, controller.login);

router.post(
  "/userResultById",
  trimRequest.all,
  // validate.searchResult,
  // controller.searchResult
  controller.userResultById
);

router.get(
  "/getallPosts",
  trimRequest.all,
  validate.getAllPosts,
  controller.getallPosts
);

router.get(
  "/getAllListing",
  trimRequest.all,
  validate.blockUser,
  controller.getAllListing
);

/*
 * Change password
 */
router.post("/resetPassword", trimRequest.all, controller.resetPassword);
/*
 * Forgot password
 */
router.post("/sendOtp", trimRequest.all, controller.sendOtp);

// submit Otp
router.post("/submitotp", trimRequest.all, controller.submitotp);

// ==========================\

router.post("/verifyOtp", trimRequest.all, controller.verifyOtp);

router.post("/forgotPassword", trimRequest.all, controller.forgotPassword);

router.post(
  "/follow",
  trimRequest.all,
  // requireAuth,
  controller.follow
);

router.post(
  "/unfollow",
  trimRequest.all,
  // requireAuth,
  controller.unfollow
);

router.get(
  "/getFollowingList",
  trimRequest.all,
  // requireAuth,
  controller.getFollowingList
);

router.get(
  "/getFollowerList",
  trimRequest.all,
  // requireAuth,
  controller.getFollowerList
);

router.get(
  "/allPostListing",
  trimRequest.all,
  validate.blockUser,
  controller.allPostListing
);


router.get(
  "/getmemberListing",
  trimRequest.all,
  validate.blockUser,
  controller.getmemberListing
);

router.get(
  "/getAllmembersAccordingbyGroupId",
  trimRequest.all,
  validate.blockUser,
  controller.getAllmembersAccordingbyGroupId
);

router.post(
  "/commentOnbusinessRequirment",
  trimRequest.all,
  // requireAuth,
  controller.commentOnbusinessRequirment
);

router.post(
  "/commentonpost",
  trimRequest.all,
  // requireAuth,
  controller.commentOnPost
);

router.get(
  "/allGroupPostListing",
  trimRequest.all,
  // requireAuth,
  controller.allGroupPostListing
);

router.get(
  "/commentListing",
  trimRequest.all,
  // requireAuth,
  controller.commentListing
);

router.get(
  "/likeListing",
  trimRequest.all,
  // requireAuth,
  controller.likeListing
);

router.post(
  "/addFCM",
  trimRequest.all,
  // requireAuth,
  controller.addFCM
);

router.post(
  "/removeFCM",
  trimRequest.all,
  // requireAuth,
  controller.removeFCM
);

router.post(
  "/postLike",
  trimRequest.all,
  // requireAuth,
  controller.postLike
);

router.get("/shareLinkforpostId", trimRequest.all, controller.shareLinkforpostId);
router.get("/shareLinkforScreentype", trimRequest.all, controller.shareLinkforScreentype);
router.get("/shareLinkforUserid", trimRequest.all, controller.shareLinkforUserid);
router.post("/payment", trimRequest.all, validate.payment, controller.payment);

router.post("/startStream", trimRequest.all,validate.startStream, controller.startStream);
router.post("/endStream", trimRequest.all,validate.endStream, controller.endStream);
router.post("/streamerToken", trimRequest.all,validate.streamerToken, controller.streamerToken);
router.post("/audienceToken", trimRequest.all, controller.audienceToken);

router.post("/sendNotification", trimRequest.all, controller.sendNotification);
router.post("/getPostById", trimRequest.all, controller.getPostById);

module.exports = router;
