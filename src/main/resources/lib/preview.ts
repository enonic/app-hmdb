import type { Request, Response } from '@enonic-types/core';
import * as portal from '/lib/xp/portal';
import * as contentLib from '/lib/xp/content';
import * as thymeleaf from '/lib/thymeleaf';

function pickImageId(content: { _id: string } | null): string | null {
    if (!content) {
        return null;
    }
    const refs = contentLib.getOutboundDependencies({ key: content._id });
    if (!refs || refs.length === 0) {
        return null;
    }
    for (let i = 0; i < refs.length; i++) {
        const item = contentLib.get({ key: refs[i] });
        if (item && item.type === 'media:image') {
            return item._id;
        }
    }
    return null;
}

export function GET(_req: Request): Response {
    const content = portal.getContent();
    const imageId = pickImageId(content);
    const view = resolve('preview.html');
    const model = {
        cssUrl: portal.assetUrl({ path: 'styles.css' }),
        displayName: (content && content.displayName) || null,
        imageUrl: imageId ? portal.imageUrl({ id: imageId, scale: 'width(500)' }) : null,
    };
    return {
        body: thymeleaf.render(view, model),
    };
}
