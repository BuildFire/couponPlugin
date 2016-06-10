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
                    console.log('Directive attached-----------Content Section----------',scope,elem,attrs);
                    var editor = new buildfire.components.carousel.editor("#carousel");
                    if(scope.images && scope.images.length>0)
                        editor.loadItems(scope.images);
                    console.log('Images in directive-------------Content Section---------------',scope.images);
                    // this method will be called when a new item added to the list
                    editor.onAddItems = function (items) {
                        if (!scope.images)
                            scope.images = [];
                        console.log('onAddItems called from directive-----------------',items);
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
})(window.angular,buildfire);