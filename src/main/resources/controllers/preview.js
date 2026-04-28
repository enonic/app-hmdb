const portal = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const thymeleaf = require('/lib/thymeleaf');

function pickImageId(content) {
    const refs = contentLib.getOutboundDependencies({key: content._id});
    if (!refs || refs.length === 0) {
        return null;
    }
    for (let i = 0; i < refs.length; i++) {
        const item = contentLib.get({key: refs[i]});
        if (item && item.type === 'media:image') {
            return item._id;
        }
    }
    return null;
}

exports.GET = function (req) {
    const content = portal.getContent();
    const imageId = pickImageId(content);
    const view = resolve('preview.html');
    const model = {
        cssUrl: portal.assetUrl({path: 'styles.css'}),
        displayName: content.displayName || null,
        imageUrl: imageId ? portal.imageUrl({id: imageId, scale: 'width(500)'}) : null
    };
    return {
        body: thymeleaf.render(view, model)
    };
};
