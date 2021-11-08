/**
 * https://www.npmjs.com/package/serializer.ts
 * https://www.youtube.com/watch?v=AlFkCPHCJEw
 */

let fs = require("fs");
//let path = require("path");
import { v4 as uuid } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from "aws-lambda";
import {steps} from "./steps.js";
import { Queue } from './lib/queue.js';

export const handler = async (  event: APIGatewayProxyEvent ): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters;

  console.dir(`queryStringParamters:${JSON.stringify(qs)}`);

  let sm = new StepsManager(qs);
  let response = sm.setStep();

  // Testing Queue
  await doQueue();

  // Testing file access
  await doFileTest();

  return {
    statusCode: 200,
    body: `input: ${JSON.stringify(qs)}, step_state: ${JSON.stringify(response)}`
  }
}

// Queue to hold the SQS-like messages
const doQueue = async (): Promise<void> => {
  await test_StepsDatabase();
  await test_queueSQS();
  await step_ValidationInventory();
}

// Hash table to hold the mock-database of steps
// Queue pop method to server as the SQS consumer lambda
// Async method to serve as a mock Inventory step validator
// Async/Sync method to serve as a mock Generic step 

//////////////////////////

// Hash table to hold the mock-database of steps
class StepsDatabase{
  private _db = new Map<string, StepState>();

  public upsert = async (step: StepState) : Promise<StepState> => {
    this._db.set(step.step_id, step);
    return step;
  }

  public get = async (step_id: string) : Promise<StepState | null> => {
    let record = this._db.get(step_id);
    if (record){
      return record;
    } else{
      return null;
    }
  }
}

const test_StepsDatabase = async (): Promise<void> =>{
  console.dir(">>> test_StepsDatabase");

  let db = new StepsDatabase();
  let step1 = await db.upsert(new StepState(StepType.start, 1));
  let step2 = await db.upsert(new StepState(StepType.generic, 2)).then((step) => {
      db.get(step.step_id).then((secondStep) => {
        console.dir(`test_StepsDatabase:${secondStep as StepState}`);
      });      
    }
  );
}

// Queue pop method to server as the SQS consumer lambda
const test_queueSQS = async (): Promise<void> => {
  console.dir(">>> test_queueSQS");
  let queue = new Queue<StepState>();

  queue.add(new StepState(StepType.invoice, 1));
  let stepState = queue.remove();
  console.dir(`test_queueSQL:${stepState}`);
}

// Async method to serve as a mock Inventory step validator
const step_ValidationInventory = async (): Promise<void> => {
  console.dir(">>> step_ValidationInventory: 5 seconds...");

  await delay(2000);
  
  console.dir("<<< step_ValidationInventory");

  // Start
  // Do the ES lookup of inventory
  // Do the Validation-Lambda vetting
  // Enqueue state of inventory step
  // Done 
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}


// Async/Sync method to serve as a mock Generic step


enum StepType{
  start = "start",
  generic = "generic",
  inventory = "inventory",
  order = "order",
  invoice = "invoice",
  return = "return",
  finish = "finish"
}

class StepState {
  step_id: string;
  step: StepType;
  sequence: number;

  constructor(step: StepType, sequence: number){
    this.step_id = uuid();
    this.step = step;
    this.sequence = sequence;
  }

  public toString = () : string =>{
    return JSON.stringify(this);
  }
}

class StepsManager{
  qs?: APIGatewayProxyEventQueryStringParameters;

  constructor(qs: APIGatewayProxyEventQueryStringParameters | null){
    this.qs = qs;
  }
  
  setStep(): StepState {
    try {
      switch (this.qs.step as StepType) {
        case StepType.start:
          return new StepState(StepType.generic, 2);
        case StepType.generic:
          return new StepState(StepType.inventory, 1);
        case StepType.inventory:
          return new StepState(StepType.order, 1);
          //
          //
          //
        default:
          return new StepState(StepType.start, 1);
      } 
    } catch (error) {
      console.dir(`ERROR:${error}`);
      return new StepState(StepType.finish, 0);
    }
  }
}



const doFileTest = async (): Promise<void> =>{
  //console.dir(`process.env.LAMBDA_TASK_ROOT:${process.env.LAMBDA_TASK_ROOT}`);
  //console.dir(`path.revolve:${path.resolve("./steps.json")}`);
  //console.dir(`doFileTest:__dirname:${__dirname}`);
 
  await writeData();  
  
  await getData().then((data) => {
    data = JSON.parse(data.toString());
    console.dir(`data:${JSON.stringify(data)}`)
  });
}

const checkData = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    fs.access("/tmp/steps.json", fs.constants.F_OK, (err: boolean) => {
        err ? resolve(false) : resolve(true)
    });
  })
}

const writeData = async (): Promise<void> => {
  await checkData().then((file_exists) => {
    if (!file_exists){
      fs.writeFile("/tmp/steps.json", JSON.stringify(steps), async function(err: any) {
        if (err) {
            return console.error(err);
        }
        console.dir("Steps file created!");
      });
    }else{
      console.dir("Steps file exists");
    }
  })
}

const getData = async () : Promise<string> => {
  
  const fsPromises = require('fs').promises;
  let data = await fsPromises.readFile("/tmp/steps.json")
                     .catch((err: any) => console.error('Failed to read file', err));
  return data;

  // return await fs.readFile(__dirname + "/steps.json", function (err: any, data: { toString: () => string; }) {
  //   if (err) {
  //     return console.error(err);
  //   }else{
  //     console.dir("Asynchronous read: " + data.toString());
  //     return data;
  //   }
  // });  
}