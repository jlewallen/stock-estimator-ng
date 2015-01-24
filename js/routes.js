(function() {
  'use strict';
  require("angular-route");

  var app = require("./wood-app");

  app.config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl : 'html/layout.html',
        controller  : 'layoutController'
      })
      .when('/cost', {
        templateUrl : 'html/cost.html',
        controller  : 'costController'
      });
  });
})();
