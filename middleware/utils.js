const mongoose = require('mongoose')
const requestIp = require('request-ip')
const { validationResult } = require('express-validator')
const ACCESS_KEY=process.env.ACCESS_KEY
const SECRET_KEY=process.env.SECRET_KEY
const Bucket=process.env.Bucket
const AWS = require("aws-sdk")
const {admin }= require("../../config/firebase.js")
// const uploadFile = require("./")
REGION = process.env.REGION
/**
 * Removes extension from file
 * @param {string} file - filename
 */
exports.removeExtensionFromFile = file => {
  return file
    .split('.')
    .slice(0, -1)
    .join('.')
    .toString()
}

/**
 * Gets IP from user
 * @param {*} req - request object
 */
exports.getIP = req => requestIp.getClientIp(req)

/**
 * Gets browser info from user
 * @param {*} req - request object
 */
exports.getBrowserInfo = req => req.headers['user-agent']

/**
 * Gets country from user using CloudFlare header 'cf-ipcountry'
 * @param {*} req - request object
 */
exports.getCountry = req =>
  req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX'

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
exports.handleError = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }
  // Sends error to user
  res.status(err.code).json({
    errors: {
      msg: err.message
    },
    code: err.code
  })
}

/**
 * Builds error object
 * @param {number} code - error code
 * @param {string} message - error text
 */
exports.buildErrObject = (code, message) => {
  return {
    code,
    message
  }
}




/**
 * Builds error for validation files
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Object} next - next object
 */
exports.validationResult = (req, res, next) => {
  try {
    validationResult(req).throw()
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase()
    }
    return next()
  } catch (err) {
    return this.handleError(res, this.buildErrObject(422, err.array()))
  }
}

/**
 * Builds success object
 * @param {string} message - success text
 */
exports.buildSuccObject = message => {
  return {
    msg: message
  }
}

/**
 * Checks if given ID is good for MongoDB
 * @param {string} id - id to check
 */
exports.isIDGood = async id => {
  return new Promise((resolve, reject) => {
    const goodID = mongoose.Types.ObjectId.isValid(id)
    return goodID
      ? resolve(id)
      : reject(this.buildErrObject(422, 'ID_MALFORMED'))
  })
}

/**
 * Item not found
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemNotFound = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (!item) {
    reject(this.buildErrObject(404, message))
  }
}

/**
 * Item already exists
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemAlreadyExists = (err, item, reject, message) => {
  console.log(item);
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (item) {
    reject(this.buildErrObject(422, message))
  }
}

exports.itemExists = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (!item) {
    reject(this.buildErrObject(422, message))
  }
}

exports.objectToQueryString = async obj => {
  return new Promise((resolve, reject) => {
    const searchParams = new URLSearchParams();
    const params = obj;
    Object.keys(params).forEach(key => searchParams.append(key, params[key]));
    resolve(searchParams.toString())
  })
}



 exports.uploadFile = async (object)=> {
  return new Promise(async (resolve, reject) => {
    var obj = object.image_data;
    console.log("OBJ in upload file is here---", obj);

    var fileExt = "." + obj.name.split(".").pop();

    console.log("File ext is -> ", fileExt);
    // const flag = allowedExt.find((item) => item == fileExt.toLowerCase());
    var imageRemoteName =
      object.path +
      "/" +
      Date.now() +
      Math.floor(1000000000 + Math.random() * 9000000000) +
      fileExt;
    AWS.config.update({
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      region: REGION,
    });

    var s3 = new AWS.S3();





    s3.upload({
      Bucket: Bucket,
      Body: obj.data,
      Key: imageRemoteName,
      // ACL: 'public-read',
      ContentType: obj.mimetype,
      // ContentDisposition:"attachment"
    })
      .promise()
      .then(async (response) => {
        // var sizeInKb = await bytesToSize(obj.size);
        var date = new Date().toISOString();
        resolve({
          url: response.Location,
          name: obj.name,
          // size: sizeInKb,
          mimetype: obj.mimetype,
          date: date,
        });
      })
      .catch((err) => {
        console.log("failed:", err);
      });
  });
}





exports.uploadMultipleFiletos3 =  async  (object) => {
  return new Promise(async (resolve, reject) => {

    console.log("here iamage aaaray===>",object.image_data)
    const images = object.image_data.length
    const imageNames = []
    if(images ===0 ) console.log("NO IMAGE")
    for await (let data of object.image_data ) {
      const objImage = {
        image_data : data,
        path : object.path
      }
      console.log("objImage---", objImage);
      const image_name = await uploadFile(objImage);
      imageNames.push(image_name);
    }
    resolve(imageNames);
  });
}



// exports.sendPushNotification = async (
//   device_token,
//   title,
//   message,
//   notificationData
// ) => {
//   try {
//     if (notificationData.sender_id)
//       notificationData.sender_id = notificationData.sender_id.toString();

//     if (notificationData.receiver_id)
//       notificationData.receiver_id = notificationData.receiver_id.toString();
//     if (notificationData.value_id)
//       notificationData.value_id = notificationData.value_id.toString();
//     const notification = {
//       title: title,
//       body: message,
//       // image: notificationData.icon
//       //   ? notificationData.icon
//       //   : `${process.env.NOTIFICATION_ICONS_PATH}/default.ico`,
//     };
//     var message = {
//       notification: notification,
//       data: notificationData,
//       tokens: device_token,
//     };
//     // console.log("final message", message);
//     admin
//       .messaging()
//       .sendMulticast(message)
//       .then((response) => {
//         console.log("response", response);
//         if (response.failureCount > 0) {
//           const failedTokens = [];
//           response.responses.forEach((resp, idx) => {
//             // console.log("resp-->", resp);
//             // console.log("idx-->", idx);
//             if (!resp.success) {
//               failedTokens.push(tokens[idx]);
//             }
//           });
//           console.log("List of tokens that caused failures: " + failedTokens);
//         }
//       })
//       .catch((error) => {
//         console.log("Error sending message:", error);
//       });
//   } catch (err) {
//     console.log(err);
//     return false;
//   }
// };


exports.sendPushNotification = async (
  device_token,
  title,
  message,
  notificationData
) => {
  try {
    if (notificationData.sender_id)
      notificationData.sender_id = notificationData.sender_id.toString();

    if (notificationData.receiver_id)
      notificationData.receiver_id = notificationData.receiver_id.toString();
    if (notificationData.value_id)
      notificationData.value_id = notificationData.value_id.toString();
    const notification = {
      title: title,
      body: message,
      // image: notificationData.icon
      //   ? notificationData.icon
      //   : `${process.env.NOTIFICATION_ICONS_PATH}/default.ico`,
    };
    var message = {
      notification: notification,
      data: notificationData,
      tokens: device_token,
    };
    // console.log("final message", message);
    admin
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        console.log("response", response);
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            // console.log("resp-->", resp);
            // console.log("idx-->", idx);
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
            }
          });
          console.log("List of tokens that caused failures: " + failedTokens);
        }
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  } catch (err) {
    console.log(err);
    return false;
  }
};