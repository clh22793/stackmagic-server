var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var uuid = require('node-uuid');
const winston = require('winston');
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

/**
 @description = takes keys that exist in obj1 and set in obj2 if dne.

 returns obj2
*/

exports.merge_objects = function(obj1,obj2){
  for(property in obj1){
    if(!obj2[property]){
      obj2[property] = obj1[property];
    }
  }

  return obj2;
};

exports.valid_input = function(value, type){
    var type = type.toLowerCase();

    switch(type){
        case "email":
            var match = email.match(/^.+@.+\..+$/);
            if(match){
                return true;
            }else{
                return false;
            }

            break;

        case "string":
            return typeof value == "string";
            break;

        case "boolean":
            return typeof value == "boolean";
            break;

        case "number":
            return typeof value == "number";
            break;

        case "array":
            if (typeof value == "string"){
                return false;
            }else{
                return value.length >= 0;
            }

            break;

        case "object":
            if (typeof value == "number"){
                return false;
            }else{
                return value.length == undefined;
            }

    }
}