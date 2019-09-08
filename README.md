# Virtual Thing

Creates and deploys a virtual thing based on its TD

## Why use this software
You may want to create a mashup scenario or a test script for a WoT thing that you only have a TD for. This tool allows you to simulate a thing based only on its TD.

## Prerequisites
All systems require:
* [NodeJS](https://nodejs.org/) version 10+ (e.g., 10.13.0 LTS)

### Linux
Meet the [node-gyp](https://github.com/nodejs/node-gyp#installation) requirements:
* Python 2.7 (v3.x.x is not supported)
* make
* A proper C/C++ compiler toolchain, like GCC

### Windows
Install the Windows build tools through a CMD shell as administrator:
```
npm install -g --production windows-build-tools
```

### Mac OS
Meet the [node-gyp](https://github.com/nodejs/node-gyp#installation) requirements:
```
xcode-select --install
```

## How to start a virtual thing
### Install this package
Clone this repository and go into it:
```
git clone https://github.com/tum-ei-esi/virtual-thing
cd virtual-thing
```
Install dependencies and build project:
```
npm install 
npm run build
```

### Optional: create a link
Make the package available on your local machine (as a symlink). You can then use each paket in its local version via `npm link <module>` instead of `npm install <module>` (see also https://docs.npmjs.com/cli/link).
```
npm link
```
This step also allows you to start a virtual-thing by just calling the command `virtual-thing` from anywhere within your computer, instead of having to call `node dist/cli.js` inside this package.

### Start with the default example TD
To get to know how the virtual-thing module works, you can start a virtual thing based on the default example TD provided.
Change directories to the root of this module with `cd` and run:
```
node dist/cli.js
```
or if you created a link, you can just call
```
virtual-thing
```

### Start a virtual thing based on any TD
you can create a virtual thing based on any given TD:
```
node dist/cli.js path/to/my/example_td.json
```
or if you created a symlink:
```
virtual-thing path/to/my/example_td.json
```

### Provide your own configuration file
By default, if no configuration file path is given as an argument, a default one is generated. Users have the possibility of changing the configuration by rejecting the default one when prompted. For more flexibility, it is recommended to create a custom configuration file and pass the path as an argument to fit your specific requirements.
```
virtual-thing -c path/to/conf.json path/to/my/example_td.json
```

### Change the configuration
the config file is a JSON file that allows you to configure some aspect of the virtual thing. These include: 
* Protocol parameters ( HTTP, CoaP or MQTT )
* Logging levels
* Event Intervals

The configuration file format looks like this:
```JSON
{
 "servient": {
     "staticAddress": STATIC,
     "http": {
         "port": HPORT
     }
 },
 "log": {
     "level": LOGLEVEL
 },
 "things": {
     "THING_ID": {
         "eventIntervals": {
             "EVENT_ID1": INTERVAL,
             "EVENT_ID2": INTERVAL
         },
         "twinPropertyCaching": {
             "PROPERTY_ID1": INTERVAL,
             "PROPERTY_ID2": INTERVAL,
         }
     }
 }
}
```

For example, you can set-up the virtual-thing to generated a specific event every 60 seconds by replacing the value of INTERVAL of the specific event with 60.  

You can also set the logging level between 0 and 4:  
`{ error: 0, warn: 1, info: 2, log: 3, debug: 4 }` 

You can also refer to the configuration file generated by default when first running virtual-thing to have a better idea.

### More Help:
If you need more help, run:
```
virtual-thing --help
```
## How to use the Digital Twin mode
### How to start a digital twin
To start a digital twin, use the `-t` or `--twin` command line options:
```
virtual-thing --twin path/to/real-thing/td.json
```
This will tell the virtual thing to start in digital twin mode. To do so, it will consume the TD, and start a thing instance that is supposed to act as a reverse proxy. When this instance receives a request, it will try to pass it on to the real thing. If this is not possible, it will generate a random response instead. The response is annotated to make the source of the data clear.

it is also possible for the digital twin to be used as caching server for load balancing purposes. This is configurable in the config file.

### How to add a model to your digital twin
It is possible to use a model of your real thing in digital twin mode. This means that when the real thing is not reachable, the digital twin will use the model to create a response instead:
```
virtual-thing --twin path/to/real-thing/td.json::path/to/model.js
```

Upon reception of a property read request, and whenever the real thing is unreachable, the digital twin will call on your model and pass on the last received property value, as well as its timestamp to it. Based on those values, your model can return an approximate value, as well as an accuracy annotation ( from 0 to 100% ). This data is then sent as a response to the received request.

the model has to conform to a specific format. An example is provided under `examples/twin-models/coffee_machine_model.js`

## How to create a group of servers or clients

Users have the possibility to create a group of servers or clients based on a configuration file which must be provided. Examples of configuration files can be found under `config-files`.
### Servers
To launch a group of servers with default configuration file : 
```
node dist/server-pool.js
```
To specify a specific configuration file :
```
node dist/server-pool.js -c path/to/server/config
```
Here is an example of a configuration file for the server pool.
```JSON
{
    "mode": MODE,
    "staticAddress": ADDRESS,
    "servients": [
        {
            "instances": SERVER_INSTANCE,
            "protocol": PROTOCOL,
            "things":{
                "path/to/td":{
                    "instances": THING_INSTANCE,
                    "eventIntervals": {
                        "EVENT_ID1": INTERVAL,
                        "EVENT_ID2": INTERVAL
                    }
                }
            }
        }
    ]
}
```
`MODE` : specifies the mode in which the servients are created. Possible values are `'single'` for single-threaded or `'multi'` for multi-threaded.  
`ADDRESS` : specifies a static IP address.  
`SERVER_INSTANCE` : specifies the number of instances of the concerned servient to create.  
`PROTOCOL` : specifies the protocol used by the servient. Possible values are `'http'` and `'coap'`.  
`THING_INSTANCE` : specifies the number of things described by the TD provided as key to create and expose on the servient.  
`INTERVAL` : specifies the interval between each emission of the concerned event.

A `server-pool` is able to contain instances of different things. To do so, specify configurations for multiple things under `"things"`.

### Clients
Group spawning of clients have the sole intention of testing the responsiveness of the servers. The clients will take measurements of the time between the moment when the request is sent and when the response is received. Once the number of measurements specified are taken, the script automatically ends and the clients are terminated. A directory containing csv files of the results is generated. A configuration file is also necessary.

To launch a group of clients with default configuration file :
```
node dist/client-pool.js path/to/put/results
```
To specify your own configuration file :
```
node dist/client-pool.js -c path/to/config path/to/put/results
```
Here is an example of a configuration file for the client pool.
```JSON
{
    "clients": [
        {
            "instances": CLIENT_INSTANCE,
            "protocol": PROTOCOL,
            "thingURL": THING_URL,
            "measures": NUM_MEASURES,
            "events_to_sub": [EVENT_ID, EVENT_ID],
            "actions_to_inv": {
                "ACTION_ID1": INTERVAL
            },
            "prop_to_read": {
                "PROP_ID1": INTERVAL
            }
        }
    ]
}
```

`CLIENT_INSTANCE` : specifies the number of instances of the concerned client to create.  
`PROTOCOL` : specifies the protocol used. Possible values are `'http'` and `'coap'`. `THING_URL` : specifies the URL to fetch the TD of the concerned thing.  
`NUM_MEASURES` : specifies the number of measures to take for each test.

To spawn multiple instances of different clients, add more configurations in the array value of the key `"clients"`.

## How to run tests
### Automated Testing
Tests done by the `client-pool` can be automated by running :
```
node dist/auto-test.js
```
This command runs tests based on a configuration file which can be found in the `config-files` directory. It first generates all the corresponding configuration files for `server-pool` and `client-pool` and then executes them one by one. This happens in a single container.

Below is an example of how a configuration file for testing should look like:
```JSON
{
    "modes": [], //applies only to server
    "protocols": [],
    "memory_limit": MEM_LIMIT,
    "ports":{
        "start": NUM_PORT,
        "end": NUM_PORT
    }, //applies only to server
    "clients":{
        "start": NUM_CLIENT,
        "end": NUM_CLIENT
    }, //applies only to client
    "prop":{
        "start": INTERVAL,
        "end": INTERVAL,
        "step": INTERVAL
    }, //applies only to client
    "action":{
        "start": INTERVAL,
        "end": INTERVAL,
        "step": INTERVAL
    }, //applies only to client
    "event":{
        "start": INTERVAL,
        "end": INTERVAL,
        "step": INTERVAL
    }, //applies only to server
    "nData": NUM_MEASURES, //applies only to client
    "tdPath": PATH_TO_TD,
    "thingInstance":{
        "start": NUM_INSTANCE,
        "end": NUM_INSTANCE,
        "step": NUM_INSTANCE
    } //applies only to server
}
```
#### Notes:
* The configuration above is used to describe ranges when generating the corresponding configuration files.
* All the configuration files are generated in `tests/config`, a directory which will be created when the script is executed.
* Each test is identified by a number, and the corresponding results can be found in `tests/results`.
* It is only possible to use one TD for automatic testing. For more specific tests, the configuration has to be done manually.
* Objects without the property `"step"` in the configuration is incremented by one from one test to another.
* For automated tests, the client subscribes to all events, invokes all actions with the specified interval, and reads all properties at the specified interval.
* It is possible to run the tests in a docker container with `Dockerfile`.
### Container to Container
It is also possible to execute tests using the default configuration files `server-config.json` and `client-config.json` under the `config-files` directory using docker-compose. This uses the dockerfiles `Dockerfile.client` and `Dockerfile.server`.
```
docker-compose up
```
### Notes:
* When running tests between containers, the static address should be set to `server-pool`.
* To make custom tests, you should edit the default configuration files.
* The results of the tests will be located at `/app/results` in the client container.

### Docker Help

* Once the test finishes, the container will be shutdown automatically. To see the previously run 20 containers, use `docker container ls --last 20`.
* `docker build -t ege/test1 .` once the configuration is set, it will build the image that you can run
* `docker run -d --memory 10240m --cpuset-cpus="0-1" ege/test3` will run it with this given name but this is not the name of the container, that will be assigned automatically
* `docker cp stupefied_mendel:app/tests ./` to copy test to current folder
* `docker build -f NEWDOCKERFILE` allows you to pass other docker files

## Useful Links:
1. [Thing Description Specification](https://w3c.github.io/wot-thing-description/#thing)
2. [Scripting API Specification](https://w3c.github.io/wot-scripting-api/)
3. [node-wot implementation of the Scripting API](https://github.com/eclipse/thingweb.node-wot)
