/* global angular: false, require: false */
(function() {
  'use strict';
  require("angular");

  var _ = require("lodash");
  var Planner = require("./planner");
  var app = require("./wood-app");

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
      { quantity: 2, thickness: 1.625, width: 1.375, length: 66 },
      { quantity: 2, thickness: 1.625, width: 3, length: 24 },
    ];
    var dutchChest = [
      { quantity: 2, thickness: 0.75, width: 11.25, length: 30.125 },
      { quantity: 1, thickness: 0.75, width: 11.25, length: 27 },
      { quantity: 2, thickness: 0.75, width: 11.25, length: 26 },
      { quantity: 1, thickness: 0.75, width: 7, length: 27 },
      { quantity: 1, thickness: 0.75, width: 1.5, length: 27 },
      { quantity: 1, thickness: 0.75, width: 15.5, length: 28.375 },
      { quantity: 2, thickness: 0.75, width: 1.25, length: 12 },
      { quantity: 1, thickness: 0.75, width: 30.5, length: 27 },
      { quantity: 1, thickness: 0.75, width: 15, length: 27 },
      { quantity: 2, thickness: 0.5, width: 1.5, length: 15 },
      { quantity: 4, thickness: 0.75, width: 0.75, length: 4 },
      { quantity: 2, thickness: 0.5, width: 2, length: 23.125 }
    ];
    $scope.cutLists = [
      { name: 'Dutch Tool Chest', necessary: dutchChest },
      { name: 'Frame Saw', necessary: frameSaw }
    ];

    $scope.stockSets = [
      { name: 'Home Depot - Construction', available: [
        { thickness: 0.75, width: 11.25, length: 96 },
        { thickness: 0.5, width: 4, length: 36 }
      ]},
      { name: 'Hardwood Dealer', available: [
    { thickness: 1.625, width: 6, length: 96 }
      ]}
    ];

    $scope.available = [];
    $scope.chooseStockSet = function(set) {
      $scope.available = set.available;
    };

    $scope.chooseCutList = function(cutList) {
      $scope.necessary = cutList.necessary;
    };
    
    function isValidBoard(board) {
      if (_.isUndefined(board.width) || _.isUndefined(board.thickness) || _.isUndefined(board.length)) {
        return false;
      }
      return board.width > 0 && board.length > 0 && board.thickness > 0;
    }
    
    function getBoardKey(board) {
      return board.thickness + "x" + board.width + "x" + board.length;
    }

    $scope.ensureEmptyRow = function(collection) {
      if (_.all(collection, isValidBoard)) {
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
      var buy = planner.calculate(_.where($scope.available, isValidBoard), _.where($scope.necessary, isValidBoard));
      
      console.log(buy);
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
      
      $scope.settings = planner.settings;
      $scope.buy = buy;
      $scope.purchase = purchase;
      $scope.diag = { purchase: purchase };
      
      $scope.ensureEmptyRow($scope.necessary);
      $scope.ensureEmptyRow($scope.available);
    }, true);
  });
})();
