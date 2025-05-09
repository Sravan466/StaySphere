const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn,isOwner,validateListing } = require("../middleware.js");
const Listing = require("../models/listing.js");
const listingController = require("../controller/listings.js");
const multer = require('multer');
const {storage} = require("../cloudConfig.js"); 
const upload = multer({ storage })

router.route("/")
  .get(wrapAsync(listingController.index)) 
  .post(
    upload.single('listing[image][url]'),
    validateListing,
    wrapAsync(listingController.createListing)
  );


//New route
router.get("/new",isLoggedIn,listingController.renderNewForm);



router.route("/:id")
.get(wrapAsync(listingController.showListing))//show route
.put(upload.single('listing[image][url]'),validateListing,isLoggedIn,isOwner,wrapAsync(listingController.updateListing))//Update route
.delete(isLoggedIn,isOwner,wrapAsync(listingController.deleteListing));//Delete route

//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));

  
module.exports = router;
