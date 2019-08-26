'use strict';

module.exports = {
  /**
   * 参数验证
   *
   * @param {Object} rule    - 规则
   * @param {Object} params  - 参数
   * @return {Boolean} 验证结果
   */
  async verify(rule, params) {
    const result = await this.validate(rule, params).catch(error => {
      throw error;
    });
    return result;
  },
};
