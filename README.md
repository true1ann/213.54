# 213.54

WebSocket-based HTTP **MORSE-ONLY** radio where you dont need any government approval, for obvious reasons

> [!IMPORTANT]
> nevermind

## WARNING

> [!IMPORTANT]  

> [!WARNING]  

TAKE ATTENTION TO THIS DOCUMENT:

this is so fucking old by now that almost nothing works, for real-time documentation refer to [index.js](index.js) file, ill update this file when the api will be fully finished

## User-usage

1. Go to [213.54's official instance](https://21354.true1ann.me/) (or see below on how to setup a custom 213.54 server)
2. Select a `freq`uency, then set a `pitchSeed`
3. Enter your text in morse

> [!IMPORTANT]
> The only allowed characters are so:  
> `.DOT`: `.`, `+`, `0`, `o`  
> `DASH`: `_`, `-`, `1`, `i`  
> Others will be deleted ON THE SERVER

4. Enter you custom speed

> [!IMPORTANT]
> To prevent issues, we have min/max `TU` (Time Unit) speeds. These are defined in ms (milliseconds)  
> `MIN`: `100`  
> `MAX`: `750`  
> 1 `DOT` is 1 `TU`. 1 `BR`(break) is 1 `TU`. 1 `DASH` is 3 `TU`  
> Once again, the values will be capped. If no `TU` definition will be set, a default of `250` per `TU` will be used  

5. Press send. The message will be played over the frequency

> [!IMPORTANT]
> You will not hear yourself. If you want to, open a new 213.54 tab and connect to the same frequency as a listener

## Spinning up a 213.54 server

1. `git clone` this repo
2. `(p)npm i`
3. Edit `config.json` as needed
4. `node index.js`
5. Follow instructions for usage above

## Using 213.54's API

- `/index.html` - (HTTP/GET) Points to the GUI of the 213.54 isntance
  - `response` - ..........go figure
- `/api/join?freq=<1>&pitchSeed=<2>` - (HTTP/POST) Register a configuration
  - `1` - The frequency you want to join. A string (a number fits too)
  - `2` - (OPTIONAL) Required to send MESSAGES, you dont need a pitchSeed if you just want to listen
  - `response` - An ID for the endpoint below
- `/api/join/<1>` - (WEBSOCK) Join to the raw PCM stream of messages (and to send them if `pitchSeed` is set)
  - `1` - Returned as `response` of above endpoint. This is your session, it lasts until the server restarts
