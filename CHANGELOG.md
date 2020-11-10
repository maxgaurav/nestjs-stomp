# CHANGE LOG

## v1.1.0 (CURRENT)
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
