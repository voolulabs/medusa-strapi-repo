"use strict";

/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
async function createOrUpdateRegionAfterDelegation(
  region,
  strapi,
  action = "create"
) {
  const {
    currency,
    countries,
    payment_providers,
    fulfillment_providers,
    ...payload
  } = region;

  if (currency) {
    payload.currency = await strapi
      .service("api::currency.currency")
      .handleManyToOneRelation(currency);
  }

  if (countries && countries.length) {
    payload.countries = await strapi
      .service("api::country.country")
      .handleOneToManyRelation(countries, "region");
  }

  if (payment_providers && payment_providers.length) {
    payload.payment_providers = await strapi
      .service("api::payment-provider.payment-provider")
      .handleManyToManyRelation(payment_providers, "region");
  }

  if (fulfillment_providers && fulfillment_providers.length) {
    payload.fulfillment_providers = await strapi
      .service("api::fulfillment-provider.fulfillment-provider")
      .handleManyToManyRelation(fulfillment_providers, "region");
  }

  if (action === "update") {
    const exists = await strapi.services["api::region.region"].findOne({
      medusa_id: region.medusa_id,
    });
    const update = await strapi.services["api::region.region"].update(
      exists.id,
      payload
    );
    console.log(update);
    return update.id;
  }

  const create = await strapi.entityService.create("api::region.region", {
    data: payload,
  });
  return create.id;
}

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::region.region", ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug("Syncing Region....");
    try {
      if (data && data.length) {
        for (const region of data) {
          region.medusa_id = region.id.toString();
          delete region.id;

          const found = await strapi.services["api::region.region"].findOne({
            medusa_id: region.medusa_id,
          });
          if (found) {
            continue;
          }

          const regionStrapiId = await createOrUpdateRegionAfterDelegation(
            region,
            strapi
          );
          if (regionStrapiId) {
            strapi.log.info("Region created");
          }
        }
      }
      strapi.log.info("Regions synced");
      return true;
    } catch (e) {
      strapi.log.error(JSON.stringify(e));
      return false;
    }
  },

  // Many "X" to One "region"
  async handleManyToOneRelation(region, caller) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      const found = await strapi.services["api::region.region"].findOne({
        medusa_id: region.medusa_id,
      });
      if (found) {
        return found.id;
      }

      return await createOrUpdateRegionAfterDelegation(region, strapi);
    } catch (e) {
      strapi.log.error(JSON.stringify(e));
      throw new Error("Delegated creation failed");
    }
  },

  async updateWithRelations(region) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      return await createOrUpdateRegionAfterDelegation(
        region,
        strapi,
        "update"
      );
    } catch (e) {
      console.log("Some error occurred while updating region \n", e);
      return false;
    }
  },

  async createWithRelations(region) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      return await createOrUpdateRegionAfterDelegation(region, strapi);
    } catch (e) {
      console.log("Some error occurred while creating region \n", e);
      return false;
    }
  },
  async findOne(params = {}) {
    const fields = ["id"];
    const filters = {
      ...params,
    };
    return (
      await strapi.entityService.findMany("api::region.region", {
        fields,
        filters,
      })
    )[0];
  },
}));
