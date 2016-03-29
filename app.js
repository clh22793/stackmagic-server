var express = require('express');
//var MongoClient = require('mongodb').MongoClient;
var Promise = require('bluebird');
var MongoClient = Promise.promisifyAll(require('mongodb')).MongoClient;
var bodyParser = require('body-parser');
var crypto = require('crypto');
var uuid = require('node-uuid');

var app = express();

// parse application/json 
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

var state = {
  db: null
};

// exceptions
var PayloadException = function(message){
	this.message = message;
	this.code = 1000;
};

var HeaderException = function(message, code){
	this.message = message;
	this.code = (code) ? code : 1001;
};

var ObjectException = function(message, code){
	this.message = message;
	this.code = (code) ? code : 1001;
};

var util = {
	'encrypt_password': function(password){
		return crypto.createHash('sha1').update(password).digest("hex");
	},

	'generate_oauth_token': function(){
		var created = new Date().toISOString();
		return crypto.createHash('sha1').update(created+uuid.v4()).digest("hex");
	}
};

var stackmagic = {
	'validate_api_key': function(content){
		return new Promise(function(resolve) {
			var x_api_key = content.request.headers['x-api-key'];

			var cursor =state.db.collection('versions').find({"id":content.version_id, "client_id":x_api_key, "active":true}).toArray(function(err, docs){
				console.log(err);
				content.versions = docs;
				content.client_id = x_api_key;
				resolve(content);
			});
		});
	},

	'insert_api_object': function(content){
		return new Promise(function(resolve) {
			var cursor = state.db.collection('api_objects').insertOne(content.api_object, function(err, result){
				console.log(err);
				content.insert_result = result;
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

	'retrieve_api_objects': function(content){
		return new Promise(function(resolve) {
			var cursor =state.db.collection('api_objects').find({"type":content.type, "version_id":content.version_id, "user_id":content.user_id, "active": true}).toArray(function(err, docs){
				console.log(err);
				content.retrieved_api_objects = docs;
				resolve(content);
			});
		});
	},

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

	'get_swagger': function(content){
		// get swagger for this version

		return new Promise(function(resolve) {
			var cursor =state.db.collection('swaggers').find({"api_id":content.api_id, "version_id":content.version_id, "active":true}).toArray(function(err, results){
				console.log(err);
				content.swagger = results;
				resolve(content);
			});
		});
	},

	'build_api_object': function(content){
		return new Promise(function(resolve) {
			var spec = content.spec;
			var request = content.request;

			if(!spec.paths['/'+content.resource]){
				throw new ObjectException("invalid resource");
			}

			if(!spec.paths['/'+content.resource][request.method.toLowerCase()]){
				throw new ObjectException("method not allowed");
			}

			var parameters = spec.paths['/'+content.resource][request.method.toLowerCase()].parameters[0];
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
						if(schema_parts[1] == 'User' && key.toLowerCase() == 'password'){
							//body[key] = crypto.createHash('sha1').update(request.body[key]+request.body['username']).digest("hex")
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
			}

			content.api_object = {"body":body, "type":schema_parts[1].toLowerCase(), "api_id":content.api_id, "version_id":content.version_id,
								  "client_id":content.client_id, "active":true};

			if(content.user_id){
				content.api_object.user_id = content.user_id;
			}
			resolve(content);
		});
	}
};

MongoClient.connect('mongodb://devtest:devtest@aws-us-east-1-portal.14.dblayer.com:10871,aws-us-east-1-portal.13.dblayer.com:10856/dev-saasdoc?authMechanism=SCRAM-SHA-1', function(err, db) {
  if (err) {
    throw err;
  }else{
    state.db = db;
  }
});

var get_path_details_from_spec = function(spec, request){
	console.log('get_auth_from_spec');
	var path_parts = request.route.path.split('/api/:api_id/:version_id');

	var spec_path = spec.paths[path_parts[1].toLowerCase()];
	return spec_path;
};

var get_auth_from_spec = function(spec_path, request){

	var security = spec_path[request.method.toLowerCase()].security;

	console.log(security);

	if(security[0].client_auth){
		return 'client_auth';
	}else{
		return 'user_auth';
	}
};

var get_swagger = function(api_id, version_id, request){
  	// get swagger for this version

	return new Promise(function(resolve) {
		var cursor =state.db.collection('swaggers').find({"api_id":api_id, "version_id":version_id, "active":true}).toArray()
			.then(function(doc){
				var spec = JSON.parse(doc[0].content);
				console.log(spec);
				var spec_path = get_path_details_from_spec(spec, request);

				// get the auth from swagger spec

				var auth = get_auth_from_spec(spec_path, request);
				console.log(auth);

				resolve({"auth":auth, "spec":spec, "request":request, "api_id":api_id, "version_id":version_id, "x-api-key":request.headers['x-api-key']});
			});
  	});
};

var validate_swagger = function(){
	return new Promise(function(resolve) {
		var cursor =state.db.collection('swaggers').find({"api_id":api_id, "version_id":version_id, "active":true}).toArray()
			.then(function(doc){
				var spec = JSON.parse(doc[0].content);
				console.log(spec);
				var spec_path = get_path_details_from_spec(spec, request);

				// get the auth from swagger spec

				var auth = get_auth_from_spec(spec_path, request);
				console.log(auth);

				resolve({"auth":auth, "spec":spec, "request":request, "api_id":api_id, "version_id":version_id, "x-api-key":request.headers['x-api-key']});
			});
  	});
};

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/api/:api_id/:version_id/users', function (request, response) {
  var api_id = request.params.api_id;
  var version_id = request.params.version_id;

	var content = {};
	content.api_id = api_id;
	content.version_id = version_id;
	content.request = request;
	content.resource = 'users';

	stackmagic.get_swagger(content)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				if(!content.swagger || content.swagger.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_id);
				}else{
					content.swagger = content.swagger[0];
					resolve(content);
				}
			});

		})
		.then(stackmagic.validate_api_key)
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.versions || content.versions.length == 0){
					throw new HeaderException('invalid x-api-key');
				}else{
					content.spec = JSON.parse(content.swagger.content);
					resolve(content);
				}
			});
		})
		.then(stackmagic.get_user_by_api)
		.then(function(content){
			return new Promise(function(resolve) {
				// err if user already exists

				if(content.api_object_users.length > 0){
					throw new ObjectException('user already exists');
				}else{
					resolve(content);
				}
			});
		})
		.then(stackmagic.build_api_object)
		.then(stackmagic.insert_api_object)
		.then(function(content){
			return new Promise(function(resolve) {
				resolve(content);
			});
		})
		.then(function(content){
			response.send(content.api_object.body);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

app.post('/api/:api_id/:version_id/oauth/token', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;

	var content = {};
	content.username = request.body.username;
	content.password = util.encrypt_password(request.body.password);

	stackmagic.authenticate_user(content)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				if(content.authenticate_users.length == 0){
					throw new ObjectException('invalid credentials');
				}else{
					resolve(content);
				}
			});
		})
		.then(stackmagic.save_oauth_token)
		.then(function(content){
			response.send(content.object.body);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

var init_content = function(request){
	var content = {};
	content.api_id = request.params.api_id;
	content.version_id = request.params.version_id;
	content.resource = request.params.resource;
	content.headers = request.headers;
	content.request = request;

	return content;
};

var request_authentication = function(content){
	return stackmagic.authenticate_token(content)
		.then(function(content){ // verify auth token
			return new Promise(function(resolve) {
				if(content.authenticated_tokens.length == 0){
					throw new ObjectException('invalid oauth credentials');
				}

				resolve(content);
			});
		});
};

app.post('/api/:api_id/:version_id/:resource', function (request, response) {
	var content = init_content(request);

	request_authentication(content)
		.then(stackmagic.get_swagger)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				if(!content.swagger || content.swagger.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_id);
				}else{
					content.swagger = content.swagger[0];
					console.log(content);
					content.spec = JSON.parse(content.swagger.content);
					resolve(content);
				}
			});

		})
		.then(stackmagic.build_api_object)
		.then(stackmagic.insert_api_object)
		.then(function(content){
			return new Promise(function(resolve) {
				resolve(content);
			});
		})
		.then(function(content){
			response.send(content.api_object);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});


app.get('/api/:api_id/:version_id/:resource', function (request, response) {
	var content = init_content(request);

	request_authentication(content)
		.then(stackmagic.get_swagger)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				if(!content.swagger || content.swagger.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_id);
				}else{
					content.swagger = content.swagger[0];
					console.log(content);
					content.spec = JSON.parse(content.swagger.content);
					resolve(content);
				}
			});

		})
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.spec.paths['/'+content.resource]){
					throw new ObjectException("invalid resource");
				}

				if(!content.spec.paths['/'+content.resource][content.request.method.toLowerCase()]){
					throw new ObjectException("method not allowed");
				}

				console.log(content);
				content.type = content.spec.paths['/'+content.resource]['x-singular'];
				resolve(content);
			});
		})
		.then(stackmagic.retrieve_api_objects)
		.then(function(content){
			return new Promise(function(resolve) {
				var payload = [];
				for(var i=0; i < content.retrieved_api_objects.length; i++){
					payload.push(content.retrieved_api_objects[i].body);
				}

				response.send(payload);
			});

			console.log(content.retrieved_api_objects);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

app.get('/api/:api_id/:version_id/:resource/:resource_id', function (request, response) {
	var content = init_content(request);
	content.resource_id = request.params.resource_id;

	request_authentication(content)
		.then(stackmagic.get_swagger)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				if(!content.swagger || content.swagger.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_id);
				}else{
					content.swagger = content.swagger[0];
					console.log(content);
					content.spec = JSON.parse(content.swagger.content);
					resolve(content);
				}
			});

		})
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.spec.paths['/'+content.resource]){
					throw new ObjectException("invalid resource");
				}

				if(!content.spec.paths['/'+content.resource][content.request.method.toLowerCase()]){
					throw new ObjectException("method not allowed");
				}

				console.log(content);
				content.type = content.spec.paths['/'+content.resource]['x-singular'];
				resolve(content);
			});
		})
		.then(stackmagic.retrieve_api_objects_by_id)
		.then(function(content){
			return new Promise(function(resolve) {
				var payload = {};

				if(content.retrieved_api_objects.length > 0){
					payload = content.retrieved_api_objects[0].body;
				}else{
					throw new ObjectException("unique resource does not exist");
				}

				response.send(payload);
			});

			console.log(content.retrieved_api_objects);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});