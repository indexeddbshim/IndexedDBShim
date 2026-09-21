describe('DOMStringList', function () {
    'use strict';

    if (!env.isNative) {
        // Exposed with a `Shim`-prefix (`ShimDOMStringList`), not as a bare
        //   `DOMStringList` global -- see `setGlobalVars.js`'s
        //   `addNonIDBGlobals` handling, which prefixes non-`IDB*`-named
        //   interfaces to avoid shadowing an environment's own globals.
        it('should throw "Illegal constructor" when called directly', function () {
            expect(() => {
                // eslint-disable-next-line no-new -- Testing the throw
                new ShimDOMStringList();
            }).to.throw(TypeError, 'Illegal constructor');
        });

        it('should throw "Illegal invocation" when `length` is read on a non-instance', function () {
            const {get} = Object.getOwnPropertyDescriptor(ShimDOMStringList.prototype, 'length');
            expect(() => {
                get.call(ShimDOMStringList.prototype);
            }).to.throw(TypeError, 'Illegal invocation');
        });

        it('should support `forEach` and `map` on a real instance', function (done) {
            this.timeout(20000);
            testHelper.createObjectStores(undefined, (error, [objectStore]) => {
                if (error) {
                    done(error);
                    return;
                }
                const {objectStoreNames} = objectStore.transaction.db;
                expect(objectStoreNames.length, 'has at least one store name').to.be.above(0);

                const namesViaIndex = [];
                for (let i = 0; i < objectStoreNames.length; i++) {
                    namesViaIndex.push(objectStoreNames[i]);
                }

                const forEachResults = [];
                objectStoreNames.forEach((name) => forEachResults.push(name));
                expect(forEachResults).to.deep.equal(namesViaIndex);

                const mapped = objectStoreNames.map((name) => name.toUpperCase());
                expect(mapped).to.deep.equal(namesViaIndex.map((name) => name.toUpperCase()));

                objectStore.transaction.db.close();
                done();
            });
        });
    }
});
