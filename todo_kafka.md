- broker
  v Listen internally on 9092, no TLS
  v Listen externally on 19092, with TLS
  v Publish 19092 as 9092
  v Check TLS requirement
  - Enable client auth (mTLS0
  - Test client auth
  - Add rule to accept all CA-signed certs for pushing data
  - Setup auto-creation of topics
  
- Console
  - Get it to work with new config
  - Connect internally
