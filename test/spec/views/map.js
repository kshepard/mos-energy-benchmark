describe('Controller: mos.views.map.MapController', function () {
    'use strict';

    // load the controller's module
    beforeEach(module('mos'));

    var $injector = angular.injector(['mos']);
    var scope;
    var Controller;
    var BuildingCompare;
    var MappingService;


    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, _$compile_, _$state_) {
        scope = $rootScope.$new();
        MappingService = $injector.get('MappingService');
        BuildingCompare = $injector.get('BuildingCompare');
        
        Controller = $controller('MapController', {
            $compile: _$compile_,
            $scope: scope,
            $state: _$state_,
            BuildingCompare: BuildingCompare,
            MappingService: MappingService
        });
    }));

    it('should have EUI for default size type', function () {
        expect(scope.sizeType.field).toBe('site_eui');
    });

    it('should have sector for default color type', function () {
        expect(scope.colorType.field).toBe('sector');
    });

    it('should be able to clear error messages', function () {
        // first set error flags
        scope.noResults = true;
        scope.amSearching = true;

        scope.clearErrorMsg();

        expect(scope.noResults).toBe(false);
        expect(scope.amSearching).toBe(false);
    });
});