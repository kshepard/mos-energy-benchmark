(function () {
    'use strict';

    /**
     * @ngInject
     */
    function MappingService (MOSColors, MapColorService) {
        var module = {};

        module.FILTER_NONE = 'All types';

        /*
         *  Builds sector legend data
         *
         *  @returns Object with properties for custom CartoDB sector legend
         */
        module.getSectorColors = function() {
            var sectors = [];
            angular.forEach(MOSColors, function(value, key) {
                sectors.push({'name': key, 'value': value});
            });
            return sectors;
        };

        /*
         *  Finds color for a given property sector
         *
         *  @param {string} sector Property sector field value from database
         *  @returns {string} Corresponding color value for display
         */
        module.findSectorColor = function(sector) {
            console.log('searching for ' + sector);
            if (sector in MOSColors) {
                return MOSColors[sector];
            } else {
                // if color not found, use 'Unknown' color
                return MOSColors.Unknown;
            }
        };

        module.getLegendOptions = function(field) {
            return MapColorService.legendOptions(field);
        };

        /*
         *  Fetches list of building categories in use
         *
         *  @returns Promise with query results
         */
        module.getBldgCategories = function() {
            var qry = 'SELECT DISTINCT sector FROM mos_beb_2013;';
            var sql = new cartodb.SQL({ user: 'azavea-demo'});
            return sql.execute(qry);
        };

        /*
         *  Fetches details for a selected property
         *
         * @param {string} cartodbId Unique ID for record to search for
         * @returns Promise with results in data.rows
         */
        module.featureLookup = function(cartodbId)  {
            var qry = 'SELECT cartodb_id, property_name, address, total_ghg, site_eui, ' + 
            'energy_star, sector FROM mos_beb_2013 where cartodb_id = {{id}}';
            var sql = new cartodb.SQL({ user: 'azavea-demo'});
            return sql.execute(qry, { id: cartodbId});
        };

        module.filterViz = function(viz, val) {
            if (!viz) {
                console.error('cannot filter; there is no viz!');
                return;
            }
            if (val === module.FILTER_NONE) {
                viz.setSQL('select * from mos_beb_2013');
            } else {
                viz.setSQL('select * from mos_beb_2013 where sector =\'' + val + '\';');
            }
        };

        module.setVizCartoCSS = function(viz, colorByField, sizeByField) {
            if (!viz) {
                console.error('cannot change CartoCSS; there is no viz!');
                return;
            }
            var css = MapColorService.baseCartoCSS + ' ' +
                      MapColorService.getFieldCartoCSS(colorByField) + ' ' +
                      MapColorService.getFieldCartoCSS(sizeByField);

            viz.setCartoCSS(css);
        };

        return module;
    }

    angular.module('mos.mapping')

      .factory('MappingService', MappingService);

})();