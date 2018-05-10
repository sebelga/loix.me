---
title: "Simplify your functions adding “hooks” to your Promises"
date: "2018-04-17"
draft: false
categories: ["Open Source"]
tags: ["Promise", "Node.js", "utility"]
canonicalCrossDomain: "https://medium.com/@sebelga/simplify-your-code-adding-hooks-to-your-promises-9e1483662dfa"
---

> This article was first [posted on Medium](https://medium.com/@sebelga/simplify-your-code-adding-hooks-to-your-promises-9e1483662dfa). Please leave me your comments there, thanks!

For my first post I am going to write about a simple technique to help you decouple pieces of functionalities of your code: **hooks**.

Hooks, or _middleware_, are functions executed right “before” or “after” particular methods. They make it very easy to plug-in/out functionalities and maintain the single responsibility principle of your methods.

You are probably familiar with the hooks of [Express](https://www.npmjs.com/package/express) where functions are executed in sequence before hitting a route handler. Those hooks can prevent a route to be accessed or can add properties to a request. The hooks we will see here have the same purpose but instead of wrapping route handlers we are going to attach them to **Promises**.

To best understand the benefits of hooks, let’s see them through an example.

# Adding middlewares to the Stripe API

Let’s take the Stripe Node.js API and add some hooks to its methods.
Imagine you have the following handler to process payments:

{{< highlight go "linenos=table" >}}
const stripe = require("stripe")("sk_test_your-token");

async function processPayement(amount, source, description) {
    let charge;
    try {
        charge = await stripe.charges.create({
            amount,
            source,
            description,
            currency: "usd"
        });
    } catch(e) {
        // Error handling
    }

    // ...
}
{{< / highlight >}}

Wouldn’t it be nice if we were able to have a function executed right _before_ a charge is about to occur or right _after_ a successful charge? Of course we could add the functionality in our “processPayement()” method but then it’d be tightly coupled and hard to disable when needed.

Hooks to the rescue! To add “pre” & “post” hooks to the _charges.create()_ method we are going to use the [promised-hooks](https://www.npmjs.com/package/promised-hooks) package. I created this small library as I could not make the [hooks](https://www.npmjs.com/package/hooks) library work with a _chain_ of Promises.

{{< highlight go "linenos=table" >}}
const stripe = require("stripe")("sk_test_your-token");
const hooks = require("promised-hooks");

// Add Hooks functionalities to the "stripe.charges" methods
hooks.wrap(stripe.charges);

// Add a "pre" middleware
stripe.charges.pre("create", function preCharge({ amount, source, description, currency }) {
    // All the arguments passed to the charges.create() method are available

    // Make any async call as long as it returns a *Promise*.
    // If the async call rejects, then the "create()" method won't be executed
    return someService.doAsyncStuff(amount, currency, description);
});

// Add a "post" middleware
stripe.charges.post("create", function postCharge(charge) {
    return myTraceService.log(`New charge ${charge.amount}`);
});

// No changes on the processPayement
async function processPayement(amount, source, description) {
    let charge;
    try {
        charge = await stripe.charges.create({
            amount,
            source,
            description,
            currency: "usd"
        });
    } catch(e) {
        // Error handling
    }

    // ...
}
{{< / highlight >}}

Great, we now have our custom async service called right before a charge occurs. If the async service rejects the Promise, the charge won’t occur and the error will be caught in our error handling.

Let’s do a quick refactor to keep our Stripe API hooks in a separate file.

{{< highlight go "linenos=table" >}}
// ./vendors/stripe.js

const stripe = require("stripe")("sk_test_your-token");
const hooks = require("promised-hooks");

// Add Hooks functionalities to the "stripe.charges" methods
hooks.wrap(stripe.charges);

// Add a "pre" middleware
stripe.charges.pre("create", function preCharge({ amount, source, description, currency }) {
    // All the arguments passed to the charges.create() method are available

    // Make any async call as long as it returns a *Promise*.
    // If the async call rejects, then the "create()" method won"t be executed
    return someService.doAsyncStuff(amount, currency, description);
});

// Add a "post" middleware
stripe.charges.post("create", function postCharge(charge) {
    return myTraceService.log(`New charge ${charge.amount}`);
});

// Export Stripe with the hooks
module.exports = stripe;
{{< / highlight >}}

{{< highlight go "linenos=table" >}}
const stripe = require("./vendors/stripe");

// No changes on the processPayement
async function processPayement(amount, source, description) {
    let charge;
    try {
        charge = await stripe.charges.create({
            amount,
            source,
            description,
            currency: "usd"
        });
    } catch(e) {
        // Error handling
    }

    // ...
}
{{< / highlight >}}

As you can see, adding “pre” and “post” functionalities to an API is easy and can greatly help the separation of concerns of your code.

# Where hooks really shine

Hooks are more useful when importing an API that **we don’t control**. Let’s continue with the example from above. Imagine that _Team A_ has finished working on its “billing” npm package. 
The code below is their small package to abstract the payment process. We can see that they haven’t forgotten to wrap their api with hooks to allow custom functionalities to be added.

{{< highlight go "linenos=table" >}}
// your-billing-package

const stripe = require("stripe")("sk_test_token");
const hooks = require("promised-hooks");

const { notify } = require("some-notification-package");

async function processPayement(amount, source, description, currency) {
    return new Promise((resolve, reject) => {
        let charge;
        try {
            charge = await stripe.charges.create({
                amount,
                source,
                description,
                currency
            });
        } catch(e) {
            // Error handling
            // Might want to retry under certain conditions
            reject(e);
        }

        try {
            notify("New payement received", { amount, source, description });
        } catch(e) {
            // Silently fail
        }

        resolve(charge);
    });
}

const api = {
  processPayement
};

// Add hook functionalities to the api
hooks.wrap(api);

module.exports = api;
{{< / highlight >}}

Now it’s your turn. You are working on a new project that will accept payments. After a few months in the project your are asked to block payments under 1 dollar and only allow payment by Card.
A good place to put your new business rules is in a middleware (just like Express allows us to add middleware to prevent to access a route).

{{< highlight go "linenos=table" >}}
// ./middleware/billing.js

const billingApi = require("your-billing-package");

/**
 * Dont' allow payment below 1$
 */
function validateAmount(amount, source, description, currency) {
    if (amount < 1) {
        return Promise.reject("Payement not allowed. The minimum charge is 1.00$.");
    }
    return Promise.resolve();
}

/**
 * Only allow payement by Card
 */
function validateSource(amount, source) {
    if (source !== "Card") {
        return Promise.reject("Only Card payement are allowed.")
    }
    return Promise.resolve();
}

// Add middleware to execute before any payement
// These are rules specific to this application
billingApi.pre("processPayement", [validateAmount, validateSource]);
{{< / highlight >}}

Just like that you added two business rules to your application that will block payments below $1 or payment not made by Card. And you didn’t have to modify any of your code.

That’s it. I invite you to play with hooks and see if some of your codebase can benefit from them. Please leave your comments [in the Medium article](https://medium.com/@sebelga/simplify-your-code-adding-hooks-to-your-promises-9e1483662dfa) that was originaly posted.

Thanks for reading!

**Note to library authors**: why not wrap your API with hooks to give your users the flexibility to run functions right before or after your methods?
It might be a very nice feature for them!
