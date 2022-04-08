exports.data = {
	title: "我改了你就刷新!",
	menus: [
		{
			name: "主页啦啦啦",
			icon: "aperture",
			link: "index.html",
		},
		{
			name: "Features",
			link: "features.html",
		},
		{
			name: "About",
			link: "about.html",
		},
		{
			name: "Contact",
			link: "#",
			children: [
				{
					name: "推特TTTT",
					link: "https://twitter.com/w_zce",
				},
				{
					name: "About",
					link: "https://weibo.com/zceme",
				},
				{
					name: "divider",
				},
				{
					name: "About",
					link: "https://github.com/zce",
				},
			],
		},
	],
	pkg: require("./package.json"),
	date: new Date(),
};
