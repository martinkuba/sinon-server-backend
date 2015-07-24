# sinon-backend-server

An alternative implementation of [Sinon.js](https://github.com/cjohansen/Sinon.JS) fake server that provides expectations similar to AngularJS [$httpBackend](https://docs.angularjs.org/api/ngMock/service/$httpBackend).

## Installation
Include /lib/server.js file in your project.

## Usage


Start and stop the fake server:

```js
var server = sinonServerBackend.create();
    
// start using fake XMLHttpRequest
server.start();
    
// restore XMLHttpRequest global function
server.restore();
```
Setup a repeatable response:
```js
server.when('GET', '/test').respond(200, 'some data');
```
Setup an expectation:
```js
server.expect('GET', '/test').respond(200, 'some data');
```
Process pending requests:
```js
server.flush();
```
Verify that all requests have been processed:
```js
server.verifyNoOutstandingRequest();
```
Verify that all expectations have been processed:
```js
server.verifyNoOutstandingExpectation();
```

### Trained responses vs expectations
Trained responses are defined using `when()`, while expectations are defined using `expect()`.  Trained responses simply return a pre-defined response to any number of requests.  Expectation provides only a single response.

Expectations also need to be fulfilled in the order they are defined.  If there is a pending expectation and a different request is made, then the fake server will throw an exception.

Also, when no response or expectation is defined and a request is made, the fake sever will throw an "unexpected request" exception.


## Example

```js
describe('using sinonServerBackend', function() {

    var server;

    beforeEach(function() {
        server = sinonServerBackend.create();
        // start using fake XMLHttpRequest
        server.start();
    });

    afterEach(function() {            
        // restore XMLHttpRequest global function
        server.restore();
    });

    it('provides repeatable responses', function() {
        server.when('GET', '/test').respond(200, 'some data');

        callTestApi();
        // success
        server.flush();
        
        callTestApi();
        // success again
        server.flush();
    });
   
    it('provides a single expected response', function() {
        server.expect('GET', '/test').respond(200, 'some data');

        callTestApi();
        server.flush();
        
        callTestApi();
        // will fail because the expectation has been fulfullied already, and 
        // the second call is seen as unexpected
        server.flush();
    });
```