var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var uuid = require('node-uuid');

const SALT_ROUNDS = 10;

exports.encrypt_password = function(password){
    //var sha_hash = crypto.createHash('sha256').update(password).digest("hex");
    return bcrypt.hashSync(password, SALT_ROUNDS);
    //return crypto.createHash('sha1').update(password).digest("hex");
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

/**
 @ access_control_policy = acp of object
 @user_id = user id
 @permission = read | write

 returns true | false
*/
exports.user_has_permissions = function(access_control_policy, user_id, permission){
    var acl = access_control_policy.access_control_list;

    for(var i=0; i < acl.length; i++){
        if(acl[i].id == user_id && acl[i].permissions.indexOf(permission) !== -1){
            return true;
        }
    }

    return false;
};
