const controller = require('../controllers/auth_cTemp')
const validate = require('../controllers/auth.validate')
const AuthController = require('../controllers/auth_cTemp')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')


router.post(
  '/checkEmailAvailability',
  trimRequest.all,
  validate.checkEmailAvailability,
  controller.checkEmailAvailability
)


router.post("/help",
  trimRequest.all,
  controller.help
);


router.get("/getFaq",
  trimRequest.all,
  controller.getFaq
);

/*
 * Verify email route
*/
router.get(
  '/verifyEmail/:token',
  trimRequest.all,
  controller.verifyEmail
)

/*
 * Forgot password email generation route
*/
router.post(
  '/sendForgotPasswordEmail',
  trimRequest.all,
  controller.sendForgotPasswordEmail
)


/*
 * Register route
*/
router.post(
  '/register',
  trimRequest.all,
  validate.register,
  controller.register
)

// router.post("/signup", controller.signup);
/*
 * Login route
*/
router.post('/login',
  trimRequest.all,
  validate.login,
  controller.login
)

/*
 * Change password
*/
router.post(
  '/resetPassword',
  trimRequest.all,
  controller.resetPassword
)
/*
 * Forgot password
*/
router.post(
  '/sendOtp',
  trimRequest.all,
  controller.sendOtp
)

// submit Otp
router.post(
  '/submitotp',
  trimRequest.all,
  controller.submitotp
)

router.post(
  '/forgotPassword',
  trimRequest.all,
  controller.forgotPassword
)

router.get(
  '/walkThrough',
  trimRequest.all,
  controller.walkThrough
)


router.get(
  '/showPost',
  trimRequest.all,
  controller.showPost
)

// router.post(
//   '/searchResult',
//   trimRequest.all,
//   validate.searchResult,
//   controller.showPost
// )

module.exports = router
