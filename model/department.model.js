const mongoose = require('mongoose')

const departmnetSchema = new mongoose.Schema({
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
  image: {
    type: String,
    default:""
  },
  isFeatured:{
    type:Boolean,
    default:false
  }
}, { timestamps: true })


const  Department = mongoose.model('Department', departmnetSchema)
module.exports = Department