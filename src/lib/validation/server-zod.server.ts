import '@tanstack/react-start/server-only'

import {
  array,
  boolean,
  enum as zodEnum,
  json,
  literal,
  number,
  object,
  preprocess,
  record,
  string,
} from 'zod'

export const serverZod = {
  array,
  boolean,
  enum: zodEnum,
  json,
  literal,
  number,
  object,
  preprocess,
  record,
  string,
}
