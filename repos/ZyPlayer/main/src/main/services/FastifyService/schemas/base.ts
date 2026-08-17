import type { TObject, TProperties } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

/**
 * Create a schema with a string enumeration type
 */
export const StringEnum = <T extends string[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({ type: 'string', enum: values });

/**
 * Create a schema with a number enumeration type
 */
export const NumberEnum = <T extends number[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({ type: 'number', enum: values });

/**
 * Enumeration of response status codes
 */
export enum ResponseCode {
  SUCCESS = 0,
  ERROR = -1,
}

/**
 * Convert object properties to nullable
 */
export const Nullable = <T extends TObject>(schema: T) =>
  Type.Object(
    Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, Type.Union([v, Type.Null()])]),
    ) as TProperties,
    { ...schema, properties: undefined },
  );

export const PageQuery = {
  pageNum: Type.Integer({ minimum: 1, default: 1, description: 'Page number' }),
  pageSize: Type.Integer({ minimum: 1, default: 10, description: 'Page size' }),
};

export const ResponseSchema = Type.Object(
  {
    code: Type.Number({
      enum: [ResponseCode.SUCCESS, ResponseCode.ERROR],
      format: 'int32',
      description: 'Response operation code',
    }),
    data: Type.Optional(Type.Any({ description: 'Response data' })),
    msg: Type.String({ description: 'Response message' }),
  },
  {
    additionalProperties: false,
    description: 'Standard response format',
  },
);

export const ResponseSuccessSchema = Type.Object(
  {
    ...Type.Omit(ResponseSchema, ['code', 'msg']).properties,
    code: Type.Literal(ResponseCode.SUCCESS, {
      format: 'int32',
      example: ResponseCode.SUCCESS,
    }),
    msg: Type.Literal('ok'),
  },
  {
    additionalProperties: false,
    description: 'Standard success response format',
  },
);

export const ResponseErrorSchema = Type.Object(
  {
    ...Type.Omit(ResponseSchema, ['code', 'msg']).properties,
    code: Type.Literal(ResponseCode.ERROR, {
      format: 'int32',
      example: ResponseCode.ERROR,
    }),
    msg: Type.String({ description: 'Error message' }),
  },
  {
    additionalProperties: false,
    description: 'Standard error response format',
  },
);

export const ResponseRedirectSchema = Type.Object(
  {
    headers: Type.Object({
      location: Type.String({ format: 'uri' }),
    }),
  },
  {
    additionalProperties: false,
    description: 'Standard redirect response format',
  },
);
