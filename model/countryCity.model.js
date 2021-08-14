const mongoose = require('mongoose')

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  parentId: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: true
  },

}, { timestamps: true })


const  Country = mongoose.model('Country', countrySchema)
module.exports = Country