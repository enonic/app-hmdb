const portal = require('/lib/xp/portal'); // Import the portal library
const thymeleaf = require('/lib/thymeleaf'); // Import the Thymeleaf library

const view = resolve('mypart.html');

exports.get = function(req) {

    const component = portal.getComponent().config;

    const imageUrl = component.myImage
        ? portal.imageUrl({
            id: component.myImage,
            scale: 'block(500,500)',
            filter: 'rounded(5)'
        })
        : undefined


    const model = {
        myText: component.myText,
        imageUrl,
        myHtml: component.myHtml,
    }

    const rendered = {
        body: thymeleaf.render(view, model)
    }

    return rendered
};
