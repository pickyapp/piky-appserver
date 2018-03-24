const mongoose = require('../config/database.js').mongoose;
const Schema = mongoose.Schema;


const UserSchema = new Schema({
	username: { type: String, lowercase: true },
	phone: String,
	followRequests: [String],
	followers: [String],
	following: [String],
});

module.exports.User = mongoose.model('User', UserSchema);

