import * as contextLib from '/lib/xp/context';
import * as contentLib from '/lib/xp/content';
import * as clusterLib from '/lib/xp/cluster';
import * as exportLib from '/lib/xp/export';
import * as projectLib from '/lib/xp/project';
import * as taskLib from '/lib/xp/task';

const projectData = {
    id: 'hmdb',
    displayName: 'Headless Movie DB',
    description: 'Site enabled version of the Movie DB',
    language: 'en',
    readAccess: {
        public: true,
    },
};

function runInContext<T>(callback: () => T): T | undefined {
    try {
        return contextLib.run({
            principals: ['role:system.admin'],
            repository: 'com.enonic.cms.' + projectData.id,
            branch: 'draft',
        }, callback);
    } catch (e) {
        log.info('Error: ' + (e as Error).message);
    }
    return undefined;
}

function createProject() {
    return projectLib.create(projectData);
}

function getProject() {
    return projectLib.get({ id: projectData.id });
}

function createContent(): void {
    const importResult = exportLib.importNodes({
        source: resolve('/import'),
        targetNodePath: '/content',
        xslt: resolve('/import/replace_app.xsl'),
        xsltParams: {
            applicationId: app.name,
        },
        includeNodeIds: true,
    });
    if (importResult.importErrors.length > 0) {
        log.warning('Errors:');
        importResult.importErrors.forEach(element => log.warning(element.message));
        log.info('-------------------');
    }
}

function publishRoot(): void {
    const result = contentLib.publish({
        keys: ['/hmdb'],
        includeChildren: true,
        includeDependencies: true,
    });
    if (!result || (result.failedContents && result.failedContents.length > 0)) {
        log.warning('Could not publish imported content. failed=' + JSON.stringify(result && result.failedContents));
    } else {
        log.info('Published ' + (result.pushedContents ? result.pushedContents.length : 0) + ' content items.');
    }
}

function initProject(): void {
    runInContext(() => {
        const project = createProject();
        if (project) {
            log.info('Project "' + projectData.id + '" successfully created');
            createContent();
            publishRoot();
        } else {
            log.error('Project "' + projectData.id + '" creation failed');
        }
    });
}

function initialize(): void {
    runInContext(() => {
        const project = getProject();
        if (!project) {
            taskLib.executeFunction({
                description: 'Importing content',
                func: initProject,
            });
        } else {
            log.debug(`Project ${project.id} exists, skipping import`);
        }
    });
}

if (clusterLib.isLeader()) {
    initialize();
}
