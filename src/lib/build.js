// Build-time constants injected by vite.config.js. They describe the bundle
// that is actually running, not the newest deployment — which is exactly the
// build a bug report should name.
export const build = Object.freeze(__BUILD_INFO__)

export const buildCommitUrl = build.commit
  ? `https://github.com/TroddenSpade/virgil/commit/${build.commit}`
  : ''
