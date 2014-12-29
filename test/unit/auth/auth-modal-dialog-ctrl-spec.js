/*
 * [y] hybris Platform
 *
 * Copyright (c) 2000-2014 hybris AG
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of hybris
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with hybris.
 */

describe('AuthModalDialogCtrl Test', function () {
    var storeTenant = '121212';
    var mockedGlobalData = {store: {tenant: storeTenant}};
    var $scope, $rootScope, $controller, $window, AuthModalDialogCtrl, $modalInstanceMock, $q, MockedAuthSvc, mockedLoginOpts={},
       mockedSessionSvc={
           afterLogIn: jasmine.createSpy()

       }, mockBackend,
        deferredSignIn, deferredSignUp, deferredSocialLogin;
    var mockedForm = {};
    // global variable to mimic FB API
    FB = {
        getLoginStatus: function(callback){
            callback({status: 'connected', authResponse: {accessToken: 'token'}});
        },
        XFBML: {
            parse: jasmine.createSpy()
        },
        init: jasmine.createSpy()

    };
    var googleClientId = 'google.client.id';
    var mockedSettings = {
        googleClientId: googleClientId,
        configKeys: {
            googleResponseToken: 'access_token'
        },
        facebookAppId: 'appId'
    };

    var mockedAuthDialogManager = {
        showResetPassword: jasmine.createSpy('showResetPassword')
    };

    var email = 'some.user@hybris.com';
    var authModel = {
        email: email,
        password: 'secret'
    };
    $modalInstanceMock = {
        close: jasmine.createSpy('close')
    };

    //***********************************************************************
    // Common Setup
    // - shared setup between constructor validation and method validation
    //***********************************************************************

    // configure the target controller's module for testing - see angular.mock
    beforeEach(angular.mock.module('restangular'));
    beforeEach(angular.mock.module('ui.router'));
    beforeEach(module('ds.auth', function ($provide) {
        $provide.value('settings', mockedSettings);
        $provide.value('GlobalData', mockedGlobalData);
        $provide.value('$translate', {});
        $provide.value('SessionSvc', mockedSessionSvc);
    }));



    beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _$httpBackend_, _$window_) {

        this.addMatchers({
            toEqualData: function (expected) {
                return angular.equals(this.actual, expected);
            }
        });
        $rootScope =  _$rootScope_;
        $scope = _$rootScope_.$new();
        $controller = _$controller_;
        $q = _$q_;
        mockBackend = _$httpBackend_;
        $window = _$window_;
    }));

    beforeEach(function () {
        deferredSignIn = $q.defer();
        deferredSignUp = $q.defer();
        deferredSocialLogin = $q.defer();

        MockedAuthSvc = {
            user:{},

            errors:{},

            formSignUp: jasmine.createSpy('formSignUp'),
            formSignIn: jasmine.createSpy('formSignIn'),
            clearErrors: jasmine.createSpy('clearErrors'),
            isAuthenticated: jasmine.createSpy('isAuthenticated'),
            requestPasswordReset: jasmine.createSpy('requestPasswordReset'),
            changePassword: jasmine.createSpy('changePassword'),
            signin: jasmine.createSpy('signin').andCallFake(function(){
                return deferredSignIn.promise;
            }),
            signup: jasmine.createSpy('signup').andCallFake(function() {
                return deferredSignUp.promise;
            }),
            initFBAPI: jasmine.createSpy('initFBAPI').andCallFake(function(){
                return deferredSocialLogin.promise;
            }),

            onGoogleLogIn: jasmine.createSpy('onGoogleLogIn'),
            fbParse: jasmine.createSpy('fbParse'),
            faceBookLogin: jasmine.createSpy('faceBookLogin'),
            socialLogin: jasmine.createSpy('socialLogin')
        };

        AuthModalDialogCtrl = $controller('AuthModalDialogCtrl', {$scope: $scope, $modalInstance: $modalInstanceMock,
            $controller: $controller, $q: $q, AuthSvc: MockedAuthSvc, SessionSvc: mockedSessionSvc,
           settings: mockedSettings, AuthDialogManager: mockedAuthDialogManager, loginOpts: mockedLoginOpts, $window: $window }
       );
    });

    it("should expose correct data to the scope", function() {
        expect($scope.user).toBeDefined();
        expect($scope.errors).toBeDefined();
        expect($scope.signup).toBeDefined();
        expect($scope.signin).toBeDefined();
        expect($scope.continueAsGuest).toBeDefined();
        expect($scope.showResetPassword).toBeDefined();
        expect($scope.clearErrors).toBeDefined();
        expect($scope.googleClientId).toEqualData(googleClientId);
    });

    describe('signin()', function(){

        it("should call AuthSvc signin if form valid", function() {
            mockedForm.$valid = true;
            $scope.signin(authModel, mockedForm);
            expect(MockedAuthSvc.formSignIn).toHaveBeenCalled();
        });

        it('should not call AuthSvc if form invalid', function(){
            mockedForm.$valid = false;
            $scope.signin(authModel, mockedForm);
            expect(MockedAuthSvc.signin).not.toHaveBeenCalled();
        });

        it('on success should set hybris user and close dialog', function(){
            mockedForm.$valid = true;

            $scope.errors.signin = ['bad stuff'];
            $scope.signin(authModel, mockedForm);
            deferredSignIn.resolve({});
            $rootScope.$apply();

            expect($scope.errors.signin).toEqualData(['bad stuff']);
        });

        it('should set errors on failure', function(){
            mockedForm.$valid = true;
            $scope.errors.signin = [{message: 'PASSWORD_INVALID'}];
            $scope.signin(authModel, mockedForm);
            deferredSignIn.reject({status: 400, data:{ details:[{field: 'password'}]}});
            $rootScope.$apply();
            expect($scope.errors.signin).toEqualData([{message: 'PASSWORD_INVALID'}]);
        });
    });

    describe('signup', function(){

        it("should call AuthSvc signup if form valid form valid", function() {
            mockedForm.$valid = true;
            $scope.errors.signup = ['bad stuff'];
            $scope.signup(authModel, mockedForm);

            deferredSignUp.resolve({});
            $rootScope.$apply();
            expect(MockedAuthSvc.formSignUp).toHaveBeenCalled();
        });

        it('should not call AuthSvc if form invalid', function(){
            mockedForm.$valid = false;
            $scope.signup(authModel, mockedForm);
            expect(MockedAuthSvc.signup).not.toHaveBeenCalled();
        });
    });

    describe('showResetPassword()', function(){
       it('should delegate to AuthDialogManager', function(){
          $scope.showResetPassword();
           expect(mockedAuthDialogManager.showResetPassword).toHaveBeenCalled();
       });
    });

    describe('continueAsGuest()', function(){
       it('should close dialog', function(){
           $scope.continueAsGuest();
           expect($modalInstanceMock.close).toHaveBeenCalled();
       });
    });

    describe('closeDialog()', function(){
       it('should close dialog', function(){
           $scope.closeDialog();
           expect($modalInstanceMock.close).toHaveBeenCalled();
       });
    });

    describe('clearErrors()', function () {
        it('should set error message to empty', function () {
            $scope.errors.signin = ['something is wrong'];
            $scope.errors.signup = ['more stuff wrong'];
            $scope.clearErrors();
            expect(MockedAuthSvc.clearErrors).toHaveBeenCalled();
        });
    });

    describe('fbLogin()', function(){
        it('should invoke social login', function(){
            var token = 'token';
            $scope.fbLogin();
            expect(MockedAuthSvc.faceBookLogin).toHaveBeenCalled();
        });
    });

    describe('onGoogleLogin', function(){
       it('should invoke social login for non-auto login', function(){
           var token = 'token';
           var eventObj = {
               access_token: token,
                status:{method: 'whatever'}
           };
           $rootScope.$broadcast('event:google-plus-signin-success', eventObj );
           deferredSocialLogin.resolve();
           $scope.$apply();
           expect(MockedAuthSvc.onGoogleLogIn).toHaveBeenCalled();
       });

        it('should NOT invoke social login for auto login', function(){
            var token = 'token';
            var eventObj = {
                access_token: token,
                status:{method: 'AUTO'}
            };
            $rootScope.$broadcast('event:google-plus-signin-success', eventObj );
            deferredSocialLogin.resolve();
            $scope.$apply();
            expect(MockedAuthSvc.socialLogin).not.toHaveBeenCalled();
        });
    });

});
