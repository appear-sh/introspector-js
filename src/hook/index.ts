// If file is being required, we can assume the user _wants_ to actually hook things.
import { EventEmitter } from "events"

import { hookInbound } from "../intercept"
import { setGlobalAppear } from "../helpers"

const emitter = new EventEmitter()
setGlobalAppear(emitter)
hookInbound(emitter)
