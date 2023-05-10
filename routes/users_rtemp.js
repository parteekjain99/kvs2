const controller = require("../controllers/users_temp");
const validate = require("../controllers/users.validate_temp");
const express = require("express");
const router = express.Router();
require("../../config/passport");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
const trimRequest = require("trim-request");

/*
 * Users routes
 */



// ****** **** A D D F C M T O K E N **** *********

// router.post("/signup", trimRequest.all, controller.signup);
// router.post("/login", trimRequest.all, controller.login);
router.get("/userDetails",
  trimRequest.all,
  validate.userDetails,
  controller.userDetails
);


router.get("/helps",
  trimRequest.all,
  controller.helps
);


router.get("/helpListing",
  trimRequest.all,
  controller.helpListing
);


router.get("/businessEnquiry",
  trimRequest.all,
  controller.businessEnquiry
);

router.get("/cms",
  trimRequest.all,
  controller.getaboutUs
);



router.patch("/editProfile",
  trimRequest.all,
  validate.editProfile,
  controller.editProfile
);


router.get("/getAllCountries",
  trimRequest.all,
  controller.GetAllCountries
);

router.get("/getStatesByCountryCode",
  trimRequest.all,
  controller.GetStatesOfCountryByCountryCode
);

router.get("/getCitiesByStateCode",
  trimRequest.all,
  controller.GetCitiesOfStateByStateCode
);



module.exports = router;
