const {
  buildSuccObject,
  buildErrObject,
  itemNotFound,
} = require("../middleware/utils");

const { Op, condition } = require("sequelize");
/**
 * Builds sorting
 * @param {string} sort - field to sort from
 * @param {number} order - order for query (1,-1)
 */
const buildSort = (sort, order) => {
  const sortBy = {};
  sortBy[sort] = order;
  return sortBy;
};

/**
 * Hack for mongoose-paginate, removes 'id' from results
 * @param {Object} result - result object
 */
const cleanPaginationID = (result) => {
  result.docs.map((element) => delete element.id);
  return result;
};

/**
 * Builds initial options for query
 * @param {Object} query - query object
 */
const listInitOptions = async (req) => {
  return new Promise((resolve) => {
    const order = req.query.order || -1;
    const sort = req.query.sort || "createdAt";
    const sortBy = buildSort(sort, order);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const options = {
      sort: sortBy,
      lean: true,
      page,
      limit,
    };
    resolve(options);
  });
};

/********************
 * CRUD functions *
 ********************/

module.exports = {
  /**
   * Gets item from database by id
   * @param {string} id - item id
   */
  async getItem(model, id, code = 404, error_msg = "ITEM NOT FOUND") {
    return new Promise((resolve, reject) => {
      model
        .findByPk(id)
        .then((data) =>
          data != "" && data != null
            ? resolve(data)
            : reject(buildErrObject(code, error_msg))
        )
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },

  /**
   * Gets item from database by query
   * @param {string} query - item query
   */
  async getItemAccQuery(model, query) {
    return new Promise((resolve, reject) => {
      model
        .findOne({ where: query })
        .then((data) => resolve(data))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },
  /**
   * Get items from database
   * Always send limit offset after converting in number
   */
  async getItemsAccQuery(model, query, limit, offset, order = ["id", "ASC"]) {
    return new Promise((resolve, reject) => {
      model
        .findAll({
          where: query,
          order: [order],
          offset: offset,
          limit: limit,
        })
        .then((data) => resolve(data))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },
  /**
   * Get items from database
   * Always send limit offset after converting in number
   */
  async getItemsAccQueryWidCount(
    model,
    query,
    limit,
    offset,
    order = ["id", "ASC"]
  ) {
    return new Promise((resolve, reject) => {
      model
        .findAndCountAll({
          where: query,
          order: [order],
          offset: offset,
          limit: limit,
        })
        .then((data) => resolve(data))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },
  /**
   * Creates a new item in database
   * @param {Object} req - request object
   */
  async createItem(model, data) {
    console.log("data", data);
    return new Promise((resolve, reject) => {
      model
        .create(data)
        .then((data) => resolve(data))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },

  /**
   * Updates an item in database by condition
   * @param {Object} updtae - request object
   */
  async updateItem(model, condition, update) {
    return new Promise((resolve, reject) => {
      model
        .update(update, { where: condition })
        .then((data) =>
          data[0]
            ? resolve("UPDATED")
            : resolve(data.updated ? "UPDATED" : "NOTHING CHANGED")
        )
        .catch((err, item) => itemNotFound(err, item, reject, "NOT_FOUND"));
    });
  },

  /**
   * Deletes items from database by query
   * @param {string} id - id of item
   */
  async deleteCustom(model, query) {
    return new Promise((resolve, reject) => {
      model
        .destroy({ where: query })
        .then((data) => (data ? resolve("DELETED") : resolve("NOT FOUND")))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },

  /**
   * Get item with include from database
   */
  async getItemWithInclude(model, query, include) {
    return new Promise((resolve, reject) => {
      model
        .findOne({ where: query, include: include })
        .then((data) => resolve(data))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },

  /**
   * Get items with include from database
   */
  async getItemsWithInclude(
    model,
    query,
    include,
    limit,
    offset,
    order = ["id", "ASC"]
  ) {
    return new Promise((resolve, reject) => {
      model
        .findAndCountAll({
          where: query,
          include: include,
          order: [order],
          offset: offset,
          limit: limit,
        })
        .then((data) => resolve(data))
        .catch((err) => reject(buildErrObject(422, err.message)));
    });
  },
};
