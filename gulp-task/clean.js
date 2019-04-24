// require something
const del = require('del');

module.exports = (profile = "default") => {
  const cfg = config[`clean:${profile}`];
  return gulp.task(cfg.taskName, () => {
    return del(cfg.src, cfg.opts).then(paths => {
      console.log(`Deleted${(cfg.opts.dryRun ? "(dry run)" : "")}:`);
      console.log(paths.join('\n'));
    });
  });
};
