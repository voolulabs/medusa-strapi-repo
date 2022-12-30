'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-tag.product-tag', ({ strapi }) => ({
  async handleManyToManyRelation(product_tags) {
    const strapiProductTagsIds = [];

    try {
      for (const product_tag of product_tags) {
        product_tag.medusa_id = product_tag.id.toString();
        delete product_tag.id;

        const found = await strapi.services['api::product-tag.product-tag'].findOne({
          medusa_id: product_tag.medusa_id
        })

        if (found) {
  strapiProductTagsIds.push({ id: found.id });
  continue;
}

const create = await strapi.entityService.create('api::product-tag.product-tag', { data: product_tag });
strapiProductTagsIds.push({ id: create.id });
      }
    } catch (e) {
  strapi.log.error(JSON.stringify(e));
  throw new Error('Delegated creation failed');
}
return strapiProductTagsIds;
  },
  async findOne(params = {}) {
  const fields = ["id"]
  const filters = {
    ...params
  }
  return (await strapi.entityService.findMany('api::product-tag.product-tag', {
    fields, filters
  }))[0];
}
}));
