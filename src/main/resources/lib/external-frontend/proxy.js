const frontendOrigin = require('./connection-config').frontendOrigin       // "http://localhost:3000"

const draftPathPrefix = require('./connection-config').draftPathPrefix     // _draft
const masterPathPrefix = require('./connection-config').masterPathPrefix   // _master

const loopbackCheckParam = 'fromXp';

const prefix = {
    draft: draftPathPrefix,
    master: masterPathPrefix,
}


// This proxies requests made directly to XP to the frontend. Normally this will
// only be used in the portal-admin content studio previews
const proxy = function(req) {

    const isLoopback = req.params[loopbackCheckParam];
    if (isLoopback) {
        log.info(`Loopback to XP detected from path ${req.rawPath}`);
        return {
            contentType: 'text/html',
            body: `<div>Error: request to frontend looped back to XP</div>`,
            status: 200,
        };
    }

    const pathStartIndex = req.rawPath.indexOf(req.branch) + req.branch.length;

    // remove the paths of the raw path up until (and including) the branch name.
    //
    // for instance:
    // "/admin/site/inline/hmdb/draft/hmdb/persons/john-travolta"
    // becomes "/hmdb/persons/john-travolta".
    //
    // this way, we can more easily query for it with Guillotine
    const contentPath = req.rawPath.slice(pathStartIndex)

    const frontendUrl = `${frontendOrigin}/${prefix[req.branch]}${contentPath}?${loopbackCheckParam}=true`;
    return {
        contentType: 'text/html',
        body: `<iframe src="${frontendUrl}" title="Externally rendered page: ${contentPath} (branch: ${req.branch})" style="margin:0; padding:0; border:0; width:100%; height:100%; overflow:auto;"></iframe>`
    };
};

exports.get = proxy;
exports.handleError = proxy;
