let http = require('http');
let https = require('https');
let unzipper = require('unzipper');
let querystring = require('querystring');

//2、auth路由：接收code，用code+client_id+client_secret换token
function auth(request, response) {
    let query = querystring.parse(request.url.match(/^\/auth\?([\s\S]+)$/)[1]);
    // console.log(query);
    getToken(query.code, function (info) {
        // console.log(info);
        // response.write(JSON.stringify(info));
        response.write(`<a href="http://localhost:8083?token=${info.access_token}">publish</a>`)
        response.end();
    })
}

function getToken(code, callback) {
    let request = https.request({
        hostname: "github.com",
        path: `/login/oauth/access_token?code=${code}&client_id=Iv1.7bb19a388a330caa&client_secret=c0937b9cf82c10f2eac9014a2a79eb546013c69a`,
        port: 443,
        method: "POST"
    }, function(response) {
        // console.log(response);
        let body = "";
        response.on('data', chunk => {
            // console.log(chunk.toString());
            body += (chunk.toString());
        })
        response.on('end', chunk => {
            // console.log(body);
            callback(querystring.parse(body));
        })
    });
    request.end();
}

//4、publish路由：用token获取用户信息，检查权限，接受发布
function publish(request, response) {
    let query = querystring.parse(request.url.match(/^\/publish\?([\s\S]+)$/)[1]);

    getUser(query.token, info => {
        console.log(info);
        if (info.login === "ylcz") {
            request.pipe(unzipper.Extract({ path: '../server/public/'}));
            request.on('end', function () {
                response.end("Success!");
            });
        }
    });

}

function getUser(token, callback) {
    let request = https.request({
        hostname: "api.github.com",
        path: `/user`,
        port: 443,
        method: "GET",
        headers: {
            Authorization: `token ${token}`,
            "User-Agent": 'ylcz-publish'
        }
    }, function(response) {
        // console.log(response);
        let body = "";
        response.on('data', chunk => {
            // console.log(chunk.toString());
            body += (chunk.toString());
        })
        response.on('end', chunk => {
            // console.log(body);
            callback(JSON.parse(body));
        })
    });
    request.end();
}

http.createServer(function (request, response) {
    if (request.url.match(/^\/auth\?/))
        return auth(request, response);
    if (request.url.match(/^\/publish\?/))
        return publish(request, response);
    // console.log("request")
    // let outFile = fs.createWriteStream("../server/public/tmp.zip");
    // request.pipe(outFile);

}).listen(8082);