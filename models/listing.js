const mongoose = require("mongoose");
const reviews = require("./Review");
const { type } = require("os");
const { url } = require("inspector");
const Schema = mongoose.Schema;

// Define schema
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },

  


   
  // image: {
  //   type: Schema.Types.Mixed,
  //   url: String,
  //   filename: String,
  //   validate: {
  //     validator: (value) =>
  //       value === "" || 
  //       (typeof value === "string" ? /^(https?:\/\/)/.test(value) :
  //       typeof value === "object" && value?.filename && value?.url),
  //     message: "Invalid image format. Must be a URL string or an object with 'filename' and 'url'.",
  //   },
  // },
  
  image: {
    url: String,
    filename: String
  },
  
    
    
    // type: {
    //   filename: { type: String, required: true },
    //   url: { type: String, required: true },
    // },

    // set: (v) => v === "" ? "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGR1cGxleCUyMGhvdXNlfGVufDB8fDB8fHww" : v,
    
  
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },

  geometry: {
    type: {
      type: String,
      enum: ['Point'], // Must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],  // Format: [longitude, latitude]
      required: true
    }
  },

  category: {
    type: String,
    enum: ['Beach', 'Mountain', 'Amazing View', 'Mansion', 'Arctic', 'Rooms', 'Iconic Cities', 'Trending', 'Amazing Pools'],
    required: true
  },
  
  
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],

  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
});

listingSchema.post("findOneAndDelete",async (listing) =>{
  if (listing){
    await reviews.deleteMany({ _id: { $in: listing.reviews }});
  }
});

// Create model
const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
