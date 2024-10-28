// If file is being required, we can assume the user _wants_ to actually hook things.
import { EventEmitter } from "events"

import {
  INTROSPECTOR_EMITTER_SYMBOL,
  INTROSPECTOR_HOOKED_SYMBOL,
} from "./symbol"
import { hookInbound } from "../intercept"

const emitter = ((globalThis as any)[INTROSPECTOR_EMITTER_SYMBOL] =
  new EventEmitter())

;(globalThis as any)[INTROSPECTOR_HOOKED_SYMBOL] = true

hookInbound(emitter)
