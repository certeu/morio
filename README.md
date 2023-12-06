# morio
This is an incubator/lab to test-drive some new ideas for log collection.

## What's with the name?

Right from the start, we need a name. To create a repository for example, we
need to give it a name.  
I was mulling it over one weekend, and landed on **morio**. Here's why:

**It's a _data plumbing_ project**

Making sure data flows from every little place where it's generated to our data lake is the data equivalent of plumbing.
It's not very sexy, but it is very important. See how you fair when the drain in your kitched gets clogged, or worse, your toilet.

Plumbing is not sexy or cool, so we borrow some cool from the world's most beloved plumber: **Mario**.  
This is Morio, not Mario. But it's a good reminder that plumbers rock.

**More data in, more value out**

Another way to explain the **morio** name is to read it as **More IO**.  
If we can make it easy (and affordable) to stream more data, we can get more value out of that stream.

## Components

This is pre-alpha for now, but the following components have been created:

### UI

The idea is that we will end up with an appliance-like box that people can administer via a web interface.

The `ui` folder holds that web interface. It will be a static-HTML website that does everything through the API.

### API

Morio is an API-first project. Everything should go via the API. The `api` folder holds that API.

So the web interface we are building to manage morio connects to the API.
But if people don't want to use the web interface and talk to the API directly, that's fine too.

