const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  dimensions: {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    z: {
      type: Number,
      required: true,
    },
  },
  stock: {
    type: Number,
    required: true,
  },
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  reviews: [
    {
      Rating: {
        type: Number,
        required: false, // Make "Rating" optional
        default: null,  // Set a default value (e.g., null) when not provided
      },
    },
  ],
});

module.exports = mongoose.model("productModel", productSchema);
