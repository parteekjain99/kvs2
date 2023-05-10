const {
  User,
  recent,
  follow,
  Follow_Following,
  businessRequirment,
  Posts,
  postMedia,
  commentOnPost,
  LikeDislike,
  Saved,
  groupPosts,
  Room,
  commentOnBusinessRequirment,
  Group,
  groupMembers,
} = require("./models");

// /********************** Users **********************/
User.hasMany(recent);
recent.belongsTo(User, {
  foreignKey: "serchId",
  target: 'id',
  as: "userData",
});

User.hasMany(follow);
follow.belongsTo(User, {
  foreignKey: "followId",
  target: 'id',
  as: "Data",
});


User.hasMany(follow);
follow.belongsTo(User, {
  foreignKey: "userId",
  target: 'id',
  as: "userData",
});


Room.belongsTo(User, {
  foreignKey: "receiver_id",
  target: 'id',
  as: "userData",
});

Room.belongsTo(User, {
  foreignKey: "sender_id",
  target: 'id',
  as: "userDatas",
});

groupMembers.belongsTo(User, {
  foreignKey: "userId",
  target: 'id',
  as: "userData",
});

// User.hasMany(Room, {
//   foreignKey: 'receiver_id', 
//   // foreignKey: 'id', 
//   // sourceKey: 'id',
//   // target: 'user_id',
//   as : "userData"
// });

// User.hasMany(Room, {
//   foreignKey: 'sender_id', 
//   // foreignKey: 'id', 
//   // sourceKey: 'id',
//   // target: 'user_id',
//   as : "userDatas"
// });


Posts.hasMany(postMedia, {
  foreignKey: 'post_id', 
  // foreignKey: 'id', 
  // sourceKey: 'id',
  // target: 'user_id',
  as : "image"
});


groupPosts.hasMany(postMedia, {
  foreignKey: 'post_id', 
  // foreignKey: 'id', 
  // sourceKey: 'id',
  // target: 'user_id',
  as : "image"
});



Saved.hasMany(Posts, {
  foreignKey: 'id', 
  // foreignKey: 'id', 
  sourceKey: 'post_id',
  // target: 'user_id',
  as : "postdetails"
});

Saved.hasMany(postMedia, {
  foreignKey: 'post_id', 
  // foreignKey: 'id', 
  sourceKey: 'post_id',
  // target: 'user_id',
  as : "images"
});

Saved.belongsTo(User, {
  foreignKey: 'user_id', 
  // foreignKey: 'id', 
  // sourceKey: 'user_id',
  // target: 'user_id',
  as : "user_detail"
});


LikeDislike.hasMany(postMedia, {
  foreignKey: 'post_id', 
  // foreignKey: 'id', 
  sourceKey: 'post_id',
  // target: 'post_id',
  as : "image"
});


// LikeDislike.hasMany(postMedia, {
//   foreignKey: 'post_id', 
//   // foreignKey: 'id', 
//   sourceKey: 'post_id',
//   // target: 'post_id',
//   as : "image"
// });
// LikeDislike.belongsTo(Posts, {
//   foreignKey: 'post_id', 
//   // foreignKey: 'id', 
//   sourceKey: 'id',
//   // target: 'user_id',
//   as : "totalLikes"
// });

LikeDislike.belongsTo(User, {
  foreignKey: 'user_id', 
  // foreignKey: 'id', 
  // sourceKey: 'user_id',
  // target: 'user_id',
  as : "user_detail"
});

commentOnPost.belongsTo(User, {
  foreignKey: 'user_id', 
  // foreignKey: 'id', 
  // sourceKey: 'id',
  target: 'id',
  as : "commentpost"
});


// commentOnPost.belongsTo(Posts, {
//   foreignKey: 'post_id', 
//   // foreignKey: 'id', 
//   // sourceKey: 'id',
//   target: 'id',
//   as : "commentpost"
// });

User.hasMany(commentOnBusinessRequirment);
commentOnBusinessRequirment.belongsTo(User, {
  foreignKey: "user_id",
  target: 'id',
  as: "commentUserData",
});

Posts.belongsTo(User, {
  foreignKey: 'user_id', 
  // foreignKey: 'id', 
  // sourceKey: 'user_id',
  // target: 'user_id',
  as : "user_detail"
});


groupPosts.belongsTo(User, {
  foreignKey: 'user_id', 
  // foreignKey: 'id', 
  // sourceKey: 'user_id',
  // target: 'user_id',
  as : "user_detail"
});


Follow_Following.belongsTo(User, {
  foreignKey: 'follow_following_id', 
  // target: 'id',
  as : "following_Details"
});

groupMembers.belongsTo(Group, {
  foreignKey: 'groupId', 
  // target: 'id',
  as : "group"
});

Follow_Following.belongsTo(User, {
  foreignKey: 'follow_following_id', 
  // target: 'id',
  as : "Users_Details"
});


User.hasOne(Follow_Following, {
  foreignKey: 'user_id', 
  // foreignKey: 'id', 
  // sourceKey: 'id',
  // target: 'user_id',
  as : "is_follow"
});



Follow_Following.belongsTo(User, {
  foreignKey: 'follow_following_id', 
  // target: 'id',
  as : "all_result"
});

// Posts.belongsTo(User, {
//   foreignKey: 'userId', 
//   // target: 'id',
//   as : "User_Details"
// });

// businessRequirment.hasMany(commentOnBusinessRequirment,{
//   foreignKey: 'requirment_id',
//   as:"total_comments"
// })


//post listing
Posts.hasOne(Follow_Following, {
  foreignKey: 'follow_following_id', 
  sourceKey: 'user_id',
  as : "Post_Details"
});


Follow_Following.belongsTo(User, {
  foreignKey: 'follow_following_id', 
  // target: 'id',
  as : "Users_Detail"
});


// Follow_Following.hasMany(Posts, {
//   foreignKey: 'user_id', 
//   sourceKey: 'user_id',
//   as : "UDetail"
// });


Posts.hasMany(postMedia, {
  foreignKey: 'post_id', 
  // foreignKey: 'id', 
  // sourceKey: 'id',
  // target: 'user_id',
  as : "Posts"
});


Posts.hasMany(LikeDislike, {
  foreignKey: 'post_id', 
  // foreignKey: 'id', 
  // sourceKey: 'id',
  // target: 'user_id',
  as : "LikePosts"
});
// groupMembers.hasMany(Group);
// Group.belongsTo(groupMembers, {
//   foreignKey: "id",
//   target: 'groupId',
//   as: "userData",
// });


// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "guru_videos",
// });

// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "literature_books",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "granths",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "audio_books",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "audio_satsangs",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "anubhavi_vaani",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "satsang_videos",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "samtavad_vani",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "mahamantra_vani",
// });
// User.hasMany(UserFavourite, {
//   foreignKey: "user_id",
//   as: "gurudev_vani",
// });
// /***
//  * ******************* UserFavourites **********************/

// UserFavourite.belongsTo(GuruImage, {
//   foreignKey: "fav_content_id",
//   as: "fav_guru_images",
// });
// UserFavourite.belongsTo(GuruVideo, {
//   foreignKey: "fav_content_id",
//   as: "fav_guru_videos",
// });
// UserFavourite.belongsTo(LiteratureBook, {
//   foreignKey: "fav_content_id",
//   as: "fav_literature_books",
// });

// UserFavourite.belongsTo(AudioBook, {
//   foreignKey: "fav_content_id",
//   as: "fav_audio_books",
// });
// UserFavourite.belongsTo(AudioSatsang, {
//   foreignKey: "fav_content_id",
//   as: "fav_audio_satsangs",
// });
// UserFavourite.belongsTo(AnubhaviVaani, {
//   foreignKey: "fav_content_id",
//   as: "fav_anubhavi_vaani",
// });
// UserFavourite.belongsTo(SatsangVideo, {
//   foreignKey: "fav_content_id",
//   as: "fav_satsang_videos",
// });
// UserFavourite.belongsTo(MahamantraContent, {
//   foreignKey: "fav_content_id",
//   as: "fav_mahamantra_vani",
// });
// UserFavourite.belongsTo(SamtavadContent, {
//   foreignKey: "fav_content_id",
//   as: "fav_samtavad_vani",
// });
// UserFavourite.belongsTo(GurudevContent, {
//   foreignKey: "fav_content_id",
//   as: "fav_gurudev_vani",
// });
// /********************** GuruImage **********************/
// GuruImage.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_guru_image",
// });

// /********************** GuruVideo **********************/
// GuruVideo.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_guru_video",
// });

// /********************** LiteratureBook **********************/
// LiteratureBook.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_literature_book",
// });

// /********************** LiteratureBook **********************/
// Granth.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_granth",
// });

// /********************** AudioBook **********************/
// AudioBook.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_audio_book",
// });

// /********************** AudioSatsang **********************/
// AudioSatsang.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_audio_satsang",
// });
// // AudioSatsang.hasMany(UserAudioBookmark, {
// //   foreignKey: "bookmark_id",
// //   as: "bookmark_data",
// // });
// /********************** AnubhaviVaani **********************/
// AnubhaviVaani.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_anubhavi_vaani",
// });

// // AnubhaviVaani.hasMany(UserAudioBookmark, {
// //   foreignKey: "bookmark_id",
// //   as: "bookmark_data",
// // });

// /********************** SatsangVideo **********************/
// SatsangVideo.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_satsang_video",
// });

// /********************** MahaMantra **********************/
// Mahamantra.hasMany(MahamantraContent, {
//   foreignKey: "mahamantra_id",
//   as: "mahamantra_content",
// });

// MahamantraContent.hasMany(MahamantraSubContent, {
//   foreignKey: "mahamantra_content_id",
//   as: "json_title_description",
// });

// MahamantraContent.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_mahamantra_vani",
// });
// /********************** HomePageParent **********************/
// // HomePageGrand.hasMany(HomePageParent,{foreignKey:"home_page_grand_id",as:"home_page_parents"})

// /********************** Gurudev **********************/
// Gurudev.hasMany(GurudevContent, {
//   foreignKey: "gurudev_id",
//   as: "gurudev_content",
// });

// GurudevContent.hasMany(GurudevSubContent, {
//   foreignKey: "gurdev_content_id",
//   as: "json_title_description",
// });
// GurudevContent.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_gurudev_vani",
// });
// /********************** Samtavad **********************/
// Samtavad.hasMany(SamtavadContent, {
//   foreignKey: "samtavad_id",
//   as: "samtavad_content",
// });

// SamtavadContent.hasMany(SamtavadSubContent, {
//   foreignKey: "samtavad_content_id",
//   as: "json_title_description",
// });
// SamtavadContent.hasMany(UserFavourite, {
//   foreignKey: "fav_content_id",
//   as: "fav_samtavad_vani",
// });
