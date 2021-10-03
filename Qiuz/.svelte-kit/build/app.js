import { respond } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths, assets } from './runtime/paths.js';
import { set_prerendering } from './runtime/env.js';
import * as user_hooks from "./hooks.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.png\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<div id=\"svelte\">" + body + "</div>\n\t</body>\n</html>\n";

let options = null;

const default_settings = { paths: {"base":"","assets":""} };

// allow paths to be overridden in svelte-kit preview
// and in prerendering
export function init(settings = default_settings) {
	set_paths(settings.paths);
	set_prerendering(settings.prerendering || false);

	const hooks = get_hooks(user_hooks);

	options = {
		amp: false,
		dev: false,
		entry: {
			file: assets + "/_app/start-709b4269.js",
			css: [assets + "/_app/assets/start-464e9d0a.css"],
			js: [assets + "/_app/start-709b4269.js",assets + "/_app/chunks/vendor-c9f9a952.js"]
		},
		fetched: undefined,
		floc: false,
		get_component_path: id => assets + "/_app/" + entry_lookup[id],
		get_stack: error => String(error), // for security
		handle_error: (error, request) => {
			hooks.handleError({ error, request });
			error.stack = options.get_stack(error);
		},
		hooks,
		hydrate: true,
		initiator: undefined,
		load_component,
		manifest,
		paths: settings.paths,
		prerender: true,
		read: settings.read,
		root,
		service_worker: null,
		router: true,
		ssr: true,
		target: "#svelte",
		template,
		trailing_slash: "never"
	};
}

// input has already been decoded by decodeURI
// now handle the rest that decodeURIComponent would do
const d = s => s
	.replace(/%23/g, '#')
	.replace(/%3[Bb]/g, ';')
	.replace(/%2[Cc]/g, ',')
	.replace(/%2[Ff]/g, '/')
	.replace(/%3[Ff]/g, '?')
	.replace(/%3[Aa]/g, ':')
	.replace(/%40/g, '@')
	.replace(/%26/g, '&')
	.replace(/%3[Dd]/g, '=')
	.replace(/%2[Bb]/g, '+')
	.replace(/%24/g, '$');

const empty = () => ({});

const manifest = {
	assets: [{"file":"favicon.png","size":1571,"type":"image/png"},{"file":"img/1621890409882.jpg","size":5322,"type":"image/jpeg"},{"file":"img/AAYQAQSZAAgAAQAAAAAAABPIj0yNMKrJR96eOuPB_YDI0A.png","size":389,"type":"image/png"},{"file":"img/list.svg","size":482,"type":"image/svg+xml"}],
	layout: "src/routes/__layout.svelte",
	error: "src/routes/__error.svelte",
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
						b: ["src/routes/__error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/TakeQuiz\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/TakeQuiz.svelte"],
						b: ["src/routes/__error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/results\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/results.svelte"],
						b: ["src/routes/__error.svelte"]
					}
	]
};

// this looks redundant, but the indirection allows us to access
// named imports without triggering Rollup's missing import detection
const get_hooks = hooks => ({
	getSession: hooks.getSession || (() => ({})),
	handle: hooks.handle || (({ request, resolve }) => resolve(request)),
	handleError: hooks.handleError || (({ error }) => console.error(error.stack)),
	externalFetch: hooks.externalFetch || fetch
});

const module_lookup = {
	"src/routes/__layout.svelte": () => import("..\\..\\src\\routes\\__layout.svelte"),"src/routes/__error.svelte": () => import("..\\..\\src\\routes\\__error.svelte"),"src/routes/index.svelte": () => import("..\\..\\src\\routes\\index.svelte"),"src/routes/TakeQuiz.svelte": () => import("..\\..\\src\\routes\\TakeQuiz.svelte"),"src/routes/results.svelte": () => import("..\\..\\src\\routes\\results.svelte")
};

const metadata_lookup = {"src/routes/__layout.svelte":{"entry":"pages/__layout.svelte-5d15319b.js","css":["assets/pages/__layout.svelte-a568be15.css"],"js":["pages/__layout.svelte-5d15319b.js","chunks/vendor-c9f9a952.js"],"styles":[]},"src/routes/__error.svelte":{"entry":"pages/__error.svelte-9e356027.js","css":[],"js":["pages/__error.svelte-9e356027.js","chunks/vendor-c9f9a952.js"],"styles":[]},"src/routes/index.svelte":{"entry":"pages/index.svelte-3fb4ece2.js","css":["assets/pages/index.svelte-8f9c851a.css"],"js":["pages/index.svelte-3fb4ece2.js","chunks/vendor-c9f9a952.js"],"styles":[]},"src/routes/TakeQuiz.svelte":{"entry":"pages/TakeQuiz.svelte-802c2823.js","css":["assets/pages/TakeQuiz.svelte-0235e505.css"],"js":["pages/TakeQuiz.svelte-802c2823.js","chunks/vendor-c9f9a952.js"],"styles":[]},"src/routes/results.svelte":{"entry":"pages/results.svelte-754f7876.js","css":["assets/pages/results.svelte-617c8e7a.css"],"js":["pages/results.svelte-754f7876.js","chunks/vendor-c9f9a952.js"],"styles":[]}};

async function load_component(file) {
	const { entry, css, js, styles } = metadata_lookup[file];
	return {
		module: await module_lookup[file](),
		entry: assets + "/_app/" + entry,
		css: css.map(dep => assets + "/_app/" + dep),
		js: js.map(dep => assets + "/_app/" + dep),
		styles
	};
}

export function render(request, {
	prerender
} = {}) {
	const host = request.headers["host"];
	return respond({ ...request, host }, options, { prerender });
}