'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget', ['ui.bootstrap'])
    .config(['$compileProvider', function ($compileProvider) {

      /**
       * To make href urls safe on mobile
       */
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/);


    }])
})(window.angular, window.buildfire, window);
