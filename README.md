# WebScheduler
A web scheduler to aid the scheduling of TA hours

Check out latest version at [https://stefanovazzocell.github.io/WebScheduler/src/](https://stefanovazzocell.github.io/WebScheduler/src/)!

## TODO

[ ] Add 'Who is available at ...?' (and privacy settings)
[ ] Add 'Quick links' (EdX, Canvas, Course Site, Slack, ...) loaded dynamically
[ ] Design the login page
[ ] Design the basic db
[ ] Design the basic server using nodejs
[ ] Design the admin UI
[ ] Write JS for admin UI
[ ] Connect the admin UI to the API

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
| pull   | Get data |   | `{"username": "{username}", "email": "{email}", "course": "{course}", "privacy": {privacy}, "calendar": [{calendar}], "schedule": {{schedule}}]` |
| push   | Get data | `"calendar": [{calendar}]` |   |
| update | Updates the user info | `{"username": "{username}", "email": "{email}", "privacy": {privacy}`  |   |
| deleteme | Deletes the current ta from the system |   |   |
| resetauth | Resets the auth hash for the ta, a new one will be sent via email |   |   |
| getsubs | Gets all the subs for all courses (where this ta is registered in) |   | `{{subs*}}` |

TYPE: `POST`

DATA: `{"auth": "{authentication hash}", ...}`

RESPONSE TYPE: `json`

| RESPONSE CODE | Meaning |
| ------------: | ------- |
|           200 | OK |
|           400 | Bad Request |
|           401 | Wrong auth hash |
|           500 | Server error |


**`{subs*}`**

Here's an example

```json
{
	"L1Ex": {
		"Available": [
			"Stefano Vazzoler"
		],
		"Prefer Not": [
			"Ruiyu Gou"
		]
	},
	"102": {
		"Available": [
			"Qianqian Feng"
		],
		"Prefer Not": [
			"Julian Mentasti",
			"Doru Kesriyeli"
		]
	}
}
```

### Coordinator/Admin



### Extra
