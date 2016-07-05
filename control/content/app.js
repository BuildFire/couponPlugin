'use strict';

(function (angular) {
  angular.module('couponPluginContent', ['couponPluginModal', 'couponsContentDirectives', 'ngRoute', 'ui.bootstrap', 'ui.tinymce', 'infinite-scroll', 'ui.sortable', 'bngCsv'])
    //injected ngRoute for routing
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'templates/home.html',
          controllerAs: 'ContentHome',
          controller: 'ContentHomeCtrl'
        })
        .when('/item', {
          templateUrl: 'templates/item.html',
          controllerAs: 'ContentItem',
          controller: 'ContentItemCtrl'
        })
        .when('/item/:id', {
          templateUrl: 'templates/item.html',
          controllerAs: 'ContentItem',
          controller: 'ContentItemCtrl'
        })
        .when('/filter', {
          templateUrl: 'templates/home.html',
          controllerAs: 'ContentFilter',
          controller: 'ContentFilterCtrl'
        })
        .when('/filter/:itemId', {
          templateUrl: 'templates/home.html',
          controllerAs: 'ContentFilter',
          controller: 'ContentFilterCtrl'
        })
        .otherwise('/');
    }])
    .filter('getImageUrl', ['Buildfire', function (Buildfire) {
      return function (url, width, height, type) {
        if (type == 'resize')
          return Buildfire.imageLib.resizeImage(url, {
            width: width,
            height: height
          });
        else
          return Buildfire.imageLib.cropImage(url, {
            width: width,
            height: height
          });
      }
    }])
    .run(['$location', '$rootScope', function ($location, $rootScope) {
      buildfire.messaging.onReceivedMessage = function (msg) {
        switch (msg.type) {
          case 'OpenItem':
            $location.path('/item/' + msg.id);
            $rootScope.$apply();
            break;
          case 'BackToHome':
            $location.path('/');
            $rootScope.$apply();
            break;
        }
      };
    }]);
})(window.angular);