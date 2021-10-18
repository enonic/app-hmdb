const portal = require('/lib/xp/portal'); // Import the portal library
const thymeleaf = require('/lib/thymeleaf'); // Import the Thymeleaf library

const view = resolve('default.html');

exports.get = function(req) {
    const content = portal.getContent();

    const model = {
        displayName: content.displayName,
        mainRegion: content.page.regions.main
    }

    return {
        body: thymeleaf.render(view, model)
    }
};
