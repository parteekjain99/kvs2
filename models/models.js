const Sequelize = require("sequelize");

const { DataTypes } = require("sequelize");

var bcrypt = require("bcrypt");
const saltRounds = 10;

/* exports.User = sequelize.define("users", {
  name: {
    type: DataTypes.STRING,
  },
  last_name: {
    type: DataTypes.STRING,
    notEmpty: true,
    validate: {
      notEmpty: {
        msg: "Last Name cannot be empty",
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: {
        msg: "Email Not Valid!",
      },
    },
  },
  phone_no: {
    type: DataTypes.STRING,
  },

  country_code: {
    type: DataTypes.STRING,
  },
  profile_image: {
    type: DataTypes.STRING,
  },
  user_type:{
    type: DataTypes.ENUM,
    values: ["buisness", "non_buisness"],
  },
  password: {
    type: DataTypes.STRING,
    // set(value) {
    //   // Storing passwords in plaintext in the database is terrible.
    //   // Hashing the value with an appropriate cryptographic hash function is better.
    //   this.setDataValue("password", bcrypt.hashSync(value, saltRounds));
    // },
  },
  location: {
    type: DataTypes.STRING,
  },

  status: {
    type: DataTypes.ENUM,
    values: ["active", "inactive"],
  },
  language: {
    type: DataTypes.ENUM,
    values: ["en", "hi"],
  },
  blockExpires: {
    type: DataTypes.DATE,
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
  },
  verified: {
    // default is 0
    type: DataTypes.TINYINT,
  },
  verification: {
    type: DataTypes.STRING,
  },
  forgot_password_otp: {
    // default is null
    type: DataTypes.INTEGER,
  },
  forgot_password_otp_time: {
    // default is null
    type: DataTypes.DATE,
  },
  data_saver: {
    type: DataTypes.ENUM,
    values: ["true", "false"],
  },
  created_at: {
    type: DataTypes.DATE,
  },
  updated_at: {
    type: DataTypes.DATE,
  },
}); */

exports.User = sequelize.define("users", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  stripe_customer_id: {
    type: DataTypes.STRING,
  },
  reciveNotification: { type: DataTypes.ENUM, values: ["true", "false"] },
  name: { type: DataTypes.STRING },
  businessname: { type: DataTypes.STRING },
  website: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  alternatePhoneno: { type: DataTypes.STRING },
  phone_no: { type: DataTypes.STRING },
  whatsapp_no: { type: DataTypes.STRING },
  dob: { type: DataTypes.STRING },
  profile_image: { type: DataTypes.STRING },
  otp: { type: DataTypes.STRING },
  username: { type: DataTypes.STRING },
  business_category: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  decoded_password: { type: DataTypes.STRING },
  forgot_password_otp: { type: DataTypes.STRING },
  forgot_password_otp_time: { type: DataTypes.DATE },
  country_code: { type: DataTypes.STRING },
  bio: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  pincode: { type: DataTypes.INTEGER },
  complete_address: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM, values: ["user", "business"] },
  followers_list: { type: DataTypes.JSON },
  following_list: { type: DataTypes.JSON },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
  // follow: {
  //   type: DataTypes.INTEGER,
  //   allowNull: false ,
  //   reference:{
  //     model : 'follow',
  //     key:'id'
  //   }
  // },
});

exports.UserAccess = sequelize.define("user_accesses", {
  email: {
    type: DataTypes.STRING,
  },
  ip: {
    type: DataTypes.STRING,
  },
  browser: {
    type: DataTypes.STRING,
  },
  country: {
    type: DataTypes.STRING,
  },
  created_at: {
    type: DataTypes.DATE,
  },
  updated_at: {
    type: DataTypes.DATE,
  },
});

exports.Cms = sequelize.define("cms", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: {
    type: DataTypes.ENUM,
    values: [
      "help",
      "about_us",
      "privacy_policy",
      "terms_condition",
      "our_values",
      "our_missions",
      "referrals",
      "blogs",
      "subscriptions",
      "partnership",
    ],
  },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  // privacy_policy:{ type: DataTypes.STRING },
  image: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Faq = sequelize.define("faqs", {
  // id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  question: { type: DataTypes.TEXT("long") },
  answer: { type: DataTypes.TEXT("long") },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.help = sequelize.define("helps", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: {
    type: DataTypes.ENUM,
    values: ["services", "products"],
  },
  subject: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.businessType = sequelize.define("businessType", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enquiry: {
    type: DataTypes.ENUM,
    values: ["Sole_Proprietorships", "Partnerships", "Corporations"],
  },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Posts = sequelize.define("posts", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: { type: DataTypes.STRING },
  title: { type: DataTypes.STRING },
  media_type: { type: DataTypes.STRING },
  unit:{ type: DataTypes.STRING },
  whatsapp_no: { type: DataTypes.STRING },
  quantity:{ type: DataTypes.STRING },
  gmail:{ type: DataTypes.STRING },
  isShow: { type: DataTypes.TINYINT, defaultValue: 1 },
  post_image: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM, values: ["user", "business"] },
  type: { type: DataTypes.ENUM, values: ["posts", "BusinessRequirment"] },
  BusinessRequirment_image: { type: DataTypes.STRING },
  business_category: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  Required_goods: { type: DataTypes.STRING },
  user_id: { type: DataTypes.INTEGER },
  posted_date: { type: DataTypes.DATE },
  total_dislikes: { type: DataTypes.INTEGER },
  total_likes: { type: DataTypes.INTEGER },

  status: {
    type: DataTypes.ENUM,
    values: ["reported", "rejected", "active", "pending"],
  },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.groupPosts = sequelize.define("group_posts", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: { type: DataTypes.STRING },
  title: { type: DataTypes.STRING },
  media_type: { type: DataTypes.STRING },
  post_image: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM, values: ["user", "business"] },
  user_id: { type: DataTypes.INTEGER },
  group_id: { type: DataTypes.INTEGER },
  total_dislikes: { type: DataTypes.INTEGER },
  total_likes: { type: DataTypes.INTEGER },
  isSaved: { type: DataTypes.TINYINT, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM,
    values: ["reported", "rejected", "active", "pending"],
  },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.walkThrough = sequelize.define("walkThrough", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  image: { type: DataTypes.STRING },
  text: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Block = sequelize.define("BlockIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.STRING },
  BlockUserId: { type: DataTypes.STRING },
  reason: { type: DataTypes.STRING },
  isBlock: { type: DataTypes.TINYINT, defaultValue: 1 },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.reportUser = sequelize.define("reportUserIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.STRING },
  reportUserId: { type: DataTypes.STRING },
  reason: { type: DataTypes.STRING },
  AdditionalComments: { type: DataTypes.STRING },
});

exports.reportPost = sequelize.define("report_posts", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER },
  group_id: { type: DataTypes.INTEGER },
  report_postId: { type: DataTypes.INTEGER },
  report_post_userId: { type: DataTypes.INTEGER },
  reason: { type: DataTypes.STRING },
  details: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.reportGroup = sequelize.define("report_groups", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER },
  report_group_userId: { type: DataTypes.INTEGER },
  report_GroupId: { type: DataTypes.INTEGER },
  reason: { type: DataTypes.STRING },
  details: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.reasonToReport = sequelize.define("reportReasons", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reason: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.reasonToReportPost = sequelize.define("reason_to_reportposts", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reason: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.search = sequelize.define("searchIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  query: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING },
});

exports.recent = sequelize.define("recentvisitsIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.STRING },
  serchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    reference: {
      model: "User",
      key: "id",
    },
  },
  updated_at: { type: DataTypes.DATE },
});

exports.follow = sequelize.define("followIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  followId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    reference: {
      model: "User",
      key: "id",
    },
  },
  userId: { type: DataTypes.STRING },
  isFollow: { type: DataTypes.TINYINT, defaultValue: 1 },
  isFollowed: { type: DataTypes.TINYINT, defaultValue: 0 },
});

exports.Group = sequelize.define("GroupIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  profile_image: { type: DataTypes.STRING },
  // memberId: { type: DataTypes.JSON },
  userId: { type: DataTypes.STRING },
  grouptitle: { type: DataTypes.STRING },
  Description: { type: DataTypes.STRING },
  Group_catagory: { type: DataTypes.STRING },
  isDeleted: { type: DataTypes.TINYINT, defaultValue: 0 },
  created_at: { type: DataTypes.DATE },
});

exports.groupMembers = sequelize.define("group_member_ids", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.STRING },
  groupId: { type: DataTypes.STRING },
  isLeft: { type: DataTypes.TINYINT, defaultValue: 0 },
  created_at: { type: DataTypes.DATE },
});

exports.groupCatagory = sequelize.define("groupCatagoryIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  groupCatagory: { type: DataTypes.STRING },
  updated_at: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE },
});

exports.HelpType = sequelize.define("HelpTypeIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
});

exports.businessRequirment = sequelize.define("businessRequirmentIds", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  BusinessRequirment_image: { type: DataTypes.STRING },
  business_category: { type: DataTypes.STRING },
  // unit:{ type: DataTypes.STRING },
  // whatsapp_no: { type: DataTypes.STRING },
  // qyantity:{ type: DataTypes.STRING },
  // gmail:{ type: DataTypes.STRING },
  media_type: { type: DataTypes.ENUM, values: ["image", "video"] },
  city: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  Required_goods: { type: DataTypes.STRING },
  userId: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.postMedia = sequelize.define("post_medias", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  post_id: { type: DataTypes.INTEGER },
  group_id: { type: DataTypes.INTEGER },
  media_type: { type: DataTypes.STRING },
  media_url: { type: DataTypes.STRING },
  thumbnail: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.commentOnBusinessRequirment = sequelize.define(
  "comment_On_Business_RequirmentIds",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    requirment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
    },
    parent_id: {
      type: DataTypes.STRING,
    },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
  }
);

exports.commentOnPost = sequelize.define("comment_on_posts", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  group_id: {
    type: DataTypes.INTEGER,
  },
  comment: {
    type: DataTypes.STRING,
  },
  parent_id: {
    type: DataTypes.STRING,
  },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Follow_Following = sequelize.define("follow_followings", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: {
    type: DataTypes.ENUM,
    values: ["follow", "following"],
  },
  user_id: { type: DataTypes.INTEGER },
  follow_following_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE },
  // updated_at: { type: DataTypes.DATE },
});

exports.FCM = sequelize.define("fcm", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER },
  device_token: { type: DataTypes.STRING },
  device_id: { type: DataTypes.STRING },
  device_type: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.LikeDislike = sequelize.define("post_like_dislike", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER },
  group_id: { type: DataTypes.INTEGER },
  post_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Saved = sequelize.define("saved_post", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER },
  group_id: { type: DataTypes.INTEGER },
  post_id: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM, values: ["posts", "group"] },
  isSaved: { type: DataTypes.TINYINT, defaultValue: 1 },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Notification = sequelize.define("notifications", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sender_id: { type: DataTypes.INTEGER },
  receiver_id: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING },
  body: { type: DataTypes.STRING },
  profile_image: { type: DataTypes.STRING },
  status: {
    type: DataTypes.ENUM,
    values: ["read", "unread"],
  },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.Room = sequelize.define("roomId", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  room_id: { type: DataTypes.STRING },
  sender_id: { type: DataTypes.INTEGER },
  receiver_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});

exports.verifyotp = sequelize.define("verify_otp", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING },
  forgot_password_otp: { type: DataTypes.STRING },
});

exports.Payment = sequelize.define("payments", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER },
  payment_id: { type: DataTypes.STRING },
  duration: { type: DataTypes.STRING },
  start_date: { type: DataTypes.DATE },
  left_days: { type: DataTypes.STRING },
  end_date: { type: DataTypes.DATE },
  price: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
});
