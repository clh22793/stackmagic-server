var crypto = require('crypto');
var uuid = require('node-uuid');

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

exports.hash = function(algorithm, value){
    var hash;
    if(algorithm.toLowerCase() == 'sha1'){
        hash = crypto.createHash('sha1').update(value).digest("hex");
    }

    return hash;
};