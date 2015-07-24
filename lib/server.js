
(function() {

var sinonServerBackend = (function() {

    function findWhenResponse(server, request) {
        var found = null;
        server.whenResponses.forEach(function(spec) {
            if (isMatch(request, spec)) {
                found = spec;
                return false;
            }
        });
        return found;
    }

    function findExpectation(server, request) {
        if (server.expectedResponses.length > 0) {
            var spec = server.expectedResponses[0];
            if (isMatch(request, spec)) {
                server.expectedResponses.splice(0, 1);
                return spec;
            }
            else {
                throw new Error('Unexpected request to ' + request.url);
            }
        }
        return null;
    }

    function isMatch(request, spec) {
        if (typeof spec.request.url === 'function') {
            if (spec.request.url(request.url) === true) {
                return true;
            }
        }
        else if (spec.request.url === request.url) {
            return true;
        }
        return false;
    }

    function createSpec(method, url, data, headers) {
        return {
            request: {
                method: method,
                url: url,
                data: data,
                headers: headers
            },                    
            respond: function(status, data, headers) {
                this.response = {
                    status: status,
                    data: data,
                    headers: headers
                };
            }
        };
    }

    var serverPrototype = {

        start: function() {
            var me = this;

            this.xhr = sinon.useFakeXMLHttpRequest();  
            this.pendingRequests = [];

            this.xhr.onCreate = function (xhrObj) {
                me.pendingRequests.push(xhrObj);
            };
        },

        restore: function() {
            this.xhr.restore();
        },

        expect: function(method, url, data, headers) {
            var spec = createSpec(method, url, data, headers);
            this.expectedResponses.push(spec);    
            return spec;
        },

        when: function(method, url, data, headers) {
            var spec = createSpec(method, url, data, headers);
            this.whenResponses.push(spec);    
            return spec;                                
        },              

        flush: function() {
            var me = this;
            var i, request, response;

            for (i = 0; i < this.pendingRequests.length; i++) {
                request = this.pendingRequests[i];
                response = findExpectation(me, request);
                if (!response) {
                    response = findWhenResponse(me, request);
                }

                if (response && response.response) {                    
                    request.respond(response.response.status, 
                        response.response.headers, response.response.data);                        
                }
                else {
                    throw new Error('Unexpected request to ' + request.url);
                }
            }

            this.pendingRequests = [];
        },

        verifyNoOutstandingExpectation: function() {
            if (this.expectedResponses.length > 0) {
                throw new Error('There are outstanding expectations.');
            }
        },

        verifyNoOutstandingRequest: function() {
            if (this.pendingRequests.length > 0) {
                throw new Error('There are outstanding requests that have not been flushed.');
            }
        }
    };

    return {
        create: function() {
            var instance = Object.create(serverPrototype, {
                pendingRequests: { writable: true, configurable: false, enumerable: false, value: [] },
                whenResponses: { writable: true, configurable: false, enumerable: false, value: [] },
                expectedResponses: { writable: true, configurable: false, enumerable: false, value: [] }
            });

            return instance;
        }
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sinonServerBackend;
}
else {
    this.sinonServerBackend = sinonServerBackend;
}

})();

