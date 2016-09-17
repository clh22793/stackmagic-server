// exceptions
exports.PayloadException = function(message){
	this.message = message;
	this.code = 1000;
};

exports.HeaderException = function(message, code){
	this.message = message;
	this.code = (code) ? code : 2000;
};

exports.ObjectException = function(message, code){
	this.message = message;
	this.code = (code) ? code : 3000;
};