const mongoose = require('mongoose')

const doctorArticleSchema = new mongoose.Schema({
  creator:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
  },
  title:{
      type:String,
      required:true,
      trim:true
  },
  description:{
      type:String,
      required:true,
  },
  slug:{
      type:String,
      required:true,
      unique:true,
      trim:true,
      lowercase: true
  },
  body:{
      type:String,
      required:true,
  },
  thumbnail:{
      type:String,
      default:""
  },
  tags:[],
  relatedArticle:{
      article1:{type:mongoose.Schema.Types.ObjectId,ref:"DoctorArticle"},
      article2:{type:mongoose.Schema.Types.ObjectId,ref:"DoctorArticle"},
      article3:{type:mongoose.Schema.Types.ObjectId,ref:"DoctorArticle"},
  },
  isApproved:{
    type:Boolean,
    default:true
  },
  views:{
      type:Number,
      default:0
  },
  isIndex:{
      type:Boolean,
      default:false
  }

},{timestamps:true})

doctorArticleSchema.index({
    title:"text",
    description:"text",
    body:"text"
},{
    weights:{
        title:5,
        description:2,
        body:1
    }
})


const DoctorArticle = mongoose.model('DoctorArticle', doctorArticleSchema)
module.exports = DoctorArticle