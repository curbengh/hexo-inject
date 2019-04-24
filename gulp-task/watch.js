// require something
module.exports = (profile = "default") => {
  const cfg = config[`watch:${profile}`];
  return gulp.task(cfg.taskName, () => {
    return cfg.opts.watchEntries.forEach(({targets, actions}) => {
      return gulp.watch(targets, actions);
    });
  });
};
