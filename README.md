# WebScheduler
A web scheduler to aid the scheduling of TA hours

Check out latest version at [https://stefanovazzocell.github.io/WebScheduler/src/](https://stefanovazzocell.github.io/WebScheduler/src/)!

## Architecture

`MySQL <-local-> NodeJS <-local-> Nginx <-https-> CloudFlare* <-https-> User's Browser`

**MySql**

Database... duh

**NodeJS**

Server backend (pretty simple, hopefully) and possibly some login ddos protection

**Nginx**

Static resources (Bootstrap page) passthrough and routing to NodeJS.

**Cloudflare** _optional_

CDN, DoS Protection and optionally extra authentication for managment.

**User's Browser**

Some processing/rendering of ui