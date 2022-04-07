const { src, dest, parallel, series, watch } = require("gulp");
const del = require("del");
const data = require("./src/temData")
// console.log(data);


const loadPlugins = require("gulp-load-plugins");
const plugins = loadPlugins(); //  加载全部插件

const browserSync = require("browser-sync");
const bs = browserSync.create();

const sass = require("gulp-sass")(require("sass"));

// 处理css
const style = () => {
	return src("src/assets/styles/*.scss", { base: "src" }) // base为基准路径，复制生成相同路径
		.pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError)) // 代码样式展开
		.pipe(dest("temp"))
		.pipe(bs.reload({ stream: true })); // 浏览器刷新
};
// 处理脚本
const script = () => {
	return src("src/assets/scripts/*.js", { base: "src" })
		.pipe(plugins.babel({ presets: ["@babel/preset-env"] }))
		.pipe(dest("temp"))
		.pipe(bs.reload({ stream: true }));
};

// 处理页面模版

const page = () => {
	return src("src/*.html", { base: "src" })
		.pipe(plugins.swig({ data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
		.pipe(dest("temp"))
		.pipe(bs.reload({ stream: true }));
};
// 处理图片
const image = () => {
	return src("src/assets/images/**", { base: "src" })
		.pipe(plugins.imagemin()) //  压缩
		.pipe(dest("dist"));
};
// 字体
const font = () => {
	return src("src/assets/fonts/**", { base: "src" })
		.pipe(plugins.imagemin()) //  压缩
		.pipe(dest("dist"));
};
// 其他文件直接复制
const extra = () => {
	return src("public/**", { base: "public" }).pipe(dest("dist"));
};
// 定义并行任务
const compile = parallel(style, script, page);

// watch任务
const serve = () => {
	watch("src/assets/styles/*.scss", style);
	watch("src/assets/scripts/*.js", script);
	watch(["src/*.html", "src/**/*.html"], page);
	// NOTE：图片，字体和其他文件的修改不会执行构建，直接刷新
	watch(["src/assets/images/**", "src/assets/fonts/**", "public/**"], bs.reload); // 刷新浏览器

	// 初始化一个dev服务器
	bs.init({
		notify: false,
		port: 4000, // 端口
		open: false, // 不自动打开浏览器
		// files: 'dist/**', // 监听文件修改,直接精确bs.reload
		server: {
			baseDir: ["temp", "src", "public"], // 顺序在三个文件夹中查找资源
			routes: {
				"/node_modules": "node_modules", // FIXME:访问地址映射到指定目录，没参与构建!!!
			},
		},
	});
};

// 按照注释打包构建
// <!-- build:css assets/styles/vendor.css -->
// <link rel="stylesheet" href="/node_modules/bootstrap/dist/css/bootstrap.css">
// 这里面的所有依赖都会被合并打包到指定目录:assets/styles/vendor.css
// <!-- endbuild -->
const useref = () => {
	return (
		src("temp/*.html", { base: "temp" })
			.pipe(plugins.useref({ searchPath: ["temp", "."] }))
			// html js css
			.pipe(plugins.if(/\.js$/, plugins.uglify()))
			.pipe(plugins.if(/\.css$/, plugins.cleanCss()))
			.pipe(
				plugins.if(
					/\.html$/,
					plugins.htmlmin({
						collapseWhitespace: true, // 折叠换行符
						minifyCSS: true, // 内联css/js的压缩
						minifyJS: true,
					})
				)
			)
			.pipe(dest("dist"))
	);
};

// 对外导出三个-----------------------------------------------------------------
const clean = () => {
	return del(["dist", "temp"]); //  删除dist和temp下的所有文件
};
// build中才执行图片和字体等压缩
const build = series(clean, parallel(series(compile, useref), image, font, extra));
const develop = series(compile, serve);

// 注意生成了一个临时文件夹temp
// dev状态下,只处理js/css/html并放到temp目录中启动代理服务器，并且代理服务器routes选项能设置映射node_modules依赖
// build状态下,先处理处s/css/html并放到temp目录中,并且使用useref合并和处理依赖资源，最后压缩图片字体等输出到dist
// NOTE:否则useref中会出现src('dist').pipe(...).dest('dist')，文件修改会冲突
module.exports = {
	clean,
	build,
	develop,
};
