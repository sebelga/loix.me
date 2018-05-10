---
title: "How to add a cache layer to the Google Datastore"
date: "2018-05-10"
draft: false
categories: ["Open Source"]
tags: ["NoSQL", "cache", "Google Datastore", "Node.js"]
canonicalCrossDomain: "https://medium.com/@sebelga/how-to-add-a-cache-layer-to-the-google-datastore-in-node-js-ffb402cd0e1c"
---

> This article was first [posted on Medium](https://medium.com/@sebelga/how-to-add-a-cache-layer-to-the-google-datastore-in-node-js-ffb402cd0e1c). Please leave me your comments there, thanks!

We all know the importance of caching to **improve the performance of our application**. There are multiple places where we can add a cache layer and today we are going to see how we can add a cache layer at the **application level**. This cache will prevent us from hitting the Datastore again and again, asking for the same _unmodified_ data.

But how do we easily cache Datastore entities _**Keys**_ or Datastore _**Queries**_? How do we know when we need to **invalidate the cache** so we are sure to always fetch the latest data from the Datastore?

I am going to document here the process I’ve been going through to give a solution to those questions. This process led me to first release [gstore-cache](https://github.com/sebelga/gstore-cache). But then realized that the cache mechanism could be used for other NoSQL databases and I separated the [**cache logic**](https://github.com/sebelga/nsql-cache) (nsql-cache) from the database implementation, and made it vendor agnostic.

I have just released the first database adapter for the Google Datastore:
[**nsql-cache-datastore**](https://github.com/sebelga/nsql-cache-datastore). This **cache layer** sits right _in front_ of the [@google-cloud/datastore](https://github.com/googleapis/nodejs-datastore) client and automatically manage the cache for you.

# The default, “magic” way

I am going to show you straight away how easy it is to add a cache layer to your existing application with nsql-cache-datastore. Hopefully this way I will be able to keep your attention throughout all the post… :)

## Install the dependencies

{{< highlight go "linenos=table" >}}
npm install nsql-cache nsql-cache-datastore --save
{{< / highlight >}}

## Instantiate the cache

{{< highlight go "linenos=table" >}}
// datastore.js

const Datastore = require("@google-cloud/datastore");
const NsqlCache = require("nsql-cache"); // 1
const dsAdapter = require("nsql-cache-datastore"); // 2

const datastore = new Datastore();
const cache = new NsqlCache({ db: dsAdapter(datastore) }); // 3

module.exports = { datastore, cache } ;
{{< / highlight >}}

That’s it. With this 3 lines of code, you’ve added an **LRU memory cache** for your entities fetching that will give a performance boost to your app right away.
It has the following default configuration:

* Maximum number of objects in cache: 100
* TTL (time to live) for entities (fetch by Key): 10 minutes
* TTL for Queries: 5 second

The rest of your application code does not change. Import the @google-cloud/datastore instance from the file above and use its API.

{{< highlight go "linenos=table" >}}
import { datastore } from "./datastore";

const key1 = datstore.key(["Post", 123]);
const key2 = datstore.key(["Post", 456]);

datastore.get([key1, key2).then((result) => {
    const [entity1, entity2] = result;
    ...
});
{{< / highlight >}}

The `datastore.get()`, `datastore.save()`, `datastore.createQuery()` and all the necessary methods from the @google-cloud/datastore have been **wrapped** by nsql-cache and you don’t have to worry about the cache.

If you don’t like so much magic, I will show you below how you can deactivate the wrapping of the client and manually manage the cache.

A nice feature to highlight is when you do batch operations (muliple keys) with the `datastore.get()` method. nsql-cache will **_only_ fetch the keys that it does not find in the cache** (in multi-stores — that we will see below — this means that it will go through each cache sequentially, looking for the keys not found in the previous cache).
In the previous example, if _key1_ is in the cache but not _key2_, nsql-cache will **only** fetch the key2 from the Datastore.

A memory cache on the server is great to add a quick performance boost, but it has, of course, its **limitations** (e.g. in _Serverless_ there is no such thing as shared memory between requests).

Let’s see how we can connect nsql-cache to a global [_Redis_ database](https://redis.io/).

## Connect to Redis

{{< highlight go "linenos=table" >}}
const Datastore = require("@google-cloud/datastore");
const NsqlCache = require("nsql-cache");
const dsAdapter = require("nsql-cache-datastore");
const redisStore = require("cache-manager-redis-store");

const datastore = new Datastore();
const cache = new NsqlCache({
    db: dsAdapter(datastore),
    stores: [{
        store: redisStore,
        host: "localhost", // default value
        port: 6379, // default value
        auth_pass: "xxxx"
    }]
});

module.exports = { datastore, cache };
{{< / highlight >}}

You now have a Redis cache with the following default configuration:

* TTL for entities (keys): 1 day
* TTL queries: 0 → infinite

**Infinite cache** for queries? Really? … Yes :)

A Query on the Datastore is always associated with an Entity _Kind_. This means that if we have a way to keep a _reference_ to all the queries we have made for each Entity Kind, we can then **invalidate** their cache only when an entity of the _same_ Kind is added/updated or deleted.

And that’s exactly what nsql-cache is doing when a Redis client is provided. Each time a Datastore Query successfully resolves, 3 operations take place:

* Generate a unique _cache key_ for the Query
* Save the response from the Query in Redis at this cache key
* In a **parallel operation**, save the cache key into a Redis **_Set_**

The next time we add, update or delete an entity, nsql-cache will:

* Read the Redis Set _members_ (cache keys) for this entity _Kind_
* Delete all the cache keys (and thus invalidate the queries cache)

## Configuration

Depending on the size of your application, keeping an infinite cache for the queries might be too much for you (yes it can get very big!).
Let’s see how to set a different Time To Live for Keys and Queries.

{{< highlight go "linenos=table" >}}
const cache = new NsqlCache({
    db: dsAdapter(datastore),
    stores: [{
        store: redisStore,
        host: "localhost",
        port: 6379,
        auth_pass: "xxxx",
    }],
    config: {
        ttl: {
            keys: 60 * 60, // 1 hour
            queries: 60 * 30 // 30 minutes
        }
    }
});
{{< / highlight >}}

As you see, you just need to provide a duration in seconds for each type of cache, and Redis will automatically delete the expired cache.

Note: the TTL duration defined here in the configuration can be overridden on any request later on.

## Multi-stores cache

Those paying attention have probably noticed that the stores setting is an Array. This is because nsql-cache uses the great [cache-manager library](https://github.com/BryanDonovan/node-cache-manager) under the hood that lets you define **multiple cache stores** with different TTL values in each one.

This allows you, for example, to have one extremely fast _memory_ cache for your most accessed entities/queries (with a short TTL), and a second _Redis_ cache for longer TTLs (also extremely fast but some latency for the network i/o cannot be avoided).

Let’s see how we would set up 2 cache stores.

{{< highlight go "linenos=table" >}}
const cache = new NsqlCache({
    db: dsAdapter(datastore),
    stores: [{
        store: "memory",
        max: 100, // maximum number of objects
    },{
        store: redisStore,
        host: "localhost", // default value
        port: 6379, // default value
        auth_pass: "xxxx",
    }]
});
{{< / highlight >}}

And to change the default TTL values for each store, provide a configuration object in the ttl config by store _name_.

{{< highlight go "linenos=table" >}}
const cache = new NsqlCache({
    ...,
    config: {
        ttl: {
            memory: {
                keys: 60 * 5, // default
                queries: 5 // default
            },
            redis: {
                keys: 60 * 60 * 24, // default
                queries: 0 // default (infinite)
            },
        }
    }
});
{{< / highlight >}}

## Complex queries

As we have seen, nsql-cache automatically keeps a reference to all the queries of each Entity Kind (if a Redis client has been provided). In some cases, you might want to **aggregate** multiple queries and save them as one key/value. nsql-cache has a method for that: `cache.queries.kset()`.

Let’s see an example where we make multiple queries to fetch the data for the Home page of a website.

{{< highlight go "linenos=table" >}}
const { datastore, cache } = require("./datastore");
const fetchHomeData = () => {
    // Check the cache first...
    return cache.get("website:home").then(data => {
        if (data) {
            // in cache, great!
            return data;
        }

        // Cache not found, query the data..
        const queryPosts = datastore
            .createQuery("Posts")
            .filter("category", "tech")
            .limit(10)
            .order("publishedOn", { descending: true });

        const queryTopStories = datastore
            .createQuery("Posts")
            .order("score", { descending: true })
            .limit(3);

        const queryProducts = datastore
            .createQuery("Products")
            .filter("featured", true);

        return Promise.all([
            queryPosts.run(),
            queryTopStories.run(),
            queryProducts.run()
        ])
        .then(([posts, topStories, products]) => {
            // Aggregate our data
            const homeData = {
                posts,
                topStories,
                products,
            };

            // We save the result of the 3 queries
            // to the "website:home" cache key
            // and associate the data to 
            // the "Posts" & "Products" Entity Kinds.
            // We can now safely keep the cache infinitely
            // until we add/edit or delete a "Posts" or a 
            // "Products" entity Kind
            return cache.queries
                .kset(
                     "website:home",
                     homeData,
                     ["Posts", "Products"]
                );
        });
    });
};
{{< / highlight >}}

# The advanced, “manual” way

If you don’t want so much magic and prefer to manage the cache yourself, you can disable the wrapping of the @google-cloud/datastore client and use the [NsqlCache API](https://github.com/sebelga/nsql-cache#api).

{{< highlight go "linenos=table" >}}
const cache = new NsqlCache({
    db: dsAdapter(datastore),
    config: {
        wrapClient: false
    }
});
{{< / highlight >}}

You are now in charge to manage the cache. You can use yet another layer of abstraction with the `cache.keys.read()` and `cache.queries.read()` methods.

{{< highlight go "linenos=table" >}}
const { datastore, cache } = require("./datastore");
const key = datastore.key(["Company", "Google"]);

// The cache.keys.read() will:
// - check the cache
// - if not found, fetch from the Datastore
// - prime the cache
cache.keys.read(key).then(([entity]) => { ... })
{{< / highlight >}}

Or you can go 100% manual… (you really want that?)

{{< highlight go "linenos=table" >}}
const { datastore, cache } = require("./datastore");
const key = datastore.key(["Company", "Google"]);
cache.get(key)
    .then(entity) => {
        if (entity){
            return entity;
        }
        return datastore.get(key)
            .then(([entity]) => {
                if (!entity) {
                    return;
                }
                // Prime the cache
                return cache.set(key, entity);
            })
    });
{{< / highlight >}}

If you are not wrapping the datastore client, read the Nsql API documentation and look at the examples in [**nsql-cache-datastore**](https://github.com/sebelga/nsql-cache-datastore) repository.

That’s it. I hope that with this post I have shown you **how easy it is to add a cache layer** for your Google Datastore entities. I hope that in a future post I will be able to come with some benchmarks (if someone can point me to a good tool/service to do them I’d appreciate it!).

Please leave me your comments about the approach I’ve taken in [the Medium article](https://medium.com/@sebelga/how-to-add-a-cache-layer-to-the-google-datastore-in-node-js-ffb402cd0e1c), and if you see any improvement that could be done, let me know!

Thanks for reading!
