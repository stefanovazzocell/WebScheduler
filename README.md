# WebScheduler
A web scheduler to aid the scheduling of TA hours

Check out latest version at [https://stefanovazzocell.github.io/WebScheduler/src/](https://stefanovazzocell.github.io/WebScheduler/src/)!

## TODO

[ ] Design the admin UI

[ ] Write JS for admin UI

[ ] Connect the admin UI to the API

## Architecture

`MongoDB <-local-> NodeJS <-local-> Nginx <-https-> CloudFlare* <-https-> User's Browser`

**MongoDB**

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

### Admin

URL: `\api\admin\{action}\`

| ACTION | Meaning | Extra DATA | Response |
| ------ | ------- | ---------- | -------- |
| get    | Gets the admin data | |  `'username': 'Name Surname', 'email': 'admin@localhost', 'courses': []` |
| resetauth | Resets the auth hash for the ta, a new one will be sent via email |   |   |
| courseAdd | Adds a new course | 
| courseRemove | Removes a course | 
| taAdd | Adds a ta | 
| taRemove | Removes a ta | 
| taGet | Gets the data from a ta | 
| taResetAuth | Resets a ta auth |
| taSetSchedule | Sets a schedule for a given TA | 


### General

TYPE: `POST`

DATA: `{"auth": "{authentication hash}", ...}`

RESPONSE TYPE: `json`

| RESPONSE CODE | Meaning |
| ------------: | ------- |
|           200 | OK |
|           400 | Bad Request |
|           401 | Wrong auth hash |
|           403 | Brute force detected |
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

URL: `\api\admin\{action}\`


## Database

**admin**

```json
{
	"_id": "??Random Auto id??",
	"name": "Tim Schmitt",
	"email": "ts@localhost",
	"auth": "secret1234",
	"courses": [
		"CPSC110",
		"CPSC221"
	]
}
```

A new admin will look like

```json
{
	"name": "Name Surname",
	"email": "admin@localhost",
	"auth": "secret",
	"courses": []
}
```

**course**

Node: if `"needed": false` then it's a filler course (meaning a Meeting). Therefore it's low priority

```json
{
	"_id": "CPSC110",
	"items": [
		{
			"name": "L1A",
			"type": "Lab",
			"room": "X250",
			"needed": 2,
			"day": 4,
			"from": 9,
			"to": 12,
			"tas": [
				"{object id for MongoDB}",
				"{object id for MongoDB}"
			]
		}
	],
}
```

**ta**

Note: As `_id` the registration email is used, everything else uses the preferred `email`

|  Value | min | max |
| :----: | :-- | :-- |
| `_id`,`email` | 5 | 200 |
| `name` | 2 | 40 |

```json
{
	"_id": "CPSC110#stefano@school.locahost",
	"name": "Stefano Vazzoler",
	"course": "CPSC110",
	"email": "stefano@private.localhost",
	"auth": "secret",
	"privacy": 1,
	"calendar": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	"schedule": [
		{
			"title": "L1A",
			"type": "Lab",
			"room": "X250",
			"day": 4,
			"from": 9,
			"to": 12
		},
		{
			"title": "MTG",
			"type": "Meeting",
			"room": "X800",
			"day": 3,
			"from": 17,
			"to": 18
		}
	],
	"lastPush": 1500000000000
}
```

`Last push` from `new Date().getTime()`