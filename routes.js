import DashboardLayout from "~theme/DashboardLayout.vue";

const pages = import.meta.glob("./pages/**/*.vue", { eager: true });

function pageComponent(name) {
	const mod = pages[`./pages/${name}.vue`];
	if (!mod) {
		throw new Error(`pageComponent: ${name} not found in this module's pages/`);
	}
	return mod.default;
}



const routes = [
    {
		path: "/",
		component: DashboardLayout,
		redirect: "/dashboard",
		children: [
			{
				path: "/coworking",
				name: "Spazi di Coworking",
				meta: { authorize: ["admin", "moma","moma_area", "user"]  },
				// lazy-loaded
				component: pageComponent("index"),
			},						
		]
	}
];

export default routes;