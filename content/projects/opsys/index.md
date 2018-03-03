---
title: "Opsys"
date: "2018-01-01"
authors: []
categories: ["Front-end dev", "Front-end architecture"]
tags: ["Angular", "Redux", "rxjs", "Node.js", "karma", "jasmine", "SystemJS"]
draft: false
current: true
shortDescr: "Angular (5+) application for the European Commission"
gallery: true
galleryImgRatio: "1200x618"
---

The DG DEVCO of the European Commission needed a revamp of an old platform to manages all the Europaid funds around the world.  Opsys is this new platform and Angular has been chosen as front-end framework to develop this multi-modules application.

Opsys relies on a UI library of Angular components built by the Commission, and a Core module that provides core functionalities (exceptions, traces, localization, storage...). In order to allow several teams to develop modules for the application, an "app shell (empty container)" has been created which is a replica of the production application. The teams are then able to develop their packages against this container in isolation. The packages are then published to a private npm registry, triggering the CI and deployement.

At the beginning of the project I developed a few feature modules. Currently I am working on the Core module, front-end architecture optimisation/tooling as well as cross functionalities (offline capability, corporate search, help tool...).
