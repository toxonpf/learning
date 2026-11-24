import { parentPort, workerData } from 'node:worker_threads';
import { solveSchedule } from './solver.js';

parentPort.postMessage(solveSchedule(workerData));
