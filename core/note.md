My dear friends, I am starting to see light at the end of the tunnel.
By which I mean, I hope that by the end of this week, I'll be able to merge my feature branch that goes from Morio, minimal MVP, to Morio with clustering support.

I'm currently updating the unit tests to the changes, and after that I'll need to update the OpenAPI specification too, but from a code point of cview, I think it can be merged. I'm sure there will be bugs and things still to do, but it's already going to be a massive merge, so I think it is better to land this.

Which brings me to: What's next?

I would like to setup automated testing to ensure we can deploy Morio with confidence.
That means that I'd love to see Morio getting deployed in a variety of constellations (stand-alone, or a 3/5/7/9 node cluster).
With the Clownstrike meltdown fresh in our memories, I hope I don't have to explain why testing is non-optional when people run your stuff.

I can (and am) looking after the unit tests, but I was hoping to have full end-to-end testing to.
Which means:

- We spin up some VMs in AWS or whatever
- We deploy Morio on it
- We run a battery of tests, including deploying it and so on

Perhaps terraform makes sense? We could run the tests, generate a report, and then just destroy the infrastructure.

There's two things I'd like your input on:

- How do you see this end-to-end testing? Do you have another idea?
- Does anybody have time/bandwidth to help with this testing setup? (that would give me more time to work on Morio itself)


