var ColorScheme = require('./color-scheme.min');
var _ = require("lodash");

var scm = new ColorScheme();
scm.from_hue(0)
  .from_hex('dd88dd')
  .scheme('analogic')
  .distance(0.20)
  .add_complement(false)
  .variation('default')
  .web_safe(false);

var colors = scm.colors();
var i = 0;
var assignColor = function(item) {
  if (_.isArray(item)) {
    _(item).each(assignColor);
  }
  else if (_.isObject(item)) {
    if (!_.isString(item.color)) {
      item.color = colors[i++ % colors.length];
    }
  }
  return item;
};

module.exports = assignColor;
