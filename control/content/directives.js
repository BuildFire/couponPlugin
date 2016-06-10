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
                    var autocomplete = new google.maps.places.Autocomplete(element[0], options);
                    google.maps.event.addListener(autocomplete, 'place_changed', function () {
                        var location = autocomplete.getPlace().formatted_address;
                        if (autocomplete.getPlace().geometry) {
                            var coordinates = [autocomplete.getPlace().geometry.location.lng(), autocomplete.getPlace().geometry.location.lat()];
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
})(window.angular,buildfire);