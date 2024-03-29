// ext requires
var Promise = require('bluebird');
var MongoClient = Promise.promisifyAll(require('mongodb')).MongoClient;
var uuid = require('node-uuid');
const winston = require('winston');
require('dotenv').config({path:'/stackmagic-server/.env'});

// internal requires
//var config = require('./config/magicstack.json');
//var db_config = require('./config/db.json');
var util = require('./util.js');
var exceptions = require('./exceptions.js');

var state = {
  db: null
};

MongoClient.connect("mongodb://"+process.env.DB_USER+":"+process.env.DB_PASSWORD+"@"+process.env.DB_HOST+"/"+process.env.DB_NAME+"?authMechanism=SCRAM-SHA-1", function(err, db) {
  if (err) {
    throw err;
  }else{
    state.db = db;
  }
});

//"version_id": "be5e86312e3b5555a7b7bf5759c3344121fb840b","body._id": "33ad0efc67adfc54c573578238dd2988057b65a6","active": true,"client_id": "c817459c9e546d447e2dde4bcafde76f","resource": "list","access_control_policy.access_control_list.id": "787adc99458c8179ce8cf57ab706d0b2e469404a","access_control_policy.access_control_list.type": "user","access_control_policy.access_control_list.permissions": "read"

//"version_id": "be5e86312e3b5555a7b7bf5759c3344121fb840b", "resource": "list","active": true,"client_id": "c817459c9e546d447e2dde4bcafde76f","access_control_policy.access_control_list.id":"787adc99458c8179ce8cf57ab706d0b2e469404a","access_control_policy.access_control_list.type":"user","access_control_policy.access_control_list.permissions":"read"
//resource: 1,active: 1,client_id: 1,"access_control_policy.access_control_list.id":1,"access_control_policy.access_control_list.type":1,"access_control_policy.access_control_list.permissions":1
//version_id:1, resource:1, active:1, client_id:1

exports.get_api_key = function(content){
    return new Promise(function(resolve) {
        if(!content.request.headers['authorization']){
            throw new exceptions.HeaderException('no authorization present.');
        }

        var authorization = content.request.headers['authorization'].replace(/\s+/g, " ");
        var authorization_parts = authorization.split(' ');

        if(authorization_parts[0].toLowerCase() == 'basic'){
            var collection = "api_keys";
            var query = {"basic_key":authorization_parts[1], "active":true};
        }else if(authorization_parts[0].toLowerCase() == 'bearer'){
            var collection = "api_oauth_tokens";
            var query = {"body.access_token": authorization_parts[1],"active":true};
        }

        winston.info("get_api_key; query - ", query);
        var cursor =state.db.collection(collection).find(query).toArray(function(err, docs){
            winston.warn(err);
            winston.info('get_api_key: docs - ', docs);
            content.api_keys = docs;

            if(authorization_parts[0].toLowerCase() == 'basic'){ // perform for basic auth requests
                // determine access level of this api key
                content.basic_key_access = docs[0].access; // full || limited (can only post /users and post /oauth2/token)
            }

            resolve(content);
        });
    });
};

exports.validate_api_key = function(content){
    return new Promise(function(resolve) {
        if(!content.api_keys[0]){
            throw new exceptions.HeaderException('invalid api key');
        }else{
            //content.spec = JSON.parse(content.swagger);
            content.client_id = content.api_keys[0].client_id || null;
            content.api_id = content.api_keys[0].api_id || null;
            content.user_id = content.api_keys[0].user_id || null;
            resolve(content);
        }
    });
};

exports.validate_user_uniqueness = function(content){
    return new Promise(function(resolve) {
        // err if user already exists

        if(content.api_object_users.length > 0){
            throw new exceptions.ObjectException('user already exists');
        }else{
            resolve(content);
        }
    });
};

exports.insert_api_object = function(content){
    return new Promise(function(resolve) {
        var cursor = state.db.collection('api_objects').insertOne(content.api_object, function(err, result){
            winston.info(err);
            content.insert_result = result;
            resolve(content);
        });
    });
};

exports.save_request = function(request, start_time, owner){
    var obj = {};
    obj.created = new Date().toISOString();
    obj.baseUrl = request.baseUrl;
    obj.method = request.method;
    obj.headers = request.headers;
    obj.body = request.body;
    obj.query = request.query;
    obj.route = request.route;
    obj.path = request.path;

    var cursor = state.db.collection('api_requests').insertOne({"request":obj, "response_time":parseInt(Date.now() - start_time), "owner":owner}, function(err, result){
        winston.info(err);

    });
};

exports.delete_api_object = function(content){
    return new Promise(function(resolve) {
        var cursor = state.db.collection('api_objects').updateMany({"body.content._id":content.resource_id,"client_id":content.client_id},{$set: { "active": false},$currentDate: { "lastModified": true }}, function(err, result){
            winston.info(err);
            content.insert_result = result;

            resolve(content);
        });
    });
};

exports.get_user_by_api = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"body.content.username": content.request.body.username, "api_id": content.api_id, "active": true}).toArray(function(err, docs){
            winston.info(err);
            content.api_object_users = docs;
            resolve(content);
        });
    });
};

exports.authenticate_user = function(content){
    return new Promise(function(resolve) {

        winston.info("AUTHENTICATE_USER");
        winston.info({"body.content.username": content.username, /*"body.password": util.encrypt_password(content.password),*/ "active": true})

        var cursor =state.db.collection('api_objects').find({"body.content.username": content.username, /*"body.password": util.encrypt_password(content.password),*/ "active": true, "api_id":content.api_id}).toArray(function(err, docs){
            winston.info(err);
            content.results = docs;
            resolve(content);
        });
    });
};

	// IS THIS USED!?!?!?!?
exports.retrieve_api_objects = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"type":content.type, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
            winston.info(err);
            content.retrieved_api_objects = docs;
            resolve(content);
        });
    });
};

// IS THIS USED!?!?!?!?!?
exports.retrieve_api_objects_by_id = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"body.content._id":content.resource_id, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
            winston.info(err);
            content.retrieved_api_objects = docs;
            resolve(content);
        });
    });
};

exports.authenticate_token = function(content){
    return new Promise(function(resolve) {
        var authorization_parts = content.headers.authorization.split(' ');
        var token = authorization_parts[1];

        var cursor =state.db.collection('api_oauth_tokens').find({"body.access_token": token, "active": true}).toArray(function(err, docs){
            winston.info(err);
            content.authenticated_tokens = docs;
            content.client_id = docs[0].client_id;
            content.user_id = docs[0].user_id;
            resolve(content);
        });

    });
};

exports.save_oauth_token = function(content){
    return new Promise(function(resolve) {

        var cursor = state.db.collection('api_oauth_tokens').insertOne(content.oauth_record, function(err, result){
            winston.info(err);
            //content.object = object;
            content.result = result;
            resolve(content);
        });
    });
};

	// DEPRECATED
exports.get_swagger = function(content){
    // get swagger for this version

    return new Promise(function(resolve) {
        var cursor =state.db.collection('swaggers').find({"api_id":content.api_id, "version_name":content.version_name, "active":true}).toArray(function(err, results){
            winston.info(err);

            content.swagger = results;
            resolve(content);
        });
    });
};

exports.get_deployment = function(content){
    // get swagger for this version

    return new Promise(function(resolve) {
        var cursor =state.db.collection('deployments').find({/*"environment":process.env.ENVIRONMENT, */"version_name":content.version_name, "api_id":content.api_id, "active":true}).toArray(function(err, results){
            winston.info(err);

            winston.info({"version_name":content.version_name, "api_id":content.api_id, "active":true});

            content.results = results;
            resolve(content);
        });
    });
};

exports.get_resource = function(content){
    //winston.info({"plurality":content.plurality, "version_id":content.version_id, "active":true});
    return new Promise(function(resolve) {
        winston.info('GET_RESOURCE========================!!!');
        winston.info({"plurality":content.plurality, "version_id":content.version_id, "active":true});

        var cursor =state.db.collection('resources').find({"plurality":content.plurality, "version_id":content.version_id, "active":true}).toArray(function(err, results){
            winston.info(err);

            content.results = results;
            resolve(content);
        });
    });
}

exports.get_parent_resource = function(content){
    winston.info({"plurality":content.parent, "version_id":content.version_id, "active":true});
    return new Promise(function(resolve) {
        var cursor =state.db.collection('resources').find({"plurality":content.parent, "version_id":content.version_id, "active":true}).toArray(function(err, results){
            winston.info(err);

            content.results = results;
            resolve(content);
        });
    });
}

exports.get_api_objects = function(content){
    winston.info("get_api_objects:",content.query);
    winston.info(content.query);

    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find(content.query).toArray(function(err, results){
            winston.info(err);

            content.results = results;
            resolve(content);
        });
    });
},

exports.build_api_object = function(content){
    return new Promise(function(resolve) {
        winston.info('BUILD API OBJECT');
        content.spec = JSON.parse(content.swagger);
        //winston.info(content.spec.paths);

        var spec = content.spec;
        var request = content.request;

        winston.debug('REQUEST BODY: ', request.body);

        if(!spec.paths[content.path]){
            throw new exceptions.ObjectException("path not supported: "+content.path);
        }

        winston.debug(spec.paths[content.path.toLowerCase()]);

        if(!spec.paths[content.path.toLowerCase()][request.method.toLowerCase()]){
            throw new exceptions.ObjectException("method not allowed: "+request.method.toLowerCase());
        }

        var parameters = spec.paths[content.path][request.method.toLowerCase()].parameters[0];
        var definitions = spec.definitions;

        winston.info("PARAMETERS:",parameters);

        // check for required body params
        if(/*parameters.required == true && */parameters.in == 'body'){
            var body = {};
            body.meta = {};
            body.content = {};

            // get reference definition
            var schema = parameters.schema;
            var schema_parts = schema['$ref'].split('#/definitions/');
            var required_params = definitions[schema_parts[1]].required;
            var properties = definitions[schema_parts[1]].properties;

            // build payload
            for(var key in properties){
                winston.info("KEY:",key);
                winston.info("PROPERTIES:",properties[key]);

                if(schema_parts[1].toLowerCase() == 'user' && key.toLowerCase() == 'username'){
                    var type = 'email';

                }else{
                    var type = properties[key].type;
                }

                if(request.body[key] && !util.valid_input(request.body[key], type)){
                    //throw new exceptions.PayloadException("validation error: '"+key+"' is not of type "+properties[key].type);
                    throw new exceptions.PayloadException("validation error: '"+key+"' is not of type "+type);
                }

                if(request.body.derived && request.body.derived[key]){ // parameters that are read only, but derived during the post or put request (ie: child resources need to be linked to parent resources through parent resource id that appears only in url parameter)
                    //body[key] = request.body.derived[key];
                    body.content[key] = request.body.derived[key];
                }else if(properties[key].readOnly == true){
                    continue;
                }else if(request.body[key] || request.body[key] === false){ // account for false boolean values
                    if(schema_parts[1].toLowerCase() == 'user' && key.toLowerCase() == 'password'){
                        //body[key] = crypto.createHash('sha1').update(request.body[key]+request.body['username']).digest("hex")
                        // validate that user is an email

                        //body[key] = util.encrypt_password(request.body[key]);
                        body.content[key] = util.encrypt_password(request.body[key]);
                    }else{
                        //body[key] = request.body[key];
                        body.content[key] = request.body[key];
                    }
                }

                winston.info("BODY.CONTENT[KEY]:",body.content[key]);
            }

            // confirm that payload has all required params
            for(var i=0; i < required_params.length; i++){
                if(!body.content[required_params[i]]){
                    if(schema_parts[1].toLowerCase() == 'user' && required_params[i].toLowerCase() == 'password' && request.method.toLowerCase() == 'put'){
                        // do nothing; THIS IS A HACK; the real fix is a custom param in the swagger spec that denotes parameters that are required for post but optional for put
                    }else{
                        throw new exceptions.PayloadException("missing required parameter: "+required_params[i]);
                    }
                }
            }
        }

        var current_ISODate = new Date().toISOString();

        if(request.method.toLowerCase() == 'post'){
            body.meta._resource = schema_parts[1].toLowerCase();
            body.meta._created = current_ISODate;
            body.meta._lastModified = current_ISODate;
            body.content._id = util.hash('sha1', body._created+body._type+uuid.v4());

            if(content.parent){ // if this resource belongs to a parent, save proper derived resource_id
                body.content["_"+content.parent_resource_name+"_id"] = content.parent_id;
            }
        }else if(request.method.toLowerCase() == 'put'){
            body.meta._resource = schema_parts[1].toLowerCase();
            //body.meta._created = current_ISODate;
            body.meta._created = content.retrieved_object_body.meta._created;
            body.meta._lastModified = current_ISODate;
            body.content = util.merge_objects(content.retrieved_object_body.content, body.content);
        }

        /*content.api_object = {"body":body, "type":schema_parts[1].toLowerCase(), "api_id":content.api_id, "version_id":content.version_id,
                              "client_id":content.client_id, "active":true, "resource":content.resource};*/

        content.api_object = {"body":body, "type":schema_parts[1].toLowerCase(), "api_id":content.api_id, "version_id":content.version_id,
                              "client_id":content.client_id, "active":true, "resource":content.resource, "resource_id":content.type_resource_id,
                              "access_control_policy":content.access_control_policy || {}};

        if(content.user_id){
            content.api_object.user_id = content.user_id;
        }

        winston.info('API OBJECT: ', content.api_object);
        resolve(content);
    });
};

var validate_headers = function(headers, name, value){
	if(headers[name] !== value){
		throw new exceptions.HeaderException('invalid headers');
	}
};

exports.validate_swagger_spec = function(content){
    // confirm proper headers are available
    //validate_headers(content.request.headers, 'content-type', 'application/json');

    return new Promise(function(resolve) {
        // validate swagger

        if(content.results.length == 0){
            throw new exceptions.HeaderException('no available definition for version: '+content.version_name);
        }else{
            content.swagger = content.results[0].swagger;
            content.version_id = content.results[0].version_id;
            resolve(content);
        }
    });
}
