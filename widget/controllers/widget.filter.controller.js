'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetFilterCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', '$modal', '$timeout',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, $modal, $timeout) {
        var WidgetFilter = this;

        WidgetFilter.back = function(){
          ViewStack.pop();
        }

      }]);
})(window.angular, window.buildfire, window);
