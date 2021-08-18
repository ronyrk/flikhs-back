const mongoose = require('mongoose')

const doctorReviewSchema = new mongoose.Schema({
    name:{type:String,required:true},
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true,index:true },
    rating:{type:Number,default:5,min:0,max:5},
    comment:{type:String,default:""},
    replyId: {
        type: String
      },
    
},{timestamps:true})


const DoctorReview = mongoose.model('DoctorReview', doctorReviewSchema)
module.exports = DoctorReview