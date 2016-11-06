// external requires
var express = require('express');
var router = express.Router();

// internal requires
var magicstack = require('../magicstack.js');
var util = require('../util.js');
//var config = require('../config/magicstack.json');
var exceptions = require('../exceptions.js');

router.post('/:version_name/users', function (request, response) {
	var start_time = Date.now();
  	var version_name = request.params.version_name;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.plurality = "users";
	//content.resource = 'user';
	//content.path = 'users';

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(magicstack.get_resource)
		.then(function(content){ // dynamically assign content.resource, content.path
			return new Promise(function(resolve){
				if(content.results.length == 0){
					throw new exceptions.ObjectException('could not find resource');
				}else{
					content.resource_id = content.results[0].id;
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.plurality;
				}

				resolve(content);
			});
		})
		.then(magicstack.get_user_by_api) // only for user resource
		.then(magicstack.validate_user_uniqueness) // only for user resource
		.then(function(content){ // set access control policy
			return new Promise(function(resolve){
				content.access_control_policy = {"owner":{"type":"client", "id":content.user_id}, "access_control_list":[{"type":"user", "id":content.user_id, "permissions":["read","write"]}]};
				resolve(content);
			});

		})
		.then(magicstack.build_api_object)
		.then(magicstack.insert_api_object)
		.then(function(content){
			delete content.api_object.body.password;
			magicstack.save_request(request, start_time, {"type":"client", "id":content.client_id});
			response.status(201).send(content.api_object.body);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.status(500).send({"error_code":err.code, "error_message":err.message});
		});
});

router.get('/:version_name/users', function (request, response) {
	var start_time = Date.now();

	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.resource = 'user';
	content.path = 'users';

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(function(content){
			return new Promise(function(resolve) {
				content.query = {"resource":content.resource, "active":true, "client_id":content.client_id};
				resolve(content);
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){
			return new Promise(function(resolve) {
				console.log('RESULTS');
				console.log(content.results);

				var payload = [];
				for(var i=0; i < content.results.length; i++){
					payload.push(content.results[i].body);
				};

				content.payload = payload;
				// delete passwords from content.payload
				for(var i=0; i < content.payload.length; i++){
					delete content.payload[i].content.password;
				}

				console.log(content.payload);

				resolve(content);
			});
		})
		.then(function(content){
			magicstack.save_request(request, start_time, {"type":"client", "id":content.client_id});
			response.status(200).send(content.payload);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.status(500).send({"error_code":err.code, "error_message":err.message});
		});
});

router.get('/:version_name/users/:resource_id', function (request, response) {
  	var start_time = Date.now();

  	//var version_name = request.params.version_name;
  	//var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.resource = 'user';
	content.path = 'users/{user_id}';
	content.resource_id = request.params.resource_id;

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(function(content){
			return new Promise(function(resolve) {
				content.query = {"version_id":content.version_id, "body.content._id":content.resource_id, "active":true, "client_id":content.client_id, "resource":content.resource};
				resolve(content);
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){
			return new Promise(function(resolve) {
				console.log('RESULTS');
				console.log(content.results);

				if(content.results.length == 0){
					throw new exceptions.ObjectException('retrieval error');
					//content.payload = {};
				}else{
					content.payload = content.results[0].body;

					// delete password from content.payload
					delete content.payload.content.password;
					console.log(content.payload);
				}

				resolve(content);
			});
		})
		.then(function(content){
			magicstack.save_request(request, start_time, {"type":"client", "id":content.client_id});
			response.status(200).send(content.payload);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.status(500).send({"error_code":err.code, "error_message":err.message});
		});
});

router.put('/:version_name/users/:resource_id', function (request, response) {
  	var start_time = Date.now();
  	//var version_name = request.params.version_name;
  	//var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.resource = 'user';
	content.path = 'users/{user_id}';
	content.resource_id = request.params.resource_id;

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(function(content){ // set query for db retrieval
			return new Promise(function(resolve) {
				content.query = {"version_id":content.version_id, "body.content._id":content.resource_id, "active":true, "client_id":content.client_id, "resource":content.resource};
				resolve(content);
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){ // set content._created
			return new Promise(function(resolve) {

				if(content.results.length == 0){
					throw new exceptions.ObjectException('retrieval error');
				}else{
					content._created = content.results[0].body.meta._created;
					content._id = content.results[0].body.content._id;
					content.access_control_policy = content.results[0].access_control_policy;
					if(content.resource == 'user'){
						content.password = content.results[0].body.content.password; // ONLY FOR USER RESOURCE
					}
				}
				resolve(content);
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
			magicstack.save_request(request, start_time, {"type":"client", "id":content.client_id});
			response.status(200).send(content.payload);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.status(500).send({"error_code":err.code, "error_message":err.message});
		});
});

router.delete('/:version_name/users/:resource_id', function (request, response) {
  	var start_time = Date.now();
  	//var version_name = request.params.version_name;
  	//var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.resource = 'user';
	content.path = 'users/{user_id}';
	content.resource_id = request.params.resource_id;

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(magicstack.delete_api_object)
		.then(function(content){
			magicstack.save_request(request, start_time, {"type":"client", "id":content.client_id});
			response.status(200).send({});
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.status(500).send({"error_code":err.code, "error_message":err.message});
		});
});

module.exports = router;