// ext requires
var express = require('express');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var app = express();
const winston = require('winston');

// internal requires
var magicstack = require('./magicstack.js');
var util = require('./util.js');
//var config = require('./config/magicstack.json');
var exceptions = require('./exceptions.js');

var users = require('./routes/users.js');

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req,res,next){
	winston.info("");
	winston.info("===INCOMING==");
	winston.info("METHOD:",req.method);
	winston.info("PATH:", req.path);
	winston.info("BODY:",req.body);
	winston.info("QUERY:",req.query);
	winston.info('HEADERS: ',req.headers);
	winston.info('CONNECTION: ',req.connection);
	next();
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

app.get('/', function (req, res) {
  res.send('abra cadabra!');
});

// user resource methods
app.post('/:version_name/users', require('./routes/users.js'));
app.get('/:version_name/users', require('./routes/users.js'));
app.get('/:version_name/users/:resource_id', require('./routes/users.js'));
app.put('/:version_name/users/:resource_id', require('./routes/users.js'));
app.delete('/:version_name/users/:resource_id', require('./routes/users.js'));

// blank resource methods
app.post('/:version_name/:plurality', require('./routes/blank.js'));
app.get('/:version_name/:plurality', require('./routes/blank.js'));
app.get('/:version_name/:plurality/:resource_id', require('./routes/blank.js'));
app.put('/:version_name/:plurality/:resource_id', require('./routes/blank.js'));
app.delete('/:version_name/:plurality/:resource_id', require('./routes/blank.js'));

app.post('/:version_name/:parent/:resource_id/:plurality', require('./routes/blank.js'));
app.get('/:version_name/:parent/:resource_id/:plurality', require('./routes/blank.js'));

// oauth methods
app.post('/:version_name/oauth2/token', require('./routes/oauth.js'));


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});