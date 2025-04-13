const Listing = require("../models/listing");
const { NominatimJS } = require('nominatim-js');
const punycode = require("punycode");

module.exports.index = async (req, res) => {
    const { category, search } = req.query;

    let query = {};

    // Apply category filter if exists
    if (category) {
        query.category = category;
    }

    // Apply search logic if exists
    if (search) {
        const regex = new RegExp(search, 'i'); // case-insensitive regex

        query.$or = [
            { title: regex },
            { location: regex },
            { country: regex },
            { description: regex }
        ];

        // If user types a number, include price match too
        if (!isNaN(search)) {
            query.$or.push({ price: Number(search) });
        }
    }

    const allListings = await Listing.find(query);

    res.render("listings/index", { allListings, category, search });
};

module.exports.renderNewForm = (req,res) =>{
    res.render("new.ejs");
};

module.exports.showListing = async (req,res) => {
    let {id} = req.params;
   const listing = await Listing.findById(id).populate({
    path: "reviews",
    model: "Review" ,
    populate: {
        path: "author",
    },
}).populate("owner");

   if(!listing){
    req.flash("error","The listing does not exist");
    res.redirect("/listings");
   }
   res.render("./listings/show.ejs",{ listing });
};

module.exports.createListing = async (req,res,next)=>{
    let results = await NominatimJS.search({ q: req.body.listing.location });
    
    
    // Use only the first geocoding result
    let geocodedLocation = results && results.length > 0 ? results[0] : null;
    const lat = geocodedLocation.lat;
    const lon = geocodedLocation.lon;
    if (geocodedLocation) {
        // Store the latitude and longitude as a GeoJSON Point
        req.body.listing.geometry = {
            type: 'Point',
            // GeoJSON format requires [longitude, latitude]
            coordinates: [
                parseFloat(geocodedLocation.lon),
                parseFloat(geocodedLocation.lat)
            ]
        };
    } else {
        req.flash("error", "Geocoding failed. Please check the address and try again.");
        return res.redirect("/listings/new");
    }

    
    if (!req.file) {
        req.flash("error", "Image upload failed.");
        return res.redirect("/listings/new");  // Redirect if no file is uploaded
    }
    let { path: url, filename } = req.file;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };  

    newListing.geometry = {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)]
      };

    let saveListing = await newListing.save();
    console.log(saveListing);
    req.flash("success","New Listing Created")
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","The listing does not exist");
        res.redirect("/listings");
       }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250")   
    res.render("listings/edit.ejs", { listing , originalImageUrl });
  };

  module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    // Handle geocoding if location changed
    if (req.body.listing.location && req.body.listing.location !== listing.location) {
        let results = await NominatimJS.search({ q: req.body.listing.location });
        let geocodedLocation = results && results.length > 0 ? results[0] : null;

        if (geocodedLocation) {
            req.body.listing.geometry = {
                type: 'Point',
                coordinates: [
                    parseFloat(geocodedLocation.lon),
                    parseFloat(geocodedLocation.lat)
                ]
            };
        } else {
            req.flash("error", "Geocoding failed. Please check the address.");
            return res.redirect(`/listings/${id}/edit`);
        }
    } else {
        // retain old geometry
        req.body.listing.geometry = listing.geometry;
    }

    // Update listing with all fields including category
    const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    // Handle image update if provided
    if (req.file) {
        let { path: url, filename } = req.file;
        updatedListing.image = { url, filename };
        await updatedListing.save();
    }

    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};



  module.exports.deleteListing = async (req,res) => {
      let { id } = req.params;
      let deletedListing = await Listing.findByIdAndDelete(id);
      console.log(deletedListing);
      req.flash("success","Listing Deleted")
      res.redirect("/listings");
  };