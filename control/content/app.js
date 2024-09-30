'use strict';

(function (angular) {
  angular.module('couponPluginContent', ['couponPluginModal', 'couponsContentDirectives', 'ngRoute', 'ui.bootstrap', 'ui.tinymce', 'infinite-scroll', 'ui.sortable', 'bngCsv'])
    //injected ngRoute for routing
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'templates/home.html',
          controllerAs: 'ContentHome',
          controller: 'ContentHomeCtrl',
          resolve: {
            ScriptLoaderService: function (ScriptLoaderService) {
              return ScriptLoaderService.loadScript();
            }
          }
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
    .service('ScriptLoaderService', ['$q', function ($q) {
      this.loadScript = function () {
        const deferred = $q.defer();

        const { apiKeys } = buildfire.getContext();
        const { googleMapKey } = apiKeys;
        const url = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=places,marker&key=${googleMapKey}`;


        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        if (document.querySelector(`script[src="${url}"]`)) {
          console.info(`Script: ${url} is already loaded`);
          deferred.resolve();
          return deferred.promise;
        }

        script.onload = function () {
          console.info(`Successfully loaded script: ${url}`);
          deferred.resolve();
        };

        script.onerror = function () {
          console.error(`Failed to load script: ${url}`);
          deferred.reject('Failed to load script.');
        };

        window.gm_authFailure = () => {
          deferred.resolve();
        };

        document.head.appendChild(script);
        return deferred.promise;
      };
    }])
    .run(['$location', '$rootScope','ScriptLoaderService', function ($location, $rootScope,ScriptLoaderService) {
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
