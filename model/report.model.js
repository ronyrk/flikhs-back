const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {type:String,default:""},
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

ReportSchema.statics.insertReport = async (post, reportedBy, type) => {
    var data = {
        post,
        reportedBy,
        type,
    };
    await Report.deleteOne({post,reportedBy}).catch(error => console.log(error));

    let _report = new Report(data)
    let report = await _report.save()
    return report
  
}


var Report = mongoose.model('Report', ReportSchema);
module.exports = Report;