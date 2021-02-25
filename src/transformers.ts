import {
  AvailableStompTransforms,
  StompMessageTransformer,
} from './stomp.interface';

export const JsonTransform: StompMessageTransformer = payload => {
  return JSON.parse(payload.messageString.toString());
};

export const TextTransform: StompMessageTransformer = payload => {
  return payload.messageString.toString();
};

export const DefaultTransform: StompMessageTransformer = payload => payload;

export const BinaryTransform: StompMessageTransformer = payload =>
  payload.readableMessage;

export function getTransform(
  transform: AvailableStompTransforms,
): StompMessageTransformer {
  if (typeof transform === 'function') {
    return transform;
  }
  if (transform === 'string') {
    return TextTransform;
  }

  if (transform === 'json') {
    return JsonTransform;
  }

  if (transform === 'binary') {
    return BinaryTransform;
  }

  return DefaultTransform;
}
