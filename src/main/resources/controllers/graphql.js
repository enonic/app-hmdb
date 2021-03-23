var guillotineLib = require('/lib/guillotine');
var graphqlPlaygroundLib = require('/lib/graphql-playground');
var graphQlLib = require('/lib/graphql');
var authLib = require('/lib/xp/auth');


//──────────────────────────────────────────────────────────────────────────────
// Constants
//──────────────────────────────────────────────────────────────────────────────
var CORS_HEADERS = {
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Origin': '*'
};

var SCHEMA = guillotineLib.createSchema();


//──────────────────────────────────────────────────────────────────────────────
// Authentication
//──────────────────────────────────────────────────────────────────────────────
function isAuthenticated() {
    return authLib.hasRole('system.authenticated')
}

function canAccessAdminLogin() {
    return authLib.hasRole('system.admin') || authLib.hasRole('system.admin.login')
}

//──────────────────────────────────────────────────────────────────────────────
// Error handling
//──────────────────────────────────────────────────────────────────────────────
function createNotFoundError() {
    return {
        status: 404,
        body: {
            "errors": [
                {
                    "errorType": "404",
                    "message": "Not found"
                }
            ]
        }
    }
}

function createUnauthorizedError() {
    return {
        status: 401,
        body: {
            "errors": [
                {
                    "errorType": "401",
                    "message": "Unauthorized"
                }
            ]
        }
    }
}


function createForbiddenError() {
    return {
        status: 403,
        body: {
            "errors": [
                {
                    "errorType": "403",
                    "message": "Forbidden"
                }
            ]
        }
    }
}


//──────────────────────────────────────────────────────────────────────────────
// Methods
//──────────────────────────────────────────────────────────────────────────────
exports.options = function () {
	return {
		contentType: 'text/plain;charset=utf-8',
		headers: CORS_HEADERS
	};
};

exports.get = function (req) {
    if (req.webSocket) {
        if (!isAuthenticated()) {
            return createUnauthorizedError();
        }
        if (!canAccessAdminLogin()) {
            return createForbiddenError();
        }
        return {
            webSocket: {
                subProtocols: ['graphql-ws']
            }
        };
    }

    var body = graphqlPlaygroundLib.render();
    return {
        contentType: 'text/html; charset=utf-8',
        body: body
    };
};

exports.post = function (req) {
    var body = JSON.parse(req.body);
    return {
        contentType: 'application/json',
		headers: CORS_HEADERS,
        body: JSON.stringify(graphQlLib.execute(SCHEMA, body.query, body.variables))
    };
};


exports.webSocketEvent = guillotineLib.initWebSockets(SCHEMA);
