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

## API

### TA/Users

URL: `\api\ta\{action}\`

| ACTION | Meaning | Extra DATA | Response |
| ------ | ------- | ---------- | -------- |
| pull   | Get data |   | `{"username": "{username}", "email": "{email}", "course": "{course}", "calendar": [{calendar}], "schedule": {{schedule}}]` |
| push   | Get data | `"calendar": [{calendar}]` |   |
| update | Updates the user info | `{"username": "{username}", "email": "{email}"`  |   |
| deleteme | Deletes the current ta from the system |   |   |
| resetauth | Resets the auth hash for the ta, a new one will be sent via email |   |   |

TYPE: `POST`

DATA: `{"auth_hash": "...", ...}`

RESPONSE TYPE: `json`

RESPONSES `{"Status": "{status code}"}`
 
| RESPONSE CODE | Meaning |
| ------------: | ------- |
|           200 | OK |
|           400 | Bad Request |
|           401 | Wrong auth hash |
|           500 | Server error |

### Coordinator/Admin



### Extra


