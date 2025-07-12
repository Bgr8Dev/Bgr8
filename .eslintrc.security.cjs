{
  "extends": [
    "plugin:security/recommended",
    "plugin:node/recommended-module"
  ],
  "plugins": [
    "security",
    "node",
    "scanjs-rules",
    "no-unsanitized"
  ],
  "rules": {
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-new-buffer": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-object-injection": "error",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-unsafe-regex": "error",
    "node/no-deprecated-api": "error",
    "node/no-extraneous-require": "error",
    "node/no-missing-require": "error",
    "node/no-unpublished-require": "error",
    "node/no-unsupported-features/es-syntax": "error",
    "scanjs-rules/accidental_assignment": "error",
    "scanjs-rules/assign_to_hostname": "error",
    "scanjs-rules/assign_to_href": "error",
    "scanjs-rules/assign_to_location": "error",
    "scanjs-rules/assign_to_onmessage": "error",
    "scanjs-rules/assign_to_pathname": "error",
    "scanjs-rules/assign_to_protocol": "error",
    "scanjs-rules/assign_to_search": "error",
    "scanjs-rules/assign_to_src": "error",
    "no-unsanitized/method": "error",
    "no-unsanitized/property": "error"
  }
} 