const mocha = heap.require('gulp-mocha');

module.exports = (profile = "default") => {
  const cfg = config[`mocha:${profile}`];
  return gulp.task(cfg.taskName, () => {
    return mocha(cfg.src, cfg.dst, cfg.opts)();
  });
};
