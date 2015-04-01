/* global require: false, module: false */
(function() {
  'use strict';
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
          // console.log(needed);
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
        });
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
        });
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

      // console.log(totalVolume, usedVolume);
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

      // console.log("Calc");

      var necessaryByWidthAndLength = sortLargestToSmallest(_.clone(necessary));
      while (_.any(necessaryByWidthAndLength)) {
        var needed = necessaryByWidthAndLength.shift();
        for (var i = 0; i < needed.quantity; ++i) {
          if (isPanel(needed)) {
            var sourceStock = getAvailablePanelStockFor(needed);
            if (!_.isUndefined(sourceStock)) {
              var pieces = Math.ceil(needed.width / sourceStock.width);
              var widthRemaining = needed.width;
              for (var piece = 0; piece < pieces; ++piece) {
                var panelPart = { 
                  thickness: needed.thickness, 
                  width: Math.min(sourceStock.width, widthRemaining), 
                  length: needed.length,
                  panel: true,
                  panelWidth: needed.width,
                  color: needed.color
                };
                layoutStock(panelPart, needed);
                widthRemaining -= sourceStock.width;
              }
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

  module.exports = Planner;
})();
