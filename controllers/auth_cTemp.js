const jwt = require("jsonwebtoken");
const Models = require("../models/models");
const utils = require("../middleware/utils");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const { addHours } = require("date-fns");
const { matchedData } = require("express-validator");
const auth = require("../middleware/auth_temp");
const emailer = require("../middleware/emailer");
const { Op } = require("sequelize");
const HOURS_TO_BLOCK = 2;
const LOGIN_ATTEMPTS = 5;
const OTP_EXPIRED_TIME = 5;
var mongoose = require("mongoose");



const {
  getItem,
  getItemAccQuery,
  createItem,
  updateItem,
  deleteCustom,
  getItems,
  getItemWithInclude,
  getItemsWithInclude,
} = require("../shared/core");
const { capitalizeFirstLetter, uploadFile } = require("../shared/helpers");
const storagePath = process.env.STORAGE_PATH;
const storagePathHttp = process.env.STORAGE_PATH_HTTP;
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

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = (req) => {
  console.log("req", req);
  let user = {
    id: req.id,
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


// async function uploadImage(object) {
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

const setBuisnessUserInfo = (req) => {
  console.log("req", req);
  let user = {
    businessname: req.businessname,
    website: req.website,
    name: req.name,
    email: req.email,
    phone_no: req.phone_no,
    password: bcrypt.hashSync(req.password, 10),
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
        var image = await uploadFile({
          file: req.files.profile_image,
          path: storagePath + "/userImage",
        });
        req.profile_image = image;
      }
      const obj = {
        name: req.name,
        email: req.email,
        phone_no: req.phone_no,
        dob: req.dob,
        username: req.username,
        country_code: req.country_code,
        verification: uuid.v4(),
        password: bcrypt.hashSync(req.password, 10),
        decoded_password: req.password,
        role: req.role,
      };

      const user = await createItem(Models.User, obj);
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
        password: bcrypt.hashSync(req.password, 10),
        decoded_password: req.password,
        city: JSON.parse(JSON.stringify(req.city)),
        state: JSON.parse(JSON.stringify(req.state)),
        country: JSON.parse(JSON.stringify(req.country)),
        pincode: req.pincode,
        alternatePhoneno: req.alternatePhoneno,
        complete_address: req.complete_address,
        role: req.role,
      };

      const user = await createItem(Models.User, obj);
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
        // email: data.email,
        // [Op.or] : { email:data.email, username:data.username , phone_no:data.phone_no}

        [Op.or]: [
          { email: data.condition },
          { username: data.condition },
          { phone_no: data.condition },
        ],
      },
    });
    console.log("user details------------>", findUser);
    if (!findUser)
      return res
        .status(404)
        .send({ status: false, message: "email  is incorrect" });

    const passwordDecrept = await bcrypt.compare(
      data.password,
      findUser.password
    );
    console.log(passwordDecrept);
    if (!passwordDecrept)
      return res
        .status(400)
        .send({ status: false, message: " password is incorrect" });

    const userID = findUser.id;
    const payLoad = { userId: userID };
    const secretKey = "userp51";
    const token = jwt.sign(payLoad, secretKey, { expiresIn: "10h" });
       
    res.status(200).json({
      code: 200,
      message: "User login successfully",
      data: { userId: findUser, token: token },
    });
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

exports.help = async (req, res) => {
  try {
    // let { type,subject,description} = req.body;

    const obj = {
      type: req.query.type,
      subject: req.body.subject,
      description: req.body.description,
    };

    const user = await createItem(Models.help, obj);
    res.status(500).send({ status: 200, data: user });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
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

const findUser = async (email) => {
  return new Promise((resolve, reject) => {
    Models.User.findOne({
      where: {
        email: email,
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

exports.sendOtp = async (req, res) => {
  try {
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    console.log(emailRegexp.test(req.body.condition));

    if(emailRegexp.test(req.body.condition)){
      
      const data = req.body;
      console.log(data);
    const locale = req.getLocale();
    const user = await findUser(data.email);
    if (user) {
      data.verificationfp_used = "false";
      data.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
      data.forgot_password_otp_time = new Date(
        new Date().getTime() + OTP_EXPIRED_TIME * 60 * 1000
      );
      const result = await Models.User.update(data, {
        where: {
          id: user.id,
        },
      });
      data.first_name = user.first_name;
      data.email = user.email;
      await emailer.sendOtpOnEmail(locale, data);
      res.status(200).json({ code: 200, message: "send otp successfully" });
    }
  }else{
    res.status(200).json({ code: 200, message: "yet to be done " });
  }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.submitotp = async (req, res) => {
  console.log(req.body);
  // let result;
  let data = req.body.password;
  let salt = 10;
  const encryptedPassword = await bcrypt.hash(data, salt);
  data = encryptedPassword;

  const result = await Models.User.update({"password":data}, {
    where: {
      forgot_password_otp: req.body.forgot_password_otp
    },
  });

  // result = await Models.User.findOne({
  //   forgot_password_otp: req.body.forgot_password_otp,
  // });
  // if (result) {
  //   result = await Models.User.update(data, {
  //     where: {
  //       id: result.id,
  //     },
  //   });
  // }

  res.status(200).json({ code: 200, message: "submit otp", data: result });
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


//PRINCE 9 MARCH
// WALK THrough

exports.walkThrough = async (req, res) => {
    try {
      const data =await Models.walkThrough.findAll({});
      // console.log(data.image);
      // var image_name = await uploadImage({
      //   image_data: data.image,
      //   path: storagePath + "/profileImages",
      // });
      // data.image = image_name;
      res.status(200).json({ code: 200,  data: data });
    } catch (error) {
      utils.handleError(res, error);
    }
};


//Show POSt

exports.showPost = async (req, res) => {
  try {
    const data = await Models.Posts.findAll({});
    res.status(200).json({ code: 200,  data: data });
  } catch (error) {
    utils.handleError(res, error);
  }
}


//search Result
exports.searchResult = async (req, res) => {
  try {
    console.log("req.query.searched---------->",req.query.searched);
    const data = await Models.User.findOne({
      where:{
        username:req.query.searched
      }
    });
    res.status(200).json({   data: "data.email" });
  } catch (error) {
    utils.handleError(res, error);
  }
}
