'use strict';

(function (angular, buildfire) {
    angular.module('couponPluginWidget')
        .controller('WidgetMasterCtrl', ['$scope', 'TAG_NAMES', 'LAYOUTS', 'DataStore','Buildfire',
            function ($scope, TAG_NAMES, LAYOUTS, DataStore, Buildfire) {
                var WidgetMaster = this;
                WidgetMaster.init = function () {
                    Buildfire.spinner.show();
                    var success = function (result) {
                        Buildfire.spinner.hide();
                        if (result && result.data) {
                            WidgetMaster.data = result.data;
                        }
                        else {
                            WidgetMaster.data = {
                                design: {
                                    itemListLayout: LAYOUTS.itemListLayout[0].name
                                },
                                "settings": {
                                    defaultView: "list",
                                    distanceIn: "mi",
                                    mapView: "show",
                                    filterPage: "show"
                                }
                            };
                        }
                        if (WidgetMaster.data && !WidgetMaster.data.design) {
                            WidgetMaster.data.design = {
                                itemListLayout: LAYOUTS.itemListLayout[0].name
                            };
                        }
                        if (WidgetMaster.data && !WidgetMaster.data.settings) {
                            WidgetMaster.data.settings = {
                                defaultView: "list",
                                distanceIn: "mi",
                                mapView: "show",
                                filterPage: "show"
                            };
                        }
                        if (!WidgetMaster.data.design.itemListLayout) {
                            WidgetMaster.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                        }
                        if (!WidgetMaster.data.content)
                            WidgetMaster.data.content = {};
                    }
                        , error = function (err) {
                        Buildfire.spinner.hide();
                        WidgetMaster.data = {design: {itemListLayout: LAYOUTS.itemListLayout[0].name}};
                        console.error('Error while getting data', err);
                    };
                    DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
                };
                
                WidgetMaster.init();
                
                var onUpdateCallback = function (event) {
                    console.log(event.data, "-=-=-=-=-=-=-=-");
                    setTimeout(function () {
                        if (event && event.tag === TAG_NAMES.COUPON_INFO) {
                            WidgetMaster.data = event.data;
                            if (!WidgetMaster.data.design)
                                WidgetMaster.data.design = {};
                            if (!WidgetMaster.data.content)
                                WidgetMaster.data.content = {};
                            if (!WidgetMaster.data.settings)
                                WidgetMaster.data.settings = {};
                        }
                        else if (event && event.tag === TAG_NAMES.COUPON_ITEMS) {

                        }

                        if (!WidgetMaster.data.design.itemListLayout) {
                            WidgetMaster.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                        }
                        $scope.$digest();
                    }, 0);
                };
                
                DataStore.onUpdate().then(null, null, onUpdateCallback);

            }])
})(window.angular, window.buildfire);
