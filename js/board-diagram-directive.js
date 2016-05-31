/* global require: false */
(function() {
  'use strict';
  var _ = require("lodash");
  var app = require("./wood-app");

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

          if (_.isString(part.color)) {
            ctx.fillStyle = '#' + part.color;
          }
          else if (part.cutoff) {
            ctx.fillStyle = '#dfdfdf';
          }
          else if (part.raw) {
            ctx.fillStyle = '#afafaf';
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
          var longest = _.max(_.map(allBoards, 'length'));
          var widest = _.max(_.map(allBoards, 'width'));
          
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
})();
