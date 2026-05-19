import type { Request, Response } from '@enonic-types/core';
import * as portal from '/lib/xp/portal';
import * as contentLib from '/lib/xp/content';

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

export function GET(req: Request): Response {
    const title = 'Headless Movie Database';
    const heading = 'Welcome to the Headless Movie Database';
    const info = 'Tip: This preview was created by the file: /src/main/resources/lib/info.ts';
    const cssUrl = portal.assetUrl({ path: 'styles.css' });
    const content = portal.getContent();
    const imageId = content ? pickImageId(content) : null;
    const bannerUrl = imageId ? portal.imageUrl({ id: imageId, scale: 'width(500)' }) : null;
    const branch = req.branch;
    const mode = req.mode;

    const standard = `
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="${cssUrl}"/>
      </head>
      <body>
          <h1>${heading}</h1>
          <h3>You are now accessing the "${branch}" branch in "${mode}" mode</h3>
          ${bannerUrl ? `<img class="banner" src="${bannerUrl}"/>` : ''}
          <p>${info}</p>
        </body>
    </html>
    `;

    return {
        body: standard,
    };
}
