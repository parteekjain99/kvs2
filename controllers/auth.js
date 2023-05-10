const jwt = require("jsonwebtoken");
const Models = require("../models/models");
// const multerS3 = require('multer-s3')
const moment = require("moment");
const utils = require("../middleware/utils");
const uuid = require("uuid");
const aws = require("aws-sdk");
const bcrypt = require("bcrypt");
const { addHours } = require("date-fns");
const { matchedData } = require("express-validator");
const auth = require("../middleware/auth");
const emailer = require("../middleware/emailer");
const { Op } = require("sequelize");

const HOURS_TO_BLOCK = 2;
const LOGIN_ATTEMPTS = 5;
const OTP_EXPIRED_TIME = 5;
var mongoose = require("mongoose");
const {
  getItem,
  getItemAccQuery,
  getItemsAccQuery,
  createItem,
  updateItem,
  deleteCustom,
  getItems,
  getItemWithInclude,
  getItemsWithInclude,
} = require("../shared/core");
const {
  capitalizeFirstLetter,
  uploadImage,
  uploadMultipleImages,
} = require("../shared/helpers");
const { log } = require("console");
const { allowedNodeEnvironmentFlags } = require("process");
// const { json } = require("stream/consumers");
var Notification = require("./notification");
const storagePath = process.env.STORAGE_PATH;
const storagePathHttp = process.env.STORAGE_PATH_HTTP;

aws.config.update({
  region: "ap-south-1",
  apiVersion: "2006-03-01",
  credentials: {
    accessKeyId: "AKIAZJDEDGCC6OQID7VB",
    secretAccessKey: "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",
  },
});

const stripe = require("stripe");
const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});


// const _sendNotification = async (data) => {
//   console.log(
//     "------------------------------------------ N O T I F I C A T I O N -----------------------------------",
//     data
//   );
//   if (data) {
//     Models.User.findOne({
//       where: {
//         id: data.sender_id,
//       },
//     }).then(
//       async (senderDetail) => {
//         if (senderDetail) {
//           let body, title;
//           let notificationObj = {
//             sender_id: data.sender_id,
//             receiver_id: data.receiver_id,
//             title:data.title,
//             body:data.body,

//             // type: data.type,
//           };
//           // if (data.value_id) notificationObj.value_id = data.value_id;
//           // if (data.type == "chat") {
//           //   body = data.body;
//           //   title = data.title;
//           // } else {
//           //   title = data.title;
//           //   body = data.body;
//           // }

//           notificationObj.body = body;
//           notificationObj.title = title;
//           try {
//             console.log(
//               "--------------- N O T I - - O B J ------",
//               notificationObj
//             );

//             await createItem(Models.Notification, notificationObj);
//           } catch (err) {
//             console.log("main err: ", err);
//           }

//           console.log("Before find user device");

//           await Models.FCM.findAll({
//             where: {
//               user_id: data.receiver_id,
//             },
//           })
//             .then(
//               (fcmTokens) => {
//                 console.log("fcmTokens", fcmTokens);
//                 if (fcmTokens) {
//                   const device_token = fcmTokens.map((ele) => ele.device_token);
//                   console.log(device_token);
//                   // delete data.push;
//                   // notificationObj;

//                   utils.sendPushNotification(
//                     device_token,
//                     title,
//                     body,
//                     notificationObj
//                   );
//                 } else {
//                   console.log("NO FCM TOKENS FOR THIS USER");
//                 }
//               },
//               (error) => {
//                 throw utils.buildErrObject(422, error);
//               }
//             )
//             .catch((err) => {
//               console.log("err: ", err);
//             });
//         } else {
//           throw utils.buildErrObject(422, "sender detail is null");
//         }
//       },
//       (error) => {
//         console.log("notification error in finding sender detail", error);
//         throw utils.buildErrObject(422, error);
//       }
//     );
//   } else {
//     throw utils.buildErrObject(422, "--* no type *--");
//   }
// };




const _sendNotification = async (data) => {
  console.log(
    "------------------------------------------ N O T I F I C A T I O N -----------------------------------",
    data
  );
  if (data.type) {
    Models.User.findOne({
      where: {
        id: data.sender_id,
      },
    }).then(
      async (senderDetail) => {
        if (senderDetail) {
          let body, title;
          let notificationObj = {
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            type: data.type,
          };
          if (data.value_id) notificationObj.value_id = data.value_id;
          if (data.type == "chat") {
            body = data.body;
            title = data.title;
          } else {
            title = data.title;
            body = data.body;
          }

          notificationObj.body = body;
          notificationObj.title = title;
          try {
            console.log(
              "--------------- N O T I - - O B J ------",
              notificationObj
            );

            await createItem(Models.Notification, notificationObj);
          } catch (err) {
            console.log("main err: ", err);
          }

          console.log("Before find user device");

          await Models.FCM.findAll({
            where: {
              user_id: data.receiver_id,
            },
          })
            .then(
              (fcmTokens) => {
                console.log("fcmTokens", fcmTokens);
                if (fcmTokens) {
                  const device_token = fcmTokens.map((ele) => ele.device_token);
                  console.log("device tokens are----", device_token);
                  delete data.push;
                  notificationObj;

                  utils.sendPushNotification(
                    device_token,
                    title,
                    body,
                    notificationObj
                  );
                } else {
                  console.log("NO FCM TOKENS FOR THIS USER");
                }
              },
              (error) => {
                throw utils.buildErrObject(422, error);
              }
            )
            .catch((err) => {
              console.log("err: ", err);
            });
        } else {
          throw utils.buildErrObject(422, "sender detail is null");
        }
      },
      (error) => {
        console.log("notification error in finding sender detail", error);
        throw utils.buildErrObject(422, error);
      }
    );
  } else {
    throw utils.buildErrObject(422, "--* no type *--");
  }
};


/*********************
 * Private functions *
 *********************/

/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = (user) => {
  // Gets expiration time
  console.log("user", user);
  const expiration =
    Math.floor(Date.now() / 1000) + 60 * process.env.JWT_EXPIRATION_IN_MINUTES;

  // returns signed and encrypted token
  return auth.encrypt(
    jwt.sign(
      {
        data: {
          id: user,
          type: "user",
        },
        exp: expiration,
      },
      process.env.JWT_SECRET
    )
  );
};

exports.createroom = async (req, res) => {
  try {
    const data = req.body;
    console.log("data---", data);
    const condition = {
      [Op.or]: [
        {
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
        },
        {
          sender_id: data.receiver_id,
          receiver_id: data.sender_id,
        },
      ],
    };
    console.log("condition---", condition);
    let roomDetail = await getItemAccQuery(Models.Room, condition);
    console.log("roomDetail---", roomDetail);

    if (!roomDetail) {
      let obj = {
        room_id: uuid.v4(),
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
      };
      console.log("roomDetail---", roomDetail);
      roomDetail = await createItem(Models.Room, obj);
    }
    res.status(200).json({ code: 200, data: roomDetail });
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = (req) => {
  console.log("req", req);
  let user = {
    id: req.id,
    reciveNotification: req.type,
    name: req.name,
    email: req.email,
    dob: req.dob,
    username: req.username,
    phone_no: req.phone_no,
    role: req.role,
  };
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== "production") {
    user = {
      ...user,
      verification: req.verification,
    };
  }
  return user;
};

const setBuisnessUserInfo = (req) => {
  console.log("req", req);
  let user = {
    businessname: req.businessname,
    whatsapp_no:req.whatsapp_no,
    reciveNotification: req.type,
    website: req.website,
    name: req.name,
    email: req.email,
    phone_no: req.phone_no,
    business_category: req.business_category,
    password: bcrypt.hashSync(req.password, 10),
    country_code: req.country_code,
    country: req.country,
    state: req.state,
    city: req.city,
    pincode: req.pincode,
    alternatePhoneno: req.alternatePhoneno,
    complete_address: req.complete_address,
    role: req.role,
  };
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== "production") {
    user = {
      ...user,
    };
  }
  return user;
};

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user) => {
  return new Promise((resolve, reject) => {
    const userAccess = {
      email: user.email,
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req),
      country: utils.getCountry(req),
    };
    Models.UserAccess.create(userAccess)
      .then((item) => {
        resolve({
          token: generateToken(user.id),
          user: setUserInfo(user),
        });
      })
      .catch((err) => {
        reject(utils.buildErrObject(422, err.message));
      });
  });
};

/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async (user) => {
  return new Promise((resolve, reject) => {
    user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK);
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      if (result) {
        resolve(utils.buildErrObject(409, "BLOCKED_USER"));
      }
    });
  });
};

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLoginAttemptsToDB = async (user) => {
  return new Promise((resolve, reject) => {
    user
      .save()
      .then((flag) => {
        resolve(true);
      })
      .catch((err) => {
        reject(utils.buildErrObject(422, err.message));
      });
  });
};

/**
 * Checks that login attempts are greater than specified in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = (user) =>
  user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date();

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async (user) => {
  return new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0;
      user
        .save()
        .then((data) => {
          resolve(true);
        })
        .catch((err) => {
          reject(utils.buildErrObject(422, err.message));
        });
    } else {
      // User is not blocked, check password (normal behaviour)
      resolve(true);
    }
  });
};

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async (user) => {
  return new Promise((resolve, reject) => {
    if (user.blockExpires > new Date()) {
      reject(utils.buildErrObject(409, "BLOCKED_USER"));
    }
    resolve(true);
  });
};

/**
 * Finds user by email
 * @param {string} email - user´s email
 */
// const findUser = async (obj) => {
//   return new Promise((resolve, reject) => {
//     const whereObj = {};
//     if (obj.email) {
//       whereObj.email = obj.email;
//     } else if (obj.phone_no) {
//       whereObj.phone_no = obj.phone_no;
//     }
//     Models.User.findOne({
//       where: whereObj,
//     })
//       .then((item) => {
//         if (item) {
//           resolve(item);
//         } else {
//           reject(utils.buildErrObject(422, "User Does Not Exist"));
//         }
//       })
//       .catch((err, item) => {
//         utils.itemNotFound(err, item, reject, "EMAIL NOT FOUND");
//       });
//   });
// };

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async (userId) => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, item) => {
      utils.itemNotFound(err, item, reject, "USER_DOES_NOT_EXIST");
      resolve(item);
    });
  });
};

/**
 * Adds one attempt to loginAttempts, then compares loginAttempts with the constant LOGIN_ATTEMPTS, if is less returns wrong password, else returns blockUser function
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async (user) => {
  user.loginAttempts += 1;
  await saveLoginAttemptsToDB(user);
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, "WRONG PASSWORD"));
    } else {
      resolve(blockUser(user));
    }
    reject(utils.buildErrObject(422, "ERROR"));
  });
};

exports.getFaq = async (req, res) => {
  try {
    if (req.query.id) {
      console.log("qry-->", req.query);
      var result = await Models.Faq.findOne({ where: { id: req.query.id } });
    } else {
      var result = await Models.Faq.findAll({});
    }
    res.status(200).json({ code: 200, result });
  } catch (error) {
    return error;
  }
};

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async (req) => {
  console.log("<----in---registerUser", req);
  return new Promise(async (resolve, reject) => {
    try {
      if (req.files && req.files.profile_image) {
        // check if image
        var image_name = await utils.uploadFile({
          image_data: req.files.profile_image,
          path: "/userImage",
        });
        req.profile_image = image_name.url;
      }

      const obj = {
        name: req.name,
        email: req.email,
        phone_no: req.phone_no,
        dob: req.dob,
        username: req.username,
        country_code: req.country_code,
        reciveNotification: req.type,
        verification: uuid.v4(),
        password: bcrypt.hashSync(req.password, 10),
        decoded_password: req.password,
        role: req.role,
        stripe_customer_id: req.stripe_customer_id,
      };

      const user = await createItem(Models.User, obj);
      // var title = "WelCome";
      // var body = user.name;

      //   var noti = {
      //     sender_id: user.id,
      //     receiver_id: user.id,
      //     title: title,
      //     body: body,
      //     type: req.body.type,
      //   };

      // const notification = _sendNotification(noti);
      resolve(user);
    } catch (err) {
      reject(utils.buildErrObject(422, err.message));
    }
  });
};

const registerBuisness = async (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      // if (req.files && req.files.profile_image) {
      //   // check if image
      //   var image = await uploadFile({
      //     file: req.files.profile_image,
      //     path: storagePath + "/userImage",
      //   });
      //   req.profile_image = image;
      // }
      const obj = {
        businessname: req.businessname,
        website: req.website,
        name: req.name,
        email: req.email,
        phone_no: req.phone_no,
        whatsapp_no:req.whatsapp_no,
        reciveNotification: req.type,
        business_category: req.business_category,
        password: bcrypt.hashSync(req.password, 10),
        decoded_password: req.password,
        city: req.city,
        state: req.state,
        country: req.country,
        country_code: req.country_code,
        pincode: parseInt(req.pincode),
        alternatePhoneno: req.alternatePhoneno,
        complete_address: req.complete_address,
        role: req.role,
        stripe_customer_id: req.stripe_customer_id,
      };

      const user = await createItem(Models.User, obj);

      // var title = "WelCome";
      // var body = user.name;

      //   var noti = {
      //     sender_id: user.id,
      //     receiver_id: user.id,
      //     title: title,
      //     body: body,
      //     type: req.body.type,
      //   };

      // const notification = _sendNotification(noti);
      resolve(user);
    } catch (err) {
      reject(utils.buildErrObject(422, err.message));
    }
  });
};
/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
  if (process.env.NODE_ENV !== "production") {
    userInfo.verification = item.verification;
  }
  const data = {
    code: 200,
    token: generateToken(item.id),
    user: userInfo,
  };
  return data;
};

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */

const verificationExists = async (id) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        verification: id,
        verified: false,
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, "NOT_FOUND_OR_ALREADY_VERIFIED");
        resolve(user);
      }
    );
  });
};

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async (user) => {
  return new Promise((resolve, reject) => {
    user.verified = true;
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve({
        email: item.email,
        verified: item.verified,
      });
    });
  });
};

/**
 * Updates a user password in database
 * @param {string} password - new password
 * @param {Object} user - user object
 */
const updatePassword = async (password, user) => {
  return new Promise((resolve, reject) => {
    user.password = password;
    user
      .save()
      .then((item) => {
        resolve(item);
      })
      .catch((err, item) => {
        utils.itemNotFound(err, item, reject, "NOT_FOUND");
      });
  });
};

/**
 * Finds user by email to reset password
 * @param {string} email - user email
 */
const findUserToResetPassword = async (email) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email,
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, "NOT_FOUND");
        resolve(user);
      }
    );
  });
};

/**
 * Creates a new password forgot
 * @param {Object} req - request object
 */
const saveForgotPassword = async (req) => {
  return new Promise((resolve, reject) => {
    const forgot = new ForgotPassword({
      email: req.body.email,
      verification: uuid.v4(),
      ipRequest: utils.getIP(req),
      browserRequest: utils.getBrowserInfo(req),
      countryRequest: utils.getCountry(req),
    });
    forgot.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve(item);
    });
  });
};

/**
 * Builds an object with created forgot password object, if env is development or testing exposes the verification
 * @param {Object} item - created forgot password object
 */
const forgotPasswordResponse = (item) => {
  let data = {
    msg: "RESET_EMAIL_SENT",
    email: item.email,
  };
  if (process.env.NODE_ENV !== "production") {
    data = {
      ...data,
      verification: item.verification,
    };
  }
  return data;
};

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async (token) => {
  return new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, "BAD_TOKEN"));
      }
      resolve(decoded.data._id);
    });
  });
};

/********************
 * Public functions *
 ********************/

/**
 * Login function called by route

//  */
// exports.login = async (req, res) => {
//   try {
//     const data = req.body;
//     const obj = {};
//     if (data.email) {
//       obj.email = data.email;
//     } else if (data.phone_no) {
//       obj.phone_no = data.phone_no;
//     }
//     const user = await findUser(obj);

//     await userIsBlocked(user);

//     await checkLoginAttemptsAndBlockExpires(user);

//     const isPasswordMatch = await auth.checkPassword(
//       data.password,
//       user.password
//     );

//     if (!isPasswordMatch) {
//       utils.handleError(res, await passwordsDoNotMatch(user));
//       return;
//     }

//     user.loginAttempts = 0;

//     await saveLoginAttemptsToDB(user);

//     if (user.status == "inactive") {
//       return res.status(422).json({
//         code: 422,
//         errors: {
//           msg: "You are disabled by Admin"
//         }
//       })
//     }

//     return res.status(200).json(await saveUserAccessAndReturnToken(req, user));
//   } catch (error) {
//     utils.handleError(res, error);
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const data = req.body;
//     console.log("data--->", data);
//     var user = await findUser(data.email);
//     const isPasswordMatch = await auth.checkPassword(data.password, user);
//     if (!isPasswordMatch) {
//       utils.handleError(res, await passwordsDoNotMatch(user));
//     } else {
//       //   user.loginAttempts = 0;
//       // if (user.is_payment == 'true') {
//       //   console.log('status->', user.status);

//       if (user.status == "active") {
//         res.status(200).json(await saveUserAccessAndReturnToken(req, user));
//       } else {
//         throw utils.buildErrObject(
//           400,
//           "You are currently inactive please contact admin"
//         );
//       }

//       // }
//       // else{
//       //   throw utils.buildErrObject(400, "Please do the payment for login")
//       // }
//     }
//   } catch (error) {
//     utils.handleError(res, error);
//   }
// };

exports.login = async (req, res) => {
  try {
    let data = req.body;

    // let findUser = await crud_table.findOne({ email: data.email });
    const findUser = await Models.User.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { email: data.email },
              { username: data.email },
              { phone_no: data.email },
            ],
          },
          //  {role:req.body.user_type},
          // {isShow:1},
        ],
        // email: data.email,
        // [Op.or] : { email:data.email, username:data.username , phone_no:data.phone_no}

        // [Op.or]: [
        //    { email: data.email },
        //    {role:req.query.user_type},
        //   { username: data.email },
        //   { phone_no: data.email },
        // ],
      },
    });

    //  if(findUser.)
    console.log(
      "++++++++++++++++++++++++++++user details------------>",
      findUser
    );
    if (!findUser)
      return res
        .status(404)
        .send({ status: false, message: "email  is incorrect " });

    const passwordDecrept = await bcrypt.compare(
      data.password,
      findUser.password
    );
    console.log(passwordDecrept);
    if (!passwordDecrept)
      return res
        .status(400)
        .send({ status: false, message: " password is incorrect" });

    if (findUser.role == req.body.user_type) {
      const userID = findUser.id;
      const payLoad = { userId: userID };
      const secretKey = "userp51";
      const token = jwt.sign(payLoad, secretKey);

      const paymentDetail = await Models.Payment.findOne({
        where: { user_id: userID },
      });

      res.status(200).json({
        code: 200,
        message: "User login successfully",
        data: { userId: findUser, paymentDetail: paymentDetail, token: token },
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "role incorrect ",
      });
    }
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET,
    async function (err, decoded) {
      if (err) {
        console.log(err);
        res.status(422).send("<h1> Token has been expired or invalid </h1>");
      } else {
        let item = await updateItem(
          User,
          { _id: mongoose.Types.ObjectId(decoded.data) },
          {
            verified: true,
            email_verified_at: Date.now(),
          }
        );
        if (item) {
          res.render("verificationSuccess", {
            redirectURL: `${process.env.WEBSITE_URL}auth/signin`,
          });
        } else {
          return res
            .status(201)
            .send("<h1 style='color:red'> Something Went Wrong </h1>");
        }
      }
    }
  );
};

/**
 * check email availablity
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.checkEmailAvailability = async (req, res) => {
  try {
    const doesEmailExists = await emailer.emailExists(req.body.email);
    res.status(201).json({ code: 200, status: doesEmailExists });
  } catch (error) {
    utils.handleError(res, error);
  }
};

// /**
//  * Register function called by route
//  * @param {Object} req - request object
//  * @param {Object} res - response object
//  */

exports.register = async (req, res) => {
  try {
    const data = req.body;
    const doesEmailExists = await emailer.emailExists(data.email);
    const doesmobileExists = await emailer.mobileExists(data.phone_no);
    console.log("data------->", data);
    const locale = req.getLocale(); // Gets locale from header 'Accept-Language'
    if (data.role === "user") {
      const UsernameExists = await emailer.userNameExists(data.username);

      if (!doesEmailExists && !doesmobileExists && !UsernameExists) {
        if (!doesEmailExists && !doesmobileExists && !UsernameExists) {
          const customer = await Stripe.customers.create({
            description: "TYPE USER REGISTER",
            email: data.email,
          });

          data.stripe_customer_id = customer.id;
          console.log("CUSTOMER==>", customer);

          const item = await registerUser(data);
          const userInfo = setUserInfo(item);

          const response = returnRegisterToken(item, userInfo);
          // emailer.sendVerificationEmail(locale, item, 'verifyEmail')
          res.status(201).json(response);
        }
      }
    } else if (data.role === "business") {
      if (!doesEmailExists && !doesmobileExists) {
        if (!doesEmailExists && !doesmobileExists) {
          console.log("---->STRIPE<----");
          const customer = await Stripe.customers.create({
            description: "TYPE BUSINESS REGISTER",
            email: data.email,
          });
          console.log("CUSTOMER==>", customer);
          data.stripe_customer_id = customer.id;

          const item = await registerBuisness(data);
          const userInfo = setBuisnessUserInfo(item);
          const response = returnRegisterToken(item, userInfo);
          // emailer.sendVerificationEmail(locale, item, 'verifyEmail')
          res.status(201).json(response);
        }
      }
    }
  } catch (error) {
    console.log("error----->", error);
    res.status(500).send({ status: false, error: error.message });
  }
};

// exports.blockUser = async (req, res) => {
//   try {
//     const token = req.headers.token;
//     console.log("token--------->", token);
//     const secretKey = "userp51";
//     const userID = jwt.verify(token, secretKey);
//     console.log("userId--------->", userID);

//     const BlockUserIds = req.body.userId;

//     const obj = {
//       BlockUserId: BlockUserIds,
//       userId: userID.userId,
//       reason: req.body.reason,
//     };

//     const user = await Models.Block.create(obj);

//     //prince change

//     const whereObj1 = {
//       id:userID.userId
//     }
//         const MyDetail = await getItemAccQuery(Models.User , whereObj1);
//         if(!MyDetail.following_list){
//           MyDetail.following_list=[];
//         }

//         if(!MyDetail.followers_list){
//           MyDetail.followers_list=[];
//         }

//         if(typeof(MyDetail.following_list)=== "string"){
//           MyDetail.following_list= JSON.parse(MyDetail.following_list);
//         }
//         if(typeof(MyDetail.followers_list)=== "string"){
//           MyDetail.followers_list= JSON.parse(MyDetail.followers_list);
//         }

//               if (MyDetail.following_list.includes(BlockUserIds)) {
//                 const index1 = MyDetail.following_list.indexOf(BlockUserIds);
//                 MyDetail.following_list.splice(index1, 1);
//       }
//       if (MyDetail.followers_list.includes(BlockUserIds)) {
//         const index1 = MyDetail.followers_list.indexOf(BlockUserIds);
//         MyDetail.followers_list.splice(index1, 1);
// }

//     const whereObj2 = {
//       id:BlockUserIds
//     }
//     const userDetail = await getItemAccQuery(Models.User , whereObj2);

//     if(!userDetail.followers_list){
//       userDetail.followers_list=[];
//     }
//     if(!userDetail.following_list){
//       userDetail.following_list=[];
//     }

//     if(typeof(userDetail.followers_list)=== "string"){
//       userDetail.followers_list= JSON.parse(userDetail.followers_list);
//     }
//     if(typeof(userDetail.following_list)=== "string"){
//       userDetail.following_list= JSON.parse(userDetail.following_list);
//     }

//     if (userDetail.followers_list.includes(userID.userId)) {
//       const index2 = userDetail.followers_list.indexOf(userID.userId);
//       userDetail.followers_list.splice(index2, 1);

// }
// if (userDetail.following_list.includes(userID.userId)) {
//   const index2 = userDetail.following_list.indexOf(userIDuserId);
//   userDetail.following_list.splice(index2, 1);

// }

//     //

//     await updateItem(Models.User,whereObj1, {following_list : MyDetail.following_list,followers_list : MyDetail.followers_list} );
//     // await updateItem(Models.User,whereObj1, {followers_list : MyDetail.followers_list} );
//     await updateItem(Models.User,whereObj2, {followers_list : userDetail.followers_list,following_list : userDetail.following_list} );
//     // await updateItem(Models.User,whereObj2, {following_list : userDetail.following_list} );

//     //end

//     const isPresent = await Models.Block.findOne({
//       where: {
//         isBlock: 0,
//         BlockUserId: BlockUserIds,
//         userId: userID.userId,
//       },
//     });

//     const isPresent1 = await Models.Block.findOne({
//       where: {
//         isBlock: 1,
//         BlockUserId: BlockUserIds,
//         userId: userID.userId,
//       },
//     });

//     // const whereObj = {
//     //   followId:BlockUserIds,
//     //   userId:userID.userId
//     // }

//     if (isPresent1) {
//       await Models.follow.update(
//         { isFollow: 0 },
//         {
//           where: {
//             [Op.and]: [{ followId: BlockUserIds }, { userId: userID.userId }],
//           },
//         }
//       );
//     } else if (isPresent1) {
//       console.log("present");
//       // await Models.follow.create(obj)
//       await Models.Block.update(
//         { isBlock: 0 },
//         {
//           where: {
//             isBlock: 1,
//             BlockUserId: BlockUserIds,
//             userId: userID.userId,
//           },
//         }
//       );
//       res.status(200).send({ data: "resp" });
//     } else if (isPresent) {
//       console.log("update follow");
//       // await Models.follow.create(obj)
//       await Models.Block.update(
//         { isBlock: 1 },
//         {
//           where: {
//             isBlock: 0,
//             BlockUserId: BlockUserIds,
//             userId: userID.userId,
//           },
//         }
//       );
//       res.status(200).send({ data: "resp" });
//     } else {
//       await Models.follow.update(
//         { isFollow: 0 },
//         {
//           where: {
//             [Op.and]: [{ followId: BlockUserIds }, { userId: userID.userId }],
//           },
//         }
//       );
//       await Models.Block.create(obj);
//     }

//     console.log("user--------->", user);

//     res.status(200).send({ data: user });
//   } catch (error) {
//     utils.handleError(res, err);
//   }
// };

exports.blockUser = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", userID);

    const BlockUserIds = req.body.userId;

    const obj = {
      BlockUserId: BlockUserIds,
      userId: id,
    };

    const updateObj = {
      isBlock: 1,
      reason: req.body.reason,
    };

    const user = await getItemAccQuery(Models.Block, obj);
    const data = {
      BlockUserId: BlockUserIds,
      userId: id,
      isBlock: 1,
      reason: req.body.reason,
    };
    if (!user) {
      console.log("USER NOT FOUND");
      await createItem(Models.Block, data);
    } else {
      console.log("UPDATED");
      await updateItem(Models.Block, obj, updateObj);
    }

    // const user = await Models.Block.create(obj);

    const delObj1 = {
      user_id: id,
      follow_following_id: BlockUserIds,
      // type: "following"
    };
    const delObj2 = {
      user_id: BlockUserIds,
      follow_following_id: id,
      // type: "follow"
    };

    await Models.Follow_Following.destroy({
      where: delObj1,
    });
    await Models.Follow_Following.destroy({
      where: delObj2,
    });

    res.status(200).send({ message: "Blocked" });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.followUser = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const data = await Models.User.findOne({
      where: {
        id: req.body.userId,
      },
    });

    const followIds = data.id;

    const obj = {
      followId: followIds,
      userId: userID.userId,
    };

    const isPresent = await Models.follow.findOne({
      where: {
        followId: followIds,
        userId: userID.userId,
      },
    });

    const isfollowed = await Models.follow.findOne({
      where: {
        followId: userID.userId,
        userId: followIds,
      },
    });

    const isfollowednot = await Models.follow.findOne({
      where: {
        isFollow: 0,
        followId: userID.userId,
        userId: followIds,
      },
    });

    const resp = await Models.Block.findOne({
      where: {
        BlockUserId: followIds,
        userId: userID.userId,
        isBlock: 1,
      },
    });

    // console.log("resp1--------", resp );
    // console.log("resp2--------", resp.isBlock);
    var title = " follow";
    var body = "user";

    var noti = {
      sender_id: id,
      receiver_id: id,
      title: title,
      body: body,
      type: "followUser",
    };
    if (resp) {
      console.log("followed");
      // await Models.follow.create(obj)
      
      await Models.follow.update(
        { isFollow: 0 },
        {
          where: {
            followId: followIds,
            userId: userID.userId,
          },
        }
      );
      res.status(200).send({ data: resp });
    } else if (!resp && isPresent) {
      console.log("present");
      // await Models.follow.create(obj)
      await Models.follow.update(
        { isFollow: 1 },
        {
          where: {
            isFollow: 0,
            followId: followIds,
            userId: userID.userId,
          },
        }
      );
      const notification = await _sendNotification(noti);
      res.status(200).send({ data: "followed" });
    } else if (!resp && isPresent) {
      console.log("update follow");
      // await Models.follow.create(obj)
      await Models.follow.update(
        { isFollow: 0 },
        {
          where: {
            isFollow: 1,
            followId: followIds,
            userId: userID.userId,
          },
        }
      );
      // res.status(200).send({ data: "unfollowed" });
    } else {
      console.log("nbot followed");
      const user = await Models.follow.create(obj);
      res.status(200).send({ data: "msg" });
    }
    // console.log("resp--------", resp && resp.isBlock);
    // console.log("resp1--------", resp );
    // console.log("resp2--------", resp.isBlock );

    if (isfollowed) {
      await Models.follow.update(
        { isFollowed: 1 },
        {
          where: {
            followId: userID.userId,
            userId: followIds,
          },
        }
      );
      const notification = await _sendNotification(noti);
      res.status(200).send({ data: isfollowed });
    } else if (isfollowednot) {
      await Models.follow.update(
        { isFollowed: 0 },
        {
          where: {
            isFollow: 0,
            followId: userID.userId,
            userId: followIds,
          },
        }
      );
      res.status(200).send({ data: isfollowednot });
    }
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.followingListing = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const result = await Models.follow.findAll({
      where: {
        [Op.and]: [
          { isFollow: 1 },
          { userId: req.query.userId || userID.userId },
        ],
      },
      include: [
        {
          model: Models.User,
          // where:{id:req.query.userId || userID.userId  },
          as: "Data",
        },
      ],
      // include: [
      //   {
      //     model: Models.User,
      //     as: "userData",
      //   },
      // ],
      // attributes: [
      //   'userId',
      // ],
      offset,
      limit,
    });

    const following = await Models.follow.findAll({
      where: {
        userId: req.query.userId || userID.userId,
        isFollow: 1,
      },
      offset,
      limit,
    });

    //  const datas= result.userId

    //   console.log("sddf-----", datas);

    // const followingUser = await Models.follow.findAll({
    //   where: {
    //     followId: datas,
    //     isFollow: 1,
    //   },
    //   offset,
    //   limit,
    // });

    res.status(200).json({
      code: 200,
      data: result,
      numberOfFollowing: following.length,
      // result:followingUser
    });
  } catch (error) {
    return error;
  }
};

exports.followersListing = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const result = await Models.follow.findAll({
      where: {
        [Op.and]: [
          { isFollow: 1 },
          { followId: req.query.userId || userID.userId },
        ],
      },
      include: [
        {
          model: Models.User,
          as: "userData",
        },
      ],
      offset,
      limit,
    });

    console.log("kdhsjdh", result);

    const follower = await Models.follow.findAll({
      where: {
        followId: req.query.userId || userID.userId,
        isFollow: 1,
      },
      offset,
      limit,
    });

    //   const isfollowed =  await  Models.follow.findOne({
    //     where: {

    //        followId:userID.userId,
    //        userId:req.body.userId
    //   }
    // })

    // console.log("jhje", isfollowed);
    //         if(isfollowed) {
    //          await   Models.follow.update({isFollowed:1},{
    //             where: {

    //               followId:userID.userId,
    //              userId:req.body.userId

    //           }
    //         })

    //       } else{
    //         res.send({msg:"error"})
    //       }

    res.status(200).json({
      code: 200,
      numberOfFollower: follower.length,
      data: result,
    });
  } catch (error) {
    return error;
  }
};

exports.getAllListing = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    // const result = await Models.follow.findAll({
    //   where: {
    //     [Op.and]: [{ isFollow: 1 }, { userId: userID.userId }],
    //   },
    //   include: [
    //     {
    //       model: Models.User,
    //       as: "Data",
    //     },
    //   ],
    //   offset,
    //   limit,
    // });

    // const following = await Models.follow.findAll({
    //   where: {
    //     userId: userID.userId,
    //     isFollow: 1,
    //   },
    //   offset,
    //   limit,
    // });

    // const results = await Models.follow.findAll({
    //   where: {
    //     [Op.and]: [{ isFollow: 1 }, { followId: userID.userId }],
    //   },
    //   include: [
    //     {
    //       model: Models.User,
    //       as: "userData",
    //     },
    //   ],
    //   offset,
    //   limit,
    // });

    // console.log("kdhsjdh", result);

    // const follower = await Models.follow.findAll({
    //   where: {
    //     followId: userID.userId,
    //     isFollow: 1,
    //   },
    //   offset,
    //   limit,
    // });

    const whereobj = {
      [Op.or]: [
        { user_id: id, type: "follow" },
        { user_id: id, type: "following" },
      ],
    };

    const include = {
      model: Models.User,
      as: "all_result",
      distinct: true
    };

   const rows = await Models.Follow_Following.findAll(
    {where:whereobj,
      include:[include],
      group: ['all_result.id']
    })
      
    // const { rows, count } = await getItemsWithInclude(
    //   Models.Follow_Following,
    //   whereobj,
    //   include,
    //   limit,
    //   offset
    // );

    //  console.log("DATA_____----",data);

    res.status(200).json({
      code: 200,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};


exports.unBlockUser = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const unblockIds = req.body.userId;

    await Models.Block.destroy({
      where: {
        BlockUserId: unblockIds,
        userId: userID.userId,
      },
    });

    // await user.save()
    // console.log("user--------->", user);

    res.status(200).send({ message: "unblock" });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    // const data = await Models.User.findOne({
    //   where: {
    //     id: req.body.userId,
    //   },
    // });
    // console.log("data--------->" , data);

    const unfollowIds = req.body.userId;
    console.log("unfollowIds--------->", unfollowIds);

    //  const obj = {
    //   followId:unfollowIds,
    //   userId:userID.userId,
    //  }

    // const user = await Models.follow.update({isFollow:0},{
    //   where: {
    //       followId:unfollowIds,
    //      userId:userID.userId
    //   }
    // }
    // );

    const isPresent = await Models.follow.findOne({
      where: {
        followId: unfollowIds,
        userId: userID.userId,
        isFollow: 0,
      },
    });

    var title = " unfollow ";
    var body = " user";

    var noti = {
      sender_id: id,
      receiver_id: id,
      title: title,
      body: body,
      type: "unfollow",
    };

    if (isPresent) {
      res.status(400).json({ status: 400, data: "already unfollowed" });
    } else {
      const user = await Models.follow.update(
        { isFollow: 0 },
        {
          where: {
            followId: unfollowIds,
            userId: userID.userId,
            isFollow: 1,
          },
        }
      );
      const notification = await _sendNotification(noti);
      res.status(200).send({ data: user, msg: "unfollow" });
    }

    // await user.save()
    // console.log("user--------->", user);
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.report = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const data = await Models.User.findOne({
      where: {
        id: req.body.userId,
      },
    });

    const reportUserIds = data.id;

    const obj = {
      reportUserId: reportUserIds,
      userId: userID.userId,
      reason: req.body.reason,
      AdditionalComments: req.body.AdditionalComments,
    };

    const user = await Models.reportUser.create(obj);

    console.log("user--------->", user);

    res.status(200).send({ data: user });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.reportPost = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    let data;
    if (req.body.group_id) {
      data = await Models.groupPosts.findOne({
        where: {
          id: req.body.PostId,
        },
      });
    } else {
      data = await Models.Posts.findOne({
        where: {
          id: req.body.PostId,
        },
      });
    }

    const reportPostId = data.id;
    const reportUserId = data.user_id;

    const obj = {
      report_post_userId: reportUserId,
      report_postId: reportPostId,
      userId: userID.userId,
      reason: req.body.reason,
      group_id: req.body.group_id,
      details: req.body.details,
    };

    const user = await Models.reportPost.create(obj);
    console.log("user--------->", user);

    res.status(200).send({ data: user });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.reportGroup = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const data = await Models.Group.findOne({
      where: {
        id: req.body.GroupId,
      },
    });

    const reportGroupId = data.id;
    const reportUserId = data.user_id;

    const obj = {
      report_group_userId: reportUserId,
      report_GroupId: reportGroupId,
      userId: userID.userId,
      reason: req.body.reason,
      details: req.body.details,
    };

    const user = await Models.reportGroup.create(obj);
    console.log("user--------->", user);

    res.status(200).send({ data: user });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.reportresonListing = async (req, res) => {
  try {
    console.log("result", req.query.type);
    const result = await Models.reasonToReport.findAll({});
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    return error;
  }
};

exports.PostreportresonListing = async (req, res) => {
  try {
    console.log("result", req.query.type);
    const result = await Models.reasonToReportPost.findAll({});
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    return error;
  }
};

exports.SavedPostListing = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", userID);
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    // const groupIds = await Models.Saved.findAll({
    //   where: {
    //     user_id:req.query.userId || userID.userId,
    //     isSaved:1
    //           },
    // })

    // console.log("groupIds",groupIds);

    // const result = await Models.Posts.findAll({where:{
    //   user_id:req.query.userId || userID.userId,
    //   isSaved:1
    // }});

    // const gpresult = await Models.groupPosts.findAll({where:{
    //   user_id:req.query.userId || userID.userId,
    //   isSaved:1
    // }});

    // const resp = [...gpresult,...result]

    const resp = await Models.Saved.findAll({
      where: {
        [Op.or]: [
          { user_id: req.query.userId || userID.userId },
          // { user_id: groupIds },
        ],
      },
      include: [
        {
          model: Models.Posts,
          // attributes:["media_url","thumbnail"],
          as: "postdetails",
        },
        {
          model: Models.postMedia,
          // attributes:["media_url","thumbnail"],
          as: "images",
        },
        {
          model: Models.User,

          as: "user_detail",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM post_like_dislikes AS likess
          WHERE
          likess.post_id = saved_post.post_id AND likess.user_id = ${id}
      )`),
            "isLike",
          ],
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM post_like_dislikes AS likess
          WHERE
          likess.post_id = saved_post.post_id AND likess.user_id = ${id}
      )`),
            "totalLikes",
          ],
        ],
      },

      offset,
      limit,
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({
      code: 200,
      data: resp,
    });
  } catch (error) {
    return error;
  }
};

exports.help = async (req, res) => {
  try {
    // let { type,subject,description} = req.body;

    const obj = {
      type: req.query.type,
      subject: req.body.subject,
      description: req.body.description,
    };

    const user = await createItem(Models.help, obj);
    res.status(200).send({ status: 200, data: user });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

exports.groups = async (req, res) => {
  try {
    const data = req.body;
    token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
const idd = userID.userId;
    data.userId = JSON.parse(data.userId);
    const ownerId = idd.toString();

data.userId.push(ownerId);
    if (req.files && req.files.profile_image) {
      var image_name = await utils.uploadFile({
        image_data: req.files.profile_image,
        path: "/group",
      });
      data.profile_image = image_name.url;
    }

    console.log(data.profile_image);
    // const groupcatagoryid = await Models.groupCatagory.findOne({
    //   where:{
    //     id:req.query.catagory_id
    //   }
    // })
    // console.log("groupcatagoryid.groupCatagory-----------",groupcatagoryid.groupCatagory);
    const obj = {
      userId: userID.userId,
      Group_catagory: data.Group_catagory,
      Description: data.Description,
      profile_image: data.profile_image,
      // memberId: data.userId,
      grouptitle: data.grouptitle,
    };
    console.log("obj -------", obj);

    const groupid = await Models.Group.create(obj);
    console.log("user2222 -------", userID.userId);

    const memberid = JSON.parse(data.userId)
    //  const obj1 = {
    //   userId:element,
    //   groupId:groupid.id
    // };
    // let element = [];

    for (let index = 0; index < memberid.length; index++) {
      // element.push(memberid[index]);
      const pobj = {
        userId: parseInt(memberid[index]),
        groupId: groupid.id,
      };
      await Models.groupMembers.create(pobj);
    }
    res.status(200).send({ status: 200, data: groupid });

    // console.log("obj -------", obj1);

    // const x = await Models.groupMembers.create(obj1);
    // console.log("user2222 -------", userID.userId)
    // res.status(200).send({ status: 200, data: x });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

exports.addmember = async (req, res) => {
  try {
    const data = req.body;
    token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("user -------", userID.userId);

    
    
       const userId  = JSON.parse(data.userId)
       let pobj ;
    for (let index = 0; index < userId.length; index++) {
      // element.push(memberid[index]);
       pobj = {
        userId: parseInt(userId[index]),
        groupId: data.groupId,
      };
      await Models.groupMembers.create(pobj);
    }
    res.status(200).send({ status: 200, data: pobj });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    // const data = req.body;
    // token = req.headers.token;
    // console.log("token--------->", token);
    // const secretKey = "userp51";
    // const userID = jwt.verify(token, secretKey);
    // console.log("user -------", userID.userId);

    // const adminDelete = await Models.Group.findOne({
    //   where: {
    //     isDeleted: 0,
    //     userId: userID.userId,
    //     id: req.body.groupId,
    //   },
    // });

    // const obj = {
    //   isDeleted: 0,
    //   userId: userID.userId,
    //   id: req.body.groupId,
    // };

    // const condition = {
    //   groupId: req.body.groupId,
    // };

    // if (adminDelete) {
    //   const result = await updateItem(Models.Group, obj, { isDeleted: 1 });
    //   await deleteCustom(Models.groupMembers, condition);
    //   res.status(200).send({ data: result });
    // } else {
    //   res.status(500).send({ status: false, data: "not present any group for delete" });
    // }

    const data = req.body;
    await Models.Group.destroy({ where: { id: data.groupId } });
    await Models.groupPosts.destroy({ where: { group_id: data.groupId } });
    await Models.postMedia.destroy({ where: { group_id: data.groupId } });
    await Models.groupMembers.destroy({ where: { groupId: data.groupId } });
    res.status(200).send({ code: 200, message: "deleted" });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.groupListing = async (req, res) => {
  try {
    const data = req.body;
    token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    // const result = await Models.Group.findAll({
    //   where:{
    //     userId:userID.userId
    //   },
    //   attributes: {
    //     include: [
    //       [
    //         sequelize.literal(`(
    //       SELECT COUNT(*)
    //       FROM group_member_ids AS member
    //       WHERE
    //       member.groupId = GroupIds.id
    //   )`),
    //         "membercount",
    //       ],
    //     ],
    //   },
    // offset,
    // limit,
    // });

    const result = await Models.groupMembers.findAll({
      where: {
        userId: userID.userId,
      },
      include: {
        required: true,
        model: Models.Group,
        as: "group",
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM group_member_ids AS groupp
                WHERE
                groupp.groupId = group.id
            )`),
              "membercount",
            ],
          ],
        },
      },
      offset,
      limit,
    });

    // if()
    // const gpid = result.map((x) => x.id)
    // const results = await Models.groupMembers.findAll({
    //   where: { groupId: gpid },
    // });
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const data = req.body;
    token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);

    const result = await Models.groupMembers.update(
      { isLeft: 1 },
      {
        where: {
          [Op.and]: [{ groupId: req.body.groupId }, { userId: userID.userId }],
        },
      }
    );
    res.status(200).json({
      code: 200,
      data: "user Left",
    });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

exports.groupCatagory = async (req, res) => {
  try {
    // console.log("result", req.query.type,);

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const result = await Models.groupCatagory.findAll({}, offset, limit);
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.serch = async (request, res) => {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit) : 10;
    const offset = request.query.offset ? parseInt(request.query.offset) : 0;
    const token = request.headers.token;
    const whereObj = {};

    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);
    if (request.query.type) {
      const like = { [Op.like]: "%" + request.query.type + "%" };

      // email: data.email,
      // [Op.or] : { email:data.email, username:data.username , phone_no:data.phone_no}
      // [Op.notIn]: [ { userId:userID.userId  }],
      whereObj.id = { [Op.ne]: userID.userId };

      whereObj[Op.or] = [
        { name: like },
        { email: like },
        { username: like },
        { phone_no: like },
        { businessname: like },
        { website: like },
        { alternatePhoneno: like },
        { dob: like },
        { business_category: like },
        { country_code: like },
        { bio: like },
        { city: like },
        { state: like },
        { country: like },
        { pincode: like },
        { complete_address: like },
      ];
    }

    const findUser = await Models.User.findAll({
      where: whereObj,
      offset,
      limit,
    });

    const obj = {
      query: request.query.type,
      userId: userID.userId,
    };

    const user = await createItem(Models.search, obj);

    res.status(200).send({ data: findUser });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};



exports.getmemberListing = async (request, res) => {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit) : 10;
    const offset = request.query.offset ? parseInt(request.query.offset) : 0;
    const token = request.headers.token;
    // const whereObj = {};

    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);
    if (request.query.group_id) {
      // email: data.email,
      // [Op.or] : { email:data.email, username:data.username , phone_no:data.phone_no}
      // [Op.notIn]: [ { userId:userID.userId  }],
      // const followedUserIds = await Models.Follow_Following.findAll({
      //   where: {
      //     [Op.or]: [
      //       {
      //         user_id: userID.userId,
      //         type: "following",
      //       },
      //       { user_id: userID.userId, type: "follow" },
      //     ],
      //   },
      // });
         
      const followedUserIdss = await Models.groupMembers.findAll({
        where: {
          groupId:request.query.group_id
        },
      });
      const flatArray = followedUserIdss.map((obj) => obj.userId);
       console.log("not in-------",followedUserIdss)
      // whereObj.user_id = { [Op.notIn]: flatArray};
      // whereObj.groupId = request.query.group_id;
       

    const findUser = await Models.Follow_Following.findAll({
      where:{
        [Op.and]: [
        { follow_following_id: { [Op.notIn]: flatArray} },
        { user_id: userID.userId },
      ]
    },
    include:[
          {
        model: Models.User,
      as: "following_Details",
      include: {
        model: Models.Follow_Following,
        required: false,
        where: {
          follow_following_id: userID.userId,
          // user_id : id,
          type: "follow",
        },
        as: "is_follow",
        // offset,
        // limit,
      }
    }
    ],
      offset,
      limit,
    });

    console.log("sjdifdhfi-------",findUser)
    res.status(200).send({ data: findUser });
    }
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

exports.recentsearch = async (req, res) => {
  // const n = req.query.n || 10;

  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const result = await Models.search.findAll({
      where: { userId: userID.userId },
    });
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting recent searches" });
  }
};

exports.removeRecentSerch = async (req, res) => {
  // const n = req.query.n || 10;

  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    // const recentSearches = await Models.search.findAll({
    //   limit: 10,
    // }

    // );
    const result = await Models.recent.destroy({
      where: {
        [Op.and]: [{ serchId: req.params.recentId }, { userId: userID.userId }],
      },
    });
    if (!result) {
      res.status(200).json({ msg: "not deleted" });
    }
    res.status(200).json({ msg: "deleted recent entry" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting recent searches" });
  }
};

exports.getAllPostsbyId = async (req, res) => {
  // const n = req.query.n || 10;

  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    // const id = 89;
    console.log("userId--------->", id);

    // const recentSearches = await Models.search.findAll({
    //   limit: 10,
    // }

    // );
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const result = await Models.Posts.findAll({
      where: {
        user_id: req.query.userId || id,
        type: "posts",
      },
      offset,
      limit,
      include: [
        {
          required: false,
          model: Models.postMedia,
          attributes: ["media_url", "thumbnail"],
          as: "image",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM post_like_dislikes AS likess
          WHERE
          likess.post_id = posts.id AND likess.user_id = ${id}
      )`),
            "isLike",
          ],
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM saved_posts AS likess
          WHERE
          likess.post_id = posts.id
      )`),
            "isSave",
          ],
          [
            sequelize.literal(`(
            SELECT COUNT(*)
            FROM comment_on_posts AS counts
            WHERE
            counts.post_id = posts.id 
        )`),
            "totalComments",
          ],
        ],
      },
    });
    if (!result) {
      res.status(400).json({ msg: "not available any post" });
    }
    res.status(200).json({ data: result, msg: "get all post" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting recent searches" });
  }
};



exports.getAllmembersAccordingbyGroupId = async (req, res) => {
  // const n = req.query.n || 10;

  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    // const id = 89;
    console.log("userId--------->", id);

    // const recentSearches = await Models.search.findAll({
    //   limit: 10,
    // }

    // );
    const whereObj = {};
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            

    const followedUserIdss = await Models.Group.findAll({
      where: {
        userId:id
      },
    });
    const flatArray = followedUserIdss.map((obj) => obj.id);
     console.log("not in-------",followedUserIdss)

    //  let whereObj;
     if (req.query.group_id == flatArray) {
      //  whereObj = { type: req.query.types };
       whereObj.groupId = req.query.group_id;
     }else{
      res.status(400).json({data:"error"})
     }
    //  else {
    //    whereObj = {
    //      user_id: id,
    //      type: req.query.types,
    //    };
    //  }
    // whereObj.groupId = { [Op.eq]: flatArray};


  const findUser = await Models.groupMembers.findAll({
    where: whereObj,
    include:[
      {
        model: Models.User,
        as: "userData",
      },
    ],
    offset,
    limit,
  });

  console.log("sjdifdhfi-------",findUser)
  res.status(200).send({ data: findUser });
  
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting recent searches" });
  }
};

// exports.getPostbyId = async (req, res) => {
//   // const n = req.query.n || 10;

//   try {
//     const token = req.headers.token;
//     console.log("token--------->", token);
//     const secretKey = "userp51";
//     const userID = jwt.verify(token, secretKey);
//     const id = userID.userId;
//     // const id = 89;
//     console.log("userId--------->", id);

//     // const recentSearches = await Models.search.findAll({
//     //   limit: 10,
//     // }

//     // );
//     const limit = req.query.limit ? parseInt(req.query.limit) : 10;
//     const offset = req.query.offset ? parseInt(req.query.offset) : 0;

//     const result = await Models.Posts.findAll({
//       where: {
//         id: req.query.post_id
//       },
//       include: [
//         {

//           model: Models.postMedia,
//           attributes:["media_url","thumbnail"],
//           as: "image",
//         },
//       ],
//       offset,
//       limit,
//       // attributes: {
//         //   include:
//         //     [
//           //       [sequelize.literal(`(
//             //     SELECT COUNT(*)
//             //     FROM post_like_dislikes AS likess
//       //     WHERE
//       //     likess.post_id = posts.id AND likess.user_id = ${id}
//       // )`), 'isLike'],
//       //     ]

//       // },
//     });
//     if (!result) {
//       res.status(400).json({ msg: "not available any post" });
//     }
//     res.status(200).json({ data: result, msg: "get all post" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error getting recent searches" });
//   }
// };

// exports.removeSerch = async (req,res) => {
//   // const n = req.query.n || 10;

//   try {

//     const token = req.headers.token;
//     console.log("token--------->", token);
//     const secretKey = "userp51";
//     const userID = jwt.verify(token, secretKey);
//     console.log("userId--------->" , userID);

//     // const recentSearches = await Models.search.findAll({
//     //   limit: 10,
//     // }

//     // );
//     const result = await Models.search.destroy({
//       where: {
//         [Op.and]: [
//           { query: req.query.query },
//           { userId: userID.userId }
//         ]
//       },

//     });
//     if(!result){
//       res.status(200).json({msg:"not deleted"});
//     }
//     res.status(200).json({msg:"deleted recent entry"});
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Error getting recent searches' });
//   }
// }

exports.removeAllRecentSerch = async (req, res) => {
  // const n = req.query.n || 10;

  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    // const recentSearches = await Models.search.findAll({
    //   limit: 10,
    // }

    // );
    const result = await Models.recent.destroy({
      where: {
        userId: userID.userId,
      },
    });
    if (!result) {
      res.status(200).json({ msg: "not deleted" });
    }
    res.status(200).json({ msg: "deleted recent entry" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting recent searches" });
  }
};

exports.recentvisit = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const params = req.params.serchId;
    console.log("params-------------->", params);
    if (!params) {
      res.send({ msg: "userid is missing" });
    }

    //  const findProduct = await Models.User.find({ id: params })
    //  console.log(findProduct)

    const obj = {
      userId: userID.userId,
      serchId: params,
    };

    const result = await Models.User.findOne({ where: { id: params } });
    console.log("result------", result);
    const resp = await Models.recent.findOne({
      where: {
        [Op.and]: [{ serchId: params }, { userId: userID.userId }],
      },
    });

    if (resp) {
      await Models.recent.destroy({
        where: {
          [Op.and]: [{ serchId: params }, { userId: userID.userId }],
        },
      });
      res.status(400).send({ data: result });
    }
    await Models.recent.create(obj);
    // else {

    // }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting recent searches" });
  }
};

exports.getallrecentVisit = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const response = await Models.recent
      .findAll({
        where: {
          // [Op.notIn]: {userId:userID.userId},
          userId: userID.userId,
        },

        include: [
          {
            model: Models.User,
            as: "userData",
          },
        ],
        limit: 5,
        order: [["updated_at", "DESC"]],
      })
      .then((result) => {
        res.json({ posts: result });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Failed to get data." });
      });

    if (!response) {
      res.status(400).send({ msg: "not found" });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.walkThrough = async (req, res) => {
  try {
    const data = await Models.walkThrough.findAll({});
    res.status(200).json({ code: 200, data: data });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.uploadPosts = async (req, res) => {
  try {
    const data = req.body;

    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    if (req.body.type == "posts") {
      const obj = {
        title: data.title,
        content: data.content,
        // post_image: data.post_image,
        role: data.role,
        user_id: userID.userId,
        // total_dislike: data.total_dislikes,
        // total_likes: data.total_likes,
        // status: data.status,
        // media_type: data.media_type,
      };
      console.log("obj--------->", obj);
      const user = await Models.Posts.create(obj);

      let postObj;
      if (data.post_image) {
        data.post_image = data.post_image;

        console.log(" data.post_image", data.post_image);
        console.log(
          " data.post_image===================",
          data.post_image.length
        );

        // uploadMedia()
        for (i = 0; i < data.post_image.length; i++) {
          postObj = {
            post_id: user.id,
            media_type: data.post_image[i].media_type,
            media_url: data.post_image[i].post_image,
            thumbnail: data.post_image[i].thumbnail,
          };
          console.log("postObj", postObj);
          const datas = await Models.postMedia.create(postObj);
          console.log("datas--------", datas);
        }
        res.status(200).send({ data: "datas" });
      }
    } else if (req.body.type == "BusinessRequirment") {
      if (req.files && req.files.BusinessRequirment_image) {
        var image_name = await utils.uploadFile({
          image_data: req.files.BusinessRequirment_image,
          path: "/BusinessRequirment",
        });
        data.BusinessRequirment_image = image_name.url;
      }

      const obj = {
        BusinessRequirment_image: data.BusinessRequirment_image,
        business_category: data.business_category,
        city: data.city,
        media_type: req.body.media_type,
        country: data.country,
        state: data.state,
        Required_goods: data.Required_goods,
        user_id: userID.userId,
        type: data.type,
        quantity:data.quantity,
        unit:data.unit,
        gmail:data.gmail,
        whatsapp_no:data.whatsapp_no
      };
      // const user = await Models.Posts.create(obj);
      const user = await createItem(Models.Posts, obj);
      res.status(200).send({ data: user });
    }
  } catch (error) {
    console.log("error in user details---", error);
    utils.handleError(res, error);
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    var image_name;
    if (req.files && req.files.post_image) {
      const objImage = {
        image_data: req.files.post_image,
        path: "/postImage",
      };
      image_name = await utils.uploadFile(objImage);
      console.log("image_name", image_name);
    }

    // const postObj = {
    //         post_id: user.id,
    //         media_url: image_name.url,
    //         thumbnail:thumbnail.url
    //       };
    //       await Models.postMedia.create(postObj);
    var data = null;
    if (image_name) {
      data = image_name.url;
    }
    res.status(200).json({
      code: 200,
      data: data,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getallPosts = async (req, res) => {
  try {
    // console.log("result", req.query.type,);
    const result = await Models.Posts.findAll({});
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getallroom = async (req, res) => {
  try {
    // console.log("result", req.query.type,);
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", userID);
    const result = await Models.Room.findAll({
      where: {
        [Op.or]: [
          {
            sender_id: id,
          },
          { receiver_id: id},
        ],
      },
      include: [
        {
          model: Models.User,
          // where:{
          //   receiver_id: id,
          // },
          as: "userData",
        },
        // {
        //   model: Models.User,
        //   // where:{
        //   //   sender_id: id,
        //   // },
        //   as: "userDatas",
        // },    
      ],
    });
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getnotificationListing = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    // console.log("result", req.query.type,);
    const result = await Models.Notification.findAll({
      where: {
        receiver_id: userID.userId,
      },
      offset,
      limit,
    });
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.updateNotificationStatus = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);
    // console.log("result", req.query.type,);

    const obj = {
      status: "unread",
      receiver_id: userID.userId,
    };

    const updateObj = {
      status: "read",
    };

    const result = await updateItem(Models.Notification, obj, updateObj);

    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.updateNotificationStatusbyNotificationid = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);
    // console.log("result", req.query.type,);

    const obj = {
      status: "unread",
      receiver_id: userID.userId,
      id: req.query.notification_id,
    };

    const updateObj = {
      status: "read",
    };

    const result = await updateItem(Models.Notification, obj, updateObj);

    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.businessRequirment = async (req, res) => {
  try {
    const data = req.body;

    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    if (req.files && req.files.BusinessRequirment_image) {
      var image_name = await utils.uploadFile({
        image_data: req.files.BusinessRequirment_image,
        path: "/BusinessRequirment",
      });
      data.BusinessRequirment_image = image_name.url;
    }

    const obj = {
      BusinessRequirment_image: data.BusinessRequirment_image,
      business_category: data.business_category,
      city: data.city,
      media_type: req.body.media_type,
      country: data.country,
      state: data.state,
      Required_goods: data.Required_goods,
      userId: userID.userId,
    };

    const user = await createItem(Models.businessRequirment, obj);

    res.status(200).send({ data: user });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.commentOnbusinessRequirment = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const requirment_id = parseInt(req.body.requirment_id);
    const { comment } = req.body;

    const obj = {
      requirment_id: requirment_id,
      comment: comment,
      user_id: id,
    };

    console.log("object is----", obj);

    if (!requirment_id || !comment) {
      res.status(400).json({ message: "requirment_id or comment is missing" });
    } else {
      const user = await createItem(Models.commentOnBusinessRequirment, obj);

      res.status(201).json(user);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.groupdetails = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const result = await Models.Group.findOne({
      where: { id: req.query.group_id, userId: id },
    });
    if (!result) {
      res.status(400).json({ code: 400, data: "not found" });
    }
    const results = await Models.groupMembers.findAll({
      where: { groupId: req.query.group_id },
    });
    res.status(200).json({
      code: 200,
      data: result,
      totalMember: results.length,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.uploadgroupPosts = async (req, res) => {
  try {
    const data = req.body;

    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    // const files = req.files;

    // console.log("files", files);
    // console.log("--------------------------DATA _________------------",data);
    const { group_id } = req.params;
    // for(let i=0 ; i<= req.files.post_image ; i++ ) {

    // }

    const obj = {
      title: data.title,
      group_id: group_id,
      content: data.content,
      // post_image: data.post_image,
      role: data.role,
      user_id: userID.userId,
      // total_dislike: data.total_dislikes,
      // total_likes: data.total_likes,
      // status: data.status,
      // media_type: data.media_type,
    };
    console.log("obj--------->", obj);
    const user = await Models.groupPosts.create(obj);
    console.log("user--------->", user);

    // if (req.files && req.files.post_image && req.files.post_image.length > 1) {
    //   for await (let data of req.files.post_image) {
    //     const objImage = {
    //       image_data: data,
    //       path: "/postImage",
    //     };
    //     console.log("objImage---", objImage);
    //     const image_name = await utils.uploadFile(objImage);
    //     const postObj = {
    //       group_id: user.group_id,
    //       post_id: user.id,
    //       media_url: image_name.url,
    //     };
    //     await Models.postMedia.create(postObj);
    //   }
    // } else {
    //   if (req.files && req.files.post_image) {
    //     const objImage = {
    //       image_data: req.files.post_image,
    //       path: "/postImage",
    //     };
    //     const image_name = await utils.uploadFile(objImage);
    //     const postObj = {
    //       group_id: user.group_id,
    //       post_id: user.id,
    //       media_url: image_name.url,
    //     };
    //     await Models.postMedia.create(postObj);
    //   }
    // }

    if (data.post_image) {
      data.post_image = data.post_image;
      console.log(" data.post_image", data.post_image);
      let postObj;
      // uploadMedia()
      for (i = 0; i < data.post_image.length; i++) {
        postObj = {
          group_id: user.group_id,
          media_type: data.post_image[i].media_type,
          media_url: data.post_image[i].post_image,
          thumbnail: data.post_image[i].thumbnail,
          post_id: user.id,
        };
        console.log("postObj", postObj);
        const datas = await Models.postMedia.create(postObj);
        console.log("datas--------", datas);
        res.status(200).send({ data: datas });
      }
    }

    res.status(200).send({ data: user });
  } catch (error) {
    console.log("error in user details---", error);
    utils.handleError(res, error);
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const post_id = parseInt(req.body.post_id);
    const { comment, group_id } = req.body;

    const obj = {
      post_id: post_id,
      group_id: group_id,
      comment: comment,
      user_id: id,
    };

    // console.log("object is----", obj);
    var title = " comment on ";
    var body = " post";

    // var noti = {
    //   sender_id: id,
    //   receiver_id: resid,
    //   title: title,
    //   body: body,
    //   type: "jdgsdgd",
    // };
      
    let whereObj = {};
        if (post_id) {
          whereObj = {post_id : req.body.post_id};
        } else if (post_id && group_id) {
          whereObj = {post_id : req.body.post_id,
            group_id : req.body.group_id};
        }
    const resp = await Models.commentOnPost.findOne({where:whereObj})
    console.log("resp---------------",resp)
    const resid = resp.user_id
    var noti = {
      sender_id: id,
      receiver_id: resid,
      title: title,
      body: body,
      type: "jdgsdgd",
    };
    if (!post_id || !comment) {
      res.status(400).json({ message: "post_id or comment is missing" });
    } else {
      const notification = await _sendNotification(noti);
      const user = await createItem(Models.commentOnPost, obj);

      res.status(201).json(user);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.commentListing = async (req, res) => {
  try {
    const result = await Models.commentOnBusinessRequirment.findAll({
      where: { requirment_id: req.query.requirment_id },
      include: {
        model: Models.User,
        as: "commentUserData",
      },
    });
    res.status(200).json({
      code: 200,
      data: result,
      count: result.length,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.commentListingbyPostId = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const result = await Models.commentOnPost.findAll({
      where: { post_id: req.query.post_id },
      include: {
        model: Models.User,
        as: "commentpost",
      },
      offset,
      limit,
    });
    res.status(200).json({
      code: 200,
      data: result,
      count: result.length,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.savedbyPostId = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);
    let msg;
    const { post_id, group_id } = req.body;
    // const post = await Models.Saved.findOne({where: {user_id:id,post_id : post_id}});

    const whereObj = {
      user_id: id,
      post_id: post_id,
    };

    const createData = {
      user_id: id,
      post_id: post_id,
      group_id: group_id,
    };
    const check_likeCondition = await getItemAccQuery(Models.Saved, whereObj);
    if (!check_likeCondition) {
      await Models.Saved.create(createData);
      msg = "Post Saved";
    } else {
      await Models.Saved.destroy({ where: whereObj });
      msg = "Post Unsaved";
    }

    res.status(200).json({
      code: 200,

      message: msg,
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.businessRequirmentListing = async (req, res) => {
  try {
    // console.log("result", req.query.type,);
    const result = await Models.businessRequirment.findAll({});
    res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.RequirmentListing = async (req, res) => {
  try {
    const data = req.query;
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    req.body.user_id = userID;
    // console.log("userId--------->", req.body.user_id);

    console.log("req.body.user_id", req.body.user_id);
    const id = userID.userId;

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    let whereObj;
    if (data.type === "all") {
      whereObj = { type: req.query.types };
    } else {
      whereObj = {
        user_id: id,
        type: req.query.types,
      };
    }

    if (req.query.types == "BusinessRequirment") {
      const user = await Models.Posts.findAll({
        where: whereObj,
        include: {
          model: Models.User,
          as: "user_detail",
        },
        // attributes: {
        //   include: [
        //     [
        //       sequelize.literal(`(
        //     SELECT COUNT(*)
        //     FROM comment_On_Business_RequirmentIds AS counts
        //     WHERE
        //     counts.requirment_id = businessRequirmentIds.id AND counts.parent_id = '0'
        // )`),
        //       "totalCounts",
        //     ],
        //   ],
        // },
        offset,
        limit,
      });

      const obj = {
        user_id: id,
        type: req.query.types,
      };
      const myBusinessRequirement = await getItemsAccQuery(Models.Posts, obj);

      if (user) {
        res.status(200).send({
          status: 200,
          data: " requirement listing data fetched",
          myCount: myBusinessRequirement.length,
          Data: user,
        });
      } else {
        res
          .status(400)
          .send({ status: 400, data: " requirement listing data not fetched" });
      }
    }
  } catch (error) {
    console.log("error in user details---", error);
    return error;
  }
};

exports.BussinessRequirmentDetails = async (req, res) => {
  try {
    const data = req.body;
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    req.body.user_id = userID;
    console.log("userId--------->", req.body.user_id);

    console.log("req.body.user_id", req.body.user_id);

    const whereObj = {
      id: req.query.requirmentId,
      type: req.query.type,
    };

    const include = {
      required: false,
      model: Models.User,
      as: "user_detail",
    };
    const user = await getItemWithInclude(Models.Posts, whereObj, include);
    // const user = await Models.businessRequirment.findOne({
    //   where: {
    //     id: req.query.requirmentId,
    //     userId: req.query.userId || userID.userId,
    //   },
    // });

    if (user) {
      res.status(200).send({
        status: 200,
        data: " requirement listing data fetched",
        Data: user,
      });
    } else {
      res
        .status(400)
        .send({ status: 400, data: " requirement listing data not fetched" });
    }
  } catch (error) {
    console.log("error in user details---", error);
    return error;
  }
};

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
  try {
    req = matchedData(req);
    const user = await verificationExists(req.id);
    res.status(200).json(await verifyUser(user));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Forgot password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.sendForgotPasswordEmail = async (req, res) => {
  try {
    const locale = req.getLocale(); // Gets locale from header 'Accept-Language'
    const data = req.body;
    const user = await findUser(data);
    let forgotPassword = await getItemCustom(ForgotPassword, {
      email: data.email,
      used: false,
      type: "user",
    });
    console.log("forgetPassword===>", forgotPassword);
    forgotPassword = forgotPassword.data;
    if (!forgotPassword) {
      forgotPassword = await saveForgotPassword(req);
    }
    let mailOptions = {
      to: data.email,
      subject: "Forgot Password",
      name: `${capitalizeFirstLetter(user.name)}`,
      url: `${
        data.is_development ? process.env.LOCAL_URL : process.env.WEBSITE_URL
      }auth/reset-password/${forgotPassword.verification}`,
    };
    emailer.sendEmail(locale, mailOptions, "/forgotPassword");
    res.status(200).json(forgotPasswordResponse(forgotPassword));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Checks User OTP
 * @param {Object} user - user object
 */
const checkOTP = async (User, otp) => {
  return new Promise((resolve, reject) => {
    if (User.forgot_password_otp_time < new Date())
      reject(utils.buildErrObject(409, "OTP_EXPIRED"));
    if (User.forgot_password_otp != otp)
      reject(utils.buildErrObject(409, "INVALID_OTP"));
    resolve(true);
  });
};

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
  try {
    var data = req.body;
    const changepassword = await auth.changeOldPassword(data, Models.User);
    res.status(200).json(changepassword);
  } catch (error) {
    utils.handleError(res, error);
  }
};

// exports.sendOtp = async (req, res) => {
//   try {
//     const data = req.body,
//       user = await findUser(data);

//     user.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
//     user.forgot_password_otp_time = new Date(
//       new Date().getTime() + OTP_EXPIRED_TIME * 60 * 1000
//     );

//     await Promise.all([
//       emailer.sendOtpOnEmail(
//         req.getLocale(),
//         {
//           email: user.email,
//           name: user.name,
//           otp: user.forgot_password_otp,
//         },
//         "RESET PASSWORD OTP"
//       ),
//       user.save(),
//     ]);

//     res.status(200).json({
//       code: 200,
//       data: "EMAIL_SEND",
//       email: user.email,
//     });
//   } catch (error) {
//     utils.handleError(res, error);
//   }
// };

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    const data = req.body;
    user = await findUser(data);

    if (await checkOTP(user, data.otp)) {
      user.forgot_password_otp_time = new Date();
      user.forgot_password_otp = 0;
      await user.save();
    }

    await updatePassword(data.new_password, user);

    res.status(200).json({
      code: 200,
      data: "PASSWORD CAHANGED",
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

// exports.forgotPassword = async (req, res) => {
//   try {
//     // Gets locale from header 'Accept-Language'
//     const locale = req.getLocale();
//     const data = matchedData(req);
//     await findUser(data.email || data.phone.no);
//     const item = await saveForgotPassword(req);
//     emailer.sendResetPasswordEmailMessage(locale, item);
//     res.status(200).json(forgotPasswordResponse(item));
//   } catch (error) {
//     utils.handleError(res, error);
//   }
// };

const findUser = async (data) => {
  return new Promise((resolve, reject) => {
    Models.User.findOne({
      where: {
        [Op.or]: [
          { email: data.email },
          { username: data.email },
          { phone_no: data.email },
        ],
      },
    })
      .then((item) => {
        var err = null;
        utils.itemNotFound(err, item, reject, "USER_DOES_NOT_EXIST");
        resolve(item);
      })
      .catch((err) => {
        var item = null;
        utils.itemNotFound(err, item, reject, "ERROR");
        resolve(item);
      });
  });
};

// async emailExists(email, throwError = true) {
//   return new Promise((resolve, reject) => {
//     model.User.findOne({
//       where:{email: email}
//     }).then(item => {
//       var err = null;
//       if (throwError) {
//         itemAlreadyExists(err, item, reject, 'EMAIL ALREADY EXISTS')
//       }
//       resolve(item ? true : false)
//     }).catch(err => {
//       var item = null;
//       itemAlreadyExists(err, item, reject, 'ERROR')
//       resolve(false)
//     })
//   })
// },

// async mobileExists(phone_no) {
//   return new Promise((resolve, reject) => {
//     model.User.findOne(
//       {
//         where: {
//           phone_no: phone_no
//         }
//       }
//     ).then(item => {
//       var err = null;
//       itemAlreadyExists(err, item, reject, 'MOBILE NUMBER_ALREADY_EXISTS')
//       resolve(item ? true : false)
//     }).catch(err => {
//       var item = null;
//       itemAlreadyExists(err, item, reject, 'ERROR')
//       resolve(false)
//     })
//   })
// },

exports.checkuser = async (req, res) => {
  try {
    const doesmobileExists = await emailer.mobileExists(req.body.phone_no);
    let UsernameExists;
    if(req.body.username){

       UsernameExists = await emailer.userNameExists(req.body.username);
    }else{
       UsernameExists = false;
    }
    const doesEmailExists = await emailer.emailExists(req.body.email);

    if (doesmobileExists || UsernameExists || doesEmailExists) {
      res
        .status(200)
        .json({ data: "email or username or mobile number already exist " });
    } else {
      res
        .status(200)
        .json({ data: "email or username or mobile number not exist " });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.sendOtp = async (req, res) => {
  try {
    // let data = req.body;
    const emailRegexp =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // const doesmobileExists = await emailer.mobileExists(req.body.phone_no);
    // const UsernameExists = await emailer.userNameExists(req.body.username);
    if (emailRegexp.test(req.body.email)) {
      const data = req.body;
      const locale = req.getLocale();

      console.log("CHECK ---->", data);

      // const user = await findUser(data);
      const user = await Models.User.findOne({
        where: { email: data.email },
      });

      console.log("USER--------------->", user);
      if (user) {
        // data.verificationfp_used = "false";
        // data.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
        // data.forgot_password_otp_time = new Date(
        //   new Date().getTime() + OTP_EXPIRED_TIME * 60 * 1000
        // );

        user.verificationfp_used = "false";
        user.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
        user.forgot_password_otp_time = new Date(
          new Date().getTime() + OTP_EXPIRED_TIME * 60 * 1000
        );

        // if(!user){
        //   data.otp = Math.floor(1000 + Math.random() * 9000);
        // }sendOtpOnEmail

        // const result = await Models.User.update(data, {
        //   where: {
        //     id: user.id,
        //   },
        // });

        user.save();

        data.first_name = user.first_name;
        data.email = user.email;
        await emailer.sendOtpOnEmail(locale, user, "otp for verification");
        res.status(200).json({ code: 200, message: "send otp successfully" });
      } else {
        const result = await createItem(Models.verifyotp, data);
        console.log("result-----------------------------", result);
        // data.email = result.email;
        result.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
        // console.log(" data.email-----",  data.email);
        // console.log("data.forgot_password_otp--------", data.forgot_password_otp);
        result.save();
        // const results = await Models.verifyotp.update(data, {
        //   where: {
        //     email: result.email,
        //   },
        // });
        await emailer.sendOtpOnEmail(locale, result, "otp for verification");
        res.status(200).json({ code: 200, message: "send otp successfully" });
        // // if(!req.body.otp){
        // //   res.status(400).json({code:400,data:"error"})
        // // }

        // res.status(400).json({ code: 400, message: "USER NOT FOUND" });
      }
    } else {
      res.status(200).json({ code: 200, message: "yet to be done " });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.verifyOtp = async (req, res) => {
  console.log(req.body);
  // let result;
  try {
    const result = await Models.verifyotp.findOne({
      where: {
        email: req.body.email,
        forgot_password_otp: req.body.forgot_password_otp,
      },
    });

    if (!result) {
      res.status(400).json({ code: 400, message: " otp wrong" });
    } else {
      res.status(200).json({ code: 200, message: "submit otp", data: result });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.submitotp = async (req, res) => {
  console.log(req.body);
  // let result;
  try {
    let data = req.body.password;
    let salt = 10;
    const encryptedPassword = await bcrypt.hash(data, salt);
    data = encryptedPassword;
    //  const otp = req.body.forgot_password_otp

    const model = await Models.User.findOne({
      where: {
        forgot_password_otp: req.body.forgot_password_otp,
      },
    });

    const obj = {
      password: data,
      decoded_password: req.body.password,
    };

    if (model) {
      await Models.User.update(obj, {
        where: {
          forgot_password_otp: req.body.forgot_password_otp,
        },
      });

      res.status(200).json({ code: 200, message: "submit otp and otp match" });
    } else {
      res.status(400).json({ msg: "otp does not match" });
    }
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.searchResult = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    console.log("userId--------->", userID);

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const data = await Models.User.findOne({
      where: {
        id: req.query.userId,
      },
      // include: [{
      //   model: Models.follow,
      //   as : "Data"
      // }],
      // order: [ [ 'id', 'DESC' ]],
    });

    const userId = data.id;

    const modelData = await Models.follow.findOne({
      where: {
        [Op.and]: [{ followId: userId }, { userId: userID.userId }],
      },
    });

    const block = await Models.Block.findOne({
      where: {
        [Op.and]: [{ BlockUserId: userId }, { userId: userID.userId }],
      },
      order: [["updated_at", "DESC"]],
    });

    const post = await Models.Posts.findAll({
      where: {
        user_id: userId,
      },
      offset,
      limit,
    });

    const whereObj = {
      id: req.query.userId,
    };
    //  const include = {
    //     model : Models.Follow_Following,
    //     required: false,
    //     where:{
    //       follow_following_id:userID.userId,
    //       type:"follow"
    //     },
    //      as :  "is_follow",

    // }

    //     const include = [{
    //       model : Models.Follow_Following,
    //       required: false,
    //       where:{
    //         follow_following_id:userID.userId,
    //         type:"follow"
    //       },
    //        as :  "following_list",

    //   },
    //   {
    //     model : Models.Follow_Following,
    //     required: false,
    //     where:{
    //       follow_following_id:userID.userId,
    //       type:"follow"
    //     },
    //      as :  "follower_list",

    // },

    // ]
    whereObj_followerList = {
      user_id: userId,
      type: "follow",
    };

    whereObj_followingList = {
      user_id: userId,
      type: "following",
    };

    // const include =[
    // {
    //   model : Models.Follow_Following,
    //   wh
    //   as :  "follower_list"
    // },
    // {
    //   model : Models.Follow_Following,
    //   as :  "following_list"
    // }
    // ]

    // const include_followingList={
    //   model : Models.Follow_Following,
    //   as :  "following_list"
    // }

    // [
    //   sequelize.literal(`(
    //   SELECT COUNT(*)
    //   FROM videos AS video
    //   WHERE
    //   video.category_id = categories.id
    // )

    const followingDetail = await getItemsWithInclude(
      Models.User,
      whereObj,
      include
    );

    // const follower = await Models.follow.findAll({
    //     //   where: {
    //     //     followId: userId,
    //     //     isFollow: 1,
    //     //   },
    //     //   offset,
    //     //   limit,
    //     // });

    //     // const following = await Models.follow.findAll({
    //     //   where: {
    //     //     userId: userId,
    //     //     isFollow: 1,
    //     //   },
    //     //   offset,
    //     //   limit,
    //     // });
    // let followCount;
    // let isFollow;
    //     if(!data.followers_list){
    //        followCount=0;
    //        isFollow=0;
    //     }else{
    //        followCount = data.followers_list.length;
    //        if (!data.followers_list.includes(userID.userId)) {
    //         isFollow=0;
    //       }else{
    //         isFollow=1;
    //       }
    //     }
    // let followingCount;
    // let isFollowing;
    //     if(!data.following_list){
    //       followingCount=0;
    //       isFollowing =0;
    //     }else{
    //        followingCount = data.following_list.length;
    //        if (!data.following_list.includes(userID.userId)) {
    //         isFollowing=0;
    //       }else{
    //         isFollowing =1;
    //       }
    //     }

    res.status(200).json({
      // data: data,
      data: followingDetail,
      // count:count,
      FollowIds: modelData,
      block: block,
      posts: post,
      numberOfPosts: post.length,
      // numberOfFollower: followCount,
      // numberOfFollowing: followingCount,
      // isFollow : isFollow,
      // isFollowing : isFollowing,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) => {
  return new Promise((resolve, reject) => {
    User.findById(data.id, (err, result) => {
      utils.itemNotFound(err, result, reject, "NOT_FOUND");
      if (data.roles.indexOf(result.role) > -1) {
        return resolve(next());
      }
      return reject(utils.buildErrObject(401, "UNAUTHORIZED"));
    });
  });
};

//PRINCE
exports.getFollowingList = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);
    let userId;
    if (req.query.user_id) {
      userId = parseInt(req.query.user_id);
    } else {
      userId = parseInt(id);
    }

    console.log(id, userId);
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    // const whereObj = { }
    const whereObj = { user_id: userId, type: "following" };

    // const include = {
    //   model: Models.Follow_Following,
    //   where : {
    //     user_id : userId,
    //     type : "following"
    //   },
    //   as: "",
    //   // required : true
    // }

    const include = {
      model: Models.User,
      as: "following_Details",
      include: {
        model: Models.Follow_Following,
        required: false,
        where: {
          follow_following_id: id,
          // user_id : id,
          type: "follow",
        },
        as: "is_follow",
        // offset,
        // limit,
      },
    };

    const { count, rows } = await getItemsWithInclude(
      Models.Follow_Following,
      whereObj,
      include,
      limit,
      offset
    );
    // const LGS_image =

    res.status(200).json({
      code: 200,
      count: count,
      data: rows,
    });

    // const userId = parseInt(req.query.user_id);
    //     const whereObj = {
    //       id:userId
    //     }
    //     const userDetail = await getItemAccQuery(Models.User , whereObj);

    //     if(!userDetail.following_list){
    //       userDetail.following_list=[];
    //     }

    //     if(typeof(userDetail.following_list)=== "string"){
    //       userDetail.following_list= JSON.parse(userDetail.following_list);
    //     }
    //     console.log("-----------",userDetail.following_list);

    //     const allFollowingList = await Models.User.findAll({where: {id: userDetail.following_list}
    //     });
    //     const count = allFollowingList.length;

    // // let isFollow;
    // //     if(!userDetail.followers_list){
    // //        isFollow=0;
    // //     }else{
    // //        if (!userDetail.followers_list.includes(id)) {
    // //         isFollow=0;
    // //       }else{
    // //         isFollow=1;
    // //       }
    // //     }
    // // let isFollowing;
    // //     if(!userDetail.following_list){
    // //       isFollowing =0;
    // //     }else{
    // //        if (!userDetail.following_list.includes(id)) {
    // //         isFollowing=0;
    // //       }else{
    // //         isFollowing =1;
    // //       }
    // //     }

    // res.status(200).json({data: allFollowingList, followings:count });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getFollowerList = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);
    let userId;
    if (req.query.user_id) {
      userId = parseInt(req.query.user_id);
    } else {
      userId = parseInt(id);
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    // const whereObj = { }
    const whereObj = { user_id: userId, type: "follow" };

    // const include = {
    //   model: Models.Follow_Following,
    //   where : {
    //     user_id : userId,
    //     type : "following"
    //   },
    //   as: "",
    //   // required : true
    // }

    const include = {
      model: Models.User,
      as: "following_Details",
      include: {
        model: Models.Follow_Following,
        required: false,
        where: {
          follow_following_id: id,
          // user_id : id,
          type: "follow",
        },
        as: "is_follow",
      },
    };

    const { count, rows } = await getItemsWithInclude(
      Models.Follow_Following,
      whereObj,
      include,
      limit,
      offset
    );
    // const LGS_image =

    res.status(200).json({
      code: 200,
      count: count,
      data: rows,
    });
    //     const whereObj = {
    //       id:userId
    //     }
    //     const userDetail = await getItemAccQuery(Models.User , whereObj);

    //     if(!userDetail.followers_list){
    //       userDetail.followers_list=[];
    //     }

    //     if(typeof(userDetail.followers_list)=== "string"){
    //       userDetail.followers_list= JSON.parse(userDetail.followers_list);
    //     }

    //     const allFollowersList = await Models.User.findAll({where: {id:userDetail.followers_list}
    //     });

    //     const count = allFollowersList.length;

    // //     let isFollow;
    // //     if(!userDetail.followers_list){
    // //        isFollow=0;
    // //     }else{
    // //        if (!userDetail.followers_list.includes(id)) {
    // //         isFollow=0;
    // //       }else{
    // //         isFollow=1;
    // //       }
    // //     }
    // // let isFollowing;
    // //     if(!userDetail.following_list){
    // //       isFollowing =0;
    // //     }else{
    // //        if (!userDetail.following_list.includes(id)) {
    // //         isFollowing=0;
    // //       }else{
    // //         isFollowing =1;
    // //       }
    // //     }

    //     res.status(200).json({data :allFollowersList, followers:count });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.follow = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = parseInt(userID.userId);
    console.log("Id--------->", id);

    // const id = req.user.id;
    const userId = parseInt(req.body.user_id);
    console.log("userId--------->", userId);
    //     const id = 67;
    // const userId = 75;
    //MY
    // const whereObj1 = {
    //   id:id
    // }
    //     const MyDetail = await getItemAccQuery(Models.User , whereObj1);
    //     console.log("------------FOLLOWINGLIST-----",MyDetail);
    //     console.log("------------FOLLOWINGLIST-----",MyDetail.following_list);
    //     if(!MyDetail.following_list){
    //       MyDetail.following_list=[];
    //     }

    //     if(typeof(MyDetail.following_list)=== "string"){
    //       MyDetail.following_list= JSON.parse(MyDetail.following_list);
    //     }

    // if (!MyDetail.following_list.includes(userId)) {
    //   MyDetail.following_list.push(userId);
    // }

    // const whereObj2 = {
    //   id:userId
    // }
    // const userDetail = await getItemAccQuery(Models.User , whereObj2);

    // if(!userDetail.followers_list){
    //   userDetail.followers_list=[];
    // }

    // if(typeof(userDetail.followers_list)=== "string"){
    //   userDetail.followers_list= JSON.parse(userDetail.followers_list);
    // }

    // if (!userDetail.followers_list.includes(id)) {
    //   userDetail.followers_list.push(id);
    // }

    const crObj1 = {
      user_id: id,
      follow_following_id: userId,
      type: "following",
    };
    const crObj2 = {
      user_id: userId,
      follow_following_id: id,
      type: "follow",
    };
    let msg;
    const user = await Models.Follow_Following.findOne({
      where: crObj1,
    });
    console.log("-------------", user);

    const checkBlockObj = {
      [Op.or]: [
        { userId: id, BlockUserId: userId },
        { userId: userId, BlockUserId: id },
      ],
    };

    const isUserBlock = await getItemAccQuery(Models.Block, checkBlockObj);
    if (isUserBlock) {
      msg = "You cant follow him";
    } else {
      if (!user) {
        await createItem(Models.Follow_Following, crObj1);
        await createItem(Models.Follow_Following, crObj2);
        msg = "follow";
      } else {
        msg = "you already follow him";
      }
    }

    //

    // await updateItem(Models.User,whereObj1, {following_list : MyDetail.following_list} );
    // await updateItem(Models.User,whereObj2, {followers_list : userDetail.followers_list} );

    res.status(200).json({ code: 200, message: msg });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.unfollow = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = parseInt(userID.userId);
    console.log("userId--------->", id);

    // const id = req.user.id;
    const userId = parseInt(req.body.user_id);
    //     const id = 67;
    // const userId = 75;
    //MY
    //     const whereObj1 = {
    //       id:id
    //     }
    //         const MyDetail = await getItemAccQuery(Models.User , whereObj1);
    //         if(!MyDetail.following_list){
    //           MyDetail.following_list=[];
    //         }

    //         if(typeof(MyDetail.following_list)=== "string"){
    //           MyDetail.following_list= JSON.parse(MyDetail.following_list);
    //         }

    //               if (MyDetail.following_list.includes(userId)) {
    //                 const index1 = MyDetail.following_list.indexOf(userId);
    //                 MyDetail.following_list.splice(index1, 1);
    //       }

    //     const whereObj2 = {
    //       id:userId
    //     }
    //     const userDetail = await getItemAccQuery(Models.User , whereObj2);

    //     if(!userDetail.followers_list){
    //       userDetail.followers_list=[];
    //     }

    //     if(typeof(userDetail.followers_list)=== "string"){
    //       userDetail.followers_list= JSON.parse(userDetail.followers_list);
    //     }

    //     if (userDetail.followers_list.includes(id)) {
    //       const index2 = userDetail.followers_list.indexOf(id);
    //       userDetail.followers_list.splice(index2, 1);

    // }

    //     //

    //     await updateItem(Models.User,whereObj1, {following_list : MyDetail.following_list} );
    //     await updateItem(Models.User,whereObj2, {followers_list : userDetail.followers_list} );
    const delObj1 = {
      user_id: id,
      follow_following_id: userId,
      type: "following",
    };
    const delObj2 = {
      user_id: userId,
      follow_following_id: id,
      type: "follow",
    };

    await Models.Follow_Following.destroy({
      where: delObj1,
    });
    await Models.Follow_Following.destroy({
      where: delObj2,
    });

    res.status(200).json({ code: 200, message: "unfollow" });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.userResultById = async (req, res) => {
  try {
    const data = req.query;
    const token = req.headers.token;
    console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = parseInt(userID.userId);
    console.log("userId--------data.userId->", data.userId);

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const userData = await Models.User.findOne({
      where: {
        id: data.userId,
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM follow_followings AS follwingCount
          WHERE
          follwingCount.user_id = users.id AND follwingCount.type = 'following'
      )`),
            "totalFollwingCount",
          ],
          [
            sequelize.literal(`(
        SELECT COUNT(*)
        FROM follow_followings AS followerCount
        WHERE
        followerCount.user_id = users.id AND followerCount.type = 'follow'
    )`),
            "totalFollowerCount",
          ],
          [
            sequelize.literal(`(
      SELECT COUNT(*)
      FROM follow_followings AS isFollow
      WHERE
      isFollow.user_id = users.id AND isFollow.type = 'follow' AND isFollow.follow_following_id = ${id}
  )`),
            "isFollow",
          ],
          [
            sequelize.literal(`(
    SELECT COUNT(*)
    FROM follow_followings AS isFollow
    WHERE
    isFollow.user_id = users.id AND isFollow.type = 'following' AND isFollow.follow_following_id = ${id}
)`),
            "isFollowing",
          ],
        ],
      },
    });

    const userId = userData ? userData.id : null;

    // const modelData = await Models.follow.findOne({
    //   where: {
    //     [Op.and]: [{ followId: userId }, { userId: userID.userId }],
    //   },
    // });

    const block = await Models.Block.findOne({
      where: {
        [Op.and]: [{ BlockUserId: userId }, { userId: userID.userId }],
      },
      order: [["updated_at", "DESC"]],
    });

    const post = await Models.Posts.findAll({
      where: {
        user_id: userId,
      },
      offset,
      limit,
    });

    res.status(200).json({
      code: 200,
      data: userData,
      block: block,
      posts: post.length,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.allPostListing = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const whereObj1 = {};

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    //   where: {
    //     [Op.and]: [{ isFollow: 1 }, { userId: userID.userId }],
    //   },
    //   include: [
    //     {
    //       model: Models.User,
    //       as: "Data",
    //     },
    //   ],
    //   offset,
    //   limit,
    // });

    // const following = await Models.follow.findAll({
    //   where: {
    //     userId: userID.userId,
    //     isFollow: 1,
    //   },
    //   offset,
    //   limit,
    // });

    // const results = await Models.follow.findAll({
    //   where: {
    //     [Op.and]: [{ isFollow: 1 }, { followId: userID.userId }],
    //   },
    //   include: [
    //     {
    //       model: Models.User,
    //       as: "userData",
    //     },
    //   ],
    //   offset,
    //   limit,
    // });

    // console.log("kdhsjdh", result);

    // const follower = await Models.follow.findAll({
    //   where: {
    //     followId: userID.userId,
    //     isFollow: 1,
    //   },
    //   offset,
    //   limit,
    // });const result = await Models.Posts.findAll({

    //     const whereobj = {

    //     }

    //     const include =
    //      [
    //         {
    //           required: true,
    //           model: Models.Follow_Following,

    //           as: "Post_Details",
    //           include:{
    //             model : Models.User,
    //             as : "Users_Detail"
    //           }
    //         },
    //         // {
    //         //   required: false,
    //         //   model: Models.postMedia,
    //         //   as: "Posts"
    //         // },

    //       ]

    const followedUserIds = await Models.Follow_Following.findAll({
      where: {
        [Op.or]: [
          {
            user_id: id,
            type: "following",
          },
          { user_id: id, type: "follow" },
        ],
      },
    });

    const flatArray = followedUserIds.map((obj) => obj.follow_following_id);

    // console.log("followedUserIds",followedUserIds[0].dataValues.follow_following_id);

    const SearchUserIds = await Models.search.findAll({
      where: {
        userId: id,
      },
    });

    const flatenArray = SearchUserIds.map((obj) => obj.query);

    console.log("followedUserIds", flatenArray);

    // const respn = ()
    // var resp
    //  for (let index = 0; index < flatArray.length; index++) {
    //   let element = flatArray[index];
    //   console.log("element",element )

    const resp = await Models.Posts.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { city: flatenArray },
              { country: flatenArray },
              { state: flatenArray },
              { Required_goods: flatenArray },
              { business_category: flatenArray },
              { title: flatenArray },
              { content: flatenArray },
              { title: { [Op.like]: "%" + req.query.type + "%" } },
              { content: { [Op.like]: "%" + req.query.type + "%" } },
              { user_id: id },

              // {"$Post_Details.follow_following_id$" :id },
              // {"$Post_Details.type$" :"following" },

              { user_id: flatArray },
            ],
          },
          { isShow: 1 },
          { type: "posts" },
        ],
      },

      include: [
        {
          model: Models.postMedia,
          attributes: ["media_url", "thumbnail"],
          as: "image",
        },
        {
          model: Models.User,
          attributes: ["name", "businessname", "profile_image"],
          as: "user_detail",
        },
        // {
        //   required: true,
        //   model: Models.Follow_Following,
        //   as: "Post_Details",
        // },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
            SELECT COUNT(*)
            FROM post_like_dislikes AS likess
            WHERE
            likess.post_id = posts.id AND likess.user_id = ${id}
        )`),
            "isLike",
          ],

          [
            sequelize.literal(`(
        SELECT COUNT(*)
        FROM saved_posts AS likess
        WHERE
        likess.post_id = posts.id AND likess.user_id = ${id}
    )`),
            "isSave",
          ],


          [
            sequelize.literal(`(
            SELECT COUNT(*)
            FROM comment_on_posts AS counts
            WHERE
            counts.post_id = posts.id AND counts.parent_id = '0'
        )`),
            "totalComments",
          ],
        ],
      },

      // where: {

      //     [Op.or]: [
      //       // { title: { [Op.like]: "%" + req.query.type + "%" } },
      //       // { content: { [Op.like]: "%" + req.query.type + "%" } },
      //       { user_id: id },
      //      {[Op.and] : [

      //           {"$Post_Details.user_id$" :id },
      //           {"$Post_Details.type$" :"following" },
      //         ]}

      //       // { user_id: followedUserIds}
      //     ],
      //     isShow:1,

      //   },
      // where: {
      //   [Op.or]:[{
      //     user_id: id,
      //     type: "following",
      //   },
      //  { user_id: id,
      //   type: "follow",},]
      // },
      offset,
      limit,
      order: [["created_at", "DESC"]],
    });

    // const condition = {
    //   id:req.body.post_id,
    //   isShow:1,
    // }
    // await updateItem(Models.Posts,condition,{isShow:0})

    // const result = await Models.Posts.findAll({where: {
    //   user_id:  id,
    // }})

    // console.log("results--------",result);

    // if (req.query.type) {
    //   const like = { [Op.like]: "%" + req.query.type + "%" };

    // whereObj1.id = { [Op.ne]: userID.userId };

    //   whereObj1[Op.or] = [
    //     { content: like },
    //     { title: like },
    //   ];
    // }

    // const findUser = await Models.Posts.findAll({
    //   where: whereObj1,
    //   // limit: 10,
    // });

    // const  {count,rows}  = await getItemsWithInclude(Models.Posts, whereobj, include, limit, offset);
    // console.log("row------",rows);
    // const returns =  [...new Set([...rows,...result,...findUser])]
    // const resp = returns.sort((a,b) => a-b)
    //  console.log(`(
    //   SELECT "user_id"
    //   FROM "follow_followings"
    //   WHERE
    //   "user_id"  = ${id}
    // )`);
    //     const posts = await Models.Posts.findAll({
    //       where: {

    //           [Op.or]: [

    //           //   [sequelize.literal(`(
    //           //     SELECT "user_id"
    //           //     FROM "follow_followings"
    //           //     WHERE
    //           //     user_id  = ${id}
    //           // )`), 'followers'],

    //             {
    //               [Op.in]: [
    //                 [sequelize.literal(`(
    //                   SELECT "user_id"
    //                   FROM "follow_followings"
    //                   WHERE
    //                   user_id  = ${id}
    //               )`), 'followers'],
    //               ]
    //             },
    //             // { user_id: id },
    //           ]
    //         }

    //     });
    if (resp) {
      res.status(200).json({
        code: 200,
        // count:count,
        data: resp,
      });
    } else {
      res.status(200).json({
        code: 200,
        // count:count,
        data: "No Post Found",
      });
    }
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.getPostById = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const whereObj = {
      id:req.body.post_id
    };
   const post = await Models.Posts.findAll({
    where:whereObj,
    include:[{
      model: Models.postMedia,
      as: "Posts"
    },
    {
      model: Models.User,
      // attributes: ["name", "businessname", "profile_image"],
      as: "user_detail",
    }],
    attributes: {
      include: [
        [
          sequelize.literal(`(
        SELECT COUNT(*)
        FROM post_like_dislikes AS likess
        WHERE
        likess.post_id = posts.id AND likess.user_id = ${id}
    )`),
          "isLike",
        ],
        [
          sequelize.literal(`(
        SELECT COUNT(*)
        FROM saved_posts AS likess
        WHERE
        likess.post_id = posts.id AND likess.user_id = ${id}
    )`),
          "isSave",
        ],
      ],
    },
   })

    res.status(200).json({
      code: 200,
      data: post
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.allGroupPostListing = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const group_id = req.query.group_id;

    // const whereobj = { group_id: group_id }

    // const include =
    // {
    //   required: false,
    //   model: Models.postMedia,
    //   as: "Posts"
    // }
    const resp = await Models.groupPosts.findAll({
      where: {
        group_id: group_id,
      },
      include: [
        {
          model: Models.postMedia,
          attributes: ["media_url", "thumbnail"],
          as: "image",
        },
        {
          model: Models.User,
          attributes: ["name", "businessname", "profile_image"],
          as: "user_detail",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM post_like_dislikes AS likess
          WHERE
          likess.post_id = group_posts.id AND likess.user_id = ${id}
      )`),
            "isLike",
          ],
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM saved_posts AS likess
          WHERE
          likess.post_id = group_posts.id
      )`),
            "isSave",
          ],
        ],
      },
      order: [["created_at", "DESC"]],
    });

    // const { rows } = await getItemsWithInclude(Models.Posts, whereobj, include, limit, offset);
    res.status(200).json({
      code: 200,
      data: resp,
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.addFCM = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const data = req.body;
    data.user_id = id;

    const FCM_Details = await createItem(Models.FCM, data);

    res.status(200).json({
      code: 200,
      data: FCM_Details,
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.removeFCM = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    const data = req.body;
    await Models.FCM.destroy({ where: { device_id: data.device_id } });

    res.status(200).json({
      code: 200,
      message: "FCM removed",
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.postLike = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

     // console.log("object is----", obj);
    var title = " post";
    var body = "Liked";
    
    const { post_id, group_id } = req.body;
     console.log("post_id",post_id)
    const resp = await Models.Posts.findOne({where:{id:post_id}})
    console.log("resp---------------",resp)
  const resid = resp.user_id
        console.log("resid",resid)
    let msg;
    var noti = {
      sender_id: id,
      receiver_id: resid,
      title: title,
      body: body,
      type: "sdhdjshf",
    };
    let post;
    if (!group_id) {
      post = await Models.Posts.findOne({ where: { id: post_id } });
      // const notification = await _sendNotification(noti);
    } else {
      post = await Models.groupPosts.findOne({ where: { id: post_id } });
      // const notification = await _sendNotification(noti);
    }

    if (!post.total_likes) {
      post.total_likes = 0;
    }
    const whereObj = {
      user_id: id,
      post_id: post_id,
    };

    const createData = {
      user_id: id,
      post_id: post_id,
      group_id: group_id,
    };
    const check_likeCondition = await getItemAccQuery(
      Models.LikeDislike,
      whereObj
    );
    if (!check_likeCondition) {
      await Models.LikeDislike.create(createData);
      const notification = await _sendNotification(noti);
      post.total_likes++;
      post.save();
      msg = "Post liked";
    } else {
      await Models.LikeDislike.destroy({ where: whereObj });
      post.total_likes--;
      post.save();
      msg = "Post unliked";
    }

    res.status(200).json({
      code: 200,
      total_likes: post.total_likes,
      post_id: post_id,
      message: msg,
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.likeListing = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    // let whereObj;
    // if (req.query.post_id) {
    //   whereObj = { post_id: req.query.post_id };
    // } else if (req.query.post_id && req.query.group_id){
    //   whereObj = {
    //     post_id: req.query.post_id,
    //     group_id: req.query.group_id,
    //   };
    // }else {
    //   whereObj = {
    //     user_id: id,
    //   };
    // }

    const resp = await Models.Posts.findAll({
      where: {
        user_id: id,
      },
      include: [
        {
          required: true,
          model: Models.LikeDislike,
          where: {
            user_id: id,
          },
          as: "LikePosts",
        },

        {
          model: Models.postMedia,
          attributes: ["media_url"],
          as: "Posts",
        },

        // {
        //   model: Models.User,

        //   as: "user_detail",
        // },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM post_like_dislikes AS likess  
          WHERE
          likess.post_id = posts.id AND likess.user_id = ${id}
      )`),
            "isLike",
          ],
          [
            sequelize.literal(`(
          SELECT COUNT(*)
          FROM saved_posts AS likess
          WHERE
          likess.post_id = posts.id
      )`),
            "isSave",
          ],
          //     [
          //       sequelize.literal(`(
          //     SELECT COUNT(*)
          //     FROM posts AS likess
          //     WHERE
          //     likess.id = post_like_dislike.post_id
          // )`),
          //       "totalLikes",
          //     ],
          [
            sequelize.literal(`(
            SELECT COUNT(*)
            FROM comment_on_posts AS counts
            WHERE
            counts.post_id = posts.id 
        )`),
            "totalComments",
          ],
        ],
      },
      offset,
      limit,

      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      code: 200,
      data: resp,
      totalLikes: resp.length,
    });
  } catch (error) {
    return error;
  }
};

exports.shareLinkforScreentype = async (req, res) => {
  try {
    // Read the user-agent header to determine the user's device
    const userAgent = req.headers["user-agent"].toLowerCase();

    const type = req.query.screen_type;
    // Check if the user is on an iOS device
    if (
      userAgent.indexOf("iphone") !== -1 ||
      userAgent.indexOf("ipad") !== -1
    ) {
      // Redirect the user to the app's custom url scheme with fallback url
      res.redirect(
        `https://${process.env.DOMAIN}://?fallback_url=https://itunes.apple.com/us/app/example-app/id1661779430&screen_type=${type}`
      );
    } else if (userAgent.indexOf("android") !== -1) {
      // Redirect the user to the app's page on the Play Store using intent URL scheme with fallback url
      res.redirect(
        `intent://${process.env.DOMAIN}/app#Intent;scheme=playstore;package=com.dev.k_v_s;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.dev.k_v_s;end&screen_type=${type}`
      );
    } else {
      // If the user is not on a mobile device, redirect them to the app's website
      res.redirect(`https://${process.env.DOMAIN}/app`);
    }
  } catch (err) {
    console.log("errrr", err);
    handleError(res, err);
  }
};

exports.shareLinkforpostId = async (req, res) => {
  try {
    // Read the user-agent header to determine the user's device
    const userAgent = req.headers["user-agent"].toLowerCase();

    const post_id = req.query.postId;

    // Check if the user is on an iOS device
    if (
      userAgent.indexOf("iphone") !== -1 ||
      userAgent.indexOf("ipad") !== -1
    ) {
      // Redirect the user to the app's custom url scheme with fallback url
      res.redirect(
        `https://${process.env.DOMAIN}://?fallback_url=https://itunes.apple.com/us/app/example-app/id1661779430&postId=${post_id}`
      );
    } else if (userAgent.indexOf("android") !== -1) {
      // Redirect the user to the app's page on the Play Store using intent URL scheme with fallback url
      res.redirect(
        `intent://${process.env.DOMAIN}/app#Intent;scheme=playstore;package=com.dev.k_v_s;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.dev.k_v_s;end&postId=${post_id}`
      );
    } else {
      // If the user is not on a mobile device, redirect them to the app's website
      res.redirect(`https://${process.env.DOMAIN}/app`);
    }
  } catch (err) {
    console.log("errrr", err);
    handleError(res, err);
  }
};

exports.shareLinkforUserid = async (req, res) => {
  try {
    // Read the user-agent header to determine the user's device
    const userAgent = req.headers["user-agent"].toLowerCase();
    const userId = req.query.user_id;
    const user_role = req.query.role;
    // Check if the user is on an iOS device
    if (
      userAgent.indexOf("iphone") !== -1 ||
      userAgent.indexOf("ipad") !== -1
    ) {
      // Redirect the user to the app's custom url scheme with fallback url
      res.redirect(
        `https://${process.env.DOMAIN}://?fallback_url=https://itunes.apple.com/us/app/example-app/id1661779430&user_id=${userId}&role=${user_role}`
      );
    } else if (userAgent.indexOf("android") !== -1) {
      // Redirect the user to the app's page on the Play Store using intent URL scheme with fallback url
      res.redirect(
        `intent://${process.env.DOMAIN}/app#Intent;scheme=playstore;package=com.dev.k_v_s;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.dev.k_v_s;end&user_id=${userId}&role=${user_role}`
      );
    } else {
      // If the user is not on a mobile device, redirect them to the app's website
      res.redirect(`https://${process.env.DOMAIN}/app`);
    }
  } catch (err) {
    console.log("errrr", err);
    handleError(res, err);
  }
};

exports.payment = async (req, res) => {
  try {
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);
    // const date =  new Date()
    const data = req.body;
    data.user_id = id;
    var start_date = moment("{" + req.body.start_date + "}", "YYYY-MM-DD");
    //    data.duration == "monthly"
    // ? (data.end_date = moment().add("1", "months")).format("YYYY-MM-DD")
    // : "";
    // data.duration == "yearly"
    // ? (data.end_date = moment().add("1", "year")).format("YYYY-MM-DD")
    // : "";

    // data.duration == "quarterly"
    // ? (data.end_date = moment().add("3", "months")).format("YYYY-MM-DD")
    // : "";

    var end_date = moment("{" + req.body.end_date + "}", "YYYY-MM-DD");

    var left_days = end_date.diff(start_date, "days");
    req.body.left_days = left_days;

    if (!req.body.end_date) {
      req.body.left_days = "infinity";
    }

    // await Models.FCM.destroy({ where: { device_id: data.device_id } });

    const plan_details = await createItem(Models.Payment, data);

    // contidion = {
    //   user_id:id
    // }

    // var end_date = moment("{" + req.body.end_date + "}", "YYYY-MM-DD");
    // var left_days = plan_details.end_date.diff(plan_details.start_date, "days");
    // req.body.left_days = left_days;
    //  await updateItem(Models.Payment, contidion,req.body.left_days);

    res.status(200).json({
      code: 200,
      data: plan_details,
    });
  } catch (err) {
    utils.handleError(res, err);
  }
};

exports.getSubscriptionPlan = async (req, res) => {
  try {
    const data = req.body;
    const token = req.headers.token;
    // console.log("token--------->", token);
    const secretKey = "userp51";
    const userID = jwt.verify(token, secretKey);
    const id = userID.userId;
    console.log("userId--------->", id);

    // req.body.left_days = left_days;
    const result = await Models.Payment.findOne({ where: { user_id: id } });
    const date = new Date();

    const end_dates = moment(result.end_date);
    console.log("end_date", end_dates);
    const left_days = end_dates.diff(date, "days");

    const update = await updateItem(
      Models.Payment,
      { user_id: id },
      { left_days: left_days }
    );

    console.log("result--------->", left_days);
    res.status(200).json({
      code: 200,
      result,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const twilio = require("twilio");

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const PlaybackGrant = AccessToken.PlaybackGrant;

const accountSid = "AC29cd979cfa6901e9742047f2c044f040"; //process.env.TWILIO_ACCOUNT_SID;
const authToken = "acf10b4a33554391e0cd9cef547afaf6"; //process.env.TWILIO_AUTH_TOKEN;
const apiKey = "SKf980526d86ce2ff1769e94eccf8a7fec"; //process.env.TWILIO_API_KEY_SID;     //change in env file
const apiKeySecret = "sR8a8fOFrNuGPtMFrwQ0Vmr71qJ0qeGU"; //process.env.TWILIO_API_KEY_SECRET;     //change in env file

const twilioClient = twilio(apiKey, apiKeySecret, { accountSid: accountSid });
const client = require("twilio")(accountSid, authToken);
// const twilioClient = require('twilio')( accountSid , authToken);

/**
 * Start a new livestream with a Video Room, PlayerStreamer, and MediaProcessor
 */

exports.startStream = async (req, res) => {
  const streamName = req.body.streamName;

  try {
    // Create the WebRTC Go video room, PlayerStreamer, and MediaProcessors
    const room = await twilioClient.video.v1.rooms.create({
      uniqueName: streamName,
      type: "go",
    });
    console.log("room----->", room);

    const playerStreamer = await twilioClient.media.v1.playerStreamer.create();

    const mediaProcessor = await twilioClient.media.v1.mediaProcessor.create({
      extension: "video-composer-v1",
      extensionContext: JSON.stringify({
        identity: "video-composer-v1",
        room: {
          name: room.sid,
        },
        outputs: [playerStreamer.sid],
      }),
    });
    console.log("mediaProcessor==----->", mediaProcessor);

    return res.status(200).send({
      roomId: room.sid,
      streamName: streamName,
      playerStreamerId: playerStreamer.sid,
      mediaProcessorId: mediaProcessor.sid,
    });
  } catch (error) {
    return res.status(400).send({
      message: `Unable to create livestream`,
      error,
    });
  }
};

/**
 * End a livestream
 */

exports.endStream = async (req, res) => {
  const streamDetails = req.body;

  // End the player streamer, media processor, and video room
  const streamName = streamDetails.streamName;
  const roomId = streamDetails.roomId;
  const playerStreamerId = streamDetails.playerStreamerId;
  const mediaProcessorId = streamDetails.mediaProcessorId;

  try {
    await twilioClient.media
      .mediaProcessor(mediaProcessorId)
      .update({ status: "ended" });
    await twilioClient.media
      .playerStreamer(playerStreamerId)
      .update({ status: "ended" });
    await twilioClient.video.rooms(roomId).update({ status: "completed" });

    return res.status(200).send({
      message: `Successfully ended stream ${streamName}`,
    });
  } catch (error) {
    return res.status(400).send({
      message: `Unable to end stream`,
      error,
    });
  }
};

/**
 * Get an Access Token for a streamer
 */

exports.streamerToken = async (req, res) => {
  if (!req.body.identity || !req.body.roomId) {
    return res.status(400).send({ message: `Missing identity or stream name` });
  }

  // Get the user's identity and the room name from the request
  const identity = req.body.identity;
  const roomName = req.body.roomId;

  try {
    // Create a video grant for this specific room
    const videoGrant = new VideoGrant({
      room: roomName,
    });

    // Create an access token
    const token = new AccessToken(accountSid, apiKey, apiKeySecret);

    // Add the video grant and the user's identity to the token
    token.addGrant(videoGrant);
    token.identity = identity;

    // Serialize the token to a JWT and return it to the client side
    return res.send({
      token: token.toJwt(),
    });
  } catch (error) {
    return res.status(400).send({ error });
  }
};

/**
 * Get an Access Token for an audience member
 */

exports.audienceToken = async (req, res) => {
  // Generate a random string for the identity
  const identity = "mmm";

  try {
    // Get the first player streamer
    const playerStreamerList = await twilioClient.media.playerStreamer.list({
      status: "started",
    });
    const playerStreamer = playerStreamerList.length
      ? playerStreamerList[0]
      : null;

    // If no one is streaming, return a message
    if (!playerStreamer) {
      return res.status(200).send({
        message: `No one is streaming right now`,
      });
    }

    // Otherwise create an access token with a PlaybackGrant for the livestream
    const token = new AccessToken(accountSid, apiKey, apiKeySecret);

    // Create a playback grant and attach it to the access token
    const playbackGrant = await twilioClient.media
      .playerStreamer(playerStreamer.sid)
      .playbackGrant()
      .create({ ttl: 60 });

    const wrappedPlaybackGrant = new PlaybackGrant({
      grant: playbackGrant.grant,
    });

    token.addGrant(wrappedPlaybackGrant);
    token.identity = identity;

    // Serialize the token to a JWT and return it to the client side
    return res.send({
      token: token.toJwt(),
    });
  } catch (error) {
    res.status(400).send({
      message: `Unable to view livestream`,
      error,
    });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const data = req.body;

   const noti =  _sendNotification(data);
    res.status(200).json({ message: noti });
  } catch (error) {
    return res.status(400).send({ error });
  }
};
