import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const REQUEST_ID_HEADER = 'x-request-id';

// Fastify reuses an incoming x-request-id (see `requestIdHeader`) or falls back to this one.
export const generateRequestId = (): string => randomUUID();

// Echoes the id so a client report can be matched with the server logs.
export const echoRequestId = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.header(REQUEST_ID_HEADER, request.id);
};
