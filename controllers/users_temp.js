const uuid = require("uuid");
const { handleError, buildErrObject } = require("../middleware/utils");
const db = require("../middleware/db");
const fs = require("fs");
const auth = require("../middleware/auth");
const { Blob, Buffer } = require("buffer");
const emailer = require("../middleware/emailer");
const bcrypt = require("bcrypt")
const jwt =  require("jsonwebtoken")
const { capitalizeFirstLetter, uploadImage } = require("../shared/helpers");
const {
  getItem,
  getItemAccQuery,
  createItem,
  updateItem,
  deleteCustom,
  getItemsAccQuery,
  getItemsAccQueryWidCount,
  getItemWithInclude,
  getItemsWithInclude,
} = require("../shared/core");
// const { uploadFile} = require("../shared/helpers");
const { Op,  where } = require("sequelize");

const storagePath = process.env.STORAGE_PATH;
const storagePathHttp = process.env.STORAGE_PATH_HTTP;

var mongoose = require("mongoose");

const STORAGE_PATH_HTTP = process.env.STORAGE_PATH_HTTP;
const STORAGE_PATH = process.env.STORAGE_PATH;

const countries = require("country-state-city").Country;
// * models
const Models = require("../models/models");
// const User = require("../models/models")
/**
 * Upload Media function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

/********************
 * Public functions *
 ********************/


exports.userDetails = async (req,res) =>{
  try {
     const data = req.body;
     const token  = req.headers.token
     console.log("token--------->" , token);
     const secretKey = "userp51"
     const userID =  jwt.verify(token,secretKey)
     req.body.user_id = userID
     console.log("userId--------->" , req.body.user_id);
    
 console.log("req.body.user_id" ,req.body.user_id);
     const user  = await Models.User.findOne({
      where:{
        id:userID.userId
      }
      })  
     console.log("user--------->" , user)

     res.status(200).send({data:user})

  } catch (error) {
    console.log("error in user details---", error)
    return error
  }
}

// const uplouploadImage =uploadImage(object) {
//   console.log("object==>", object);
//   return new Promise((resolve, reject) => {
//     var obj = object.image_data;
//     var name = Date.now() + obj.name;
//     obj.mv(object.path + "/" + name, function (err) {
//       if (err) {
//         reject(utils.buildErrObject(422, err.message));
//       }
//       resolve(name);
//     });
//   });
// }

// exports.uploadPosts = async (req,res) =>{
//   try {
//      const data = req.body;

//     const obj  = {
//       title : data.title,
//       content:data.title,
//     }
      
//      const user  = await Models.Posts.create({
//      obj
//       })  
//      console.log("user--------->" , user)

//      res.status(200).send({data:user})

//   } catch (error) {
//     console.log("error in user details---", error)
//     return error
//   }
// }

// const getUserIdFromToken = async (token) => {
//   return new Promise((resolve, reject) => {
//     // Decrypts, verifies and decode token
//     jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
//       if (err) {
//         reject(utils.buildErrObject(409, "BAD_TOKEN"));
//       }
//       if (decoded.data._id) {
//         resolve(decoded.data._id);
//       }

//       if (decoded.data.id) {
//         resolve(decoded.data.id);
//       }
//       resolve(null);
//     });
//   });
// };

// const isValid = function(value) {
//   if (typeof value === 'undefined' || value === null) return false
//   if (typeof value === 'string' && value.trim().length === 0) return false
//   return true;
// }


exports.editProfile = async (req, res) => {
  try {
    const data = req.body;
    const token  = req.headers.token
    const secretKey = "userp51"
    const userID =  jwt.verify(token,secretKey)
    req.body.user_id = userID
    if (req.files && req.files.profile_image) {
      console.log("files----",req.files.profile_image)
      var image_name = await uploadImage({
        image_data: req.files.profile_image,
        path: storagePath + "/profileImages",
      });
      data.profile_image = image_name;
    }
    console.log("data--->", data);
    if (data.country) {
      data.country = JSON.parse(JSON.stringify(data.country))
    }
    if (data.state) {
      data.state = JSON.parse(JSON.stringify(data.state))
    }
    if (data.city) {
      data.city = JSON.parse(JSON.stringify(data.city))
    }
    const update  = await Models.User.update(
     data,
      {
        where: { id: userID.userId }
      }
    );
      console.log("update----->" , update);
    res.status(200).send({
      code: 200,
      data:update
    }); 
  } catch (error) {
    console.log(error);
  //  res.send("error",error)
  }
};






exports.getaboutUs = async (req, res) => {
  try {
      console.log("result", req.query.type,);
    const result = await Models.Cms.findOne({
      where: {
        type: req.query.type,
      },
    });
    res.status(200).json({
      code: 200,
      data:result,
    });
  } catch (error) {
    return error
  }
};


exports.helps = async (req, res) => {
  try {
      console.log("result", req.query.type,);
    const result = await Models.help.findOne({
      where: {
        type: req.query.type,
      },
    });
    res.status(200).json({
      code: 200,
      data:result,
    });
  } catch (error) {
    return error
  }
};




exports.helpListing = async (req, res) => {
  try {
      console.log("result", req.query.type,);
    const result = await Models.help.findAll({});
    res.status(200).json({
      code: 200,
      data:result,
    });
  } catch (error) {
    return error
  }
};

exports.businessEnquiry = async (req, res) => {
  try {
      // console.log("result", req.query.type,);
    const result = await Models.businessType.findAll({});
    res.status(200).json({
      code: 200,
      data:result,
    });
  } catch (error) {
    console.log("error in user details---", error)
    return error
  }
};


exports.getUserIdFromToken = async (token) => {
  return new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, "BAD_TOKEN"));
      }
      if (decoded.data._id) {
        resolve(decoded.data._id);
      }

      if (decoded.data.id) {
        resolve(decoded.data.id);
      }
      resolve(null);
    });
  });
};








exports.GetAllCountries = (req, res) => {
  var countries = require("country-state-city").Country;
  var countryNames = countries.getAllCountries();
  res.send({
    code: 200,
    data: countryNames,
  });
};

exports.GetStatesOfCountryByCountryCode = (req, res) => {
  var code = req.query.country_code;
  var states = require("country-state-city").State.getStatesOfCountry(code);
  res.send({
    code: 200,
    data: states,
  });
};

exports.GetCitiesOfStateByStateCode = (req, res) => {
  var country = req.query.country_code;
  var state = req.query.state_code;
  var cities = require("country-state-city").City.getCitiesOfState(country, state);
  res.send({
    code: 200,
    data: cities
  });
};


























// exports.signup = async (req,res) => {
//   try {
//     let { first_name,last_name, email, password , phone_no ,country_code ,location , status , language ,data_saver,user_type} = req.body;
//   const saltRounds = 10;
//     const encryptedPassword = await bcrypt.hash(password, saltRounds);
//     password = encryptedPassword;
//     const post_data = Models.User.build({
//          first_name,
//         last_name,
//       email,
//       password,
//       phone_no,
//       country_code,
//       location,
//       status,
//       language,
//       data_saver,
//       user_type
//     });





    
//     await post_data.save();
//     res.send("Data posted ");
//   } catch (error) {
//     res.status(500).send({ status: false, error: err.message })
//   }
// }











// exports.login = async (req, res) => {
//   try {
//     let data = req.body;

//     // let findUser = await crud_table.findOne({ email: data.email });
//     const findUser = await Models.User.findOne({
//       where: { 
//         email: data.email 
//       }
//   })
//     console.log("email",findUser);
//     if (!findUser)
//       return res
//         .status(404)
//         .send({ status: false, message: "email  is incorrect" });

//     const passwordDecrept = await bcrypt.compare(
//       data.password,
//       findUser.password
//     );
//     console.log(passwordDecrept);
//     if (!passwordDecrept)
//       return res
//         .status(400)
//         .send({ status: false, message: " password is incorrect" });

//     const userID = findUser._id;
//     const payLoad = { userId: userID };
//     const secretKey = "userp51";
//     const token = jwt.sign(payLoad, secretKey, { expiresIn: "10h" });

//     res.status(200).send({
//       status: true,
//       message: "User login successfully",
//       data: { userID: findUser._id, token: token },
//     });
//   } catch (err) {
//     res.status(500).send({ status: false, error: err.message });
//   }
// };







// exports.addFcm = async (req, res) => {
//   try {
//     let item;
//     const data = req.body;
//     const condition = {
//       user_id: data.user_id,
//       device_id: data.device_id,
//     };
//     item = await getItemAccQuery(Models.UserDevice, condition);
//     if (!item) {
//       item = await createItem(Models.UserDevice, data);
//     } else {
//       await updateItem(Models.UserDevice, condition, data);
//     }
//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.removeFcm = async (req, res) => {
//   try {
//     const condition = {
//       user_id: req.params.user_id,
//       device_id: req.params.device_id,
//     };
//     const item = await deleteCustom(Models.UserDevice, condition);
//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getCms = async (req, res) => {
//   try {
//     const item = await getItemAccQuery(Models.CMS, req.params);
//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getContactUs = async (req, res) => {
//   try {
//     const item = await getItemAccQuery(Models.ContactUs, {});
//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.editUserProfile = async (req, res) => {
//   try {
//     const data = req.body;
//     console.log("********* D A T A ***************", data);
//     data.user_id = req.user.id;
//     const condition = {
//       id: data.user_id,
//     };
//     if (req.files && req.files.profile_image) {
//       // check if image
//       var image = await uploadFile({
//         file: req.files.profile_image,
//         path: storagePath + "/userImage",
//       });
//       data.profile_image = image;
//     }

//     const item = await updateItem(Models.User, condition, data);
//     return res.status(200).json({
//       code: 200,
//       data: item,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.getUserProfile = async (req, res) => {
//   try {
//     const condition = {
//       id: req.user.id,
//     };
//     const item = await getItemAccQuery(Models.User, condition);
//     return res.status(200).json({
//       code: 200,
//       data: item,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.getGuruImages = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };
//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.title = like;
//     }
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "guru_image", user_id: USER_ID },
//         as: "fav_guru_image",
//         required: false,
//       };
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.GuruImage,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );

//     res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.getGuruVideos = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };
//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.title = like;
//     }
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];

//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "guru_video", user_id: USER_ID },
//         as: "fav_guru_video",
//         required: false,
//       };
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.GuruVideo,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );

//     res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.literatureBooks = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };
//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.name = like;
//     }
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "literature_book", user_id: USER_ID },
//         as: "fav_literature_book",
//         required: false,
//       };
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.LiteratureBook,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );

//     res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.granths = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };
//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.title = like;
//     }
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "granth", user_id: USER_ID },
//         as: "fav_granth",
//         required: false,
//       };
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.Granth,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );
//     res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.audioBooks = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };
//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.title = like;
//     }
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];

//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = [
//         {
//           model: Models.UserFavourite,
//           where: { fav_content_type: "audio_book", user_id: USER_ID },
//           as: "fav_audio_book",
//           required: false,
//         },
//         // {
//         //   model: Models.UserAudioBookmark,
//         //   where: { bookmark_type: "book", user_id: USER_ID },
//         //   as: "bookmark_data",
//         //   required: false,
//         // },
//       ];
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.AudioBook,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.audioSatsangs = async (req, res) => {
//   try {
//     const data = req.query;
//     let order;
//     const condition = {
//       status: "active",
//     };
//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition[Op.or] = {
//         title: like,
//         author: like,
//       };
//     }
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = [
//         {
//           model: Models.UserFavourite,
//           where: { fav_content_type: "audio_satsang", user_id: USER_ID },
//           as: "fav_audio_satsang",
//           required: false,
//         },
//         // {
//         //   model: Models.UserAudioBookmark,
//         //   where: { bookmark_type: "satsang", user_id: USER_ID },
//         //   as: "bookmark_data",
//         //   required: false,
//         // },
//       ];
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.AudioSatsang,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.anubhaviVaaniList = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//       type: data.type,
//     };
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];

//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.name = like;
//     }
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = [
//         {
//           model: Models.UserFavourite,
//           where: { fav_content_type: "anubhavi_vaani", user_id: USER_ID },
//           as: "fav_anubhavi_vaani",
//           required: false,
//         },
//         // {
//         //   model: Models.UserAudioBookmark,
//         //   where: { bookmark_type: "vani", user_id: USER_ID },
//         //   as: "bookmark_data",
//         //   required: false,
//         // },
//       ];
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.AnubhaviVaani,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.satsangVideos = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };

//     if (data.sort_by && data.param) order = [data.param, data.sort_by];

//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.title = like;
//     }
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       include = {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "satsang_video", user_id: USER_ID },
//         as: "fav_satsang_video",
//         required: false,
//       };
//     } else {
//       include = [];
//     }
//     const { count, rows } = await getItemsWithInclude(
//       Models.SatsangVideo,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.searchAllOverApp = async (req, res) => {
//   try {
//     const data = req.query;

//     const condition = {
//       status: "active",
//     };

//     const condition_other = {
//       status: "active",
//     };

//     const condition_granth = {
//       status: "active",
//     };
//     const condition_literature = {
//       status: "active",
//     };

//     const condition_satsang = {
//       status: "active",
//     };
//     const condition_vani = {
//       status: "active",
//     };
//     if (data.search) {
//       // data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition_granth[Op.or] = {
//         title: like,
//         description: like
//       }

//       condition_literature[Op.or] = {
//         name: like,
//         author: like
//       }

//       condition_satsang[Op.or] = {
//         title: like,
//         author: like
//       }

//       condition_vani[Op.or] = {
//         name: like,
//         author: like,
//         type: like
//       }

//       // condition_granth.title = like;
//       // condition_granth.description = like;

//       // condition_literature.name = like;
//       // condition_literature.author = like;

//       // condition_satsang.title = like;
//       // condition_satsang.author = like;

//       // condition_vani.name = like;
//       // condition_vani.author = like;
//       // condition_vani.type = like;

//       condition_other.name = like;
//       condition.title = like;
//     }
//     console.log("Audio Satsang", condition_satsang);
//     const [
//       guru_videos,
//       literature_books,
//       granths,
//       audio_book,
//       audio_satsang,
//       anubhavi_vaani,
//       guru_images,
//       satsang_video,
//     ] = await Promise.all([
//       getItemsAccQuery(Models.GuruVideo, condition),
//       getItemsAccQuery(Models.LiteratureBook, condition_literature),
//       getItemsAccQuery(Models.Granth, condition_granth),
//       getItemsAccQuery(Models.AudioBook, condition),
//       getItemsAccQuery(Models.AudioSatsang, condition_satsang),
//       getItemsAccQuery(Models.AnubhaviVaani, condition_vani),
//       getItemsAccQuery(Models.GuruImage, condition),
//       getItemsAccQuery(Models.SatsangVideo, condition),
//     ]);
//     return res.status(200).json({
//       code: 200,
//       guru_videos: guru_videos,
//       literature_books: literature_books,
//       granths: granths,
//       audio_book: audio_book,
//       audio_satsang: audio_satsang,
//       anubhavi_vaani: anubhavi_vaani,
//       guru_images: guru_images,
//       satsang_video: satsang_video,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.addOrRemoveFavourite = async (req, res) => {
//   try {
//     const data = req.body;
//     let item;
//     if (data.type == "unfavourite") {
//       const condition = {
//         user_id: data.user_id,
//         fav_content_id: data.fav_content_id,
//         fav_content_type: data.fav_content_type,
//       };
//       item = await deleteCustom(Models.UserFavourite, condition);
//     } else {
//       item = await createItem(Models.UserFavourite, data);
//     }
//     return res.status(200).json({
//       code: 200,
//       data: item,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.userFavourites = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = {
//       id: req.user.id,
//     };
//     const include = [
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "guru_image" },
//         as: "guru_images",
//         required: false,
//         include: {
//           model: Models.GuruImage,
//           as: "fav_guru_images",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "guru_video" },
//         as: "guru_videos",
//         required: false,
//         include: {
//           model: Models.GuruVideo,
//           as: "fav_guru_videos",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "literature_book" },
//         as: "literature_books",
//         required: false,
//         include: {
//           model: Models.LiteratureBook,
//           as: "fav_literature_books",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "granth" },
//         as: "granths",
//         required: false,
//         include: {
//           model: Models.Granth,
//           as: "fav_granths",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "audio_book" },
//         as: "audio_books",
//         required: false,
//         include: {
//           model: Models.AudioBook,
//           as: "fav_audio_books",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "audio_satsang" },
//         as: "audio_satsangs",
//         required: false,
//         include: {
//           model: Models.AudioSatsang,
//           as: "fav_audio_satsangs",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "anubhavi_vaani" },
//         as: "anubhavi_vaani",
//         required: false,
//         include: {
//           model: Models.AnubhaviVaani,
//           as: "fav_anubhavi_vaani",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "satsang_video" },
//         as: "satsang_videos",
//         required: false,
//         include: {
//           model: Models.SatsangVideo,
//           as: "fav_satsang_videos",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "mahamantra_vani" },
//         as: "mahamantra_vani",
//         required: false,
//         include: {
//           model: Models.MahamantraContent,
//           as: "fav_mahamantra_vani",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "samtavad_vani" },
//         as: "samtavad_vani",
//         required: false,
//         include: {
//           model: Models.SamtavadContent,
//           as: "fav_samtavad_vani",
//           required: false,
//         },
//       },
//       {
//         model: Models.UserFavourite,
//         where: { fav_content_type: "gurudev_vani" },
//         as: "gurudev_vani",
//         required: false,
//         include: {
//           model: Models.GurudevContent,
//           as: "fav_gurudev_vani",
//           required: false,
//         },
//       },
//     ];
//     const item = await getItemWithInclude(Models.User, condition, include);

//     return res.status(200).json({
//       code: 200,
//       data: item,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// const clientId = "37d2a87c-0de3-46ca-bf80-3ae33577eee2";
// const secret = "1ce947733d1ea9e3b3a3165a1e838abd";
// const wordsApi = new WordsApi(clientId, secret);

// exports.testFile = async (req, res) => {
//   try {
//     const data = req.body;
//     const requestDocument = await fs.readFileSync(
//       "/var/www/html/Samtavad/public/monthlyPublications/testfile.docx"
//     );
//     console.log("requestDocument", requestDocument);
//     const convertRequest = new ConvertDocumentRequest({
//       document: requestDocument,
//       format: "epub",
//     });

//     wordsApi
//       .convertDocument(convertRequest)
//       .then((result) => {
//         fs.writeFile(
//           "/var/www/html/Samtavad/public/literatureImages/new1.epub",
//           result.body,
//           (err) => {
//             if (err) throw err;
//             console.log("Successfully converted");
//             res.status(200).json({
//               code: 200,
//               data: result,
//             });
//           }
//         );
//       })
//       .catch(function (err) {
//         console.log("Error:", err);
//       });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.monthlyPublications = async (req, res) => {
//   try {
//     const data = req.query;
//     let include, order;
//     const condition = {
//       status: "active",
//     };
//     if (data.sort_by && data.param) order = [data.param, data.sort_by];

//     if (data.search) {
//       const like = {
//         [Op.like]: "%" + data.search + "%",
//       };
//       condition.title = like;
//     }
//     // if(req.headers.authorization) {
//     //   const USER_ID = await getUserIdFromToken(req.headers.authorization)
//     //    include = {
//     //     model: Models.UserFavourite,
//     //     where : {fav_content_type:"anubhavi_vaani",user_id:USER_ID},
//     //     as: "fav_anubhavi_vaani",
//     //     required : false,
//     //    }
//     // }else {
//     // }
//     include = [];
//     const { count, rows } = await getItemsWithInclude(
//       Models.MonthlyPublication,
//       condition,
//       include,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       order
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.ashramAddresses = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = {
//       status: "active",
//     };
//     const { count, rows } = await getItemsAccQueryWidCount(
//       Models.AshramAddress,
//       condition,
//       parseInt(data.limit),
//       parseInt(data.offset)
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.createRoom = async (req, res) => {
//   try {
//     const USER_ID = req.user.id;
//     const admin_data = await getItemAccQuery(Models.Admin, {});
//     const data = {
//       sender_id: USER_ID,
//       receiver_id: admin_data.id,
//     };
//     const condition = {
//       [Op.or]: [{ receiver_id: USER_ID }, { sender_id: USER_ID }],
//     };
//     const GET_ITEM = await getItemAccQuery(Models.UserRoom, condition);
//     if (!GET_ITEM) {
//       data.room_id = uuid.v4();
//       const CREATE_ITEM = await createItem(Models.UserRoom, data);
//       return res.status(200).json({
//         code: 200,
//         data: CREATE_ITEM,
//         admin_data: admin_data,
//       });
//     } else {
//       return res.status(200).json({
//         code: 200,
//         data: GET_ITEM,
//         admin_data: admin_data,
//       });
//     }
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.alarmVaani = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = {
//       status: "active",
//     };
//     const { count, rows } = await getItemsAccQueryWidCount(
//       Models.AlarmVaani,
//       condition,
//       parseInt(data.limit),
//       parseInt(data.offset),
//       ["id", "ASC"]
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getUserAlarms = async (req, res) => {
//   try {
//     const data = req.query;
//     data.user_id = req.user.id;
//     const condition = {
//       user_id: data.user_id,
//     };
//     const { count, rows } = await getItemsAccQueryWidCount(
//       Models.UserAlarm,
//       condition
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.createUserAlarm = async (req, res) => {
//   try {
//     const data = req.body;

//     data.user_id = req.user.id;
//     const CREATE_ITEM = await createItem(Models.UserAlarm, data);
//     return res.status(200).json({
//       code: 200,
//       data: CREATE_ITEM,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.editUserAlarm = async (req, res) => {
//   try {
//     const data = req.body;
//     const condition = {
//       id: data.alarm_id,
//     };
//     const item = await updateItem(Models.UserAlarm, condition, data);
//     return res.status(200).json({
//       code: 200,
//       data: item,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.deleteUserAlarm = async (req, res) => {
//   try {
//     const data = req.params;
//     data.user_id = req.user.id;
//     const condition = {
//       id: data.alarm_id,
//     };
//     const item = await deleteCustom(Models.UserAlarm, condition);
//     return res.status(200).json({
//       code: 200,
//       data: item,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getTelecasts = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = {
//       status: "active",
//       type: data.type,
//     };
//     const { count, rows } = await getItemsAccQueryWidCount(
//       Models.Telecast,
//       condition,
//       parseInt(data.limit),
//       parseInt(data.offset)
//     );
//     return res.status(200).json({
//       code: 200,
//       total_count: count,
//       data: rows,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getHomePage = async (req, res) => {
//   try {
//     const data = req.query;

//     const include = {
//       model: Models.HomePageParent,
//       as: "home_page_parents",
//       required: false,
//     };
//     const section_1 = await getItemWithInclude(
//       Models.HomePageGrand,
//       { type: "banner", main_type: data.type },
//       include
//     );
//     const section_2 = await getItemWithInclude(
//       Models.HomePageGrand,
//       { type: data.type, main_type: data.type },
//       include
//     );
//     const section_3 = await getItemWithInclude(
//       Models.HomePageGrand,
//       { type: "heading", main_type: data.type },
//       include
//     );
//     const section_4 = await getItemWithInclude(
//       Models.HomePageGrand,
//       { type: "vaani", main_type: data.type },
//       include
//     );
//     const section_5 = await getItemWithInclude(
//       Models.HomePageGrand,
//       { type: "video", main_type: data.type },
//       include
//     );

//     return res.status(200).json({
//       code: 200,
//       section_1: section_1,
//       section_2: section_2,
//       section_3: section_3,
//       section_4: section_4,
//       section_5: section_5,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getGurudev = async (req, res) => {
//   try {
//     const data = req.query;
//     let includeVani;
//     const include = [
//       {
//         model: Models.GurudevContent,
//         as: "gurudev_content",
//         required: false,
//         include: [
//           {
//             model: Models.GurudevSubContent,
//             as: "json_title_description",
//             required: false,
//           },
//         ],
//       },
//     ];
//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       includeVani = [
//         {
//           model: Models.GurudevContent,
//           as: "gurudev_content",
//           required: false,
//           include: [
//             {
//               model: Models.UserFavourite,
//               where: { fav_content_type: "gurudev_vani", user_id: USER_ID },
//               as: "fav_gurudev_vani",
//               required: false,
//             },
//             {
//               model: Models.GurudevSubContent,
//               as: "json_title_description",
//               required: false,
//             },
//           ],
//         },
//       ];
//     } else {
//       includeVani = [
//         {
//           model: Models.GurudevContent,
//           as: "gurudev_content",
//           required: false,
//         },
//       ];
//     }
//     const section_1 = await getItemsAccQuery(Models.Gurudev, {
//       type: "banner",
//     });
//     const section_2 = await getItemWithInclude(
//       Models.Gurudev,
//       { type: "heading" },
//       include
//     );
//     const section_3 = await getItemWithInclude(
//       Models.Gurudev,
//       { type: "shlok" },
//       include
//     );
//     const section_4 = await getItemWithInclude(
//       Models.Gurudev,
//       { type: "vaani" },
//       includeVani
//     );
//     const section_5 = await getItemWithInclude(
//       Models.Gurudev,
//       { type: "video" },
//       include
//     );

//     return res.status(200).json({
//       code: 200,
//       section_1: section_1,
//       section_2: section_2,
//       section_3: section_3,
//       section_4: section_4,
//       section_5: section_5,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getSamtavad = async (req, res) => {
//   try {
//     const data = req.query;
//     let includeVani;
//     const include = [
//       {
//         model: Models.SamtavadContent,
//         as: "samtavad_content",
//         required: false,
//         include: {
//           model: Models.SamtavadSubContent,
//           as: "json_title_description",
//           required: false,
//         },
//       },
//     ];

//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       includeVani = [
//         {
//           model: Models.SamtavadContent,
//           as: "samtavad_content",
//           required: false,
//           include: [
//             {
//               model: Models.UserFavourite,
//               where: { fav_content_type: "samtavad_vani", user_id: USER_ID },
//               as: "fav_samtavad_vani",
//               required: false,
//             },
//             {
//               model: Models.SamtavadSubContent,
//               as: "json_title_description",
//               required: false,
//             },
//           ],
//         },
//       ];
//     } else {
//       includeVani = [
//         {
//           model: Models.SamtavadContent,
//           as: "samtavad_content",
//           required: false,
//         },
//       ];
//     }
//     const section_1 = await getItemsAccQuery(Models.Samtavad, {
//       type: "banner",
//     });
//     const section_2 = await getItemWithInclude(
//       Models.Samtavad,
//       { type: "heading" },
//       include
//     );
//     const section_3 = await getItemWithInclude(
//       Models.Samtavad,
//       { type: "shlok" },
//       include
//     );
//     const section_4 = await getItemWithInclude(
//       Models.Samtavad,
//       { type: "vaani" },
//       includeVani
//     );
//     const section_5 = await getItemWithInclude(
//       Models.Samtavad,
//       { type: "video" },
//       include
//     );

//     return res.status(200).json({
//       code: 200,
//       section_1: section_1,
//       section_2: section_2,
//       section_3: section_3,
//       section_4: section_4,
//       section_5: section_5,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getMahamantras = async (req, res) => {
//   try {
//     const data = req.query;
//     let includeVani;
//     const condition = {};
//     const include = [
//       {
//         model: Models.MahamantraContent,
//         as: "mahamantra_content",
//         required: false,
//         include: {
//           model: Models.MahamantraSubContent,
//           as: "json_title_description",
//           required: false,
//         },
//       },
//     ];

//     if (req.headers.authorization) {
//       const USER_ID = await getUserIdFromToken(req.headers.authorization);
//       includeVani = [
//         {
//           model: Models.MahamantraContent,
//           as: "mahamantra_content",
//           required: false,
//           include: [
//             {
//               model: Models.UserFavourite,
//               where: { fav_content_type: "mahamantra_vani", user_id: USER_ID },
//               as: "fav_mahamantra_vani",
//               required: false,
//             },
//             {
//               model: Models.MahamantraSubContent,
//               as: "json_title_description",
//               required: false,
//             },
//           ],
//         },
//       ];
//     } else {
//       includeVani = [
//         {
//           model: Models.MahamantraContent,
//           as: "mahamantra_content",
//           required: false,
//         },
//       ];
//     }
//     const section_1 = await getItemsAccQuery(Models.Mahamantra, {
//       type: "banner",
//     });
//     const section_2 = await getItemWithInclude(
//       Models.Mahamantra,
//       { type: "mahamantra" },
//       include
//     );
//     const section_3 = await getItemWithInclude(
//       Models.Mahamantra,
//       { type: "heading" },
//       include
//     );
//     const section_4 = await getItemWithInclude(
//       Models.Mahamantra,
//       { type: "shlok" },
//       include
//     );
//     const section_5 = await getItemWithInclude(
//       Models.Mahamantra,
//       { type: "vaani" },
//       includeVani
//     );
//     const section_6 = await getItemWithInclude(
//       Models.Mahamantra,
//       { type: "video" },
//       include
//     );

//     return res.status(200).json({
//       code: 200,
//       section_1: section_1,
//       section_2: section_2,
//       section_3: section_3,
//       section_4: section_4,
//       section_5: section_5,
//       section_6: section_6,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.subscribeNewsLetter = async (req, res) => {
//   try {
//     var data = JSON.stringify({
//       email_address: req.body.email, // send email dynamically
//       status: "subscribed",
//     });

//     var config = {
//       method: "post",
//       url: "https://us21.api.mailchimp.com/3.0/lists/64841de53f/members",
//       headers: {
//         Authorization:
//           "Basic OWM5NzcyOTE2NDE0ZDUxY2Y0ZjAxMGVmMzI2YTJjNjMtdXMyMTo5Yzk3NzI5MTY0MTRkNTFjZjRmMDEwZWYzMjZhMmM2My11czIx",
//         "Content-Type": "application/json",
//         Cookie:
//           "ak_bmsc=DDBC2693209AB4EDB57E053432B4A135~000000000000000000000000000000~YAAQRwVaaMh7t4OEAQAAurpKoxHDM6hmgIhNQiy0Ak1qkGwF4FJJ/VD5zx83ewtfbmQKoU+LZlwdfJHGsqzoHR/HbzujHAFcqoIEBHjYKN53Tv/4J2x9FHfWpxYLqHtXwHypwabpMAnAQ9X8t7uexbMDrrk5/O3tJ1Wfac8wQIjTKiAEKvv/mZDxGnuJrbUxePqQCn2+JEZZhVgmrIoqvoVNPuGG/DUhVocfvSfC3JGMqMkTMyvXU6mMhsLjFxjuh0jjKpIsdovk57dBw0SaumH8DpCf6WSGoyTWrKARAc/3K0LIURuQFqJeLKGvKyATSGWd90CZjYnICRlGkpCOUeyYroDpi4P6IWsm8IoRLoHGbd3jh+y5DJ+h0QgcwPY6ZdNR4ZU=; bm_sv=A86D900D349190D3929EFAF7E0AC1AC3~YAAQRwVaaKKUt4OEAQAA2X1QoxFAh7AR6VoP16SJooRBmKGLN+A8uYZofaC0xuRWGfu41xJo/NK6kJCHH5O4kSeKFAC7LYGrtmLb3JUn3zySbwVnxJqGFhfd5hVzQCNByz7+IA/thM9YAj1jhx5Navwgt5SKPUn6uZdq8jFZTKWfPqsOSPR+mayIkITd7iJnKuIMXDUbTRuxRVjhc+whAwvthus4K8m9LvrlMpDAck4vdbDbVVjw6IxcodLXOuQPgShmuBWsZw==~1",
//       },
//       data: data,
//     };

//     axios(config)
//       .then(function (response) {
//         res.status(200).json({
//           result: response.data,
//         });
//       })
//       .catch(function (error) {
//         res.status(error.response.status).json({
//           errors: {
//             msg: error.response.data.title,
//           },
//           code: error.response.status,
//         });
//       });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.getSubscribeNewsLetter = async (req, res) => {
//   try {
//     var data = JSON.stringify({
//       email_address: req.body.email, // send email dynamically
//       status: "subscribed",
//     });

//     var config = {
//       method: "GET",
//       url: "https://us21.api.mailchimp.com/3.0/lists/64841de53f/members/5db7895fca9fa3b81318d428216d7367",
//       headers: {
//         Authorization:
//           "Basic OWM5NzcyOTE2NDE0ZDUxY2Y0ZjAxMGVmMzI2YTJjNjMtdXMyMTo5Yzk3NzI5MTY0MTRkNTFjZjRmMDEwZWYzMjZhMmM2My11czIx",
//         "Content-Type": "application/json",
//         Cookie:
//           "ak_bmsc=DDBC2693209AB4EDB57E053432B4A135~000000000000000000000000000000~YAAQRwVaaMh7t4OEAQAAurpKoxHDM6hmgIhNQiy0Ak1qkGwF4FJJ/VD5zx83ewtfbmQKoU+LZlwdfJHGsqzoHR/HbzujHAFcqoIEBHjYKN53Tv/4J2x9FHfWpxYLqHtXwHypwabpMAnAQ9X8t7uexbMDrrk5/O3tJ1Wfac8wQIjTKiAEKvv/mZDxGnuJrbUxePqQCn2+JEZZhVgmrIoqvoVNPuGG/DUhVocfvSfC3JGMqMkTMyvXU6mMhsLjFxjuh0jjKpIsdovk57dBw0SaumH8DpCf6WSGoyTWrKARAc/3K0LIURuQFqJeLKGvKyATSGWd90CZjYnICRlGkpCOUeyYroDpi4P6IWsm8IoRLoHGbd3jh+y5DJ+h0QgcwPY6ZdNR4ZU=; bm_sv=A86D900D349190D3929EFAF7E0AC1AC3~YAAQRwVaaKKUt4OEAQAA2X1QoxFAh7AR6VoP16SJooRBmKGLN+A8uYZofaC0xuRWGfu41xJo/NK6kJCHH5O4kSeKFAC7LYGrtmLb3JUn3zySbwVnxJqGFhfd5hVzQCNByz7+IA/thM9YAj1jhx5Navwgt5SKPUn6uZdq8jFZTKWfPqsOSPR+mayIkITd7iJnKuIMXDUbTRuxRVjhc+whAwvthus4K8m9LvrlMpDAck4vdbDbVVjw6IxcodLXOuQPgShmuBWsZw==~1",
//       },
//     };

//     axios(config)
//       .then(function (response) {
//         res.status(200).json({
//           result: response.data,
//         });
//       })
//       .catch(function (error) {
//         res.status(error.response.status).json({
//           errors: {
//             msg: error.response.data.title,
//           },
//           code: error.response.status,
//         });
//       });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.addBookmark = async (req, res) => {
//   try {
//     let item;
//     const data = req.body;
//     const condition = {
//       bookmark: data.bookmark,
//       book: data.book,
//     };
//     item = await getItemAccQuery(Models.UserBookmark, condition);
//     if (!item) {
//       item = await createItem(Models.UserBookmark, data);
//     }
//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.getBookmarks = async (req, res) => {
//   try {
//     const data = req.body;
//     const condition = {
//       user_id: data.user_id,
//       book: data.book,
//     };
//     const item = await Models.UserBookmark.findAll({
//       attributes: ["bookmark"],
//       where: condition,
//       order: [["id", "DESC"]],
//     });

//     return res.status(200).json({ item: item });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.deleteBookmark = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = {
//       bookmark: data.bookmark,
//     };
//     const item = await deleteCustom(Models.UserBookmark, condition);

//     return res.status(200).json({ item: item });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.extractTextFromEbook = async (req, res) => {
//   try {
//     const URL =
//       "https://api.samtawad.com/Samtavad/admin/public/granthImages/Shri Samta Vilas All Page Complete.epub";
//     TEXTRACT.fromUrl(URL, async function (error, text) {
//       if (error) {
//         console.log(error);
//       }
//       return res.status(200).json({ text: text });
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.addUserDurationBookmark = async (req, res) => {
//   try {
//     let item;
//     const data = req.body;
//     data.user_id = req.user.id;
//     const condition = {
//       bookmark_id: data.bookmark_id,
//       user_id: data.user_id,
//       bookmark_type: data.bookmark_type,
//       duration: data.duration,
//     };
//     item = await getItemAccQuery(Models.UserDurationBookmark, condition);
//     if (!item) {
//       item = await createItem(Models.UserDurationBookmark, data);
//     }
//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.removeUserDurationBookmark = async (req, res) => {
//   try {
//     const data = req.params;
//     const condition = {
//       id: data.id,
//     };
//     const item = await deleteCustom(Models.UserDurationBookmark, condition);

//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.getUserDurationBookmark = async (req, res) => {
//   try {
//     const data = req.query;
//     data.user_id = req.user.id;
//     const condition = {
//       bookmark_id: data.bookmark_id,
//       user_id: data.user_id,
//       bookmark_type: data.bookmark_type,
//     };
//     const item = await getItemsAccQuery(Models.UserDurationBookmark, condition);

//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.getNotifications = async (req, res) => {
//   try {
//     const data = req.query;
//     data.user_id = req.user.id;
//     const condition = {
//       user_id: data.user_id,
//     };
//     const item = await getItemsAccQuery(Models.Notification, condition);

//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.deleteNotifications = async (req, res) => {
//   try {
//     const data = req.query;
//     data.user_id = req.user.id;
//     const condition = {
//       user_id: data.user_id,
//     };
//     const item = await deleteCustom(Models.Notification, condition);

//     return res.status(200).json(item);
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.dataSaverToggle = async (req, res) => {
//   try {
//     const data = req.body;
//     const toggle = await Models.User.update(
//       {
//         data_saver: data.data_saver,
//       },
//       {
//         where: {
//           id: data.user_id,
//         },
//       }
//     );
//     return res.status(200).json("Updated");
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// exports.logoSong = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = {};
//     const item = await getItemAccQuery(Models.LogoSong, condition);

//     return res.status(200).json({ item: item });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.videoCompress = async (req, res) => {
//   try {
//     const data = req.body;
//     const fromPath = data.fromPath;
//     const toPath = data.toPath;

//     exec(
//       `ffmpeg -i ${fromPath} -b:v 350k -bufsize 350k ${toPath}`,
//       (err, stdout, stderr) => {
//         if (err) {
//           // node couldn't execute the command
//           console.log(err);
//           return;
//         }

//         // the *entire* stdout and stderr (buffered)
//         console.log(`stdout: ${stdout}`);
//         console.log(`stderr: ${stderr}`);
//       }
//     );

//     res.json({
//       code: 200,
//       data,
//     });
//   } catch (err) {
//     handleError(res, error);
//   }
// };

// exports.upcomingSatsang = async (req, res) => {
//   try {
//     const data = req.query;
//     const condition = { status: "active" };
//     const item = await getItemsAccQuery(
//       Models.SatsangAddress,
//       condition,
//       parseInt(data.limit),
//       parseInt(data.offset)
//     );

//     return res.status(200).json({ item: item });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

// exports.isFavourite = async (req, res) => {
//   try {
//     const condition = {
//       ...req.params,
//     };
//     const item = await getItemAccQuery(Models.UserFavourite, condition);
//     return res.status(200).json({
//       isFavourite: item ? true : false,
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };
// // exports.getAllLists = async (req, res) => {
// //   try {
// //     const response = await client.lists.getListMembersInfo("64841de53f");

// //     return res.status(200).json(response);
// //   } catch (error) {
// //     handleError(res, error);
// //   }
// // };
// // exports.extractTextFromEbookFs = async (req, res) => {
// //   try {
// //     // const URL =
// //     //   "https://api.samtawad.com/Samtavad/admin/public/granthImages/Shri Samta Vilas All Page Complete.epub";
// //     // fs.readFile(
// //     //   "/var/www/html/Samtavad/admin/public/granthImages/Shri Samta Vilas All Page Complete.epub",
// //     //   "utf8",
// //     //   (err, data) => {
// //     //     if (err) {
// //     //       console.error(err);
// //     //     }
// //     //     return res.status(200).json({ text: data });
// //     //   }
// //     // );
// //     let epub = new EPub(
// //       "/var/www/html/Samtavad/admin/public/granthImages/Shri Samta Vilas All Page Complete.epub"
// //     );
// //     epub.on("error", function (err) {
// //       console.log("ERROR\n-----");
// //       throw err;
// //     });

// //     epub.on("end", function (err) {
// //       console.log("METADATA:\n");
// //       console.log(epub.metadata);

// //       console.log("\nSPINE:\n");
// //       console.log(epub.flow);

// //       console.log("\nTOC:\n");
// //       console.log(epub.toc);

// //       // get first chapter
// //       epub.getChapter(epub.spine.contents[0].id, function (err, data) {
// //         if (err) {
// //           console.log(err);
// //           return;
// //         }
// //         console.log("\nFIRST CHAPTER:\n");
// //         console.log(data.substr(0, 512) + "..."); // first 512 bytes
// //       });

// //       /*
// //         epub.getImage(image_id, function(err, data, mimeType){
// //             console.log(err || data);
// //             console.log(mimeType)
// //         });
// //         */
// //     });

// //     epub.parse();
// //   } catch (error) {
// //     handleError(res, error);
// //   }
// // };
