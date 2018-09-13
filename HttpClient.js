const vscode = require('vscode');
const path = require("path");
const superagent = require('superagent');
const constants = require('./constants');

class HttpClient {
    constructor(url, username, password) {
        this.snow_url = url;
        this.username = username;
        this.password = password;
        this.api_path = constants.API_PATH;
    }

    _getBase64(string) {
        return Buffer.from(string).toString('base64')
    }

    _getAuthHeader(username,password) {
        return "Basic " + this._getBase64(username+":"+password);
    }

    get(table_name, query_params=null, sys_id=null) {
        const auth_header = this._getAuthHeader(this.username, this.password);
        var url = this.snow_url + "/" + this.api_path + "table/" + table_name;
        console.log("Calling " + url);
        return superagent.get(url)
        .set('Authorization', auth_header)
        .query(query_params)
    }

    put(table_name, sys_id, data) {
        console.log("Putting " + table_name);
        const auth_header = this._getAuthHeader(this.username, this.password);
        var url = this.snow_url + "/" +  this.api_path + "table/" + table_name + "/" + sys_id;
        var payload = JSON.stringify({
            script : data
        });
        
        return superagent.put(url)
        .send(payload)
        .set('Authorization', auth_header)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
    }

    post(table_name, sys_id, content_object) {

    }
}

exports.HttpClient = HttpClient;