import { type EventEmitter } from "events"

import {
  APPEAR_SYMBOL,
  INTROSPECTOR_EMITTER_SYMBOL,
  INTROSPECTOR_HOOKED_SYMBOL,
} from "./hook/symbol"

type GlobalAppear = {
  [INTROSPECTOR_EMITTER_SYMBOL]: EventEmitter
  [INTROSPECTOR_HOOKED_SYMBOL]: boolean
}

declare global {
  var [APPEAR_SYMBOL]: GlobalAppear | null
}
