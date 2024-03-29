/* axios v0.15.3 | (c) 2016 by Matt Zabriskie */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.axios=t():e.axios=t()}(this,function(){return function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){e.exports=n(1)},function(e,t,n){"use strict";function r(e){var t=new i(e),n=s(i.prototype.request,t);return o.extend(n,i.prototype,t),o.extend(n,t),n}var o=n(2),s=n(3),i=n(4),a=n(5),u=r(a);u.Axios=i,u.create=function(e){return r(o.merge(a,e))},u.Cancel=n(22),u.CancelToken=n(23),u.isCancel=n(19),u.all=function(e){return Promise.all(e)},u.spread=n(24),e.exports=u,e.exports.default=u},function(e,t,n){"use strict";function r(e){return"[object Array]"===C.call(e)}function o(e){return"[object ArrayBuffer]"===C.call(e)}function s(e){return"undefined"!=typeof FormData&&e instanceof FormData}function i(e){var t;return t="undefined"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer&&e.buffer instanceof ArrayBuffer}function a(e){return"string"==typeof e}function u(e){return"number"==typeof e}function c(e){return"undefined"==typeof e}function f(e){return null!==e&&"object"==typeof e}function p(e){return"[object Date]"===C.call(e)}function d(e){return"[object File]"===C.call(e)}function l(e){return"[object Blob]"===C.call(e)}function h(e){return"[object Function]"===C.call(e)}function m(e){return f(e)&&h(e.pipe)}function y(e){return"undefined"!=typeof URLSearchParams&&e instanceof URLSearchParams}function w(e){return e.replace(/^\s*/,"").replace(/\s*$/,"")}function g(){return"undefined"!=typeof window&&"undefined"!=typeof document&&"function"==typeof document.createElement}function v(e,t){if(null!==e&&"undefined"!=typeof e)if("object"==typeof e||r(e)||(e=[e]),r(e))for(var n=0,o=e.length;n<o;n++)t.call(null,e[n],n,e);else for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.call(null,e[s],s,e)}function x(){function e(e,n){"object"==typeof t[n]&&"object"==typeof e?t[n]=x(t[n],e):t[n]=e}for(var t={},n=0,r=arguments.length;n<r;n++)v(arguments[n],e);return t}function b(e,t,n){return v(t,function(t,r){n&&"function"==typeof t?e[r]=E(t,n):e[r]=t}),e}var E=n(3),C=Object.prototype.toString;e.exports={isArray:r,isArrayBuffer:o,isFormData:s,isArrayBufferView:i,isString:a,isNumber:u,isObject:f,isUndefined:c,isDate:p,isFile:d,isBlob:l,isFunction:h,isStream:m,isURLSearchParams:y,isStandardBrowserEnv:g,forEach:v,merge:x,extend:b,trim:w}},function(e,t){"use strict";e.exports=function(e,t){return function(){for(var n=new Array(arguments.length),r=0;r<n.length;r++)n[r]=arguments[r];return e.apply(t,n)}}},function(e,t,n){"use strict";function r(e){this.defaults=e,this.interceptors={request:new i,response:new i}}var o=n(5),s=n(2),i=n(16),a=n(17),u=n(20),c=n(21);r.prototype.request=function(e){"string"==typeof e&&(e=s.merge({url:arguments[0]},arguments[1])),e=s.merge(o,this.defaults,{method:"get"},e),e.baseURL&&!u(e.url)&&(e.url=c(e.baseURL,e.url));var t=[a,void 0],n=Promise.resolve(e);for(this.interceptors.request.forEach(function(e){t.unshift(e.fulfilled,e.rejected)}),this.interceptors.response.forEach(function(e){t.push(e.fulfilled,e.rejected)});t.length;)n=n.then(t.shift(),t.shift());return n},s.forEach(["delete","get","head"],function(e){r.prototype[e]=function(t,n){return this.request(s.merge(n||{},{method:e,url:t}))}}),s.forEach(["post","put","patch"],function(e){r.prototype[e]=function(t,n,r){return this.request(s.merge(r||{},{method:e,url:t,data:n}))}}),e.exports=r},function(e,t,n){"use strict";function r(e,t){!s.isUndefined(e)&&s.isUndefined(e["Content-Type"])&&(e["Content-Type"]=t)}function o(){var e;return"undefined"!=typeof XMLHttpRequest?e=n(7):"undefined"!=typeof process&&(e=n(7)),e}var s=n(2),i=n(6),a=/^\)\]\}',?\n/,u={"Content-Type":"application/x-www-form-urlencoded"},c={adapter:o(),transformRequest:[function(e,t){return i(t,"Content-Type"),s.isFormData(e)||s.isArrayBuffer(e)||s.isStream(e)||s.isFile(e)||s.isBlob(e)?e:s.isArrayBufferView(e)?e.buffer:s.isURLSearchParams(e)?(r(t,"application/x-www-form-urlencoded;charset=utf-8"),e.toString()):s.isObject(e)?(r(t,"application/json;charset=utf-8"),JSON.stringify(e)):e}],transformResponse:[function(e){if("string"==typeof e){e=e.replace(a,"");try{e=JSON.parse(e)}catch(e){}}return e}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,validateStatus:function(e){return e>=200&&e<300}};c.headers={common:{Accept:"application/json, text/plain, */*"}},s.forEach(["delete","get","head"],function(e){c.headers[e]={}}),s.forEach(["post","put","patch"],function(e){c.headers[e]=s.merge(u)}),e.exports=c},function(e,t,n){"use strict";var r=n(2);e.exports=function(e,t){r.forEach(e,function(n,r){r!==t&&r.toUpperCase()===t.toUpperCase()&&(e[t]=n,delete e[r])})}},function(e,t,n){"use strict";var r=n(2),o=n(8),s=n(11),i=n(12),a=n(13),u=n(9),c="undefined"!=typeof window&&window.btoa&&window.btoa.bind(window)||n(14);e.exports=function(e){return new Promise(function(t,f){var p=e.data,d=e.headers;r.isFormData(p)&&delete d["Content-Type"];var l=new XMLHttpRequest,h="onreadystatechange",m=!1;if("undefined"==typeof window||!window.XDomainRequest||"withCredentials"in l||a(e.url)||(l=new window.XDomainRequest,h="onload",m=!0,l.onprogress=function(){},l.ontimeout=function(){}),e.auth){var y=e.auth.username||"",w=e.auth.password||"";d.Authorization="Basic "+c(y+":"+w)}if(l.open(e.method.toUpperCase(),s(e.url,e.params,e.paramsSerializer),!0),l.timeout=e.timeout,l[h]=function(){if(l&&(4===l.readyState||m)&&(0!==l.status||l.responseURL&&0===l.responseURL.indexOf("file:"))){var n="getAllResponseHeaders"in l?i(l.getAllResponseHeaders()):null,r=e.responseType&&"text"!==e.responseType?l.response:l.responseText,s={data:r,status:1223===l.status?204:l.status,statusText:1223===l.status?"No Content":l.statusText,headers:n,config:e,request:l};o(t,f,s),l=null}},l.onerror=function(){f(u("Network Error",e)),l=null},l.ontimeout=function(){f(u("timeout of "+e.timeout+"ms exceeded",e,"ECONNABORTED")),l=null},r.isStandardBrowserEnv()){var g=n(15),v=(e.withCredentials||a(e.url))&&e.xsrfCookieName?g.read(e.xsrfCookieName):void 0;v&&(d[e.xsrfHeaderName]=v)}if("setRequestHeader"in l&&r.forEach(d,function(e,t){"undefined"==typeof p&&"content-type"===t.toLowerCase()?delete d[t]:l.setRequestHeader(t,e)}),e.withCredentials&&(l.withCredentials=!0),e.responseType)try{l.responseType=e.responseType}catch(e){if("json"!==l.responseType)throw e}"function"==typeof e.onDownloadProgress&&l.addEventListener("progress",e.onDownloadProgress),"function"==typeof e.onUploadProgress&&l.upload&&l.upload.addEventListener("progress",e.onUploadProgress),e.cancelToken&&e.cancelToken.promise.then(function(e){l&&(l.abort(),f(e),l=null)}),void 0===p&&(p=null),l.send(p)})}},function(e,t,n){"use strict";var r=n(9);e.exports=function(e,t,n){var o=n.config.validateStatus;n.status&&o&&!o(n.status)?t(r("Request failed with status code "+n.status,n.config,null,n)):e(n)}},function(e,t,n){"use strict";var r=n(10);e.exports=function(e,t,n,o){var s=new Error(e);return r(s,t,n,o)}},function(e,t){"use strict";e.exports=function(e,t,n,r){return e.config=t,n&&(e.code=n),e.response=r,e}},function(e,t,n){"use strict";function r(e){return encodeURIComponent(e).replace(/%40/gi,"@").replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")}var o=n(2);e.exports=function(e,t,n){if(!t)return e;var s;if(n)s=n(t);else if(o.isURLSearchParams(t))s=t.toString();else{var i=[];o.forEach(t,function(e,t){null!==e&&"undefined"!=typeof e&&(o.isArray(e)&&(t+="[]"),o.isArray(e)||(e=[e]),o.forEach(e,function(e){o.isDate(e)?e=e.toISOString():o.isObject(e)&&(e=JSON.stringify(e)),i.push(r(t)+"="+r(e))}))}),s=i.join("&")}return s&&(e+=(e.indexOf("?")===-1?"?":"&")+s),e}},function(e,t,n){"use strict";var r=n(2);e.exports=function(e){var t,n,o,s={};return e?(r.forEach(e.split("\n"),function(e){o=e.indexOf(":"),t=r.trim(e.substr(0,o)).toLowerCase(),n=r.trim(e.substr(o+1)),t&&(s[t]=s[t]?s[t]+", "+n:n)}),s):s}},function(e,t,n){"use strict";var r=n(2);e.exports=r.isStandardBrowserEnv()?function(){function e(e){var t=e;return n&&(o.setAttribute("href",t),t=o.href),o.setAttribute("href",t),{href:o.href,protocol:o.protocol?o.protocol.replace(/:$/,""):"",host:o.host,search:o.search?o.search.replace(/^\?/,""):"",hash:o.hash?o.hash.replace(/^#/,""):"",hostname:o.hostname,port:o.port,pathname:"/"===o.pathname.charAt(0)?o.pathname:"/"+o.pathname}}var t,n=/(msie|trident)/i.test(navigator.userAgent),o=document.createElement("a");return t=e(window.location.href),function(n){var o=r.isString(n)?e(n):n;return o.protocol===t.protocol&&o.host===t.host}}():function(){return function(){return!0}}()},function(e,t){"use strict";function n(){this.message="String contains an invalid character"}function r(e){for(var t,r,s=String(e),i="",a=0,u=o;s.charAt(0|a)||(u="=",a%1);i+=u.charAt(63&t>>8-a%1*8)){if(r=s.charCodeAt(a+=.75),r>255)throw new n;t=t<<8|r}return i}var o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";n.prototype=new Error,n.prototype.code=5,n.prototype.name="InvalidCharacterError",e.exports=r},function(e,t,n){"use strict";var r=n(2);e.exports=r.isStandardBrowserEnv()?function(){return{write:function(e,t,n,o,s,i){var a=[];a.push(e+"="+encodeURIComponent(t)),r.isNumber(n)&&a.push("expires="+new Date(n).toGMTString()),r.isString(o)&&a.push("path="+o),r.isString(s)&&a.push("domain="+s),i===!0&&a.push("secure"),document.cookie=a.join("; ")},read:function(e){var t=document.cookie.match(new RegExp("(^|;\\s*)("+e+")=([^;]*)"));return t?decodeURIComponent(t[3]):null},remove:function(e){this.write(e,"",Date.now()-864e5)}}}():function(){return{write:function(){},read:function(){return null},remove:function(){}}}()},function(e,t,n){"use strict";function r(){this.handlers=[]}var o=n(2);r.prototype.use=function(e,t){return this.handlers.push({fulfilled:e,rejected:t}),this.handlers.length-1},r.prototype.eject=function(e){this.handlers[e]&&(this.handlers[e]=null)},r.prototype.forEach=function(e){o.forEach(this.handlers,function(t){null!==t&&e(t)})},e.exports=r},function(e,t,n){"use strict";function r(e){e.cancelToken&&e.cancelToken.throwIfRequested()}var o=n(2),s=n(18),i=n(19),a=n(5);e.exports=function(e){r(e),e.headers=e.headers||{},e.data=s(e.data,e.headers,e.transformRequest),e.headers=o.merge(e.headers.common||{},e.headers[e.method]||{},e.headers||{}),o.forEach(["delete","get","head","post","put","patch","common"],function(t){delete e.headers[t]});var t=e.adapter||a.adapter;return t(e).then(function(t){return r(e),t.data=s(t.data,t.headers,e.transformResponse),t},function(t){return i(t)||(r(e),t&&t.response&&(t.response.data=s(t.response.data,t.response.headers,e.transformResponse))),Promise.reject(t)})}},function(e,t,n){"use strict";var r=n(2);e.exports=function(e,t,n){return r.forEach(n,function(n){e=n(e,t)}),e}},function(e,t){"use strict";e.exports=function(e){return!(!e||!e.__CANCEL__)}},function(e,t){"use strict";e.exports=function(e){return/^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(e)}},function(e,t){"use strict";e.exports=function(e,t){return e.replace(/\/+$/,"")+"/"+t.replace(/^\/+/,"")}},function(e,t){"use strict";function n(e){this.message=e}n.prototype.toString=function(){return"Cancel"+(this.message?": "+this.message:"")},n.prototype.__CANCEL__=!0,e.exports=n},function(e,t,n){"use strict";function r(e){if("function"!=typeof e)throw new TypeError("executor must be a function.");var t;this.promise=new Promise(function(e){t=e});var n=this;e(function(e){n.reason||(n.reason=new o(e),t(n.reason))})}var o=n(22);r.prototype.throwIfRequested=function(){if(this.reason)throw this.reason},r.source=function(){var e,t=new r(function(t){e=t});return{token:t,cancel:e}},e.exports=r},function(e,t){"use strict";e.exports=function(e){return function(t){return e.apply(null,t)}}}])});
//# sourceMappingURL=axios.min.map

/**
 *
 *
 */

var kb = function(){
    this.config = {
        url: "https://app.kloudbit.com/",
    };

    this.session = {
        save: function(key, value){
            sessionStorage[key] = value;
        },

        get: function(key){
            return sessionStorage[key];
        },

        remove: function(key){
            sessionStorage.removeItem(key);
        }
    };

    this.make_request = function(config, callback){
        var that = this;

        console.log('make_request');
        console.log(config);

        axios.request(config)
            .then(function (response) {

                if(that.is_user_resource() && config.method == 'post'){
                    that.authenticate(config.data.username, config.data.password, callback);
                }else{
                    if(callback){
                        callback({"result":response.data});
                    }
                }

            })
            .catch(function (error) {
                if(error.response && error.response.data && callback){
                    callback(error.response.data);
                }else{
                    console.log('unexpected kb error');
                    console.log(error);
                }
            });
    };

    this.make_auth_request = function(config, callback){
        var that = this;

        console.log('make_auth_request');
        console.log(config);

        axios.request(config)
            .then(function (response) {
                that.access_token = response.data.access_token;
                that.session.save('access_token', response.data.access_token);

                if(callback){
                    callback({"result":response.data});
                }
            })
            .catch(function (error) {
                console.log(error);
                if(error.response){
                    callback(error.response.data);
                }
            });
    };

    this.is_user_resource = function(){
        var match = this.url.match('^users\/?');

        if(match && match.length > 0){
            return match[0].replace("/","");
        }else{
            return false;
        }
    };

    this.get_authorization_header = function(){
        if(this.is_user_resource()){
            return 'Basic '+this.kloudbit_token;
        }else{
            return 'Bearer '+this.session.get('access_token');
        }    
    };

    this.post_request = function(resource, data, callback){
        var config = {
            url: this.config.url+'v1/'+resource,
            method: 'post',
            data:data
        };

        config.headers = {Authorization: this.get_authorization_header()};

        this.make_request(config, callback);
    };

    this.put_request = function(resource, data, callback){
        var config = {
            url: this.config.url+'v1/'+resource,
            method: 'put',
            data:data
        };

        config.headers = {Authorization: this.get_authorization_header()};

        this.make_request(config, callback);
    };

    this.get_request = function(resource, callback){
        console.log('calling this.get_request()');


        var config = {
            url: this.config.url+'v1/'+resource,
            method: 'get',
        };

        config.headers = {Authorization: this.get_authorization_header()};

        this.make_request(config, callback);
    };

    this.delete_request = function(resource, callback){
        var config = {
            url: this.config.url+'v1/'+resource,
            method: 'delete'
        };

        config.headers = {Authorization: this.get_authorization_header()};

        this.make_request(config, callback);
    };

    this.get_kloudbit_access_token = function(username, password, callback){
        var config = {
            url: this.config.url+'v1/oauth2/token?username='+username+'&password='+password,
            method: 'post',
            headers: {Authorization: 'Basic '+this.kloudbit_token}
        };

        this.make_auth_request(config, callback);
    };

    this.verify_schema = function(schema){
        return true;

        /*
        if(schema == 'users' || schema == 'todos'){
            return true;
        }

        return false;
        */
    };
};

kb.prototype.init = function(kb_token){

    this.kloudbit_token = kb_token;
};

kb.prototype.uri = function(url){
    this.url = url;

    if(!this.verify_schema(this.url)){
        this.error = {code:101, message:"could not find schema"};
    }

    return this;
};

kb.prototype.add = function(data, callback){
    if(this.error){
        return this;
    }

    this.post_request(this.url, data, callback);

    return this;
};


kb.prototype.get = function(callback){
    console.log('calling get()');

    if(this.error){
        return this;
    }

    this.get_request(this.url, callback);
};

kb.prototype.update = function(data, callback){
    console.log('calling update()');

    if(this.error){
        return this;
    }

    this.put_request(this.url, data, callback);
};

kb.prototype.remove = function(callback){
    console.log('calling remove');

    if(this.error){
        return this;
    }

    this.delete_request(this.url, callback);
};

kb.prototype.authenticate = function(username, password, callback){
    this.get_kloudbit_access_token(username,password,callback);
};

kb.prototype.auth = function(access_token){
    return this;
};

kb.prototype.logout = function(){
    this.session.remove('access_token');
};

kb.prototype.is_logged_in = function(){

    if(this.session.get('access_token')){
        return true;
    }else{
        return false;
    }
};

var kloudbit = new kb();