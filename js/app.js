/* global angular: false, require: false */
(function() {
  'use strict';
  require("angular");

  var _ = require("lodash");
  var Planner = require("./planner");
  var app = require("./wood-app");
  var colors = require("./colors");

  require("./board-diagram-directive");
  require("./routes");

  app.controller('costController', function($scope) {
    var board = $scope.board = {
      length: 8 * 12,
      width: 12,
      thickness: 0.75,
      pricePerBoard: 37,
      pricePerBoardFoot: 0
    };
    
    $scope.boardFeet = function() {
      return Math.round(board.thickness) * board.width * board.length / 144;
    };
    
    $scope.pricePerBoardFootChanges = function() {
      board.pricePerBoard = $scope.boardFeet() * board.pricePerBoardFoot;
      lastApproach = $scope.pricePerBoardFootChanges;
    };
    
    $scope.pricePerBoardChanges = function() {
      board.pricePerBoardFoot = board.pricePerBoard / $scope.boardFeet();
      lastApproach = $scope.pricePerBoardChanges;
    };
    
    var lastApproach = $scope.pricePerBoardChanges;

    $scope.refresh = function() {
      if (lastApproach) {
        lastApproach();
      }
    };
    
    lastApproach();
  });

  app.controller('layoutController', function($scope) {
    var frameSaw = [
      { quantity: 2, thickness: 1.625, width: 1.375, length: 66, name: "" },
      { quantity: 2, thickness: 1.625, width: 3, length: 24, name: "" },
    ];
    var makeHavenBench = [
      { quantity: 6, thickness: 1.0, width: 4.0, length: 62, name: "Slats" },
      { quantity: 6, thickness: 1.0, width: 4.0, length: 18, name: "Legs" },
      { quantity: 6, thickness: 1.0, width: 4.0, length: 18, name: "Rails" },
    ];
    var dutchChest = [
      { quantity: 2, thickness: 0.75, width: 11.25, length: 30.125, name: "Sides" },
      { quantity: 1, thickness: 0.75, width: 11.25, length: 27, name: "Bottom" },
      { quantity: 2, thickness: 0.75, width: 11.25, length: 26, name: "Shelves" },
      { quantity: 1, thickness: 0.75, width: 7, length: 27, name: "Front" },
      { quantity: 1, thickness: 0.75, width: 1.5, length: 27, name: "Bottom Lip" },
      // { quantity: 1, thickness: 0.75, width: 15.5, length: 28.375, name: "Lid" },
      { quantity: 1, thickness: 0.75, width: 15.5, length: 24.375, name: "Lid" },
      { quantity: 2, thickness: 0.75, width: 2.0, length: 15.5, name: "Breadboard Ends" },
      { quantity: 2, thickness: 0.75, width: 1.25, length: 12, name: "Skids" },
      { quantity: 1, thickness: 0.75, width: 30.5, length: 27, name: "Back" },
      { quantity: 1, thickness: 0.75, width: 15, length: 27, name: "Fall-front" },
      { quantity: 2, thickness: 0.5, width: 1.5, length: 15, name: "Panel Battens" },
      { quantity: 4, thickness: 0.75, width: 0.75, length: 4, name: "Catches" },
      { quantity: 2, thickness: 0.5, width: 2, length: 23.125, name: "Locks" }
    ];
    var helper = [
      { quantity: 7, thickness: 0.75, width: 2, length: 15, name: "Runners" },
      { quantity: 4, thickness: 0.75, width: 2, length: 34, name: "Legs" },
      { quantity: 2, thickness: 0.75, width: 2, length: 8.5, name: "Legs" },
      { quantity: 4, thickness: 0.75, width: 2, length: 7, name: "Runners" },
      { quantity: 2, thickness: 0.75, width: 2, length: 13, name: "Runnere" },
      { quantity: 2, thickness: 0.75, width: 10, length: 15, name: "Steps" }
    ];
    $scope.cutLists = [
      { name: 'Dutch Tool Chest', necessary: dutchChest },
      { name: 'Frame Saw', necessary: frameSaw },
      { name: 'Make Haven Bench', necessary: makeHavenBench },
      { name: 'Helper', necessary: helper }
    ];

    $scope.stockSets = [
      { name: 'Hardwood', available: [
        { exclude: false, thickness: 0.750, width: 11.25, length: 12 * 8 },
        { exclude: false, thickness: 0.750, width: 11.25, length: 12 * 6 },
        { exclude: false, thickness: 0.500, width: 4,     length: 36 },
        { exclude: false, thickness: 0.750, width: 6,     length: 12 * 8 },
        { exclude: false, thickness: 1.625, width: 6,     length: 12 * 8 }
      ]},
      { name: '8ft Dimensional', available: [
        { thickness: 1.0, width: 4, length: 12 * 8 }
      ]},
      { name: '10ft Dimensional', available: [
        { thickness: 1.0, width: 4, length: 12 * 10 }
      ]},
      { name: 'Construction', available: [
        { thickness: 1.75, width: 12, length: 12 * 16 },
        { thickness: 1.75, width: 12, length: 12 * 10 },
        { thickness: 1.75, width: 12, length: 12 * 8 },
        { thickness: 1.75, width: 10, length: 12 * 8 },
        { thickness: 1.75, width:  8, length: 12 * 8 },
        { thickness: 1.75, width:  6, length: 12 * 8 },
        { thickness: 1.75, width:  4, length: 12 * 8 }
      ]}
    ];

    $scope.available = [];
    $scope.chooseStockSet = function(set) {
      $scope.available = set.available;
    };

    $scope.chooseCutList = function(cutList) {
      $scope.necessary = colors(cutList.necessary);
    };
    
    $scope.chooseStockSet($scope.stockSets[0]);
    $scope.chooseCutList($scope.cutLists[0]);

    function isValidBoard(board) {
      if (_.isUndefined(board.width) || _.isUndefined(board.thickness) || _.isUndefined(board.length)) {
        return false;
      }
      if (board.exclude === true) {
        return false;
      }
      return board.width > 0 && board.length > 0 && board.thickness > 0;
    }
    
    function getBoardKey(board) {
      return board.thickness + "x" + board.width + "x" + board.length;
    }

    $scope.ensureEmptyRow = function(collection) {
      if (_.every(collection, isValidBoard)) {
        collection.push({});
      }
    };
    
    $scope.removeRow = function(collection, item) {
      _.pull(collection, item);
      $scope.ensureEmptyRow(collection);
    };

    $scope.hoveringOver = function(hovering) {
      _.each($scope.necessary, function(board) {
        board.hovering = false;
      });
      _.each(hovering, function(hoveredBoard) {
        hoveredBoard.parent.hovering = true;
      });
    };
    
    $scope.$watch("[necessary, available]", function() {
      if (_.isEmpty($scope.available) || _.isEmpty($scope.necessary)) {
        console.log("incomplete");
        return;
      }

      var planner = new Planner();
      var mostEfficient = planner.calculateForAllAvailableAndPickBest($scope.stockSets, _.filter($scope.necessary, isValidBoard));
      var plan = planner.calculate(_.filter($scope.available, isValidBoard), _.filter($scope.necessary, isValidBoard));
      var buy = plan.buy;

      var purchase = _.map(_.groupBy(buy, function(board) {
        return getBoardKey(board.template);
      }), function(k, v) {
        var template = angular.copy(k[0].template);
        return _.extend({
          quantity: k.length,
          feet: k.length * (template.length / 12),
          bdft: k.length * (Math.ceil(template.thickness) * template.width * template.length / 144)
        }, template);
      });

      $scope.plan = plan;
      $scope.settings = planner.settings;
      $scope.buy = buy;
      $scope.purchase = purchase;
      $scope.diag = { purchase: purchase };
      
      $scope.ensureEmptyRow($scope.necessary);
      $scope.ensureEmptyRow($scope.available);
    }, true);
  });
})();
