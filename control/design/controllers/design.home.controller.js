'use strict';

(function (angular, window) {
  angular
    .module('couponPluginDesign')
    .controller('DesignHomeCtrl', ['$scope', 'Buildfire', 'LAYOUTS', 'DataStore', 'TAG_NAMES',
      function ($scope, Buildfire, LAYOUTS, DataStore, TAG_NAMES) {
        var DesignHome = this;
        var DesignHomeMaster;
        var _data = {
          design: {
            itemListLayout: ""
          },
          content: {},
          settings:{}
        };

        DesignHome.layouts = {
          itemListLayout: [
            {name: "List-Layout-1"},
            {name: "List-Layout-2"},
            {name: "List-Layout-3"},
            {name: "List-Layout-4"}
          ]
        };

        /*On layout click event*/
        DesignHome.changeListLayout = function (layoutName) {
          if (layoutName && DesignHome.data.design) {
            DesignHome.data.design.itemListLayout = layoutName;
            console.log(DesignHome.data);
            saveData(function (err, data) {
                if (err) {
                  return DesignHome.data = angular.copy(DesignHomeMaster);
                }
                else if (data && data.obj) {

                  return DesignHomeMaster = data.obj;

                }
                $scope.$digest();
              }
            )
          }
        };

        /*save method*/
        var saveData = function (callback) {
          callback = callback || function () {

          };
          Buildfire.datastore.save(DesignHome.data, TAG_NAMES.COUPON_INFO, callback);
        };

        var init = function () {
          Buildfire.datastore.get(TAG_NAMES.COUPON_INFO, function (err, data) {
            if (err) {
              Console.log('------------Error in Design of People Plugin------------', err);
            }
            else if (data && data.data) {
              DesignHome.data = angular.copy(data.data);
              console.log("init Data:", DesignHome.data);
              if (!DesignHome.data.design)
                DesignHome.data.design = {};
              if (!DesignHome.data.design.itemListLayout)
                DesignHome.data.design.itemListLayout = DesignHome.layouts.itemListLayout[0].name;
              DesignHomeMaster = angular.copy(data.data);
              $scope.$digest();
            }
            else {
              DesignHome.data = _data;
              console.info('------------------unable to load data---------------');
            }
          });
        };

        init();

        /*watch the change event and update in database*/
        $scope.$watch(function () {
          return DesignHome.data;
        }, function (oldObj, newObj) {

          if (oldObj != newObj && newObj) {
            console.log("Updated Object:", newObj);
            Buildfire.datastore.save(DesignHome.data, TAG_NAMES.COUPON_INFO, function (err, data) {
              if (err) {
                return DesignHome.data = angular.copy(DesignHomeMaster);
              }
              else if (data && data.obj) {
                return DesignHomeMaster = data.obj;

              }
              $scope.$digest();
            });
          }
        }, true);

      }]);
})(window.angular);
