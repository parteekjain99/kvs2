const { handleError, buildErrObject } = require("../middleware/utils");
var mongoose = require("mongoose");
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

// var storage = multer.memoryStorage({
//   destination: function(req, file, callback) {
//       callback(null, '');
//   }
// });

// var multipleUpload = multer({ storage: storage }).array('file');
// var upload = multer({ storage: storage }).single('file');
// const BUCKET_NAME = 'kvs-prom';
// const IAM_USER_KEY = 'AKIAZJDEDGCC6OQID7VB';
// const IAM_USER_SECRET = '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';
module.exports = {


  // multipleUpload


  //  async S3Multipleupload(req, res) {

  //   const file = req.files;
  // let s3bucket = new AWS.S3({
  //     accessKeyId: IAM_USER_KEY,
  //     secretAccessKey: IAM_USER_SECRET,
  //     Bucket: BUCKET_NAME
  //   });
  // s3bucket.createBucket(function () {
  //       let Bucket_Path = 'kvs-prom';
  //       //Where you want to store your file
  //       var ResponseData = [];
     
  // file.map((item) => {
  //       var params = {
  //         Bucket: Bucket_Path,
  //         Key: item.originalname,
  //         Body: item.buffer,
  //         ACL: 'public-read'
  //   };
  // s3bucket.upload(params, function (err, data) {
  //         if (err) {
  //          res.json({ "error": true, "Message": err});
  //         }else{
  //             ResponseData.push(data);
  //             if(ResponseData.length == file.length){
  //               res.json({ "error": false, "Message": "File Uploaded    SuceesFully", Data: ResponseData});
  //             }
  //           }
  //        });
  //      });
  //    });
  // },













  /**
   * upload file to server
   * @param {Object} object - binary file with path
  */

  async uploadImage(object) {
    return new Promise((resolve, reject) => {
      var obj = object.image_data;
      var name = Date.now() + obj.name;
      obj.mv(object.path + "/" + name, function (err) {
        if (err) {
          reject(utils.buildErrObject(422, err.message));
        }
        resolve(name);
      });
    });
  },




  async uploadMultipleImages(object) {
    console.log("===object==", object);
    return new Promise((resolve, reject) => {
      var medias = [];
      object.image_data.forEach(function (val, ind) {
        var obj = val;
        var name = obj.name;
        var string =
          Date.now() + name.replace(/[&\/\\#,+()$~%'":*?<>{}\s]/g, "_");
        // var imageRemoteName = object.path + '/' + string;
        obj.mv(object.path + string, function (err) {
          if (err) {
            //console.log(err);
            reject(utils.buildErrObject(422, err.message));
          }
          medias.push({ name: string });
          if (object.image_data.length - 1 == ind) {
            resolve(medias);
          }
        });
      });
      if (object.image_data.length == 0) {
        resolve(medias);
      }
    });
  },


  
  /********************
   * Private functions *
  ********************/
  async getUserIdFromToken(token) { // in case need to get id without requireAuth
    return new Promise((resolve, reject) => {
      const tokenEncrypted = token
        .replace("Bearer ", "")
        .trim();

      // Decrypts, verifies and decode token
      jwt.verify(auth.decrypt(tokenEncrypted), process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          reject(buildErrObject(401, "Unauthorized"));
        }
        resolve(decoded.data.id);
      });
    });
  },


  /**
   * capitalize first letter of string
   * @param {string} string 
  */

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  /**
   * generate random string
   * @param {string} string 
  */

  async randomString(length, chars) {
    var result = "";
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  },

  /**
   * convert a given array of string to mongoose ids
   * @param {Array} array 
  */


};