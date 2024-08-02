---
title: Console Service Guide
tags:
  - console
---

The **Morio Console Service** (console) is an instance of [RedPanda
Console](https://www.redpanda.com/redpanda-console-kafka-ui) a web-based
management interface for RedPanda brokers.

## Console service responsibilities

The ca service runs on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### Provide insights into the broker service

The console service provides detailed insights into the Morio broker service --
a RedPanda broker under the hood,

This includes not only the health status of the broker(s) but also information
about topics, partitions, and configuration.

It's an intuitive way to familiarize yourself with the internals of what is
otherwise a rather complex service.

## Allow management of topics

The console allows the creations of topics on the broker service in an
intuitive way that is more user friendly than using the API.

## Allow management of the broker's access control list

The console service also allows managing the access control list (ACL) of the
broker service.

The ACL governs who can read or write what type of data on the broker service.
Given that authentication is based on mutual TLS (mTLS) managing the ACL is
something that is a lot more user-friendly via the consolve service than
through the api service.

