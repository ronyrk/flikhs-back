const mongoose = require('mongoose')

const doctorSchema = new mongoose.Schema({
    general: {
        name: { type: String, required: true },
        title: { type: String, default: "" },
        gender: { type: String, default: "" },
        age: { type: String, default: "" },
        country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
        city: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
        address: { type: String, default: "" },
        zip: { type: String, default: "" },
        phone: { type: String, default: "" },
        website: { type: String, default: "" },
        newPatient: { type: Boolean, default: false },
        teleHealth: { type: Boolean, default: false },
    },
    about: { type: String, default: "" },
    education: [
        {
            academyName: { type: String, default: "" },
            academyAddress: { type: String, default: "" },
            from: { type: String, default: "" },
            to: { type: String, default: "" },
        }
    ],
    hospital: [
        {
            hospitalName: { type: String, default: "" },
            hospitalAddress: { type: String, default: "" },
            call: { type: String, default: "" },
            from: { type: String, default: "" },
            fromFormat: { type: String, default: "" },
            to: { type: String, default: "" },
            toFormat: { type: String, default: "" },
        }
    ],
    experience: [
        {
            academyName: { type: String, default: "" },
            academyAddress: { type: String, default: "" },
            from: { type: String, default: "" },
            to: { type: String, default: "" },
        }
    ],
    language:[{type:String}],
    social: [
        {
            socialLink: { type: String, default: "" },
            socialName: { type: String, default: "" },
        }
    ],
    category:[{ type: mongoose.Schema.Types.ObjectId, ref: "Department"}],
    profileImage:{type:String,default:""},
    isApproved:{type:Boolean,default:false},
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
      },

}, { timestamps: true })


const Doctor = mongoose.model('Doctor', doctorSchema)
module.exports = Doctor

