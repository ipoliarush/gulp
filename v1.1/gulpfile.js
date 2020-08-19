'use strict';
var gulp = require('gulp'),
  browserSync = require('browser-sync').create(), // сервер для работы и автоматического обновления страниц
  plumber = require('gulp-plumber'), // модуль для отслеживания ошибок
  rigger = require('gulp-rigger'), // модуль для импорта содержимого одного файла в другой
  sourcemaps = require('gulp-sourcemaps'), // модуль для генерации карты исходных файлов
  sass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
  autoprefixer = require('autoprefixer'), // модуль для автоматической установки автопрефиксов
  cleanCSS = require('gulp-clean-css'), // плагин для минимизации CSS
  uglify = require('gulp-uglify'), // модуль для минимизации JavaScript
  cache = require('gulp-cache'), // модуль для кэширования
  imagemin = require('gulp-imagemin'), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
  jpegrecompress = require('imagemin-jpeg-recompress'), // плагин для сжатия jpeg
  pngquant = require('imagemin-pngquant'), // плагин для сжатия png
  del = require('del'), // плагин для удаления файлов и каталогов
  //extReplace = require("gulp-ext-replace"),
  //webp = require("imagemin-webp"),
  postcss = require('gulp-postcss'),

  rep = 'mini/';

var path = {
  vendor: {
    js: rep + 'app/js/vendor/*.js',
    css: rep + 'app/css/vendor/*.css'
  },
  dist: { //Тут мы укажем куда складывать готовые после сборки файлы
    html: rep + 'dist/',
    js: rep + 'dist/js/',
    scss: rep + 'dist/css/',
    css: rep + 'dist/css/',
    img: rep + 'dist/img/',
    fonts: rep + 'dist/fonts/'
  },
  app: { //Пути откуда брать исходники
    html: rep + 'app/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
    js: rep + 'app/js/*.js', //В стилях и скриптах нам понадобятся только main файлы
    scss: rep + 'app/css/*.scss',
    css: rep + 'app/css/*.css',
    img: rep + 'app/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
    fonts: rep + 'app/fonts/**/*.*'
  },
  watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
    html: rep + 'app/**/*.html',
    js: rep + 'app/js/**/*.js',
    scss: rep + 'app/css/**/*.scss',
    css: rep + 'app/css/**/*.css',
    img: rep + 'app/img/**/*.*',
    fonts: rep + 'app/fonts/**/*.*'
  },
  clean: './' + rep + 'dist/'
};


var config = {
  server: {
    baseDir: './' + rep + "dist"
  },
  tunnel: false,
  host: 'localhost',
  open: 'external',
  port: 8081,
  logPrefix: "ipoliarush"
};

// запуск сервера
gulp.task('browserSync', function(done) {
  browserSync.init(config);
  done();
});

// сбор vendorJs
gulp.task('vendorJs:build', function(done) {
  gulp.src(path.vendor.js) //Выберем файлы по нужному пути
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(sourcemaps.init()) //Инициализируем sourcemap
    .pipe(uglify()) //Сожмем наш js
    .pipe(sourcemaps.write()) //Пропишем карты
    .pipe(gulp.dest(path.dist.js)) //Выплюнем готовый файл в build
    .pipe(browserSync.reload({
      stream: true
    })); //И перезагрузим сервер
  done();
});

// сбор vendorCss
gulp.task('vendorCss:build', function(done) {
  gulp.src(path.vendor.css) //Выберем файлы по нужному пути
    .pipe(sourcemaps.init()) //То же самое что и с js
    .pipe(cleanCSS()) //Сожмем
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.dist.css)) //И в build
    .pipe(browserSync.reload({
      stream: true
    }));
  done();
});

// сбор html
gulp.task('html:build', function(done) {
  gulp.src(path.app.html) //Выберем файлы по нужному пути
    .pipe(plumber()) // отслеживание ошибок
    .pipe(rigger()) // импорт вложений
    .pipe(gulp.dest(path.dist.html)) //Выплюнем их в папку build
    .pipe(browserSync.reload({
      stream: true
    })); //И перезагрузим наш сервер для обновлений
  done();
});

// сбор js
gulp.task('js:build', function(done) {
  gulp.src(path.app.js) //Найдем наш main файл
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(rigger()) // импортируем все указанные файлы в main.js
    .pipe(sourcemaps.init()) //Инициализируем sourcemap
    .pipe(uglify()) //Сожмем наш js
    .pipe(sourcemaps.write('./')) //Пропишем карты
    .pipe(gulp.dest(path.dist.js)) //Выплюнем готовый файл в build
    .pipe(browserSync.reload({
      stream: true
    })); //И перезагрузим сервер
  done();
});

// сбор scss
gulp.task('scss:build', function(done) {
  gulp.src(path.app.scss) //Выберем наш main.scss
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(sourcemaps.init()) //То же самое что и с js
    .pipe(sass({
      outputStyle: 'compact'
    }).on('error', sass.logError)) // scss -> css
    .pipe(postcss([autoprefixer({
      overrideBrowserslist: ['last 2 versions'],
      cascade: false
    })]))
    // .pipe(autoprefixer(/*{тут был автопрефиксер-лист(галп-автопрефиксер я поменял его на просто автопрефиксер)}*/)) // добавим префиксы
    .pipe(cleanCSS({
      level: 2
    }, (details) => {
      console.log(`${details.name}: ${details.stats.originalSize}`);
      console.log(`${details.name}: ${details.stats.minifiedSize}`);
    })) // минимизируем CSS
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(path.dist.scss)) //И в build
    .pipe(browserSync.reload({
      stream: true
    }));
  done();
});

// сбор css
gulp.task('css:build', function(done) {
  gulp.src(path.app.css) //Выберем наш main.css
    .pipe(sourcemaps.init()) //То же самое что и с js
    .pipe(cleanCSS()) //Сожмем
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.dist.css)) //И в build
    .pipe(browserSync.reload({
      stream: true
    }));
  done();
});

// обработка картинок
gulp.task('image:build', function(done) {
  gulp.src(path.app.img) //Выберем наши картинки
    .pipe(cache(imagemin([ // сжатие изображений
      imagemin.gifsicle({
        interlaced: true
      }),
      jpegrecompress({
        progressive: true,
        max: 90,
        min: 80
      }),
      pngquant(),
      imagemin.svgo({
        plugins: [{
          removeViewBox: false
        }]
      })
    ])))
    .pipe(gulp.dest(path.dist.img))
  done();
});

/*
//создание webp
gulp.task('images:build', function (done) {
	gulp.src(path.app.img)
		.pipe(
			imagemin({
				verbose: true,
				plugins: webp({
					quality: 75,
            		method: 6,
            		sns: 0,
            		lossless: true
				})
			})
		)
		.pipe(extReplace(".webp"))
		.pipe(gulp.dest(path.dist.img));
	done();
});

*/

// сбор fonts
gulp.task('fonts:build', function(done) {
  gulp.src(path.app.fonts)
    .pipe(gulp.dest(path.dist.fonts));
  done();
});

// удаление каталога dist
gulp.task('clean:build', function(done) {
  del.sync(path.clean);
  done();
});

// очистка кэша
gulp.task('cache:clear', function(done) {
  cache.clearAll();
  done();
});

// сборка
gulp.task('build', gulp.series('clean:build', 'vendorCss:build', 'vendorJs:build', 'html:build', 'js:build', 'scss:build', 'css:build', 'fonts:build', 'image:build', function(done) {
  done();
}));

// запуск задач при изменении файлов
gulp.task('watch', function() {
  gulp.watch(path.watch.html, gulp.series('html:build'));
  gulp.watch(path.watch.scss, gulp.series('scss:build'));
  gulp.watch(path.watch.css, gulp.series('css:build'));
  gulp.watch(path.watch.js, gulp.series('vendorJs:build'));
  gulp.watch(path.watch.css, gulp.series('vendorCss:build'));
  gulp.watch(path.watch.js, gulp.series('js:build'));
  gulp.watch(path.watch.img, gulp.series('image:build'));
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
  //gulp.watch(path.watch.fonts, gulp.series('images:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series('clean:build', 'build', gulp.parallel('browserSync', 'watch')));
