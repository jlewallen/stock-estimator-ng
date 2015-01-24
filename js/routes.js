(function() {
  'use strict';
  require("angular-route");

  var app = require("./wood-app");

  app.config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl : 'layout.html',
        controller  : 'layoutController'
      })
      .when('/cost', {
        templateUrl : 'cost.html',
        controller  : 'costController'
      });
  });
})();
