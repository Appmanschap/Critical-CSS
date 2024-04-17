# Changelog

## 2.0.0
Update dependencies

Due to Node.js & dependency updates we now use type `module` (e.g. esm). 
This breaks ncc, so we refactored this action to a Docker action instead.

Also switch to TypeScript

## 1.0.7 - 1.0.8 - 1.0.9 - 1.0.10 - 1.0.11
Delete old critical files on server first

## 1.0.6
Fix optional private key

## 1.0.5
Bump dependencies, add optional port parameter, made sshPrivateKeyPath optional 

## 1.0.4
Bump dependencies, use `pnpm` to fix some audit issues

## 1.0.3
Bump dependencies, use ncc to build package

## 1.0.2
Audit fix

## 1.0.1
Update npm packages to fix lodash vulnerability

## 1.0.0
Initial release
