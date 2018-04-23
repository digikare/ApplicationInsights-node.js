﻿import assert = require("assert");
import sinon = require("sinon");
var http = require("http");
var https = require("https");
import url = require('url');

import Util = require("../../Library/Util");

describe("Library/Util", () => {

    describe("#getCookie(name, cookie)", () => {

        var test = (cookie: string, query: string, expected: string) => {
            var actual = Util.getCookie(query, cookie);
            assert.equal(expected, actual, "cookie is parsed correctly");
        }

        it("should parse expected input", () => {
            test("testCookie=id|acq|renewal", "testCookie", "id|acq|renewal");
        });

        it("should parse expected input with another cookie present before", () => {
            test("other=foo; testCookie=id|acq|renewal", "testCookie", "id|acq|renewal");
        });

        it("should parse expected input with another cookie present after", () => {
            test("another=bar; ;a=testCookie=; testCookie=id|acq|renewal; other=foo|3|testCookie=", "testCookie", "id|acq|renewal");
        });

        it("should ignore similar names", () => {
            test("xtestCookiex=id|acq|renewal", "testCookie", "");
        });

        it("should not crash on unexpected input", () => {
            test("", "testCookie", "");
        });
    });

    describe("#trim(str)", () => {
        it("should not crash", () => {
            assert.doesNotThrow(() => Util.trim(undefined));
            assert.doesNotThrow(() => Util.trim(null));
            assert.doesNotThrow(() => Util.trim(""));
            assert.doesNotThrow(() => Util.trim(<any>3));
            assert.doesNotThrow(() => Util.trim(<any>{}));
            assert.doesNotThrow(() => Util.trim(<any>[]));
        });

        it("should trim strings", () => {
            assert.equal(Util.trim(""), "");
            assert.equal(Util.trim("\t"), "");
            assert.equal(Util.trim("\n"), "");
            assert.equal(Util.trim("\t\n\r test \t\n\r"), "test");
            assert.equal(Util.trim("\t\n\r test \t\n\r test \t\n\r"), "test \t\n\r test");
        });
    });

    describe("#newGuid()", () => {
        it("should generate a valid guid", () => {
            var mathStub = sinon.stub(Math, "random", () => 0);
            var expected = "00000000-0000-4000-8000-000000000000";
            var actual = Util.newGuid();
            assert.equal(actual, expected, "expected guid was generated");
            mathStub.restore();
        });
    });

    describe("#isArray(obj)", () => {
        it("should detect if an object is an array", () => {
            assert.ok(Util.isArray([]));
            assert.ok(!Util.isArray("sdf"));
            assert.ok(Util.isArray([0, 1]));
            assert.ok(!Util.isArray({ length: "" }));
            assert.ok(!Util.isArray({ length: 10 }));
        });
    });

    describe("#isError(obj)", () => {
        it("should detect if an object is an instance of Error", () => {
            class MyError extends Error {
                constructor() {
                    super();
                }
            }

            assert.ok(!Util.isError(undefined));
            assert.ok(!Util.isError(null));
            assert.ok(!Util.isError(true));
            assert.ok(!Util.isError(1));
            assert.ok(!Util.isError(""));
            assert.ok(!Util.isError([]));
            assert.ok(!Util.isError({}));
            assert.ok(Util.isError(new Error()));
            assert.ok(Util.isError(new MyError()));
        });
    });

    describe("#random32()", () => {
        let test = (i: number, expected: number) => {
            let mathStub = sinon.stub(Math, "random", () => i);
            assert.equal(Util.random32(), expected);
            mathStub.restore();
        }
        it("should generate a number in the range [-0x80000000..0x7FFFFFFF]", () => {
            test(0, 0);
            test(0.125, 0x20000000);
            test(0.25, 0x40000000);
            test(0.5, -0x80000000);
            test(0.75, -0x40000000);
            test(1.0, 0);
        });
    });

    describe("#randomu32()", () => {
        let test = (i: number, expected: number) => {
            let mathStub = sinon.stub(Math, "random", () => i);
            assert.equal(Util.randomu32(), expected);
            mathStub.restore();
        }
        it("should generate a number in the range [0x00000000..0xFFFFFFFF]", () => {
            test(0, 0x80000000);
            test(0.125, 0xA0000000);
            test(0.25, 0xC0000000);
            test(0.5, 0x00000000);
            test(0.75, 0x40000000);
            test(1.0, 0x80000000);
        });
    });

    describe("#uint32ArrayToBase64()", () => {
        it("should convert an 32-bit array to Base64", () => {
            assert.equal(Util.int32ArrayToBase64([-1, -1, -1, -1]), "/////////////////////w");
            assert.equal(Util.int32ArrayToBase64([0, 0, 0, 0]), "AAAAAAAAAAAAAAAAAAAAAA");
            assert.equal(Util.int32ArrayToBase64([0x1234567]), "ASNFZw");
        });
    });

    describe("#msToTimeSpan(totalMs)", () => {
        var test = (input: number, expected: string, message: string) => {
            var actual = Util.msToTimeSpan(input);
            assert.equal(expected, actual, message);
        }

        it("should convert milliseconds to a c# timespan", () => {
            test(0, "00:00:00.000", "zero");
            test(1, "00:00:00.001", "milliseconds digit 1");
            test(10, "00:00:00.010", "milliseconds digit 2");
            test(100, "00:00:00.100", "milliseconds digit 3");
            test(1 * 1000, "00:00:01.000", "seconds digit 1");
            test(10 * 1000, "00:00:10.000", "seconds digit 2");
            test(1 * 60 * 1000, "00:01:00.000", "minutes digit 1");
            test(10 * 60 * 1000, "00:10:00.000", "minutes digit 2");
            test(1 * 60 * 60 * 1000, "01:00:00.000", "hours digit 1");
            test(10 * 60 * 60 * 1000, "10:00:00.000", "hours digit 2");
            test(24 * 60 * 60 * 1000, "1.00:00:00.000", "hours overflow");
            test(11 * 3600000 + 11 * 60000 + 11111, "11:11:11.111", "all digits");
            test(5 * 86400000 + 13 * 3600000 + 9 * 60000 + 8 * 1000 + 789, "5.13:09:08.789", "all digits with days");
            test(1001.505, "00:00:01.001505", "fractional milliseconds");
            test(1001.5, "00:00:01.0015", "fractional milliseconds - not all precision 1");
            test(1001.55, "00:00:01.00155", "fractional milliseconds - not all precision 2");
            test(1001.5059, "00:00:01.0015059", "fractional milliseconds - all digits");
            test(1001.50559, "00:00:01.0015056", "fractional milliseconds - too many digits, round up");
        });

        it("should handle invalid input", () => {
            test(<any>"", "00:00:00.000", "invalid input");
            test(<any>"'", "00:00:00.000", "invalid input");
            test(NaN, "00:00:00.000", "invalid input");
            test(<any>{}, "00:00:00.000", "invalid input");
            test(<any>[], "00:00:00.000", "invalid input");
            test(-1, "00:00:00.000", "invalid input");
        });
    });

    describe("#enforceStringMap", () => {
        it("should only allow string:string", () => {
            assert.equal(Util.validateStringMap(undefined), undefined);
            assert.equal(Util.validateStringMap(1), undefined);
            assert.equal(Util.validateStringMap(true), undefined);
            assert.equal(Util.validateStringMap("test"), undefined);
            assert.equal(Util.validateStringMap(():void => null), undefined);
            assert.deepEqual(Util.validateStringMap({ a: {} }), { a: "[object Object]" });
            assert.deepEqual(Util.validateStringMap({ a: 3, b: "test" }), { a: "3", b: "test" });
            assert.deepEqual(Util.validateStringMap({ a: 0, b: null, c: undefined, d: [], e: '', f: -1 }), { a: "0", d: "", e: "", f: "-1" });
        });
    });

    describe("#canIncludeCorrelationHeader", () => {
        it("should return true if arguments are missing", () => {
            assert.equal(Util.canIncludeCorrelationHeader(null, null), true);
            assert.equal(Util.canIncludeCorrelationHeader(<any>{ config: null }, null), true);
            assert.equal(Util.canIncludeCorrelationHeader(<any>{ config: { correlationHeaderExcludedDomains: [] } }, null), true);
        });

        it("should return true if domain is not on the excluded list", () => {
            let client = <any>{ config: { correlationHeaderExcludedDomains: ["example.com", "bing.net", "abc.bing.com"] } };
            let url = "http://bing.com/search?q=example.com";

            assert.equal(Util.canIncludeCorrelationHeader(client, url), true);
        });

        it("should return false if domain is on the excluded list", () => {
            let client = <any>{ config: { correlationHeaderExcludedDomains: ["bing.com", "bing.net"] } };
            let url = "http://bing.com/search?q=node";

            assert.equal(Util.canIncludeCorrelationHeader(client, url), false);

            let urlSecure = "https://bing.com/search?q=node";

            assert.equal(Util.canIncludeCorrelationHeader(client, urlSecure), false);

            let secondDomainUrl = "http://bing.net/search?q=node";

            assert.equal(Util.canIncludeCorrelationHeader(client, secondDomainUrl), false);
        });

        it("can take wildcards in the excluded domain list", () => {
            let client = <any>{ config: { correlationHeaderExcludedDomains: ["*.bing.com"] } };
            let url = "https://abc.def.bing.com";

            assert.equal(Util.canIncludeCorrelationHeader(client, url), false);
        });
    });

    describe("#makeRequest()", () => {
        const proxyUrl = "http://10.0.0.1:3128";
        const proxyUrlParsed = url.parse(proxyUrl);
        const options = {
            method: "GET",
            headers: <{ [key: string]: string }>{
                "Content-Type": "application/x-json-stream"
            }
        };

        describe("for http request", () => {
            const requestUrl = "http://abc.def.bing.com";
            const requestUrlParsed = url.parse(requestUrl);

            beforeEach(() => {
                if (process.env.hasOwnProperty('https_proxy')) {
                    delete process.env.https_proxy;
                }
                if (process.env.hasOwnProperty('http_proxy')) {
                    delete process.env.http_proxy;
                }
                if (process.env.hasOwnProperty('no_proxy')) {
                    delete process.env.no_proxy;
                }
                sinon.spy(http, 'request')
            });

            afterEach(() => {
                http.request.restore();
            });

            it("should not override options when http_proxy not defined", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: requestUrlParsed.hostname,
                    port: requestUrlParsed.port,
                    path: requestUrlParsed.pathname,
                };

                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(http.request.getCall(0).args[1], callback);
            });

            it("should not override options when http_proxy not defined and https_proxy is defined", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: requestUrlParsed.hostname,
                    port: requestUrlParsed.port,
                    path: requestUrlParsed.pathname,
                };

                process.env.https_proxy = proxyUrl;
                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(http.request.getCall(0).args[1], callback);
            });

            it("should override options when http_proxy is defined with the correct values", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: proxyUrlParsed.hostname,
                    port: proxyUrlParsed.port,
                    path: requestUrl,
                    headers: {...options.headers,
                        Host: requestUrlParsed.hostname,
                    }
                };

                process.env.http_proxy = proxyUrl;
                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(http.request.getCall(0).args[1], callback);
            });

            it("should not override options when http_proxy is defined with the correct values and no_proxy is defined with the domain", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: requestUrlParsed.hostname,
                    port: requestUrlParsed.port,
                    path: requestUrlParsed.pathname,
                };

                process.env.no_proxy = "abc.def.bing.com";
                process.env.http_proxy = proxyUrl;
                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(http.request.getCall(0).args[1], callback);
            });
        });


        describe("for https request", () => {
            const requestUrl = "https://abc.def.bing.com";
            const requestUrlParsed = url.parse(requestUrl);

            beforeEach(() => {
                if (process.env.hasOwnProperty('https_proxy')) {
                    delete process.env.https_proxy;
                }
                if (process.env.hasOwnProperty('http_proxy')) {
                    delete process.env.http_proxy;
                }
                if (process.env.hasOwnProperty('no_proxy')) {
                    delete process.env.no_proxy;
                }
                sinon.spy(http, 'request')
                sinon.spy(https, 'request');
            });

            afterEach(() => {
                http.request.restore();
                https.request.restore();
            });

            it("should not override options when https_proxy not defined", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: requestUrlParsed.hostname,
                    port: requestUrlParsed.port,
                    path: requestUrlParsed.pathname,
                };

                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(https.request.calledOnce, true, "https.request should be called");
                assert.deepEqual(https.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(https.request.getCall(0).args[1], callback);
            });

            it("should not override options when https_proxy not defined and http_proxy is defined", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: requestUrlParsed.hostname,
                    port: requestUrlParsed.port,
                    path: requestUrlParsed.pathname,
                };

                process.env.http_proxy = proxyUrl;
                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(https.request.calledOnce, true);
                assert.deepEqual(https.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(https.request.getCall(0).args[1], callback);
            });

            it("should override options when https_proxy is defined with the correct values", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: proxyUrlParsed.hostname,
                    port: proxyUrlParsed.port,
                    path: requestUrl,
                    headers: {...options.headers,
                        Host: requestUrlParsed.hostname,
                    }
                };

                process.env.https_proxy = proxyUrl;
                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(https.request.calledOnce, false);
                assert.equal(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(http.request.getCall(0).args[1], callback);
            });

            it("should not override options when https_proxy is defined with the correct values and no_proxy is defined with the domain", () => {
                const callback = sinon.spy();
                const expectedOptions = {
                    ...options,
                    host: requestUrlParsed.hostname,
                    port: requestUrlParsed.port,
                    path: requestUrlParsed.pathname,
                };

                process.env.no_proxy = "abc.def.bing.com";
                process.env.https_proxy = proxyUrl;
                const req = Util.makeRequest(requestUrl, options, callback);

                assert.equal(https.request.calledOnce, false);
                assert.equal(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0], expectedOptions);
                assert.deepEqual(http.request.getCall(0).args[1], callback);
            });
        });

    });
});
