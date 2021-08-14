const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    userTo: { type: Schema.Types.ObjectId, ref: 'User' },
    userFrom: { type: Schema.Types.ObjectId, ref: 'User' },
    opened: { type: Boolean, default: false },
    entityId: String,
    notificationType:String
}, { timestamps: true });

NotificationSchema.statics.insertNotification = async (userTo, userFrom, notificationType, entityId) => {
    var data = {
        userTo: userTo,
        userFrom: userFrom,
        notificationType: notificationType,
        entityId: entityId
    };
    await Notification.deleteOne(data).catch(error => console.log(error));

    let _noti = new Notification(data)
    let noti = await _noti.save()
    return await noti.populate('userFrom'," _id first last profileimg").execPopulate().catch(error => console.log(error));
  
}


var Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;