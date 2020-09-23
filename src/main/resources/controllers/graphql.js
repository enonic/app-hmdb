var guillotineLib = require('/lib/guillotine');
var graphqlPlaygroundLib = require('/lib/graphql-playground');
var graphQlLib = require('/lib/graphql');
var graphQlRxLib = require('/lib/graphql-rx');
var authLib = require('/lib/xp/auth');
var webSocketLib = require('/lib/xp/websocket');


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
// GraphQL WS Protocol
//──────────────────────────────────────────────────────────────────────────────
const graphQlSubscribers = {};

function cancelSubscription(sessionId) {
    Java.synchronized(() => {
        const subscriber = graphQlSubscribers[sessionId];
        if (subscriber) {
            delete  graphQlSubscribers[sessionId];
            subscriber.cancelSubscription();
        }
    }, graphQlSubscribers)();
}

function handleStartMessage(sessionId, message) {
    const graphlqlOperationId = message.id;
    const payload = message.payload;

    try {
        const result = graphQlLib.execute(SCHEMA, payload.query, payload.variables);

        if (result.data instanceof com.enonic.lib.graphql.rx.Publisher) {
            const subscriber = graphQlRxLib.createSubscriber({
                onNext: (result) => {
                    webSocketLib.send(sessionId, JSON.stringify({
                        type: 'data',
                        id: graphlqlOperationId,
                        payload: result
                    }));
                }
            });
            Java.synchronized(() => graphQlSubscribers[sessionId] = subscriber, graphQlSubscribers)();
            result.data.subscribe(subscriber);
        }
    } catch (e) {
        log.error('Error while handling Start GraphQL-WS message', e);
        throw e;
    }
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
        body: graphQlLib.execute(SCHEMA, body.query, body.variables)
    };
};


exports.webSocketEvent = function (event) {
    switch (event.type) {
    case 'close':
        cancelSubscription(event.session.id);
        break;
    case 'message':
        var message = JSON.parse(event.message);
        switch (message.type) {
        case 'connection_init':
            webSocketLib.send(event.session.id, JSON.stringify({
                type: 'connection_ack'
            }));
            break;
        case 'start':
            handleStartMessage(event.session.id, message);
            break;
        case 'stop':
            cancelSubscription(event.session.id);
            break;
        }
        break;
    case 'error':
        log.warning('Session [' + event.session.id + '] error: ' + event.error);
        break;
    }
};


