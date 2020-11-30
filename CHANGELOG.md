# CHANGE LOG

# v1.2.0-alpha.2
### Added
* Delay restarting on ack/nack error

### Change 
* Changed config property **restartOnSubscriptionAckNackError** to **restartOnAckNackError**

# v1.2.0-alpha.1
### Added
* Config to auto restart of subscriptions when nac/ack actions fails
* Added restart subscriptions action added via decorators through explorer service
* Added unsubscribe subscriptions action added via decorators through explorer service 

## v1.1.3 (CURRENT)
### Added
* Added stomp error callback in stomp options

### Fixed
* Nack not exiting the message but continuing to call ack

### Changed
* Wrapped nack and ack auto actions inside try/catch with error message so that handling of messages does not break system.

## v1.1.2
### Changed
* Moved error logging of nack action above nack action so that logging can be seen before.

## v1.1.1
### Fixed
* For node v12 and above error thrown causing exit of client connection thus converted to logger log action 

## v1.1.0
### Changed
* Exposing the StompExplorer service
* Exposing the client in StompService
* Stomp Client in StompService is reused rather than new one being created and injected

### Fixed
* Client not connected when injecting StompService


## V1.0.3
### Fixes
* Adding of injectable providers for async module configuration

## V1.0.2
### Fixes
* Async Provide injection for option factory fixed

## V1.0.1
### Fixes
* On Connect called after connection established causing subscription not being invoked
* Changed build target to ES2019 from ESNext so that **?** optional chaining are backward compatible

## V1.0.0
* Published first version
