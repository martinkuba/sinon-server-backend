
describe('sinonServerBackend', function() {

    it('has create factory method', function() {
        var instance = sinonServerBackend.create();
        expect(instance).toBeDefined();
    });

    it('factory method returns unique instance', function() {
        var instance1 = sinonServerBackend.create();
        var instance2 = sinonServerBackend.create();

        expect(instance1).not.toBe(instance2);
        expect(instance1)
    });

    it('instances have the same prototype', function() {
        var instance1 = sinonServerBackend.create();
        var instance2 = sinonServerBackend.create();

        expect(instance1.__proto__).toBeDefined();
        expect(instance1.__proto__).toBe(instance2.__proto__);
    });

    it('mocks XMLHttpRequest when start method is called', function() {        
        var instance = sinonServerBackend.create();
        spyOn(sinon, 'useFakeXMLHttpRequest').and.returnValue({});  

        instance.start();        

        expect(sinon.useFakeXMLHttpRequest).toHaveBeenCalled();        
    });

    it('stores fake XMLHttpRequest in xhr property', function() {
        var mockXMLHttpRequest = {};
        var instance = sinonServerBackend.create();
        spyOn(sinon, 'useFakeXMLHttpRequest').and.returnValue(mockXMLHttpRequest);
        
        instance.start();
        
        expect(instance.xhr).toBe(mockXMLHttpRequest);        
    });

    it('calls restore on fake XMLHttpRequest when restore method is called', function() {
        var mockXMLHttpRequest = { restore: function() {} };
        var instance = sinonServerBackend.create();
        spyOn(sinon, 'useFakeXMLHttpRequest').and.returnValue(mockXMLHttpRequest);
        spyOn(mockXMLHttpRequest, 'restore');
        
        instance.start();            
        expect(mockXMLHttpRequest.restore).not.toHaveBeenCalled();

        instance.restore();            
        expect(mockXMLHttpRequest.restore).toHaveBeenCalled();        
    });

    describe('when', function() {

        var server;

        beforeEach(function() {
            server = sinonServerBackend.create();
            server.start();
        });

        afterEach(function() {            
            server.restore();
        });

        it('provides response', function() {
            var responseData = '{ "prop": "value" }';

            server.when('GET', '/test')
                .respond(200, responseData);

            var request = createRequest('GET', '/test');
            request.onload = function(e) {
                expect(request.responseText).toBe(responseData);  
            }
            request.open("GET", '/test', true);
            request.send();

            server.flush();
        });

        it('provides the same response to multiple requests', function() {
            var calls = 0;
            var responseData = '{ "prop": "value" }';

            function handleOnLoad() {
                calls++;
                expect(request.responseText).toBe(responseData);                  
            }

            server.when('GET', '/test')
                .respond(200, responseData);

            var request = createRequest('GET', '/test');
            request.onload = handleOnLoad;
            server.flush();

            var request2 = createRequest('GET', '/test');
            request2.onload = handleOnLoad;
            server.flush();

            expect(calls).toBe(2);
        });

        it('accepts function for url parameter', function() {
            server.when('GET', function(url) {
                return url.indexOf('test') > -1;
            }).respond(200, '{}');

            var called = false;
            var request = createRequest('GET', '/test');
            request.onload = function() {
                called = true;
            };
            server.flush();

            expect(called).toBeTruthy();
        });

        it('when url function returns false, the request is not matched', function() {
            server.when('GET', function(url) {
                return url.indexOf('test') > -1;
            }).respond(200, '{}');

            var called = false;
            var request = createRequest('GET', '/someOther');
            request.onload = function() {
                called = true;
            };

            // flush is going to throw an exception
            try {
                server.flush();
            }
            catch(e) {}           

            expect(called).toBeFalsy();
        });
    });

    describe('expect', function() {

        var server;

        beforeEach(function() {
            server = sinonServerBackend.create();
            server.start();
        });

        afterEach(function() {            
            server.restore();
        });            

        it('provides response to a single request', function() {
            var responseData = '{ "prop": "value" }';

            server.expect('GET', '/test')
                .respond(200, responseData);

            var request1 = createRequest('GET', '/test')
            server.flush();

            var request2 = createRequest('GET', '/test');
            expect(function() { server.flush(); }).toThrow();            
        });

        it('must be fulfilled in the correct order', function() {
            server.expect('GET', '/someOther').respond(200, 'a');
            server.expect('GET', '/test').respond(200, 'b');

            var request = createRequest('GET', '/test');
            expect(function() { server.flush(); }).toThrow();
        });

        it('takes precedence over response defined by when', function() {
            server.when('GET', '/test').respond(200, 'a');
            server.expect('GET', '/test').respond(200, 'b');

            var request = createRequest('GET', '/test');
            request.onload = function() {
                expect(request.responseText).toBe('b');
            };

            server.flush();
        });
    });

    describe('flush', function() {

        var server;

        beforeEach(function() {
            server = sinonServerBackend.create();
            server.start();
        });

        afterEach(function() {            
            server.restore();
        }); 

        it('throws an error when no mock response or expectation matches the request', function() {
            var request = createRequest('GET', '/test');
            expect(function() { server.flush(); }).toThrow();
        });
    });

    describe('verifyNoOutstandingExpectation', function() {

        var server;

        beforeEach(function() {
            server = sinonServerBackend.create();
            server.start();
        });

        afterEach(function() {            
            server.restore();
        }); 

        it('throws an exception when an expect response has not been fulfilled', function() {
            server.expect('GET', '/test').respond(200);
            expect(function() { server.verifyNoOutstandingExpectation(); }).toThrow();
        });
    });

    describe('verifyNoOutstandingRequest', function() {

        var server;

        beforeEach(function() {
            server = sinonServerBackend.create();
            server.start();
        });

        afterEach(function() {            
            server.restore();
        }); 

        it('throws an exception when there are requests that have not been fulfilled', function() {
            var request = createRequest('GET', '/test');
            expect(function() { server.verifyNoOutstandingRequest(); }).toThrow();
        });
    });
});

function createRequest(method, url) {
    var request = new XMLHttpRequest();                
    request.open(method, url, true);
    request.send();
    return request;
}
