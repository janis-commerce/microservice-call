# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.2] - 2020-06-19
### Fixed
- Reinstalled

## [4.1.1] - 2020-06-19
### Fixed
- `list` and `safeList` wrong default `endpointParameters` value

## [4.1.0] - 2020-05-05
### Added
- `list` and `safeList` accepts `endpointParameters`

## [4.0.0] - 2020-05-05
### Added
- `safeCall()` method
- `list()` method
- `safeList()` method
- `statusCode` field to `MicroServiceCallError`

### Removed
- `get()` method
- `post()` method
- `put()` method
- `patch()` method
- `delete()` method

## [3.1.0] - 2020-02-14
### Added
- Added a `call()` method in order to avoid knowing the HTTP Method in advance.

### Changed
- Deprecated `get()` method and implemented as an alias of `call()`
- Deprecated `post()` method and implemented as an alias of `call()`
- Deprecated `put()` method and implemented as an alias of `call()`
- Deprecated `patch()` method and implemented as an alias of `call()`
- Deprecated `delete()` method and implemented as an alias of `call()`

### Fixed
- Fixed documentation for `patch()` method that claimed to make a `DELETE` request.

## [3.0.1] - 2019-10-22
### Fixed
- Api key prefixing Service name with `service-`.

## [3.0.0] - 2019-10-08
### Added
- `janis-client` and `x-janis-user` headers can now be injected using Session

### Changed
- Now Authentication needs `JANIS_SERVICE_NAME` and `JANIS_SERVICE_SECRET` env vars (**BREAKING CHANGE**)
- Upgraded `@janiscommerce/router-fetcher` dependency (**BREAKING CHANGE**)

### Fixed
- Multiple path parameters are now replaced properly

### Removed
- API Key settings removed

## [2.0.0] - 2019-08-07
### Added
- Use `@janiscommerce/Settings` dependency

### Changed
- `api-key` config comes from `path/to/root/[MS_PATH]/config/.janiscommercerc.json`

## [1.0.0] - 2019-06-21
### Added
- Project inited
- `MicroService-Call` module added
- *Unit Tests* added
- *"lib/"* folder into package.json files

### Changed
- `MicroService-Call` constructs, don't need parametres anymore
- `MicroServiceCall-Error` changed response format.
- Update *Unit Tests*
- Changed modules files folder into *"lib/"*

### Removed
- `Router-Fetcher` moved to an independent package.
