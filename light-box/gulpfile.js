var gulp=require('gulp');
var browserSync =require('browser-sync').create();
var plumber=require('gulp-plumber');
var sass=require('gulp-sass');

//编译sass文件
gulp.task('compile-sass',function () {
	gulp.src('src/sass/*.scss')
	.pipe(plumber())
	.pipe(sass({
		outputStyle: 'expanded'
	}))
	.pipe(gulp.dest('build/css'));
});

//监控sass文件改动
gulp.task('sass:watch',function () {
	gulp.watch('src/sass/*.scss',['compile-sass']);
});

gulp.task('browser-sync',function () {
	var files=[
		'./build/*.html',
	    './build/css/*.css',
	    './build/js/*.js'
	];

	browserSync.init(files,{
		server:{
			baseDir:"./build"
		},
		port:3058
	});
});

gulp.task('default',['sass:watch','browser-sync']);

