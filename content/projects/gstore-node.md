---
title: "gstore-node"
date: "2017-07-01"
draft: false
shortDescr: "'Mongoose' clone for the Google Datastore"
categories: ["Open Source"]
tags: ["Node.js", "Goolge Datastore", "mocha", "chai"]
current: true
---

<img src="https://raw.githubusercontent.com/sebelga/gstore-node/master/logo/logo.png">

gstore-node is a _Mongoose_ clone for the [Google Datastore](https://cloud.google.com/datastore/docs/concepts/overview). This module let the developers create Schemas to model the entities to be saved in the Datastore.

With those Schemas gstore node can then validate the entity data (properties _type_ and _value_) to be saved in the Datastore.

Its other main features are:  

* Custom methods on entities
* virtual properties
* shortcut queries
* Middleware functions ("hooks") executed before and after saving/deleting entities

See the [github repository](https://github.com/sebelga/gstore-node)
