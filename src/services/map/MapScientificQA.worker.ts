import {
  runMapScientificQAGeometryChecks,
  type MapScientificQAGeometryInput,
  type MapScientificQAGeometryResult,
} from "./MapScientificQA";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<MapScientificQAGeometryInput>) => {
  const result: MapScientificQAGeometryResult = runMapScientificQAGeometryChecks(event.data);
  workerScope.postMessage(result);
};
