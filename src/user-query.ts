import * as WoT from "wot-typescript-definitions"; 

const inquirer = require("inquirer");

interface staticAddressResponse {
    staticAddress: string
}

let staticAddressQuery = {
    type: 'input',
    message: 'Enter static address : ',
    default: 'localhost',
    name: 'staticAddress'
}   

interface protocolTypeResponse {
    protocols: Array<string>
}

let protocolTypeQuery = {
    type: 'checkbox',
    message: 'Select desired protocols : ',
    name: 'protocols',
    choices: ["http", "coap", "mqtt"],
    validate: (answer: Array<object>) => {
        if(answer.length < 1){
            return 'Select at least one protocol!';
        }
        return true;
    }
}

interface portQueryResponse {
    port: number
}

let portQuery = {
    type: 'number',
    name: 'port',
    message: '',
    validate: (answer: number) => {
        if(!(answer >= 1024 && answer <= 49151)){
            return "Port not allowed.";
        }
        return true;
    }
}

interface mqttBrokerChoiceResponse {
    broker: string
}

let mqttBrokerChoiceQuery = {
    type: 'list',
    name: 'broker',
    message: 'Do you want to use an online broker or generate a local broker?',
    choices: ["online", "local"]
}

interface mqttBrokerURIResponse {
    uri: string
}

let mqttBrokerURIQuery = {
    type: 'input',
    name: 'uri',
    message: 'Enter online broker URI: '
}

interface mqttUsernameResponse {
    username: string
}

let mqttUsernameQuery = {
    type: 'input',
    name: 'username',
    message: 'Enter username (if any) :'
}

interface mqttPasswordResponse {
    password: string
}

let mqttPasswordQuery = {
    type: 'password',
    name: 'password',
    message: 'Enter password (if any) :'
}

interface mqttClientIdResponse {
    clientId: string
}

let mqttClientIdQuery = {
    type: 'input',
    name: 'clientId',
    message: 'Enter clientId (if any) :'
}

interface logLevelResponse {
    level: number
}

let logLevelQuery = {
    type: 'list',
    message: 'Select log level : ',
    name: 'level',
    choices: [0, 1, 2, 3, 4]
}

interface instanceNumberResponse {
    nInstance: number;
}

let instanceNumberQuery = {
    type: 'number',
    message: '',
    name: 'nInstance',
    validate: (answer: number) => {
        if(typeof answer !== 'number' || isNaN(answer)){
            return "Not a number.";
        }else if(answer <= 0){
            return "Number of instance cannot be less than or equal to zero.";
        }
        return true;
    }
}

interface eventIntervalResponse {
    eventIntervals: number
}

let eventIntervalQuery = {
    type: 'number',
    message: 'Enter event interval in seconds for all events : ',
    name: 'eventIntervals',
    validate: (answer: number) => {
        if(typeof answer !== 'number' || isNaN(answer)){
            return "Not a number.";
        }
        return true;
    }
}

interface twinPropertyCachingResponse {
    twinPropertyCaching: number
}

let twinPropertyCachingQuery = {
    type: 'number',
    message: 'Enter property caching interval in seconds for digital twins : ',
    name: 'twinPropertyCaching',
    validate: (answer: number) => {
        if(typeof answer !== 'number' || isNaN(answer)){
            return "Not a number.";
        }
        return true;
    }
}

interface defaultQueryResponse {
    choice: string;
}

export const defaultQuery = async () => {
    return inquirer.prompt({
        type: 'list',
        name: 'choice',
        message: 'Use default configuration?',
        choices: ['yes', 'no']
    }).then((response: defaultQueryResponse) => response.choice);
}

const protocolsQuery = async () => {
    let protocolConfig = {};
    return await inquirer.prompt(protocolTypeQuery).then( async (response: protocolTypeResponse) => {
        if(response.protocols.includes('http')){
            portQuery.message = "Enter port for HTTP protocol : ";
            await inquirer.prompt(portQuery).then((responseHttp: portQueryResponse) => {
                Object.assign(protocolConfig, { http: responseHttp });
            });
        }
        return response;
    }).then( async (response: protocolTypeResponse) => {
        if(response.protocols.includes('coap')){
            portQuery.message = "Enter port for CoAP protocol : ";
            await inquirer.prompt(portQuery).then((responseCoAP: portQueryResponse) => {
                Object.assign(protocolConfig, { coap: responseCoAP });
            });
        }
        return response;
    }).then( async (response: protocolTypeResponse) => {
        if(response.protocols.includes('mqtt')){
            await inquirer.prompt(mqttBrokerChoiceQuery).then( async (responseMQTT: mqttBrokerChoiceResponse) => {
                if(responseMQTT.broker === "online"){
                    await inquirer.prompt(mqttBrokerURIQuery).then( async (mqttBrokerURI: mqttBrokerURIResponse) => {
                        // Unsure of utility of specifying port for online broker ( able to connect to online broker even without )
                        //await inquirer.prompt(portQuery).then( async (mqttPort: portQueryResponse) => {
                            await inquirer.prompt(mqttUsernameQuery).then( async (mqttUsername: mqttUsernameResponse) => {
                                await inquirer.prompt(mqttPasswordQuery).then( async (mqttPassword: mqttPasswordResponse) => {
                                    await inquirer.prompt(mqttClientIdQuery).then( (mqttClientId: mqttClientIdResponse) => {
                                        Object.assign(protocolConfig, { 
                                            mqtt : { 
                                                online : { 
                                                    uri : mqttBrokerURI.uri, 
                                                    username : ( mqttUsername.username === '' ) ? undefined : mqttUsername.username, 
                                                    password : ( mqttPassword.password === '' ) ? undefined : mqttPassword.password,
                                                    clientId : ( mqttClientId.clientId === '' ) ? undefined : mqttClientId.clientId
                                                }
                                            }
                                        });
                                    });
                                });
                            });
                        //});
                    });
                }else{
                    await inquirer.prompt(portQuery).then((mqttPort: portQueryResponse) => {
                        Object.assign(protocolConfig, { mqtt: { local: mqttPort } });
                    })
                }
            })
        }
    }).then( () => protocolConfig);
}

const thingQuery = async (thingList: Array<WoT.ThingInstance>) => {
    let things = {};
    thingList.forEach( (thing: WoT.ThingInstance) => {
        Object.assign(things, { [thing.id]: {} });
    });
    return inquirer.prompt(eventIntervalQuery).then( ( eventTime: eventIntervalResponse ) => {
        return inquirer.prompt(twinPropertyCachingQuery).then( async ( cachingTime: twinPropertyCachingResponse ) => {
            for(let i = 0; i < thingList.length; i++){
                let container = {};
                let eventInter = {};
                let twinProp = {};

                instanceNumberQuery.message = `Enter desired number of instances for thing with id ${thingList[i].id} :`

                await inquirer.prompt(instanceNumberQuery).then( (instanceNumber: instanceNumberResponse) => {
                    Object.assign(container, { nInstance: instanceNumber.nInstance });
                });

                for(let event in thingList[i].events){
                    Object.assign(eventInter, { [event]: eventTime.eventIntervals });
                }
                Object.assign(container, { eventIntervals: eventInter });

                for(let prop in thingList[i].properties){
                    Object.assign(twinProp, { [prop]: cachingTime.twinPropertyCaching });
                }
                Object.assign(container, { twinPropertyCaching: twinProp });

                Object.assign(things, { [thingList[i].id]: container });
            }
        });
    }).then( () => {
        return things;
    });        
}

export const configurationQuery = async (thingList: Array<WoT.ThingInstance>) => {
    let config = {
        servient: {},
        log: {},
        things: {}    
    };

    return inquirer.prompt(staticAddressQuery).then( async (address: staticAddressResponse) => {
        await protocolsQuery().then( (protocols) => {
            config.servient = {
                ...address,
                ...protocols
            };
        });

        return inquirer.prompt(logLevelQuery);
    
    }).then( (logLevel: logLevelResponse) => {
        config.log = logLevel;
        return thingQuery(thingList);
    
    }).then( (things: object) => {
        config.things = things;
        return config;
    });
}