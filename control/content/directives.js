(function (angular,buildfire) {
    "use strict";
    angular
        .module('couponsContentDirectives', [])
        .directive('carouselComponent', ['$timeout',function ($timeout) {
            return {
                template: "<div id='carousel'></div>",
                replace: true,
                scope: {images: '='},
                link: function (scope, elem, attrs) {
                    var editor = new buildfire.components.carousel.editor("#carousel");
                    function initCarousel(){

                        if(scope.images && scope.images.length>0)
                            editor.loadItems(scope.images);
                        // this method will be called when a new item added to the list
                        editor.onAddItems = function (items) {
                            if (!scope.images)
                                scope.images = [];
                            $timeout(function(){
                                scope.$apply(function () {
                                    scope.images.push.apply(scope.images, items);
                                });
                            },0);
                        };
                        // this method will be called when an item deleted from the list
                        editor.onDeleteItem = function (item, index) {
                            $timeout(function(){
                                scope.$apply(function () {
                                    scope.images.splice(index, 1);
                                });
                            },0);
                        };
                        // this method will be called when you edit item details
                        editor.onItemChange = function (item, index) {
                            $timeout(function(){
                                scope.$apply(function () {
                                    scope.images.splice(index, 1, item);
                                });
                            },0);
                        };
                        // this method will be called when you change the order of items
                        editor.onOrderChange = function (item, oldIndex, newIndex) {
                            $timeout(function(){
                                scope.$apply(function () {
                                    var items = scope.images;

                                    var tmp = items[oldIndex];

                                    if (oldIndex < newIndex) {
                                        for (var i = oldIndex + 1; i <= newIndex; i++) {
                                            items[i - 1] = items[i];
                                        }
                                    } else {
                                        for (var i = oldIndex - 1; i >= newIndex; i--) {
                                            items[i + 1] = items[i];
                                        }
                                    }
                                    items[newIndex] = tmp;

                                    scope.images = items;
                                });
                            },0);
                        };
                    }
                    initCarousel();
                    scope.$watch("images", function (newVal, oldVal) {
                        if (newVal) {
                            if (scope.images) {
                                initCarousel();
                            }
                        }
                    });
                }
            };
        }])
        .directive('dynamicLinkComponent', ['$timeout',function ($timeout) {
            return {
                template: "<div id='actionItems'></div>",
                replace: true,
                scope: {links: '='},
                link: function (scope, elem, attrs) {
                    // create a new instance of the buildfire action Items
                    var linkEditor = new buildfire.components.actionItems.sortableList("#actionItems");
                    function initDynamicLinks(){
                    if(scope.links && scope.links.length>0)
                        linkEditor.loadItems(scope.links);
                    // this method will be called when a new item added to the list
                    linkEditor.onAddItems = function (items) {
                        if (!scope.links)
                            scope.links = [];

                        $timeout(function(){
                            scope.$apply(function () {
                                scope.links.push(items);
                            });
                        },0);
                    };
                    // this method will be called when an item deleted from the list
                    linkEditor.onDeleteItem = function (item, index) {
                        $timeout(function(){
                            scope.$apply(function () {
                                scope.links.splice(index, 1);
                            });
                        },0);
                    };
                    // this method will be called when you edit item details
                    linkEditor.onItemChange = function (item, index) {
                        $timeout(function(){
                            scope.$apply(function () {
                                scope.links.splice(index, 1, item);
                            });
                        },0);
                    };
                    // this method will be called when you change the order of items
                    linkEditor.onOrderChange = function (item, oldIndex, newIndex) {
                        $timeout(function(){
                            scope.$apply(function () {
                                var items = scope.links;
                                var i;
                                var tmp = items[oldIndex];
                                if (oldIndex < newIndex) {
                                    for ( i = oldIndex + 1; i <= newIndex; i++) {
                                        items[i - 1] = items[i];
                                    }
                                } else {
                                    for (i = oldIndex - 1; i >= newIndex; i--) {
                                        items[i + 1] = items[i];
                                    }
                                }
                                items[newIndex] = tmp;
                                scope.links = items;
                            });
                        },0);
                    };
                    }
                    initDynamicLinks();
                    scope.$watch("links", function (newVal, oldVal) {
                        if (newVal) {
                            if (scope.links) {
                                initDynamicLinks();
                            }
                        }
                    });
                }
            };
        }])
        .directive('googleLocationSearch', function () {
            return {
                restrict: 'A',
                scope: {setLocationInController: '&callbackFn'},
                link: function (scope, element, attributes) {
                    var options = {
                        types: ['geocode']
                    };
                    var $el,
                      styleTag = document.createElement('style'),
                      appended = false,
                      hgt = $(element).outerHeight(),
                      offset = $(element).offset();
                    
                    styleTag.id = 'GAC-PAC';
                    $(styleTag).text(".pac-container.pac-container { top: " + (offset.top + 34) + "px !important;}");

                    document.getElementsByTagName('head')[0].appendChild( styleTag );

                    var autocomplete = new google.maps.places.Autocomplete(element[0], options);
                    google.maps.event.addListener(autocomplete, 'place_changed', function () {
                        var location = autocomplete.getPlace().formatted_address;
                        if (autocomplete.getPlace().geometry) {
                            var coordinates = {lat: autocomplete.getPlace().geometry.location.lat(), lng: autocomplete.getPlace().geometry.location.lng()};
                            scope.setLocationInController({
                                data: {
                                    location: location,
                                    coordinates: coordinates
                                }
                            });
                        }
                    });
                }
            };
        })
        .directive('dateTimeStart', function () {
            return {
                scope: {startDate: "="},
                link: function (scope, elem, attrs) {
                    setTimeout(function () {
                        $(elem).datepicker({
                            dateFormat: "mm/dd/yy",
                            onSelect: function () {
                                var value = $(this).val();
                                scope.startDate = +new Date(value);
                                scope.$apply();
                                $(elem).datepicker("setDate", new Date(value));
                                document.activeElement.blur();
                            }
                        });
                        scope.hasDatePicker = true;
                        scope.$apply();
                    }, 0);

                    var unbindWatch = scope.$watch("startDate", function (newVal) {
                        if(newVal && scope.hasDatePicker) {
                            $(elem).datepicker("setDate", new Date(newVal));
                            unbindWatch();
                        }
                    });
                }
            };
        })
      .directive('dateTimeExpire', function () {
            return {
                scope: {expireDate: "="},
                link: function (scope, elem, attrs) {
                    setTimeout(function () {
                        $(elem).datepicker({
                            dateFormat: "mm/dd/yy",
                            onSelect: function () {
                                var value = $(this).val();
                                scope.expireDate = +new Date(value);
                                scope.$apply();
                                $(elem).datepicker("setDate", new Date(value));
                                document.activeElement.blur();
                            }
                        });
                        scope.hasDatePicker = true;
                        scope.$apply();
                    }, 0);

                    var unbindWatch = scope.$watch("expireDate", function (newVal) {
                        if(newVal && scope.hasDatePicker) {
                            $(elem).datepicker("setDate", new Date(newVal));
                            unbindWatch();
                        }
                    });
                }
            };
        })
        .directive("googleMap", function () {
            return {
                template: "<div></div>",
                replace: true,
                scope: {coordinates: '=', draggedGeoData: '&draggedFn'},
                link: function (scope, elem, attrs) {
                    var geocoder = new google.maps.Geocoder();
                    var location;
                    scope.$watch('coordinates', function (newValue, oldValue) {
                        if (newValue) {
                            scope.coordinates = newValue;
                            if (scope.coordinates) {
                                var map = new google.maps.Map(elem[0], {
                                    center: new google.maps.LatLng(scope.coordinates.lat, scope.coordinates.lng),
                                    zoomControl: false,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    zoom: 15,
                                    mapTypeId: google.maps.MapTypeId.ROADMAP
                                });
                                var marker = new google.maps.Marker({
                                    position: new google.maps.LatLng(scope.coordinates.lat, scope.coordinates.lng),
                                    map: map,
                                    draggable: true
                                });

                                var styleOptions = {
                                    name: "Report Error Hide Style"
                                };
                                var MAP_STYLE = [
                                    {
                                        stylers: [
                                            {visibility: "on"}
                                        ]
                                    }];
                                var mapType = new google.maps.StyledMapType(MAP_STYLE, styleOptions);
                                map.mapTypes.set("Report Error Hide Style", mapType);
                                map.setMapTypeId("Report Error Hide Style");
                            }
                            google.maps.event.addListener(marker, 'dragend', function (event) {
                                scope.coordinates = [event.latLng.lng(), event.latLng.lat()];
                                geocoder.geocode({
                                    latLng: marker.getPosition()
                                }, function (responses) {
                                    if (responses && responses.length > 0) {
                                        scope.location = responses[0].formatted_address;
                                        scope.draggedGeoData({
                                            data: {
                                                location: scope.location,
                                                coordinates: {
                                                   lng: scope.coordinates[0],
                                                   lat: scope.coordinates[1]
                                                }
                                            }
                                        });
                                    } else {
                                        location = 'Cannot determine address at this location.';
                                    }

                                });
                            });
                        }
                    }, true);
                }
            }
        })
        .directive('ngEnter', function () {
            return function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if (event.which === 13) {
                        var val = $(element).val(),
                            regex = /^[0-9\-\., ]+$/g;
                        if (regex.test(val)) {
                            scope.$apply(function () {
                                scope.$eval(attrs.ngEnter);
                            });

                            event.preventDefault();
                        }
                    }
                });
            };
        })
})(window.angular,buildfire);