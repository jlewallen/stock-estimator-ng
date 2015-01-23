/* global angular */
require("angular");
require("angular-route");

var _ = require("lodash");

function Planner() {
  var self = this;
  
  self.cutoffs = [];
  self.buy = [];
  self.settings = {
    kerf: 0.125 * 2
  };

  function sortLargestToSmallest(collection) {
    collection.sort(function(a, b) {
      if (a.width == b.width)
        return b.length - a.length;
      return b.width - a.width;
    });
    return collection;  
  }
  
  function sortSmallestToLargest(collection) {
    collection.sort(function(a, b) {
      if (a.width == b.width)
        return a.length - b.length;
      return a.width - b.width;
    });
    return collection;  
  }

  function getAvailablePanelStockFor(needed) {
    return _.first(_.where(self.available, function(availStock) {
      return availStock.thickness == needed.thickness && 
             availStock.width <= needed.width;
    }));
  }
  
  function getAvailableSourceStockFor(needed) {
    return _.first(_.where(self.available, function(availStock) {
      return availStock.thickness == needed.thickness && 
            (availStock.width >= needed.width || availStock.width === 0) && 
            (availStock.length >= needed.length);
    }));
  }
  
  function findCutoffFor(required) {
    return _.first(_.where(self.cutoffs, function(cutoff) {
      return cutoff.thickness === required.thickness && cutoff.width >= required.width && cutoff.length >= required.length;
    }));
  }
  
  function isPanel(needed) {
    return !_.any(self.available, function(availStock) {
      return needed.width <= availStock.width;
    });
  }

  function layoutStock(needed, parent) {
    var sourceStock = findCutoffFor(needed);
    if (_.isUndefined(sourceStock)) {
      var availStock = getAvailableSourceStockFor(needed);
      if (_.isUndefined(availStock)) {
        needed.unavailable = true;
        console.log(needed);
        return;
      }
      needed.unavailable = false;
      sourceStock = _.extend({
          yields: [],
          left: 0,
          top: 0,
          raw: true,
          template: availStock
        }, angular.copy(availStock));
      self.buy.push(sourceStock);
    }
    else {
      needed.unavailable = false;
      self.cutoffs = _.pull(self.cutoffs, sourceStock);
    }
    
    sourceStock.yields.push(_.extend({
      left: sourceStock.left, 
      top: sourceStock.top, 
      parent: parent
    }, needed));
    
    var currentCutoffs = [];
    
    if (needed.length < sourceStock.length) {
      currentCutoffs.push({  
        left: sourceStock.left,
        top: sourceStock.top + needed.length + self.settings.kerf,
        thickness: needed.thickness,
        width: sourceStock.width,
        length: sourceStock.length - needed.length - self.settings.kerf,
        cutoff: true,
        yields: []
      })
    }
    
    if (needed.width < sourceStock.width) {
      currentCutoffs.push({  
        left: sourceStock.left + needed.width + self.settings.kerf,
        top: sourceStock.top,
        thickness: needed.thickness,
        width: sourceStock.width - needed.width - self.settings.kerf,
        length: needed.length,
        cutoff: true,
        yields: []
      })
    }
    if (_.any(currentCutoffs)) {
      self.cutoffs = sortSmallestToLargest(self.cutoffs.concat(currentCutoffs));
      sourceStock.yields = sourceStock.yields.concat(currentCutoffs);
    }
  }
  
  function flattenYields(board) {
    var yields = [];
    var queue = angular.copy(board.yields);
    while (queue.length > 0) 
    {
      var item = queue.pop();
      if (_.isArray(item.yields)) {
        queue = queue.concat(item.yields);
      }
      yields.push(item);
    }
    return yields;
  }
  
  function boardVolume(board) {
    return Math.ceil(board.thickness) * board.width * board.length;
  }
  
  function calculateBoardEfficiency(board) {
    var yields = _.where(flattenYields(board), function(board) { return !board.cutoff; });
    var usedVolume = _.reduce(_.map(yields, boardVolume), function(sum, num) { return sum + num; }, 0);
    var totalVolume = boardVolume(board);

    console.log(totalVolume, usedVolume);
    return _.extend({ 
      totalVolume: totalVolume,
      usedVolume: usedVolume,
      efficiency: usedVolume / totalVolume * 100
    }, board);
  }
  
  this.calculate = function(available, necessary) {
    self.cutoffs = [];
    self.buy = [];
    self.available = _.sortBy(available, 'width').reverse();

    console.log("Calc");

    var necessaryByWidthAndLength = sortLargestToSmallest(_.clone(necessary));
    while (_.any(necessaryByWidthAndLength)) {
      var needed = necessaryByWidthAndLength.shift();
      for (var i = 0; i < needed.quantity; ++i) {
        if (isPanel(needed)) {
          var sourceStock = getAvailablePanelStockFor(needed);
          var pieces = Math.ceil(needed.width / sourceStock.width);
          for (var piece = 0; piece < pieces; ++piece) {
            var panelPart = { 
              thickness: needed.thickness, 
              width: sourceStock.width, 
              length: needed.length,
              panel: true,
              panelWidth: needed.width
            };
            layoutStock(panelPart, needed);
          }
        }
        else {
          layoutStock(needed, needed);
        }
      }
    }

    return _.map(self.buy, calculateBoardEfficiency);
  };
  
  return self;  
}

var app = angular.module('plunker', ['ngRoute']);

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

app.directive('boardDiagram', function() {
  return {
    template: "<canvas width='64px' height='512px'></canvas>",
    scope: true,
    link: function($scope, el, attrs) {
      var canvas = el.find("canvas");
      var ctx = canvas[0].getContext("2d");
      var rectangles = [];
      var toX;
      var toY;
        
      function find(x, y) {
        return _.filter(rectangles, function(rect) {
          return x >= rect.x && y >= rect.y && (x < (rect.x + rect.w)) && (y < (rect.y + rect.h));
        });
      }
      
      function draw(part) {
        var x = toX(part.left);
        var y = toY(part.top);
        var w = toX(part.width);
        var h = toY(part.length);

        if (part.cutoff) {
          ctx.fillStyle = '#ddeeee';
        }
        else if (part.raw) {
          ctx.fillStyle = '#cecece';
        }
        else if (part.panel) {
          ctx.fillStyle = '#dd20f6';
        }
        else {
          ctx.fillStyle = '#ad21f6';
        }

        rectangles.push({ x: x, y: y, w: w, h: h, part: part });
        
        ctx.fillRect(x, y, w, h);
        
        _.each(part.yields, function(yielded) {
          draw(yielded);
        });
      }

      canvas.bind('mousemove', function(e) {
        $scope.$apply(function() {
          $scope.hovering = _.map(_.filter(find(e.offsetX, e.offsetY), function(rect) {
            return !rect.part.raw && !rect.part.cutoff;
          }), function(rect) {
            return rect.part;
          });
          $scope.hoveringOver($scope.hovering);
        });
      });

      $scope.$watch(attrs.allBoards, function() {
        var allBoards = $scope.$eval(attrs.allBoards);
        var longest = _.max(_.pluck(allBoards, 'length'));
        var widest = _.max(_.pluck(allBoards, 'width'));
        
        var board = $scope.$eval(attrs.boardDiagram);
        var maxX = 64.0;
        var maxY = 512.0;
  
        rectangles = [];
        toX = function(inc) {
          return inc * maxX / widest;
        };
        toY = function(inc) {
          return inc * maxY / longest;
        };
        
        draw(board);
      });
    }
  };
});

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
  }
  
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
  
  $scope.necessary = dutchChest;
  // $scope.necessary = frameSaw;
  
  $scope.available = [
    { thickness: 0.75, width: 11.25, length: 96 },
    { thickness: 0.5, width: 4, length: 36 },
    { thickness: 1.625, width: 6, length: 96 }
  ];
  
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
  }

  $scope.hoveringOver = function(hovering) {
    _.each($scope.necessary, function(board) {
      board.hovering = false;
    });
    _.each(hovering, function(hoveredBoard) {
      hoveredBoard.parent.hovering = true;
    });
  };
  
  $scope.$watch("[necessary, available]", function() {
    var planner = new Planner();
    var buy = planner.calculate(_.where($scope.available, isValidBoard), _.where($scope.necessary, isValidBoard));
    
    console.log(buy);
    var purchase = _.map(_.groupBy(buy, function(board) {
      return getBoardKey(board.template);
    }), function(k, v) {
      var template = angular.copy(k[0].template)
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
