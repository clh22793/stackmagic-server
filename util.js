var crypto = require('crypto');

exports.encrypt_password = function(password){
    return crypto.createHash('sha1').update(password).digest("hex");
};

exports.generate_oauth_token = function(){
    var created = new Date().toISOString();
    return crypto.createHash('sha1').update(created+uuid.v4()).digest("hex");
};

exports.validate_email = function(email){
    return true;
};
