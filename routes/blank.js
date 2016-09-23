// external requires
var express = require('express');
var router = express.Router();

// internal requires
var magicstack = require('../magicstack.js');
var util = require('../util.js');
var config = require('../config/magicstack.json');
var exceptions = require('../exceptions.js');

router.post('/:version_name/:plurality', function (request, response) {
  	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.plurality = request.params.plurality;

	//content.resource = 'user'; // GET THIS DYNAMICALLY!
	//content.path = 'users'; // GET THIS DYNAMICALLY!

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
		.then(function(content){ // set access control policy
			return new Promise(function(resolve){
				content.access_control_policy = {"owner":{"type":"user", "id":content.user_id}, "access_control_list":[{"type":"user", "id":content.user_id, "permissions":["read","write"]}]};
				resolve(content);
			});
		})
		.then(magicstack.build_api_object)
		.then(magicstack.insert_api_object)
		.then(function(content){
			response.send(content.api_object.body);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

router.get('/:version_name/:plurality', function (request, response) {
  	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.plurality = request.params.plurality;

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
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.plurality;
				}

				resolve(content);
			});
		})
		.then(function(content){
			return new Promise(function(resolve) {
				content.query = {"resource":content.resource, "active":true, "client_id":content.client_id, "access_control_policy.access_control_list.id":content.user_id, "access_control_policy.access_control_list.type":"user", "access_control_policy.access_control_list.permissions":"read"};
				console.log(content.query);
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
					delete content.payload[i].password;
				}

				console.log(content.payload);

				resolve(content);
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

router.get('/:version_name/:plurality/:resource_id', function (request, response) {
  	var content = {};
	content.request = request;
	content.version_name = request.params.version_name;
	content.plurality = request.params.plurality;
  	/*
  	var version_name = request.params.version_name;
  	var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.resource = 'user';
	content.path = 'users/{user_id}';*/
	content.resource_id = request.params.resource_id;

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
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.plurality;
				}

				resolve(content);
			});
		})
		.then(function(content){
			return new Promise(function(resolve) {
				content.query = {"version_id":content.version_id, "body._id":content.resource_id, "active":true, "client_id":content.client_id, "resource":content.resource, "access_control_policy.access_control_list.id":content.user_id, "access_control_policy.access_control_list.type":"user", "access_control_policy.access_control_list.permissions":"read"};
				resolve(content);
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){
			return new Promise(function(resolve) {
				console.log('RESULTS');
				console.log(content.results);

				if(content.results.length == 0){
					throw new exceptions.ObjectException('could not find resource id');
					//content.payload = {};
				}else{
					content.payload = content.results[0].body;

					// delete password from content.payload
					delete content.payload.password;
					console.log(content.payload);
				}

				resolve(content);
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

router.put('/:version_name/:plurality/:resource_id', function (request, response) {
  	var version_name = request.params.version_name;
  	var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.plurality = request.params.plurality;
	//content.resource = 'user';
	//content.path = 'users/{user_id}';
	content.resource_id = resource_id;

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
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.plurality+'/{'+content.resource+'_id}';
				}

				resolve(content);
			});
		})
		.then(function(content){ // set query for db retrieval
			return new Promise(function(resolve) {
				content.query = {"version_id":content.version_id, "body._id":content.resource_id, "active":true, "client_id":content.client_id, "resource":content.resource};
				resolve(content);
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){ // confirm write permissions on this resource
		    return new Promise(function(resolve){
		        if(!util.user_has_permissions(content.results[0].access_control_policy, content.user_id, 'write')){
		            throw new exceptions.ObjectException('permissions denied');
		        }

		        resolve(content);
		    });
		})
		.then(function(content){ // set content._created and content.access_control_policy for resource that will replace this one
			return new Promise(function(resolve) {

				if(content.results.length == 0){
					throw new exceptions.ObjectException('retrieval error');
				}else{
					content._created = content.results[0].body._created;
					content.access_control_policy = content.results[0].access_control_policy;
					if(content.resource == 'user'){
						content.password = content.results[0].body.password; // ONLY FOR USER RESOURCE
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
			response.send(content.payload);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

router.delete('/:version_name/:plurality/:resource_id', function (request, response) {
  	var version_name = request.params.version_name;
  	var resource_id = request.params.resource_id;

	var content = {};
	content.version_name = version_name;
	content.request = request;
	content.plurality = request.params.plurality;
	content.resource_id = resource_id;

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
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.plurality+'/{'+content.resource+'_id}';
				}

				resolve(content);
			});
		})
		.then(function(content){ // set query for db retrieval
			return new Promise(function(resolve) {
				content.query = {"version_id":content.version_id, "body._id":content.resource_id, "active":true, "client_id":content.client_id, "resource":content.resource};
				resolve(content);
			});
		})
		.then(magicstack.get_api_objects)
		.then(function(content){ // confirm write permissions on this resource
		    return new Promise(function(resolve){
		        if(!util.user_has_permissions(content.results[0].access_control_policy, content.user_id, 'write')){
		            throw new exceptions.ObjectException('permissions denied');
		        }

		        resolve(content);
		    });
		})
		.then(magicstack.delete_api_object)
		.then(function(content){
			response.send({});
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

router.post('/:version_name/:parent/:resource_id/:plurality', function (request, response) {
  	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.plurality = request.params.plurality;
	content.parent = request.params.parent;
	content.resource_id = request.params.resource_id;

	//content.resource = 'user'; // GET THIS DYNAMICALLY!
	//content.path = 'users'; // GET THIS DYNAMICALLY!

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(magicstack.get_parent_resource)
		.then(function(content){
		    return new Promise(function(resolve){
		        if(content.results.length == 0){
		            throw new exceptions.ObjectException('could not find parent resource');
		        }else{
		            content.parent_resource = content.results[0].name.toLowerCase();
		        }
		        resolve(content);
		    });
		})
		.then(magicstack.get_resource)
		.then(function(content){ // dynamically assign content.resource, content.path
			return new Promise(function(resolve){
				if(content.results.length == 0){
					throw new exceptions.ObjectException('could not find resource');
				}else{
					content.resource_id = content.results[0].id;
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.parent+"/{"+content.parent_resource+"_id}/"+content.plurality;
				}

				resolve(content);
			});
		})
		.then(function(content){ // set access control policy
			return new Promise(function(resolve){
				content.access_control_policy = {"owner":{"type":"user", "id":content.user_id}, "access_control_list":[{"type":"user", "id":content.user_id, "permissions":["read","write"]}]};
				resolve(content);
			});
		})
		.then(function(content){
			return new Promise(function(resolve){ // insert derived values; bypass swagger defined read_only param attributes
				content.request.body.derived = {};
				content.request.body.derived["list_id"] = content.resource_id;
				resolve(content);
			});
		})
		.then(magicstack.build_api_object)
		.then(magicstack.insert_api_object)
		.then(function(content){
			response.send(content.api_object.body);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

router.get('/:version_name/:parent/:resource_id/:plurality', function (request, response) {
  	var content = {};
	content.version_name = request.params.version_name;
	content.request = request;
	content.plurality = request.params.plurality;
	content.parent = request.params.parent;
	content.resource_id = request.params.resource_id;

	//content.resource = 'user'; // GET THIS DYNAMICALLY!
	//content.path = 'users'; // GET THIS DYNAMICALLY!

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(magicstack.get_parent_resource)
		.then(function(content){
		    return new Promise(function(resolve){
		        if(content.results.length == 0){
		            throw new exceptions.ObjectException('could not find parent resource');
		        }else{
		            content.parent_resource = content.results[0].name.toLowerCase();
		        }
		        resolve(content);
		    });
		})
		.then(magicstack.get_resource)
		.then(function(content){ // dynamically assign content.resource, content.path
			return new Promise(function(resolve){
				if(content.results.length == 0){
					throw new exceptions.ObjectException('could not find resource');
				}else{
					content.resource = content.results[0].name.toLowerCase();
					content.path = content.parent+"/{"+content.parent_resource+"_id}/"+content.plurality;
				}

				resolve(content);
			});
		})
		.then(function(content){
			return new Promise(function(resolve) {
				content.query = {"resource":content.resource, "active":true, "client_id":content.client_id, "access_control_policy.access_control_list.id":content.user_id, "access_control_policy.access_control_list.type":"user", "access_control_policy.access_control_list.permissions":"read"};
				console.log(content.query);
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
					delete content.payload[i].password;
				}

				console.log(content.payload);

				resolve(content);
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

module.exports = router;