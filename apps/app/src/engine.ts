/**
 * Heavy media engine (Mediabunny + WebCodecs pipeline). Never import this file statically:
 * use loadEngine() from ./utils/loadEngine so it stays in a lazily loaded chunk.
 */
export { probe, plan, run, detectCapabilities } from '@whatmedia/core';
