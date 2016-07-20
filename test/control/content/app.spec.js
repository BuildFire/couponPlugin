describe('Unit: couponPluginContent content app', function () {
  describe('Unit: app routes', function () {
    beforeEach(module('couponPluginContent'));
    var location, route, rootScope;
    beforeEach(inject(function (_$location_, _$route_, _$rootScope_) {
      location = _$location_;
      route = _$route_;
      rootScope = _$rootScope_;

    }));

    describe('Home route', function () {
      beforeEach(inject(
        function ($httpBackend) {
          $httpBackend.expectGET('templates/home.html')
            .respond(200);
          $httpBackend.expectGET('/')
            .respond(200);
        }));
    });

    describe('Create item route', function () {
      beforeEach(inject(
        function ($httpBackend) {
          $httpBackend.expectGET('templates/item.html')
            .respond(200);
          $httpBackend.expectGET('/item')
            .respond(200);
        }));
    });

    describe('Edit item route', function () {
      beforeEach(inject(
        function ($httpBackend) {
          $httpBackend.expectGET('templates/item.html')
            .respond(200);
          $httpBackend.expectGET('/item/:id')
            .respond(200);
        }));
    });
  });


  describe('Unit: Sample Test', function () {
    beforeEach(module('couponPluginContent'));
    var filter;
     it('Sample Test', function () {
      var result;
      //result = filter('getImageUrl')('https://imagelibserver.s3.amazonaws.com/25935164-2add-11e5-9d04-02f7ca55c361/950a50c0-400a-11e5-9af5-3f5e0d725ccb.jpg', 88, 124, 'resize');
      expect(1).toEqual(1);
    });

  });

});