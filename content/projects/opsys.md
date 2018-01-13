---
date: "2018-01-01"
title: "Opsys"
authors: []
categories: ["Front-end development"]
tags: ["Angular", "Redux", "rxjs", "Front-end Architecture"]
draft: false
current: true
shortDescr: "Angular (5+) application for the European Commission"
---

The DG DEVCO of the European Commission needed a revamp of an old platform to manages all the Europaid funds around the world.  Opsys is this new platform and Angular has been chosen as front-end framework to develop this multi-modules application.

Opsys relies on a UI library of Angular components built by the Commission, and a Core module that provides core functionalities (exceptions, traces, localization, storage...). In order to allow several teams to develop modules for the application, an "app shell (empty container)" has been created as a replica of the production app. The teams are then responsible for maintaining their module and publish it to a npm repository.

The final application is then *only* responsible for fetching the npm package and create the final build.

At the beginning of the project I developed a few feature modules. Currently, I am working on the Core Module, front-end architecture optimisation as well as cross functionalities (corporate search, help tools...)

#### Stack (front-end)
Angular, ngrx (redux), karma, jasmine
