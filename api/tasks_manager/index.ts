/**
 * https://www.npmjs.com/package/serializer.ts
 * https://www.youtube.com/watch?v=AlFkCPHCJEw
 */

let fs = require("fs");
let path = require("path");
import { v4 as uuid } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from "aws-lambda";
import { tasks as imported_tasks } from "./tasks.js";
import { Queue } from './lib/queue.js';
import { Http2ServerRequest } from 'http2';
import { S_IROTH } from 'constants';
let mock_database_filename = "/tmp/tasks.json";

//
// Standard AWS API Event Handler
//
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters;

  console.dir(`queryStringParamters:${JSON.stringify(qs)}`);

  //await doQueueTest();         // Testing Queue
  //await doFileTest();          // Testing file access
  //await doTasksDatabaseTest(); // Testing mock database

  let sm = new TasksManager(qs);
  let response = await sm.authorizeAndPerformTask();

  // Begin IOT socket connection...

  // Or perform direct response...
  return {
    statusCode: 200,
    body: `input: ${JSON.stringify(qs)}, task_state: ${response}`
  }
}

//
// A TypeScript class to manage all the task-state transitions and Worker Lambdas 
//
class TasksManager {
  qs?: APIGatewayProxyEventQueryStringParameters;

  constructor(qs: APIGatewayProxyEventQueryStringParameters | null) {
    this.qs = qs;
  }

  // IOT?
  pollTaskDatabase = async (): Promise<any> =>{
    //... stay open ...
    
  }

  //
  // Main entry point for the task processing
  //  Vet the task and if authorized,
  //  allow the task to trigger RStream requests to trigger Worker Lambdas
  //
  authorizeAndPerformTask = async (): Promise<any> => {
    try {
      // Get to the mock database
      let db = new TasksDatabase();
      await db.load();
      console.dir(`authorizeAndPerformTask.A:${JSON.stringify("")}`);

      // If given a task id to process...
      if (this.qs.task_id) {
        let task = await db.get(this.qs.task_id);
        if (task) {

          // Prior task has been completed?
          let priorTask = await db.findPriorPriorTask(task.sequence);
          if (priorTask && priorTask.status != TaskStatus.passed){
            return new TaskResponse(false, "Not authorized. Prior task NOT PASSED. Prior task:", priorTask);
          }

          // Vet the task for status authorization
          console.dir(`authorizeAndPerformTask.B.1:${JSON.stringify(task)}`);
          let is_continue = await this.authorizeTask(task, db);

          // We altered the task during the authorizeTask -- refetch it...
          task = await db.get(task.task_id);
          console.dir(`authorizeAndPerformTask.B.2:${JSON.stringify(task)}`);

          // Perform the work under the task
          if (task.status === TaskStatus.passed) {
            console.dir(`authorizeAndPerformTask.C:${JSON.stringify("")}`);
            return new TaskResponse(true, "Task PASSED. Move to next task.", task);
          } else {
            if (is_continue) {
              console.dir(`authorizeAndPerformTask.D:${JSON.stringify("")}`);
              return await this.performTaskWork(task, db);
            } else {
              console.dir(`authorizeAndPerformTask.E:${JSON.stringify("")}`);
              return new TaskResponse(false, "Task failed or is not authorized to continue. Try again.", task);
            }
          }
        }
      }

      // Forward response to client through IOT?
      // IoT.Forward(response);
      

      console.dir(`authorizeAndPerformTask.W:${JSON.stringify("")}`);
      // Reset the mock data file
      if (this.qs?.reset) {
        writeData(true, imported_tasks);
        return JSON.stringify({ "reset": "database was reset" });
      }
      console.dir(`authorizeAndPerformTask.X:${JSON.stringify("")}`);
      // Wipe the data clean -- NO TASKS
      if (this.qs?.wipe) {
        writeData(true, null);
        return JSON.stringify({ "wipe": "database was wiped" });
      }
      console.dir(`authorizeAndPerformTask.Y:${JSON.stringify("")}`);
      // If nothing is available return warning
      if (this.qs?.retailer_id) {
        return JSON.stringify({ "warning": `No tasks found to process for retailer_id:${this.qs?.retailer_id}` });
      }

      console.dir(`authorizeAndPerformTask.Z:${JSON.stringify("")}`);
      // No Querystring -- return all data
      return await getData();

    } catch (error) {
      // Build the rules from the mock data file
      if (this.qs?.start) {
        writeData(true, imported_tasks);
        return JSON.stringify({ "start": "Rules have been built" });
      } else {
        // Default if all goes wrong -- return the data
        return await getData();
      }
    }
  }

  //
  // Should the Supplier be allowed to process this task?
  // Has the previous task been Passed or Skipped?
  //
  authorizeTask = async (task: TaskState, db: TasksDatabase): Promise<boolean> => {
    let is_true = (Math.floor(Math.random() * 2) + 1) === 1 ? true : false;
    console.dir(`authorizeTask.A:${JSON.stringify(is_true)}`);
    switch (task.status) {
      case TaskStatus.new:
        is_true = true;
        task.status = TaskStatus.in_progress;
        console.dir(`authorizeTask.B:${JSON.stringify(task.status)}`);
        break;
      case TaskStatus.in_progress:
      case TaskStatus.internal_in_progress:
        task.status = is_true ? TaskStatus.passed : TaskStatus.failed;
        console.dir(`authorizeTask.C:${JSON.stringify(task.status)}`);
        break;
      case TaskStatus.passed:
        is_true = true;
        console.dir(`authorizeTask.D:${JSON.stringify(task.status)}`);
        break;
      case TaskStatus.failed:
        is_true = false;
        task.status = TaskStatus.new;
        console.dir(`authorizeTask.E:${JSON.stringify(task.status)}`);
        break;
      default:
        is_true = true;
        console.dir(`authorizeTask.F:${JSON.stringify(task.status)}`);
        break;
    }
    console.dir(`authorizeTask.Z:${JSON.stringify(task.status)}`);
    await db.upsert(task);
    await db.persist();
    return is_true;
  }

  //
  // If the task entails async work -- pass it off to the Worker Lambdas
  //
  performTaskWork = async (task: TaskState, db: TasksDatabase): Promise<any> => {

    // Perform the work under the task
    let response: TaskResponse;

    // Set the task to in_progress
    // This would be done by the Worker Lambda
    task.status = TaskStatus.in_progress;

    try {
      switch (task.task_type) {
        case TaskType.a_started:
          // Kick off the task-builder lambda rStreams request...
          response = new TaskResponse(true, "Tasks are now set.", task);
          break;
        case TaskType.b_read_onboarding_guide:
          task.status = TaskStatus.passed;
          response = new TaskResponse(true, "Onboarding guide has been read.", task);
          break;
        case TaskType.c_configured_initial_settings:
          task.status = TaskStatus.passed;
          response = new TaskResponse(true, "Configuration configured.", task);
          break;
        case TaskType.d_inventory_loaded:
          await task_ValidationInventory(); // RStreams request sent here...
          task.status = TaskStatus.internal_in_progress;
          response = new TaskResponse(true, "Inventory upload is being processed.", task);
          break;
        case TaskType.e_inventory_updated:
          response = new TaskResponse(true, "Inventory update is being processed", task);
          break;
        case TaskType.f_test_orders_created:
          response = new TaskResponse(true, "Test orders have been created.", task);
          break;
        case TaskType.g_acknowledge_orders:
          response = new TaskResponse(true, "Acknowledge order is in progress.", task);
          break;
        case TaskType.h_single_shipment_all_skus:
          response = new TaskResponse(true, "Order shipment is being vetted.", task);
          break;
        case TaskType.i_order_cancelled:
          response = new TaskResponse(true, "Order cancel is being vetted.", task);
          break;
        case TaskType.j_ship_sku_cancel_sku:
          response = new TaskResponse(true, "Order ship and cancel is being vetted.", task);
          break;
        case TaskType.k_invoice_created:
          response = new TaskResponse(true, "Invoice test is being processed.", task);
          break;
        case TaskType.l_return_shipment:
          response = new TaskResponse(true, "Return test is being processed.", task);
          break;
        case TaskType.m_finished:
          task.status = TaskStatus.passed;
          response = new TaskResponse(true, "Your are FINISHED!", task);
          break;
        default:
          response = new TaskResponse(false, "Task_type not found", task);
          break;
      }
    } catch (error) {
      response = new TaskResponse(false, `ERROR performing task work:${error}`, task);
    }

    // Save the task to the database
    // This would normally be done by the Worker Lambda
    await db.upsert(task);
    await db.persist();

    return response;
  }
}

enum TaskStatus {
  new = "new",
  failed = "failed",
  passed = "passed",
  in_progress = "in_progress",
  internal_in_progress = "internal_in_progress",
  internal_error = "internal_error"
}

enum TaskType {
  a_started = "started",
  b_read_onboarding_guide = "read_onboarding_guide",
  c_configured_initial_settings = "configured_initial_settings",
  d_inventory_loaded = "inventory_loaded",
  e_inventory_updated = "inventory_updated",
  f_test_orders_created = "test_orders_created",
  g_acknowledge_orders = "acknowledge_orders",
  h_single_shipment_all_skus = "single_shipment_all_skus",
  i_order_cancelled = "order_cancelled",
  j_ship_sku_cancel_sku = "ship_sku_cancel_sku",
  k_invoice_created = "invoice_created",
  l_return_shipment = "return_shipment",
  m_finished = "finished"
}

class TaskState {
  task_id: string;
  task_type: TaskType;
  status: TaskStatus;
  sequence: number;

  constructor(task_type: TaskType, sequence: number) {
    this.task_id = uuid();
    this.task_type = task_type;
    this.status = TaskStatus.new;
    this.sequence = sequence;
  }

  public toString = (): string => {
    return JSON.stringify(this);
  }
}

class TaskResponse {
  success: boolean;
  message: string;
  task?: TaskState;

  constructor(success: boolean, message: string, task: TaskState) {
    this.success = success;
    this.message = message;
    this.task = task;
  }

  public toString = (): string => {
    return JSON.stringify(this);
  }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Components to mock:
// - Hash table to hold the mock-database of tasks
// - Queue pop method to server as the SQS consumer lambda
// - Async method to serve as a mock Inventory task validator
// - Async/Sync method to serve as a mock Generic task 

// Hash table to hold the mock-database of tasks
class TasksDatabase {
  private _db = new Map<string, TaskState>();

  public load = async (): Promise<void> => {
    const fsPromises = require('fs').promises;

    // Now read the data from disk 
    let data = await fsPromises.readFile(mock_database_filename)
      .catch((err: any) => console.error('Failed to read file', err));

    // We must parse the raw data from the file into JSON
    data = JSON.parse(data);

    // Now load the db (Map) with the tasks from the file
    data.map((task: any) => {
      this._db.set(task.task_id, task);
    });
  }

  public persist = async (): Promise<void> => {
    let data = [];
    for (let val of Array.from(this._db.values())) {
      data.push(val);
    }
    writeData(true, data);
  }

  public findForTaskType = async (task_type: string): Promise<TaskState | null> => {
    for (let val of Array.from(this._db.values())) {
      if ((val as TaskState).task_type == task_type) {
        return val;
      }
    }
    return null;
  }

  public findPriorPriorTask = async (sequence: number): Promise<TaskState | null> => {
    for (let val of Array.from(this._db.values())) {
      if ((val as TaskState).sequence === sequence - 1) {
        return val;
      }
    }
    return null;
  }

  public upsert = async (task: TaskState): Promise<TaskState> => {
    this._db.set(task.task_id, task);
    return task;
  }

  public get = async (task_id: string): Promise<TaskState | null> => {
    let record = this._db.get(task_id);
    if (record) {
      return record;
    } else {
      return null;
    }
  }
}

const doTasksDatabaseTest = async (): Promise<void> => {
  console.dir(">>> doTasksDatabaseTest");
  let db = new TasksDatabase();
  //let data = await getData();
  //await db.load(JSON.parse(data));
  await db.load();
  let task = await db.get("08173c09-c6fe-4a54-972e-01180ed4c9f0");
  console.dir(`@@@@ 08173c09-c6fe-4a54-972e-01180ed4c9f0:${JSON.stringify(task)}`);

  //let task1 = await db.upsert(new TaskState(TaskType.a_started, 1));
  //let task2 = await db.upsert(new TaskState(TaskType.b_read_onboarding_guide, 2)).then((task) => {
  //  db.get(task.task_id).then((secondTask) => {
  //    console.dir(`doTasksDatabaseTest:${secondTask as TaskState}`);
  //  });
  //}
  //);
}

// Queue to hold the SQS-like messages
const doQueueTest = async (): Promise<void> => {
  await test_queueSQS();
}

// Queue pop method to server as the SQS consumer lambda
const test_queueSQS = async (): Promise<void> => {
  console.dir(">>> test_queueSQS");
  let queue = new Queue<TaskState>();
  queue.add(new TaskState(TaskType.d_inventory_loaded, 1));
  let taskState = queue.remove();
  console.dir(`test_queueSQL:${taskState}`);
}

// Async method to serve as a mock Inventory task validator
const task_ValidationInventory = async (): Promise<void> => {
  console.dir(">>> task_ValidationInventory: delayed...");
  await delay(2000);
  console.dir("Do the ES lookup of inventory");
  console.dir("Do the Validation-Lambda vetting");
  console.dir("Update state of inventory task");
  console.dir("<<< task_ValidationInventory");
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const doFileTest = async (): Promise<void> => {
  //console.dir(`process.env.LAMBDA_TASK_ROOT:${process.env.LAMBDA_TASK_ROOT}`);
  //console.dir(`path.revolve:${path.resolve("/tmp/tasks.json")}`);
  //console.dir(`doFileTest:__dirname:${__dirname}`);

  await writeData(false, imported_tasks);

  await getData().then((data) => {
    data = JSON.parse(data);
    console.dir(`data:${JSON.stringify(data)}`)
  });
}

const checkData = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    fs.access(mock_database_filename, fs.constants.F_OK, (err: boolean) => {
      err ? resolve(false) : resolve(true)
    });
  })
}

const writeData = async (is_override: boolean = false, data: any[]): Promise<void> => {
  await checkData().then((file_exists) => {
    if (!file_exists || is_override) {
      fs.writeFile(mock_database_filename, JSON.stringify(data), async function (err: any) {
        if (err) {
          return console.error(err);
        }
        console.dir("Tasks file saved!");
      });
    } else {
      console.dir("Tasks file exists");
    }
  })
}

const getData = async (): Promise<string> => {
  const fsPromises = require('fs').promises;
  let data = await fsPromises.readFile(mock_database_filename)
    .catch((err: any) => console.error('Failed to read file', err));
  return data;
}