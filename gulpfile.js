let {
  task,
  dest,
  watch,
  src,
  series,
  parallel
} = require('gulp');
let del = require('del');
let sass = require('gulp-sass');
let concat = require('gulp-concat');
let concatCss = require('gulp-concat-css');
let minifyCss = require('gulp-clean-css');
let uglify = require('gulp-uglify');
let rename = require('gulp-rename');
let pug = require('gulp-pug');
let autoprefixer = require('gulp-autoprefixer');
let sourcemaps = require('gulp-sourcemaps');
let merge = require('merge-stream');
let browserSync = require('browser-sync');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
// var watchify = require('watchify');
var babelify = require('babelify');

const server = browserSync.create();


const options = {
  npmPath: 'node_modules/',
  externalSeverRoot: '/web/app',
  devServerRoot: 'docs'
};


let externalSeverRoot = '../restserver/web/app';

let sassBundles = [{
  sassFiles: [
    options.npmPath + 'normalize.css/normalize.css',
    'scss/global.scss',
  ],
  outputFile: 'main.css',
  outputFolder: options.devServerRoot + '/css'
}];
let watchSassFiles = ['scss/**/*.scss'];


let watchJSFiles = ['js/**/*.js'];

let pugBundles = [{
  pugFiles: [
    'pug/sites/**/*.pug',
  ],
  outputFile: 'index.html',
  outputFolder: options.devServerRoot + '/'
}];
let watchPugFiles = ['pug/**/*.pug'];

let fontsBundle = {
  fontFiles: [
    'fonts/*',
  ]
};

function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    server: {
      baseDir: options.devServerRoot
    }
  });
  done();
}

function clean(){
   return del([options.devServerRoot]);
}



function scss() {
  let bundles = [];
  sassBundles.forEach(function (bundle, index) {
    bundles[index] = src(bundle.sassFiles)
      .pipe(sass().on('error', sass.logError))
      .pipe(concatCss(bundle.outputFile, {
        rebaseUrls: false
      }))
      // Base64 is super slow. Use only if necessary 
      // .pipe(cssBase64()) 
      .pipe(autoprefixer())
      .pipe(dest(bundle.outputFolder))
      .pipe(sourcemaps.init())
      .pipe(minifyCss())
      .pipe(rename({
        extname: '.min.css'
      }))
      .pipe(sourcemaps.write(''))
      .pipe(dest(bundle.outputFolder));
  });
  return merge(bundles);
}

function js() {

    return browserify({
        'entries': ['./js/main.js'],
        'debug': true,
        'transform': [
          babelify.configure({
            'presets': ["@babel/preset-env"]
          })
        ]
      })
      .bundle()
      .on('error', function (error) {
        console.error(error.message);
        this.emit('end');
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(dest(options.devServerRoot + '/js'))
      .pipe(rename({
        extname: '.min.js'
      }))
       .pipe(sourcemaps.init({
         'loadMaps': true
       }))
         .pipe(uglify())
         .pipe(sourcemaps.write('.'))
      .pipe(dest(options.devServerRoot + '/js'))
      .pipe(server.stream());
}


function pugBuild() {

  let bundles = [];
  pugBundles.forEach(function (bundle, index) {
    bundles[index] = src(bundle.pugFiles)
      .pipe(pug({
        pretty: true
      }).on('error', function (err) {
      console.error(err.message);
      this.emit('end');
      }))
      .pipe(dest(bundle.outputFolder));
  });

  return merge(bundles);
}

function favicon() {
  return src('images/favicon/*')
    .pipe(dest(options.devServerRoot + '/'));
}


const images = parallel(favicon, function copyImages() {
  return src('images/**/*')
    .pipe(dest(options.devServerRoot + '/images/'));
});

function fonts() {
  return src(fontsBundle.fontFiles)
    .pipe(dest(options.devServerRoot + '/fonts/'));
}



const watcher = parallel(function watcherPug() {
  return watch(watchPugFiles, series(pugBuild, reload))
}, 
  function watcherScss() {
  return watch(watchSassFiles, series(scss, reload))
  },
  function watcherJS() {
    return watch(watchJSFiles, series(js, reload))
  });

const build = series(clean, parallel(scss, js, pugBuild, images, fonts));

// const dev = series(build, serve, reload);
const dev = series(build, serve, watcher, reload);

task('publish', series(build, function publishToServer() {
  return src(options.devServerRoot + '/**/*')
    .pipe(dest(externalSeverRoot));
}));

function errorHandler(error) {
  console.log(error.message);
}

exports.default = dev;
