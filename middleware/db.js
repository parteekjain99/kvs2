const {
  buildErrObject
} = require("../middleware/utils");

const {
  getItem,
  getItemAccQuery,
  createItem,
  updateItem,
  deleteCustom,
  getItems,
  getItemWithInclude,
  getItemsWithInclude
} = require('../shared/core')

const { convertToObjectIds } = require('../shared/helpers')
var mongoose = require("mongoose");

module.exports = {

  async getProfile(data) {
    return new Promise(async (resolve, reject) => {
      let result = await model.User.findOne({
        where: {
          id: data.user_id,
        },
        
      });
      
      // result = await JSON.parse(JSON.stringify(result));
      // result.phone_no = {
      //   number: result.number,
      //   internationalNumber: result.internationalNumber,
      //   nationalNumber: result.nationalNumber,
      //   countryCode: result.countryCode,
      //   dialCode: result.dialCode,
      //   e164Number: result.e164Number,
      // };
      resolve(result);
    });
  },



  async subscriptionPlanDetail(model, plan_id) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await model.findOne({
          where: {
            id: plan_id,
          },
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  },


  // async editProfile(model, data) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       if (data.phone_no) {
  //         data.phone_no = data.phone_no
         
  //       }
  //       // if (data.country) {
  //       //   data.country = JSON.parse(JSON.stringify(data.country))
  //       // }
  //       // if (data.state) {
  //       //   data.state = JSON.parse(JSON.stringify(data.state))
  //       // }
  //       // if (data.city) {
  //       //   data.city = JSON.parse(JSON.stringify(data.city))
  //       // }
  //       const update = await model.update(data, {
  //         where: {
  //           id: data.userId,
  //         },
  //       });
  //       console.log('update---->', update);
  //       const result = await model.findByPk(data.user_id)
  //       resolve(result);
  //     } catch (e) {
  //       reject(e); // throw e ;  is same
  //     }
  //   });
  // },

  async test(collection, data) {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await getItemCustom(collection,
          { type: data.type },
          'content title updatedAt'
        );
        resolve(item)
      } catch (error) {
        reject(buildErrObject(422, error.message));
      }
    })
  },


};
