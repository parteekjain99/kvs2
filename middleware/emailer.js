const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const i18n = require('i18n')
const model = require('../models/models')
const { itemAlreadyExists, itemExists } = require('../middleware/utils')
const express = require('express')
var jwt = require('jsonwebtoken');
var path = require('path')
const app = express()
const APP_NAME = process.env.APP_NAME
const { capitalizeFirstLetter } = require('../shared/helpers')
app.set('views', path.join(`${process.env.SERVER_PATH}`, 'views'))
// app.set('view engine', 'jade');
app.set('view engine', 'ejs'); // we use ejs
var mailer = require('express-mailer');

mailer.extend(app, {
  from: process.env.EMAIL_FROM_NAME,
  host: process.env.EMAIL_HOST, // hostname
  secureConnection: true, // use SSL
  port: Number(process.env.EMAIL_PORT), // port for secure SMTP
  transportMethod: process.env.EMAIL_TRANSPORT_METHOD, // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Sends email
 * @param {Object} data - data
 * @param {boolean} callback - callback
 */
const sendEmail = async (data, callback) => {
  const auth = {
    auth: {
      // eslint-disable-next-line camelcase
      api_key: process.env.EMAIL_SMTP_API_MAILGUN,
      domain: process.env.EMAIL_SMTP_DOMAIN_MAILGUN
    }
  }
  const transporter = nodemailer.createTransport(mg(auth))
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `${data.user.name} <${data.user.email}>`,
    subject: data.subject,
    html: data.htmlMessage
  }
  transporter.sendMail(mailOptions, err => {
    if (err) {
      return callback(false)
    }
    return callback(true)
  })
}

/**
 * Prepares to send email
 * @param {string} user - user object
 * @param {string} subject - subject
 * @param {string} htmlMessage - html message
 */
const prepareToSendEmail = (user, subject, htmlMessage) => {
  user = {
    name: user.name,
    email: user.email,
    verification: user.verification
  }
  const data = {
    user,
    subject,
    htmlMessage
  }
  if (process.env.NODE_ENV === 'production') {
    sendEmail(data, messageSent =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.log(data)
  }
}

module.exports = {


  /**
  * Checks User model if user with an specific username exists
  * @param {string} username - user username
  * @param {Boolean} throwError - whenther to throw error or not
  */

  async usernameExists(username, throwError = false) {
    return new Promise((resolve, reject) => {
      model.User.findOne({
        username: username
      }).then(item => {
        var err = null;
        if (throwError) {
          itemAlreadyExists(err, item, reject, 'USERNAME ALREADY EXISTS')
        }
        resolve(item ? true : false)
      }).catch(err => {
        var item = null;
        itemAlreadyExists(err, item, reject, 'ERROR')
        resolve(false)
      })
    })
  },

  async emailExistsForSocialRegister(email, column) {
    return new Promise((resolve, reject) => {
      model.User.findOne(
        {
          where: {
            email: email,
            [column]: {
              [Op.is]: null
            }
          }
        }
      ).then(item => {
        var err = null;
        itemAlreadyExists(err, item, reject, 'EMAIL_ALREADY_EXISTS')
        resolve(false)
      }).catch(err => {
        var item = null;
        itemAlreadyExists(err, item, reject, 'ERROR')
        resolve(false)
      })
    })
  },



  async emailExistsForLogin(email) {
    return new Promise((resolve, reject) => {
      model.User.findOne(
        {
          where: {
            email: email
          }
        }
      ).then(item => {
        var err = null;
        itemExists(err, item, reject, 'EMAIL DOES NOT EXISTS')
        resolve(false)
      }).catch(err => {
        var item = null;
        itemExists(err, item, reject, 'ERROR')
        resolve(false)
      })
    })
  },

  async emailExistsAdmin(email, id) {
    return new Promise((resolve, reject) => {
      console.log(email, id)
      model.Admin.findOne(
        {
          where: {
            id: {
              [Op.not]: id
            },
            email: email
          }
        }
      ).then(item => {
        if (item) {
          resolve(false)
        } else {
          resolve(true)
        }
      }).catch(err => {
        var item = null;
        itemAlreadyExists(err, item, reject, 'ERROR')
        resolve(false)
      })
    })
  },

  async mobileExistsAdmin(phone_no, id) {
    return new Promise((resolve, reject) => {
      model.Admin.findOne(
        {
          where: {
            id: {
              [Op.not]: id
            },
            phone_no: phone_no
          }
        }
      ).then(item => {
        if (item) {
          resolve(false)
        } else {
          resolve(true)
        }
      }).catch(err => {
        var item = null;
        itemAlreadyExists(err, item, reject, 'ERROR')
        resolve(false)
      })
    })
  },

  /**
   * Checks User model if user with an specific email exists but excluding user id
   * @param {string} id - user id
   * @param {string} email - user email
   */
  async emailExistsExcludingMyself(id, email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
          _id: {
            $ne: id
          }
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'EMAIL_ALREADY_EXISTS')
          resolve(false)
        }
      )
    })
  },

  /**
   * Checks User model if user with an specific mobile exists but excluding user id
   * @param {string} id - user id
   * @param {string} email - user email
   */
  async checkMobileExistsExcludingMyself(id, phone_no) {
    return new Promise((resolve, reject) => {
      model.User.findOne({
        where: {
          phone_no: phone_no,
          id: {
            [Op.not]: id
          }
        }
      }).then(item => {
        if (item) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  },

  /**
   * Sends email common
   * @param {string} locale - locale
   * @param {Object} mailOptions - mailOptions object
   * @param {string} template - template
  */

  async sendEmail(locale, mailOptions, template) {
    mailOptions.website_url = process.env.WEBSITE_URL
    app.mailer.send(
      `${locale}/${template}`,
      mailOptions,
      function (err, message) {
        if (err) {
          console.log("There was an error sending the email" + err);
        } else {
          console.log("Mail sent");
        }
      }
    );
  },

  /**
   * Sends reset password email
   * @param {string} locale - locale
   * @param {Object} user - user object
  */

  async sendResetPasswordEmailMessage(locale, user) {
    i18n.setLocale(locale)
    const subject = i18n.__('forgotPassword.SUBJECT')
    const htmlMessage = i18n.__(
      'forgotPassword.MESSAGE',
      user.email,
      process.env.FRONTEND_URL,
      user.verification
    )
    prepareToSendEmail(user, subject, htmlMessage)
  },

  async sendVerificationEmail(locale, user, template) {
    user = JSON.parse(JSON.stringify(user))
    const token = jwt.sign({ // sign the jwt token wiht the user id
      data: user._id
    }, process.env.JWT_SECRET, { expiresIn: '24h' })
    app.mailer.send(`${locale}/${template}`, { // email view path
      to: user.email,
      subject: `Verify Email - ${APP_NAME}`,
      name: `${capitalizeFirstLetter(user.first_name)} ${capitalizeFirstLetter(user.last_name)}`,
      verification_code: user.verification,
      verification_link: `${process.env.SERVER_URL}auth/verifyEmail/${token}`,
      website_url: process.env.WEBSITE_URL
    }, function (err) {
      if (err) {
        console.log('There was an error sending the email' + err)
      }
      console.log("VERIFICATION EMAIL SENT");
      return true
    })
  },

// in use functions 
    /**
   * Checks User model if user with an specific email exists
   * @param {string} email - user email
   * @param {Boolean} throwError - whenther to throw error or not
   */
     async emailExists(email, throwError = true) {
      return new Promise((resolve, reject) => {
        model.User.findOne({
          where:{email: email}
        }).then(item => {
          var err = null;
          if (throwError) {
            itemAlreadyExists(err, item, reject, 'EMAIL ALREADY EXISTS')
          }
          resolve(item ? true : false)
        }).catch(err => {
          var item = null;
          itemAlreadyExists(err, item, reject, 'ERROR')
          resolve(false)
        })
      })
    },
    async mobileExists(phone_no) {
      return new Promise((resolve, reject) => {
        model.User.findOne(
          {
            where: {
              phone_no: phone_no
            }
          }
        ).then(item => {
          var err = null;
          itemAlreadyExists(err, item, reject, 'MOBILE NUMBER_ALREADY_EXISTS')
          resolve(item ? true : false)
        }).catch(err => {
          var item = null;
          itemAlreadyExists(err, item, reject, 'ERROR')
          resolve(false)
        })
      })
    },
    async userNameExists(username) {
      console.log('username------->',username);
      return new Promise((resolve, reject) => {
        model.User.findOne(
          {
            where: {
              username: username
            }
          }
        ).then(item => {
          var err = null;
          itemAlreadyExists(err, item, reject, 'USERNAME_ALREADY_EXISTS')
          resolve(item ? true : false)
        }).catch(err => {
          var item = null;
          itemAlreadyExists(err, item, reject, 'ERROR')
          resolve(false)
        })
      })
    },
  async sendOtpOnEmail(locale, data, subject) {
    var mailOptions = {
      to: data.email,
      subject,
      name: data.name,
      otp: data.forgot_password_otp,
    };
    console.log("mailoption-----",mailOptions)
    app.mailer.send(`${locale}/sendOTP`, mailOptions, function (err, message) {
      if (err) {
        console.log("There was an error sending the email" + err);
      } else {
        console.log("Mail sent to user");
      }
    });
  },


}
