# CHANGE LOG

## v1.1.1 (CURRENT)
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
