# Changelog

## 1.0.12
Update dependencies

This has some issues because to most dependencies are now pure ESM modules (critical, chrome launcher).
However, critical depends on `penthouse` which has an ancient version of puppeteer which uses `__dirname` and that
breaks building with `vercel/ncc`. So we remove ncc and add the entire node_modules directory.

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
