/**
 * sass-loader
 *
 * @author : sunkeysun
 */
var sass = require('node-sass');

module.exports = function (data, file) {
    try {
        return sass.renderSync({ data: data, file: file }).css.toString('utf8');
    } catch (e) {
        console.log(e);
    }
};
