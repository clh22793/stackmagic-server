// external requires
var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

// internal requires
var magicstack = require('../magicstack.js');
var util = require('../util.js');
//var config = require('../config/magicstack.json');
var exceptions = require('../exceptions.js');

router.post('/:version_name/oauth2/token', function (request, response) {
	var start_time = Date.now();
	var content = {};

	content.request = request;
	content.version_name = request.params.version_name;
	content.username = request.query.username;
	content.password = request.query.password;
	content.grant_type = request.query.grant_type;

	magicstack.get_api_key(content)
		.then(magicstack.validate_api_key)
		.then(magicstack.get_deployment)
		.then(magicstack.validate_swagger_spec)
		.then(magicstack.authenticate_user)
		.then(function(content){
			return new Promise(function(resolve){
				if(content.results.length == 0){
					throw new exceptions.ObjectException('invalid credentials');
				}

				if(!bcrypt.compareSync(content.password, content.results[0].body.password)){
					throw new exceptions.ObjectException('invalid credentials');
				}

				resolve(content);
			});
		})
		.then(function(content){
			return new Promise(function(resolve) {
				//if(content.results.length == 0){
				//	throw new exceptions.ObjectException('invalid credentials');
				//}else{
					//content.payload = content.results[0].body;
					var object = {};
					object.api_id = content.api_id;
					object.version_id = content.version_id;
					object.user_id = content.results[0].body._id;
					object.client_id = content.client_id;
					object.active = true;
					object.body = {};
					object.body._created = new Date().toISOString();
					object.body.access_token = util.generate_oauth_token();
					object.body.user_id = content.results[0].body._id;

					content.oauth_record = object;
				//}

				resolve(content);
			});
		})
		.then(magicstack.save_oauth_token)
		.then(function(content){
			magicstack.save_request(request, start_time, {"type":"client", "id":content.client_id});
			response.send(content.oauth_record.body);
		})
		.catch(function(err){
			console.trace();
			console.log(err);
			response.send({"error_code":err.code, "error_message":err.message});
		});
});

module.exports = router;