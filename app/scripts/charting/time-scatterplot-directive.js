(function () {
    'use strict';

    // Define object config of properties for this chart directive
    var TimeScatterPlotDefaults = {
        plotWidth: 800,
        plotHeight: 400,
        xDefault: 'eui',
        yDefault: 'emissions',
        prevLabel: 2012,
        currLabel: 2013,
        prevColor: '#33CCFF',
        currColor: '#CC3366',
        prevRadius: 6,
        currRadius: 6,
        lazyLoad: true,
        transitionMillis: 500
    };

    /**
     * ngInject
     */
    function timeScatterPlot (CartoConfig, TimeScatterPlotDefaults) {

        var PLOT_CLASS = 'mos-time-scatterchart';

        // Private vars
        var svg = null;

        // Begin directive module definition
        var module = {};

        module.restrict = 'EA';
        module.templateUrl = 'scripts/charting/time-scatterplot-partial.html';

        module.controller = 'ChartingController';

        module.scope = {
            data: '=',              // Required
            id: '@',                // Required
            plotWidth: '@',
            plotHeight: '@',

            xSeries: '=?',
            ySeries: '=?',
            prevLabel: '@',
            currLabel: '@',
            prevColor: '@',
            currColor: '@',
            prevRadius: '@',
            currRadius: '@',
            lazyLoad: '@',
            transitionMillis: '@'
        };

        module.link = function ($scope, element, attrs) {

            // Setup public ($scope) and private variables
            $scope.configure(TimeScatterPlotDefaults);
            var config = $scope.config;
            var margins = config.margin;
            var width = config.plotWidth - margins.right - margins.left;
            var height = config.plotHeight - margins.top - margins.bottom;

            $scope.selectOptions = _.omit(CartoConfig.labels, 'squarefeet');
            $scope.selected = {};
            var dimensions = _.keys($scope.selectOptions);
            $scope.selected.x = config.xDefault;
            $scope.selected.y = config.yDefault;

            var xAttr = $scope.selected.x;
            var yAttr = $scope.selected.y;
            var xIndex = dimensions.indexOf(xAttr);
            var yIndex = dimensions.indexOf(yAttr);
            var x = null;
            var y = null;
            var xAxis = null;
            var yAxis = null;
            var tip = null;

            initializeChart();

            // $scope

            $scope.selectedXChanged = function (xkey) {
                $scope.selected.x = xkey;
                xAttr = $scope.selected.x;
                xIndex = dimensions.indexOf(xAttr);
                refreshData();
            };

            $scope.selectedYChanged = function (ykey) {
                $scope.selected.y = ykey;
                yAttr = $scope.selected.y;
                yIndex = dimensions.indexOf(yAttr);
                refreshData();
            };

            // Overridden ChartingController method
            $scope.plot = function(data) {
                var prevColor = config.prevColor;
                var currColor = config.currColor;

                // TODO: have unused configuration vars
                //var prevRadius = config.prevRadius;
                //var currRadius = config.currRadius;

                refreshScale(dimensions);

                // Draw the lines connecting the points
                var circles = svg.selectAll().data(data).enter();
                circles.append('line')
                    .attr('class', 'connector')
                    .attr('x1', function(d) { return x(d.prev[xAttr]); })
                    .attr('y1', function(d) { return y(d.prev[yAttr]); })
                    .attr('x2', function(d) { return x(d.curr[xAttr]); })
                    .attr('y2', function(d) { return y(d.curr[yAttr]); });

                // Draw the current and previous year points
                drawPoints('curr', currColor);
                drawPoints('prev', prevColor);

                // Perform the initial animation
                refreshData();

                // Helper for drawing points on the chart
                function drawPoints(objName, color) {
                    circles.append('circle')
                        .attr('class', objName)
                        .attr('fill', color)
                        .attr('stroke', color)
                        .attr('cx', function(d) { return x(d[objName][xAttr]); })
                        .attr('cy', function(d) { return y(d[objName][yAttr]); })
                        // Radius of zero initially so it can be animated on load
                        .attr('r', 0)
                        .on('mouseover', tip.show)
                        .on('mouseout', tip.hide);
                }
            };

            // PRIVATE METHODS

            function initializeChart() {
                element.addClass(PLOT_CLASS);
                // Create the D3 svg graphic element
                svg = d3.select('#' + attrs.id + ' .chart')
                        .attr('width', config.plotWidth)
                        .attr('height', config.plotHeight)
                        .append('g')
                        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
                x = d3.scale.linear().range([0, width]);
                y = d3.scale.linear().range([height, 0]);

                // Create axes
                xAxis = d3.svg.axis().scale(x).orient('bottom');
                yAxis = d3.svg.axis().scale(y).orient('left');

                svg.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis);

                svg.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis)
                    .append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('y', 6)
                    .attr('dy', '.71em')
                    .style('text-anchor', 'end');

                // Add tooltips
                tip = d3.tip()
                        .attr('class', 'd3-tip')
                        .offset([-10, 0])
                        .html(function(d) {
                            return '<span class="propertyName">' + d.curr.propertyname + '</span>';
                        });
                svg.call(tip);

                drawLegend();
            }

            function drawLegend() {
                var prevColor = config.prevColor;
                var currColor = config.currColor;
                var prevRadius = config.prevRadius;
                var currRadius = config.currRadius;
                var prevLabel = config.prevLabel;
                var currLabel = config.currLabel;

                // Add a legend
                var legendData = [
                    {
                        classes: 'prev-legend',
                        label: prevLabel,
                        color: prevColor,
                        radius: prevRadius
                    },
                    {
                        classes: 'curr-legend',
                        label: currLabel,
                        color: currColor,
                        radius: currRadius
                    }
                ];
                var legend = svg.append('g')
                        .attr('class', 'legend')
                        .attr('x', width - 65)
                        .attr('y', 25)
                        .attr('height', 100)
                        .attr('width', 100)
                        .attr('zIndex', 100);

                var legendTextWidth = 30;
                var legendTextPadding = 8;
                legend.selectAll('g').data(legendData)
                    .enter()
                    .append('g')
                    .each(function(d, i) {
                        var g = d3.select(this);
                        g.append('circle')
                            .attr('fill', function(d) { return d.color; })
                            .attr('stroke', function(d) { return d.color; })
                            .attr('cx', function (d) { return width - legendTextWidth - legendTextPadding - d.radius * 2; })
                            .attr('cy', i * 25)
                            .attr('class', function (d) { return d.classes; })
                            .attr('r', function(d) { return d.radius; });
                        g.append('text')
                            .attr('class', 'title')
                            .attr('x', width - legendTextWidth)
                            .attr('y', i * 25 + 4)
                            .attr('height', 30)
                            .attr('width', 100)
                            .text(function(d) { return d.label; });
                    });
            }

            function refreshScale(dimensions) {
                // Calculate extents for each dimension
                var extents = _.map(dimensions, function(dimension) {
                    return [0, d3.max($scope.data, function(d) {
                        return Math.max(d.curr[dimension], d.prev[dimension]);
                    })];
                });

                // Update scales
                x.domain(extents[xIndex]);
                y.domain(extents[yIndex]);

                // Update the axes
                svg.select('.x.axis').call(xAxis);
                svg.select('.y.axis').call(yAxis);
            }

            // Check to ensure that all data is in place for the given attributes
            function isCompleteData(data, xAttr, yAttr) {
                return x(data.curr[xAttr]) && x(data.prev[xAttr]) && y(data.curr[yAttr]) && y(data.prev[yAttr]);
            }

            // Tell JS that the parameter *is* a number
            function isAn(val) {
                return isNaN(val) ? 0 : val;
            }


            // We do not call redraw/plot when the axis changes because we are only shifting
            //  the drawn points rather than redrawing them entirely
            function refreshData() {
                var transitionMillis = config.transitionMillis;
                var currRadius = config.currRadius;
                var prevRadius = config.prevRadius;
                refreshScale(dimensions);

                svg.selectAll('circle.curr') // first transition moves
                    .transition()
                    .ease('linear')
                    .duration(transitionMillis)
                    .attr('cx', function(d) { return x(isAn(d.curr[xAttr])); })
                    .attr('cy', function(d) { return y(isAn(d.curr[yAttr])); });

                svg.selectAll('circle.curr') // second transition fades
                    .transition()
                    .ease('linear')
                    .delay(transitionMillis)
                    .attr('r', function(d) { return isCompleteData(d, xAttr, yAttr) ? currRadius : 0; });

                svg.selectAll('circle.prev') // first transition moves
                    .transition()
                    .ease('linear')
                    .duration(transitionMillis)
                    .attr('cx', function(d) { return x(isAn(d.prev[xAttr])); })
                    .attr('cy', function(d) { return y(isAn(d.prev[yAttr])); });

                svg.selectAll('circle.prev') // second transition fades
                    .transition()
                    .ease('linear')
                    .delay(transitionMillis)
                    .attr('r', function(d) { return isCompleteData(d, xAttr, yAttr) ? prevRadius : 0; });


                svg.selectAll('line.connector')
                    .attr('x1', function(d) { return x(isAn(d.prev[xAttr])); })
                    .attr('y1', function(d) { return y(isAn(d.prev[yAttr])); })
                    .attr('x2', function(d) { return x(isAn(d.prev[xAttr])); })
                    .attr('y2', function(d) { return y(isAn(d.prev[yAttr])); });
                svg.selectAll('line.connector')
                    .transition()
                    .ease('linear')
                    .delay(transitionMillis)
                    .duration(transitionMillis)
                    .attr('x1', function(d) { return isCompleteData(d, xAttr, yAttr) ? x(d.prev[xAttr]) : 0; })
                    .attr('y1', function(d) { return isCompleteData(d, xAttr, yAttr) ? y(d.prev[yAttr]) : 0; })
                    .attr('x2', function(d) { return isCompleteData(d, xAttr, yAttr) ? x(d.curr[xAttr]) : 0; })
                    .attr('y2', function(d) { return isCompleteData(d, xAttr, yAttr) ? y(d.curr[yAttr]) : 0; });
            }
        };

        return module;
    }

    angular.module('mos.charting')
    .constant('TimeScatterPlotDefaults', TimeScatterPlotDefaults)
    .directive('mosTimeScatterplot', timeScatterPlot);

})();
