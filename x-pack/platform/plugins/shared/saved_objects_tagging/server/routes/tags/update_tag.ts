/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { TagValidationError } from '../../services/tags';
import type { TagsPluginRouter } from '../../types';

export const registerUpdateTagRoute = (router: TagsPluginRouter) => {
  router.post(
    {
      path: '/api/saved_objects_tagging/tags/{id}',
      security: {
        authz: {
          enabled: false,
          reason:
            'This route is opted out from authorization because the tags client internals leverages the SO client',
        },
      },
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          name: schema.string(),
          description: schema.string(),
          color: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (ctx, req, res) => {
      const { id } = req.params;
      try {
        const { tagsClient } = await ctx.tags;

        const existingTag = await tagsClient.findByName(req.body.name, { exact: true });
        if (existingTag && existingTag.id !== id) {
          return res.conflict({
            body: `A tag with the name "${req.body.name}" already exists.`,
          });
        }

        const tag = await tagsClient.update(id, req.body);
        return res.ok({
          body: {
            tag,
          },
        });
      } catch (e) {
        if (e instanceof TagValidationError) {
          return res.badRequest({
            body: {
              message: e.message,
              attributes: e.validation,
            },
          });
        }
        throw e;
      }
    })
  );
};
