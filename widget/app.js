'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget', ['ui.bootstrap', 'ngAnimate', 'infinite-scroll', 'ngtimeago', 'rzModule'])
    .config(['$compileProvider', function ($compileProvider) {

      /**
       * To make href urls safe on mobile
       */
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/);


    }])
    .directive("viewSwitcher", ["ViewStack", "$rootScope", '$compile',
      function (ViewStack, $rootScope, $compile) {
        return {
          restrict: 'AE',
          link: function (scope, elem, attrs) {
            var views = 0,
              currentView = null;
            manageDisplay();
            $rootScope.$on('VIEW_CHANGED', function (e, type, view, noAnimation) {
              if (type === 'PUSH') {
                console.log("VIEW_CHANGED>>>>>>>>", type, view);
                currentView = ViewStack.getPreviousView();
                var newScope = scope; //$rootScope.$new(false);
                $rootScope.$on("$includeContentLoaded", function (event, templateName) {
                  if (newScope && !newScope.$$phase) {
                    console.log("Force Rebind>>>>>>>>", newScope);
                    newScope.$digest();
                  }
                });

                var _newView = '<div  id="' + view.template + '" ><div class="slide content" ng-include="\'templates/' + view.template + '.html\'"></div></div>';
                var parTpl = $compile(_newView)(newScope);

                $(elem).append(parTpl);
                views++;

              } else if (type === 'POP') {

                var _elToRemove = $(elem).find('#' + view.template),
                  _child = _elToRemove.children("div").eq(0);

                _child.addClass("ng-leave ng-leave-active");
                _child.one("webkitTransitionEnd transitionend oTransitionEnd", function (e) {
                  _elToRemove.remove();
                  views--;
                });

                currentView = ViewStack.getCurrentView();
              }
              else if (type === 'POPALL') {
                console.log(view);
                angular.forEach(view, function (value, key) {
                  var _elToRemove = $(elem).find('#' + value.template),
                    _child = _elToRemove.children("div").eq(0);

                  if (!noAnimation) {
                    _child.addClass("ng-leave ng-leave-active");
                    _child.one("webkitTransitionEnd transitionend oTransitionEnd", function (e) {
                      _elToRemove.remove();
                      views--;
                    });
                  } else {
                    _elToRemove.remove();
                    views--;
                  }
                });
              }
              manageDisplay();
            });

            function manageDisplay() {
              if (views) {
                $(elem).removeClass("ng-hide");
              } else {
                $(elem).addClass("ng-hide");
              }
            }

          }
        };
      }])
    .directive("buildFireCarousel", ["$rootScope", function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
          $rootScope.$broadcast("Carousel:LOADED");
        }
      };
    }])
    .directive("buildFireCarousel2", ["$rootScope", function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
          $rootScope.$broadcast("Carousel2:LOADED");
        }
      };
    }])
    .directive("loadImage", ['Buildfire', function (Buildfire) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          element.attr("src", "../../../styles/media/holder-" + attrs.loadImage + ".gif");

          attrs.$observe('finalSrc', function () {
            var _img = attrs.finalSrc;

            if (attrs.cropType == 'resize') {
              Buildfire.imageLib.local.resizeImage(_img, {
                width: attrs.cropWidth,
                height: attrs.cropHeight
              }, function (err, imgUrl) {
                _img = imgUrl;
                replaceImg(_img);
              });
            } else {
              Buildfire.imageLib.local.cropImage(_img, {
                width: attrs.cropWidth,
                height: attrs.cropHeight
              }, function (err, imgUrl) {
                _img = imgUrl;
                replaceImg(_img);
              });
            }
          });

          function replaceImg(finalSrc) {
            var elem = $("<img>");
            elem[0].onload = function () {
              element.attr("src", finalSrc);
              elem.remove();
            };
            elem.attr("src", finalSrc);
          }
        }
      };
    }])
    .value('globals', {
      'wasFinderClicked': false
    })
    .directive("googleMap", function (globals) {
      return {
        template: "<div></div>",
        replace: true,
        scope: {
          locationData: '=locationData',
          refreshData: '=refreshData',
          markerCallback: '=markerCallback'
        },
        link: function (scope, elem, attrs) {
          var newClustererMap = '';
          elem.css('width', '100%');
          scope.$watch('refreshData', function (newValue, oldValue) {
            if (newValue) {
              var mapCenterLng = (scope.locationData && scope.locationData.currentCoordinates && scope.locationData.currentCoordinates.length && scope.locationData.currentCoordinates[0]) ? scope.locationData.currentCoordinates[0] : -87.7679;
              var mapCenterLat = (scope.locationData && scope.locationData.currentCoordinates && scope.locationData.currentCoordinates.length && scope.locationData.currentCoordinates[1]) ? scope.locationData.currentCoordinates[1] : 41.8718;

              // Create the map.
              var map = new google.maps.Map(elem[0], {
                streetViewControl: false,
                gestureHandling: 'greedy',
                mapTypeControl: false,
                zoom: 8,
                center: { lat: mapCenterLat, lng: mapCenterLng },
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_TOP
                },
                mapId: buildfire.getContext().apiKeys.googleMapId ||'bfMainPageMap'
              });
              var getCustomMarkerIcon = function (_imageUrl) {
                return {
                  url: _imageUrl,
                  scaledSize: new google.maps.Size(20, 20),
                  anchor: new google.maps.Point(10, 10)
                }
              }
              var selectedLocation = null;

              var currentLocationIconImageUrl = 'http://app.buildfire.com/app/media/google_marker_blue_icon.png';
              var placeLocationIconImageUrl = 'http://app.buildfire.com/app/media/google_marker_red_icon.png';
              var selectedLocationIconImageUrl = 'http://app.buildfire.com/app/media/google_marker_green_icon.png';

              var currentLocationIcon = getCustomMarkerIcon(currentLocationIconImageUrl);
              var placeLocationIcon = getCustomMarkerIcon(placeLocationIconImageUrl);
              var selectedLocationIcon = getCustomMarkerIcon(selectedLocationIconImageUrl);

              // Shapes define the clickable region of the icon. The type defines an HTML
              // <area> element 'poly' which traces out a polygon as a series of X,Y points.
              // The final coordinate closes the poly by connecting to the first coordinate.
              var shape = {
                coords: [1, 1, 1, 20, 18, 20, 18, 1],
                type: 'poly'
              };

              if (scope.locationData && scope.locationData.currentCoordinates && scope.locationData.currentCoordinates.length) {
                const pinGlyph = new google.maps.marker.PinElement({});
                var currentLocationMarker = new google.maps.marker.AdvancedMarkerElement({
                  position: {
                    lat: scope.locationData.currentCoordinates[1],
                    lng: scope.locationData.currentCoordinates[0]
                  },
                  content: pinGlyph.element,
                  map: map,
                });
                currentLocationMarker.content.innerHTML = `<img width="20" height="20" src=${currentLocationIcon.url} />`;
              }

              var placeLocationMarkers = [];
              if (scope.locationData && scope.locationData.items && scope.locationData.items.length) {
                for (var _index = 0; _index < scope.locationData.items.length; _index++) {

                  var _place = scope.locationData.items[_index]
                    , marker = '';


                  if (_place.data && _place.data.location && _place.data.location.coordinates && _place.data.location.coordinates.lng && _place.data.location.coordinates.lat && !_place.alreadySet) {
                    //If someone has clicked on the finder, stop centering on the item/location
                    if (_index == 0 && !globals.wasFinderClicked) {
                      map.setCenter(new google.maps.LatLng(_place.data.location.coordinates.lat, _place.data.location.coordinates.lng));
                    }
                    const image = document.createElement("img");
                    image.width = 20;
                    image.height = 20;
                    image.src =placeLocationIconImageUrl;

                    marker = new google.maps.marker.AdvancedMarkerElement({
                      position: { lat: _place.data.location.coordinates.lat, lng: _place.data.location.coordinates.lng },
                      map: map,
                      title: _place.couponContained ? (_place.couponContained.length + " coupons") : _place.data.title,
                      zIndex: _index,
                      content: image,
                    });
                    marker.addListener('click', function () {
                      var _this = this;
                      if (selectedLocation) {
                        selectedLocation.content.src = placeLocationIcon.url;
                      }
                      _this.content.src = selectedLocationIcon.url;

                      selectedLocation = _this;
                      scope.markerCallback(_this.zIndex);
                    });
                    placeLocationMarkers.push(marker);
                  }
                }
              }

              var clusterStyles = [
                {
                  textColor: 'white',
                  url: 'http://app.buildfire.com/app/media/google_marker_blue_icon2.png',
                  height: 53,
                  width: 53
                }
              ];
              var mcOptions = {
                gridSize: 53,
                styles: clusterStyles,
                maxZoom: 15
              };
              var markerCluster = new MarkerClusterer(map, placeLocationMarkers, mcOptions);


              map.addListener('click', function () {
                if (selectedLocation) {
                  scope.markerCallback(null);
                  selectedLocation.content.src = placeLocationIcon.url;
                }
              });
            }
          }, true);
        }
      }
    })
    .service('ScriptLoaderService', ['$q', function ($q) {
      this.loadScript = function (url) {
        const deferred = $q.defer(); // Use $q to create a promise

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        script.onload = function () {
          console.info(`Successfully loaded script: ${url}`);
          deferred.resolve(); // Resolve the promise when the script is loaded
        };

        script.onerror = function () {
          console.error(`Failed to load script: ${url}`);
          deferred.reject('Failed to load script.');
        };
        window.gm_authFailure = () => {
          buildfire.dialog.alert({
            title: 'Error',
            message: getString('general.failedToLoadGoogleMapsApi'),
          });
          deferred.resolve();
        };

        document.head.appendChild(script);
        return deferred.promise; // Return the promise
      };
    }])
    .run(['ViewStack', '$rootScope', 'ScriptLoaderService', function (ViewStack, $rootScope, ScriptLoaderService) {
      $rootScope.getString = getString;
      buildfire.history.onPop(function () {
        if (ViewStack.hasViews()) {
          if (ViewStack.getCurrentView().template == 'Item') {
            buildfire.messaging.sendMessageToControl({
              type: 'BackToHome'
            });
          }
          ViewStack.pop();
        }
      });

      buildfire.messaging.onReceivedMessage = function (msg) {
        switch (msg.type) {
          case 'AddNewItem':
            ViewStack.popAllViews(true);
            ViewStack.push({
              template: 'Item',
              params: {
                itemId: msg.id,
                stopSwitch: true
              }
            });
            buildfire.history.push('Item', { itemId: msg.id });
            $rootScope.$apply();
            break;
          case 'OpenItem':
            var currentView = ViewStack.getCurrentView();
            if (currentView && currentView.template !== "Item") {
              ViewStack.push({
                template: 'Item',
                params: {
                  itemId: msg.id
                }
              });
              buildfire.history.push('Item', { itemId: msg.id });
              $rootScope.$apply();
            }
            break;
          case 'ImportCSV':
            msg.importing ? $rootScope.importingCSV = true : $rootScope.importingCSV = false;
            if(!$rootScope.importingCSV) window.location.href = window.location.href;
          default:
            ViewStack.popAllViews(true);
        }
      };

      const initGoogleMapsSDK = () => {
        const { apiKeys } = buildfire.getContext();
        const { googleMapKey } = apiKeys;
        const googleMapsURL = `https://maps.googleapis.com/maps/api/js?v=weekly&sensor=true&libraries=places,marker&key=${googleMapKey}`;

        ScriptLoaderService.loadScript(googleMapsURL)
          .then(() => {
            console.info("Successfully loaded Google's Maps SDK.");
          })
          .catch(() => {
            buildfire.dialog.alert({
              title: 'Error',
              message: getString('general.failedToLoadGoogleMapsApi'),
            });
          });
      };

      initLanguageStrings()
        .then(() => {
          initGoogleMapsSDK();
        })
        .catch((error) => {
          console.error('Error loading language strings', error);
          initGoogleMapsSDK();
        });
    }])
})(window.angular, window.buildfire, window);
