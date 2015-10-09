var gulp = require('gulp');
var browserSync = require('browser-sync');

gulp.task('browserSync', function() {
  browserSync({
    server:''
  })
});

gulp.task('watch', ['browserSync'], function() {
  gulp.watch('*.js', browserSync.reload);
  gulp.watch('*.html', browserSync.reload)
  gulp.watch('*.css', browserSync.reload)
})
