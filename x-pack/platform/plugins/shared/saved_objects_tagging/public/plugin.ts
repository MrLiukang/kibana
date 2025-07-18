/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { CoreSetup, CoreStart, PluginInitializerContext, Plugin } from '@kbn/core/public';
import { ManagementSetup } from '@kbn/management-plugin/public';
import { SavedObjectTaggingOssPluginSetup } from '@kbn/saved-objects-tagging-oss-plugin/public';
import { tagManagementSectionId } from '../common/constants';
import { getTagsCapabilities } from '../common/capabilities';
import { SavedObjectTaggingPluginStart } from './types';
import { TagsClient, TagsCache, TagAssignmentService } from './services';
import { getUiApi } from './ui_api';
import { SavedObjectsTaggingClientConfig, SavedObjectsTaggingClientConfigRawType } from './config';

interface SetupDeps {
  management: ManagementSetup;
  savedObjectsTaggingOss: SavedObjectTaggingOssPluginSetup;
}

export class SavedObjectTaggingPlugin
  implements Plugin<{}, SavedObjectTaggingPluginStart, SetupDeps, {}>
{
  private tagClient?: TagsClient;
  private tagCache?: TagsCache;
  private assignmentService?: TagAssignmentService;
  private readonly config: SavedObjectsTaggingClientConfig;

  constructor(context: PluginInitializerContext) {
    this.config = new SavedObjectsTaggingClientConfig(
      context.config.get<SavedObjectsTaggingClientConfigRawType>()
    );
  }

  public setup(
    core: CoreSetup<{}, SavedObjectTaggingPluginStart>,
    { management, savedObjectsTaggingOss }: SetupDeps
  ) {
    const kibanaSection = management.sections.section.kibana;
    const title = i18n.translate('xpack.savedObjectsTagging.management.sectionLabel', {
      defaultMessage: 'Tags',
    });
    kibanaSection.registerApp({
      id: tagManagementSectionId,
      title,
      order: 1.5,
      mount: async (mountParams) => {
        const { mountSection } = await import('./management');
        return mountSection({
          tagClient: this.tagClient!,
          tagCache: this.tagCache!,
          assignmentService: this.assignmentService!,
          core,
          mountParams,
          title,
        });
      },
    });

    savedObjectsTaggingOss.registerTaggingApi(
      core.getStartServices().then(([_core, _deps, startContract]) => startContract)
    );

    return {};
  }

  public start({ http, application, analytics, ...startServices }: CoreStart) {
    this.tagCache = new TagsCache({
      refreshHandler: () => this.tagClient!.getAll({ asSystemRequest: true }),
      refreshInterval: this.config.cacheRefreshInterval,
    });
    this.tagClient = new TagsClient({ analytics, http, changeListener: this.tagCache });
    this.assignmentService = new TagAssignmentService({ http });

    // do not fetch tags on anonymous page
    if (!http.anonymousPaths.isAnonymous(window.location.pathname)) {
      // we don't need to wait for this to resolve.
      this.tagCache.initialize().catch(() => {
        // cache is resilient to initial load failure. We just need to catch to avoid unhandled promise rejection
      });
    }

    return {
      client: this.tagClient,
      cache: this.tagCache,
      ui: getUiApi({
        ...startServices,
        cache: this.tagCache,
        client: this.tagClient,
        capabilities: getTagsCapabilities(application.capabilities),
      }),
    };
  }

  public stop() {
    if (this.tagCache) {
      this.tagCache.stop();
    }
  }
}
