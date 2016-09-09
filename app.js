// ext requires
var express = require('express');
var Promise = require('bluebird');
var MongoClient = Promise.promisifyAll(require('mongodb')).MongoClient;
var bodyParser = require('body-parser');
var crypto = require('crypto');
var uuid = require('node-uuid');
var app = express();

// internal requires
var magicstack = require('./magicstack.js');
var util = require('./util.js');
var config = require('./config/magicstack.json');

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));


// exceptions
var PayloadException = function(message){
	this.message = message;
	this.code = 1000;
};

var HeaderException = function(message, code){
	this.message = message;
	this.code = (code) ? code : 2001;
};

var ObjectException = function(message, code){
	this.message = message;
	this.code = (code) ? code : 3001;
};

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

// DEPRECATED
var get_swagger = function(api_id, version_name, request){
  	// get swagger for this version

	return new Promise(function(resolve) {
		var cursor =state.db.collection('swaggers').find({"api_id":api_id, "name":version_name, "active":true}).toArray()
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

// IS THIS USED!?!?!?!?!?
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
  res.send('abra cadabra!');
});

app.post('/:version_name/users', function (request, response) {
  	var version_name = request.params.version_name;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.resource = 'users';

	magicstack.get_deployment(content)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				console.log(content.results);

				if(content.results.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_name);
				}else{

					content.swagger = content.results[0].swagger;
					content.version_id = content.results[0].version_id;
					resolve(content);
				}
			});

		})
		.then(magicstack.validate_api_key)
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.api_keys[0]){
					throw new HeaderException('invalid x-api-key');
				}else{
					content.spec = JSON.parse(content.swagger);
					content.client_id = content.api_keys[0].client_id;
					content.api_id = content.api_keys[0].api_id;
					resolve(content);
				}
			});
		})
		.then(magicstack.get_user_by_api)
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
		.then(magicstack.build_api_object)
		.then(magicstack.insert_api_object)
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

app.get('/:version_name/users', function (request, response) {
  	var version_name = request.params.version_name;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.resource = 'users';

	magicstack.get_deployment(content)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				console.log(content.results);

				if(content.results.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_name);
				}else{

					content.swagger = content.results[0].swagger;
					content.version_id = content.results[0].version_id;
					resolve(content);
				}
			});

		})
		.then(magicstack.validate_api_key)
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.api_keys[0]){
					throw new HeaderException('invalid authorization');
				}else{
					content.spec = JSON.parse(content.swagger);
					content.client_id = content.api_keys[0].client_id;
					content.api_id = content.api_keys[0].api_id;

					content.query = {"version_id":content.version_id, "resource":content.resource, "active":true};

					resolve(content);
				}
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){
			return new Promise(function(resolve) {
				console.log('RESULTS');
				console.log(content.results);

				if(content.results.length == 0){
					throw new ObjectException('retrieval error');
				}else{
					var payload = [];
					for(var i=0; i < content.results.length; i++){
						payload.push(content.results[i].body);
					};

					content.payload = payload;
					// delete passwords from content.payload
					for(var i=0; i < content.payload.length; i++){
						delete content.payload[i].password;
					}

					console.log(content.payload);

					resolve(content);
				}
			});
		})
		.then(function(content){
			//response.send(content.api_object.body);
			response.send(content.payload);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

app.get('/:version_name/users/:resource_id', function (request, response) {
  	var version_name = request.params.version_name;
  	var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.resource = 'users';
	content.resource_id = resource_id;

	magicstack.get_deployment(content)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				console.log(content.results);

				if(content.results.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_name);
				}else{

					content.swagger = content.results[0].swagger;
					content.version_id = content.results[0].version_id;
					resolve(content);
				}
			});

		})
		.then(magicstack.validate_api_key)
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.api_keys[0]){
					throw new HeaderException('invalid authorization');
				}else{
					content.spec = JSON.parse(content.swagger);
					content.client_id = content.api_keys[0].client_id;
					content.api_id = content.api_keys[0].api_id;

					content.query = {"version_id":content.version_id, "body._id":content.resource_id, "active":true};

					resolve(content);
				}
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){
			return new Promise(function(resolve) {
				console.log('RESULTS');
				console.log(content.results);

				if(content.results.length == 0){
					throw new ObjectException('retrieval error');
				}else{
					content.payload = content.results[0].body;

					// delete password from content.payload
					delete content.payload.password;
					console.log(content.payload);

					resolve(content);
				}
			});
		})
		.then(function(content){
			response.send(content.payload);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

app.put('/:version_name/users/:resource_id', function (request, response) {
  	var version_name = request.params.version_name;
  	var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.resource = 'users/{user_id}';
	content.resource_id = resource_id;

	magicstack.get_deployment(content)
		.then(function(content){
			return new Promise(function(resolve) {
				// validate swagger

				console.log(content.results);

				if(content.results.length == 0){
					throw new HeaderException('no available definition for version: '+content.version_name);
				}else{
					content.swagger = content.results[0].swagger;
					content.version_id = content.results[0].version_id;
					resolve(content);
				}
			});

		})
		.then(magicstack.validate_api_key)
		.then(function(content){
			return new Promise(function(resolve) {
				if(!content.api_keys[0]){
					throw new HeaderException('invalid authorization');
				}else{
					content.spec = JSON.parse(content.swagger);
					content.client_id = content.api_keys[0].client_id;
					content.api_id = content.api_keys[0].api_id;

					//content.query = {"version_id":content.version_id, "body._id":content.resource_id, "active":true};

					resolve(content);
				}
			});
		})
		.then(magicstack.build_api_object)
		.then(magicstack.delete_api_object)
		.then(magicstack.insert_api_object)
		.then(function(content){
			return new Promise(function(resolve) {
				content.payload = content.api_object.body;
				delete content.payload.password;
				resolve(content);
			});
		})
		.then(function(content){
			//response.send(content.api_object.body);
			response.send(content.payload);
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

	magicstack.authenticate_user(content)
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
		.then(magicstack.save_oauth_token)
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
	return magicstack.authenticate_token(content)
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
		.then(magicstack.get_swagger)
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
		.then(magicstack.build_api_object)
		.then(magicstack.insert_api_object)
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
		.then(magicstack.get_swagger)
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
		.then(magicstack.retrieve_api_objects)
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
		.then(magicstack.get_swagger)
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
		.then(magicstack.retrieve_api_objects_by_id)
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

app.put('/api/:api_id/:version_id/:resource/:resource_id', function (request, response) {
	var content = init_content(request);
	content.resource_id = request.params.resource_id;

	request_authentication(content)
		.then(magicstack.get_swagger)
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

				console.log(content.spec.paths['/'+content.resource]);

				if(!content.spec.paths['/'+content.resource][content.request.method.toLowerCase()]){
					throw new ObjectException("method not allowed!!!");
				}

				console.log(content);
				content.type = content.spec.paths['/'+content.resource]['x-singular'];
				resolve(content);
			});
		})
		.then(magicstack.retrieve_api_objects_by_id)
		.then(function(content){
			return new Promise(function(resolve) {
				if(content.retrieved_api_objects.length > 0){
					//payload = content.retrieved_api_objects[0].body;
					content.api_object = content.retrieved_api_objects[0];
				}else{
					throw new ObjectException("unique resource does not exist");
				}

				resolve(content);
			});

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