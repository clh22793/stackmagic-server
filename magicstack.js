// ext requires
var Promise = require('bluebird');
var MongoClient = Promise.promisifyAll(require('mongodb')).MongoClient;

// internal requires
var config = require('./config/magicstack.json');
var util = require('./util.js');

var state = {
  db: null
};

MongoClient.connect('mongodb://devtest:devtest@aws-us-east-1-portal.14.dblayer.com:10871,aws-us-east-1-portal.13.dblayer.com:10856/dev-saasdoc?authMechanism=SCRAM-SHA-1', function(err, db) {
  if (err) {
    throw err;
  }else{
    state.db = db;
  }
});

exports.validate_api_key = function(content){
    return new Promise(function(resolve) {
        var authorization = content.request.headers['authorization'];
        console.log('validating');
        console.log(authorization);
        var authorization_parts = authorization.split(' ');

        var cursor =state.db.collection('api_keys').find({"basic_key":authorization_parts[1], "active":true}).toArray(function(err, docs){
            console.log(err);

            content.api_keys = docs;
            console.log(content);
            resolve(content);
        });
    });
};

exports.insert_api_object = function(content){
    return new Promise(function(resolve) {
        var cursor = state.db.collection('api_objects').insertOne(content.api_object, function(err, result){
            console.log(err);
            content.insert_result = result;
            console.log('result');
            console.log(result);
            resolve(content);
        });
    });
};

exports.delete_api_object = function(content){
    return new Promise(function(resolve) {
        var cursor = state.db.collection('api_objects').updateMany({"body._id":content.resource_id},{$set: { "active": false},$currentDate: { "lastModified": true }}, function(err, result){
            console.log(err);
            content.insert_result = result;
            console.log('result');
            console.log(result);
            resolve(content);
        });
    });
};

exports.get_user_by_api = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"body.username": content.request.body.username, "api_id": content.api_id, "active": true}).toArray(function(err, docs){
            console.log(err);
            content.api_object_users = docs;
            resolve(content);
        });
    });
};

exports.authenticate_user = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"body.username": content.username, "body.password": content.password, "active": true}).toArray(function(err, docs){
            console.log(err);
            content.authenticate_users = docs;
            resolve(content);
        });
    });
};

	// IS THIS USED!?!?!?!?
exports.retrieve_api_objects = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"type":content.type, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
            console.log(err);
            content.retrieved_api_objects = docs;
            resolve(content);
        });
    });
};

// IS THIS USED!?!?!?!?!?
exports.retrieve_api_objects_by_id = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find({"body._id":content.resource_id, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
            console.log(err);
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
            console.log(err);
            content.authenticated_tokens = docs;
            content.client_id = docs[0].client_id;
            content.user_id = docs[0].user_id;
            resolve(content);
        });

    });
};

exports.save_oauth_token = function(content){
    return new Promise(function(resolve) {
        var object = {};
        object.api_id = content.authenticate_users[0].api_id;
        object.version_id = content.authenticate_users[0].version_id;
        object.user_id = content.authenticate_users[0].body._id;
        object.client_id = content.authenticate_users[0].client_id;
        object.active = true;
        object.body = {};
        object.body._created = new Date().toISOString();
        object.body.access_token = util.generate_oauth_token();

        var cursor = state.db.collection('api_oauth_tokens').insertOne(object, function(err, result){
            console.log(err);
            content.object = object;
            resolve(content);
        });
    });
};

	// DEPRECATED
exports.get_swagger = function(content){
    // get swagger for this version

    return new Promise(function(resolve) {
        var cursor =state.db.collection('swaggers').find({"api_id":content.api_id, "version_name":content.version_name, "active":true}).toArray(function(err, results){
            console.log(err);
            content.swagger = results;
            resolve(content);
        });
    });
};

exports.get_deployment = function(content){
    // get swagger for this version

    return new Promise(function(resolve) {
        var cursor =state.db.collection('deployments').find({"environment":config.environment, "version_name":content.version_name, "active":true}).toArray(function(err, results){
            console.log(err);
            //console.log(results);

            //content.swagger = results[0].swagger;
            content.results = results;
            resolve(content);
        });
    });
};

exports.get_api_objects = function(content){
    return new Promise(function(resolve) {
        var cursor =state.db.collection('api_objects').find(content.query).toArray(function(err, results){
            console.log(err);

            content.results = results;
            resolve(content);
        });
    });
},

exports.build_api_object = function(content){
    return new Promise(function(resolve) {
        console.log('BUILD API OBJECT');
        console.log(content.spec.paths);
        var spec = content.spec;
        var request = content.request;

        console.log('REQUEST BODY');
        console.log(request.body);

        if(!spec.paths[content.resource]){
            throw new ObjectException("invalid resource: "+content.resource);
        }

        console.log('build api object');
        console.log(spec.paths[content.resource.toLowerCase()]);

        if(!spec.paths[content.resource.toLowerCase()][request.method.toLowerCase()]){
            throw new ObjectException("method not allowed: "+request.method.toLowerCase());
        }

        var parameters = spec.paths[content.resource][request.method.toLowerCase()].parameters[0];
        var definitions = spec.definitions;

        // check for required body params
        if(parameters.required == true && parameters.in == 'body'){
            var body = {};

            // get reference definition
            var schema = parameters.schema;
            var schema_parts = schema['$ref'].split('#/definitions/');
            var required_params = definitions[schema_parts[1]].required;
            var properties = definitions[schema_parts[1]].properties;

            // build payload
            for(var key in properties){
                if(properties[key].readOnly == true){
                    continue;
                }else if(request.body[key]){
                    if(schema_parts[1].toLowerCase() == 'user' && key.toLowerCase() == 'password'){
                        //body[key] = crypto.createHash('sha1').update(request.body[key]+request.body['username']).digest("hex")
                        // validate that user is an email

                        body[key] = util.encrypt_password(request.body[key]);
                    }else{
                        body[key] = request.body[key];
                    }
                }
            }

            // confirm that payload has all required params
            for(var i=0; i < required_params.length; i++){
                if(!body[required_params[i]]){
                    throw new PayloadException("missing parameter: "+required_params[i]);
                }
            }
        }

        if(request.method.toLowerCase() == 'post'){
            body._created = new Date().toISOString();
            body._type = schema_parts[1].toLowerCase();
            body._id = crypto.createHash('sha1').update(body._created+body._type+uuid.v4()).digest("hex");
        }else if(request.method.toLowerCase() == 'put'){
            body._lastModified = new Date().toISOString();
            body._type = schema_parts[1].toLowerCase();
            body._id = content.resource_id;
        }

        content.api_object = {"body":body, "type":schema_parts[1].toLowerCase(), "api_id":content.api_id, "version_id":content.version_id,
                              "client_id":content.client_id, "active":true, "resource":content.resource};

        if(content.user_id){
            content.api_object.user_id = content.user_id;
        }
        resolve(content);
    });
};



/*var magicstack = {
	'config': {'environment':'dev'},

	'validate_api_key': function(content){
		return new Promise(function(resolve) {
			var authorization = content.request.headers['authorization'];
			console.log('validating');
			console.log(authorization);
			var authorization_parts = authorization.split(' ');

			var cursor =state.db.collection('api_keys').find({"basic_key":authorization_parts[1], "active":true}).toArray(function(err, docs){
				console.log(err);

				content.api_keys = docs;
				console.log(content);
				resolve(content);
			});
		});
	},

	'insert_api_object': function(content){
		return new Promise(function(resolve) {
			var cursor = state.db.collection('api_objects').insertOne(content.api_object, function(err, result){
				console.log(err);
				content.insert_result = result;
				console.log('result');
				console.log(result);
				resolve(content);
			});
		});
	},

	'delete_api_object': function(content){
		return new Promise(function(resolve) {
			var cursor = state.db.collection('api_objects').updateMany({"body._id":content.resource_id},{$set: { "active": false},$currentDate: { "lastModified": true }}, function(err, result){
				console.log(err);
				content.insert_result = result;
				console.log('result');
				console.log(result);
				resolve(content);
			});
		});
	},

	'get_user_by_api': function(content){
		return new Promise(function(resolve) {
			var cursor =state.db.collection('api_objects').find({"body.username": content.request.body.username, "api_id": content.api_id, "active": true}).toArray(function(err, docs){
				console.log(err);
				content.api_object_users = docs;
				resolve(content);
			});
		});
	},

	'authenticate_user': function(content){
		return new Promise(function(resolve) {
			var cursor =state.db.collection('api_objects').find({"body.username": content.username, "body.password": content.password, "active": true}).toArray(function(err, docs){
				console.log(err);
				content.authenticate_users = docs;
				resolve(content);
			});
		});
	},

	// IS THIS USED!?!?!?!?
	'retrieve_api_objects': function(content){
		return new Promise(function(resolve) {
			var cursor =state.db.collection('api_objects').find({"type":content.type, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
				console.log(err);
				content.retrieved_api_objects = docs;
				resolve(content);
			});
		});
	},

	// IS THIS USED!?!?!?!?!?
	'retrieve_api_objects_by_id': function(content){
		return new Promise(function(resolve) {
			var cursor =state.db.collection('api_objects').find({"body._id":content.resource_id, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
				console.log(err);
				content.retrieved_api_objects = docs;
				resolve(content);
			});
		});
	},

	'authenticate_token': function(content){
		return new Promise(function(resolve) {
			var authorization_parts = content.headers.authorization.split(' ');
			var token = authorization_parts[1];

			var cursor =state.db.collection('api_oauth_tokens').find({"body.access_token": token, "active": true}).toArray(function(err, docs){
				console.log(err);
				content.authenticated_tokens = docs;
				content.client_id = docs[0].client_id;
				content.user_id = docs[0].user_id;
				resolve(content);
			});

		});
	},

	'save_oauth_token': function(content){
		return new Promise(function(resolve) {
			var object = {};
			object.api_id = content.authenticate_users[0].api_id;
			object.version_id = content.authenticate_users[0].version_id;
			object.user_id = content.authenticate_users[0].body._id;
			object.client_id = content.authenticate_users[0].client_id;
			object.active = true;
			object.body = {};
			object.body._created = new Date().toISOString();
			object.body.access_token = util.generate_oauth_token();

			var cursor = state.db.collection('api_oauth_tokens').insertOne(object, function(err, result){
				console.log(err);
				content.object = object;
				resolve(content);
			});
		});
	},

	// DEPRECATED
	'get_swagger': function(content){
		// get swagger for this version

		return new Promise(function(resolve) {
			var cursor =state.db.collection('swaggers').find({"api_id":content.api_id, "version_name":content.version_name, "active":true}).toArray(function(err, results){
				console.log(err);
				content.swagger = results;
				resolve(content);
			});
		});
	},

	'get_deployment': function(content){
		// get swagger for this version

		return new Promise(function(resolve) {
			var cursor =state.db.collection('deployments').find({"environment":magicstack.config.environment, "version_name":content.version_name, "active":true}).toArray(function(err, results){
				console.log(err);
				//console.log(results);

				//content.swagger = results[0].swagger;
				content.results = results;
				resolve(content);
			});
		});
	},

	'get_api_objects': function(content){
		return new Promise(function(resolve) {
			var cursor =state.db.collection('api_objects').find(content.query).toArray(function(err, results){
				console.log(err);

				content.results = results;
				resolve(content);
			});
		});
	},

	'build_api_object': function(content){
		return new Promise(function(resolve) {
			console.log('BUILD API OBJECT');
			console.log(content.spec.paths);
			var spec = content.spec;
			var request = content.request;

			console.log('REQUEST BODY');
			console.log(request.body);

			if(!spec.paths[content.resource]){
				throw new ObjectException("invalid resource: "+content.resource);
			}

			console.log('build api object');
			console.log(spec.paths[content.resource.toLowerCase()]);

			if(!spec.paths[content.resource.toLowerCase()][request.method.toLowerCase()]){
				throw new ObjectException("method not allowed: "+request.method.toLowerCase());
			}

			var parameters = spec.paths[content.resource][request.method.toLowerCase()].parameters[0];
			var definitions = spec.definitions;

			// check for required body params
			if(parameters.required == true && parameters.in == 'body'){
				var body = {};

				// get reference definition
				var schema = parameters.schema;
				var schema_parts = schema['$ref'].split('#/definitions/');
				var required_params = definitions[schema_parts[1]].required;
				var properties = definitions[schema_parts[1]].properties;

				// build payload
				for(var key in properties){
					if(properties[key].readOnly == true){
						continue;
					}else if(request.body[key]){
						if(schema_parts[1].toLowerCase() == 'user' && key.toLowerCase() == 'password'){
							//body[key] = crypto.createHash('sha1').update(request.body[key]+request.body['username']).digest("hex")
							// validate that user is an email

							body[key] = util.encrypt_password(request.body[key]);
						}else{
							body[key] = request.body[key];
						}
					}
				}

				// confirm that payload has all required params
				for(var i=0; i < required_params.length; i++){
					if(!body[required_params[i]]){
						throw new PayloadException("missing parameter: "+required_params[i]);
					}
				}
			}

			if(request.method.toLowerCase() == 'post'){
				body._created = new Date().toISOString();
				body._type = schema_parts[1].toLowerCase();
				body._id = crypto.createHash('sha1').update(body._created+body._type+uuid.v4()).digest("hex");
			}else if(request.method.toLowerCase() == 'put'){
				body._lastModified = new Date().toISOString();
				body._type = schema_parts[1].toLowerCase();
				body._id = content.resource_id;
			}

			content.api_object = {"body":body, "type":schema_parts[1].toLowerCase(), "api_id":content.api_id, "version_id":content.version_id,
								  "client_id":content.client_id, "active":true, "resource":content.resource};

			if(content.user_id){
				content.api_object.user_id = content.user_id;
			}
			resolve(content);
		});
	}
};*/