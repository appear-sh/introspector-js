# @appear.sh/introspector

## 1.1.0

### Minor Changes

- 36e9603: add debug option to allow easier debugging of what introspector is doing
- 36e9603: add runtime config input validation on top of TS types

### Patch Changes

- 36e9603: Fix request body detection for outgoing fetch() requests
- 36e9603: Fix handling of responses without body
- 36e9603: Fix response body parsing for all outgoing requests

## 1.0.1

### Patch Changes

- 87be47c: Fix Reporter export

## 1.0.0

### Major Changes

- 07b0f7f: Brand new integration powered by OpenTelemetry libraries

  This version brings significant improvements:

  - Full OpenTelemetry integration for better runtime compatibility
  - Enhanced developer experience with standardized instrumentation
  - New interface design for future extensibility
  - Reduced likelihood of breaking changes in future releases

  For migration instructions, please refer to the README.md file.
