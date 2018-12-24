#!/bin/bash
set -eux

CURL="curl --silent"
HEADER="-H X-Binaris-Api-Key:$(bn show apiKey)"
URL="https://${BINARIS_INVOKE_ENDPOINT:-run.binaris.com}/v2/run/$(bn show accountId)"

${CURL} ${HEADER} ${URL}/quine_py | diff quine.py -
${CURL} ${HEADER} ${URL}/quine_js | diff quine.js -
${CURL} ${HEADER} ${URL}/ouroboros_py | diff ouroboros.js -
${CURL} ${HEADER} ${URL}/ouroboros_js | diff ouroboros.py -

echo All clear.
