var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone = {};
  for (const key in obj) {
    clone[key.toLowerCase()] = obj[key];
  }
  return clone;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
const s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
const s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
const escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
const absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
class ReadOnlyFormData {
  constructor(map) {
    __privateAdd(this, _map, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of __privateGet(this, _map))
      yield key;
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
}
_map = new WeakMap();
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function afterUpdate() {
}
var root_svelte_svelte_type_style_lang = "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}";
const css$4 = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$4);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
let base = "";
let assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
let options = null;
const default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-709b4269.js",
      css: [assets + "/_app/assets/start-464e9d0a.css"],
      js: [assets + "/_app/start-709b4269.js", assets + "/_app/chunks/vendor-c9f9a952.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
const empty = () => ({});
const manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "img/1621890409882.jpg", "size": 5322, "type": "image/jpeg" }, { "file": "img/AAYQAQSZAAgAAQAAAAAAABPIj0yNMKrJR96eOuPB_YDI0A.png", "size": 389, "type": "image/png" }, { "file": "img/list.svg", "size": 482, "type": "image/svg+xml" }],
  layout: "src/routes/__layout.svelte",
  error: "src/routes/__error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/TakeQuiz\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/TakeQuiz.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/results\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/results.svelte"],
      b: ["src/routes/__error.svelte"]
    }
  ]
};
const get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
  externalFetch: hooks.externalFetch || fetch
});
const module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  "src/routes/__error.svelte": () => Promise.resolve().then(function() {
    return __error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/TakeQuiz.svelte": () => Promise.resolve().then(function() {
    return TakeQuiz$1;
  }),
  "src/routes/results.svelte": () => Promise.resolve().then(function() {
    return results;
  })
};
const metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-5d15319b.js", "css": ["assets/pages/__layout.svelte-a568be15.css"], "js": ["pages/__layout.svelte-5d15319b.js", "chunks/vendor-c9f9a952.js"], "styles": [] }, "src/routes/__error.svelte": { "entry": "pages/__error.svelte-9e356027.js", "css": [], "js": ["pages/__error.svelte-9e356027.js", "chunks/vendor-c9f9a952.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-3fb4ece2.js", "css": ["assets/pages/index.svelte-8f9c851a.css"], "js": ["pages/index.svelte-3fb4ece2.js", "chunks/vendor-c9f9a952.js"], "styles": [] }, "src/routes/TakeQuiz.svelte": { "entry": "pages/TakeQuiz.svelte-802c2823.js", "css": ["assets/pages/TakeQuiz.svelte-0235e505.css"], "js": ["pages/TakeQuiz.svelte-802c2823.js", "chunks/vendor-c9f9a952.js"], "styles": [] }, "src/routes/results.svelte": { "entry": "pages/results.svelte-754f7876.js", "css": ["assets/pages/results.svelte-617c8e7a.css"], "js": ["pages/results.svelte-754f7876.js", "chunks/vendor-c9f9a952.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var app = "/*! tailwindcss v2.2.15 | MIT License | https://tailwindcss.com*/\n/*! modern-normalize v1.1.0 | MIT License | https://github.com/sindresorhus/modern-normalize */html{-webkit-text-size-adjust:100%;line-height:1.15;-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;margin:0}hr{color:inherit;height:0}abbr[title]{-webkit-text-decoration:underline dotted;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}::-moz-focus-inner{border-style:none;padding:0}:-moz-focusring{outline:1px dotted ButtonText}:-moz-ui-invalid{box-shadow:none}legend{padding:0}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}button{background-color:transparent;background-image:none}fieldset,ol,ul{margin:0;padding:0}ol,ul{list-style:none}html{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;line-height:1.5}body{font-family:inherit;line-height:inherit}*,:after,:before{border:0 solid;box-sizing:border-box}hr{border-top-width:1px}img{border-style:solid}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{color:#9ca3af;opacity:1}input:-ms-input-placeholder,textarea:-ms-input-placeholder{color:#9ca3af;opacity:1}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:-moz-focusring{outline:auto}table{border-collapse:collapse}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}button,input,optgroup,select,textarea{color:inherit;line-height:inherit;padding:0}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]{display:none}*,:after,:before{--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-transform:translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));--tw-border-opacity:1;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;border-color:rgba(229,231,235,var(--tw-border-opacity))}.container{width:100%}@media (min-width:640px){.container{max-width:640px}}@media (min-width:768px){.container{max-width:768px}}@media (min-width:1024px){.container{max-width:1024px}}@media (min-width:1280px){.container{max-width:1280px}}@media (min-width:1536px){.container{max-width:1536px}}.absolute{position:absolute}.relative{position:relative}.top-0{top:0}.left-0{left:0}.z-0{z-index:0}.z-20{z-index:20}.float-right{float:right}.mr-2{margin-right:.5rem}.mr-3{margin-right:.75rem}.mt-1{margin-top:.25rem}.mt-4{margin-top:1rem}.mb-2{margin-bottom:.5rem}.ml-2{margin-left:.5rem}.mt-2{margin-top:.5rem}.ml-1{margin-left:.25rem}.block{display:block}.inline-block{display:inline-block}.inline{display:inline}.flex{display:flex}.grid{display:grid}.hidden{display:none}.h-screen{height:100vh}.h-full{height:100%}.h-2{height:.5rem}.h-6{height:1.5rem}.h-3{height:.75rem}.w-screen{width:100vw}.w-full{width:100%}.w-10\\/12{width:83.333333%}.w-10{width:2.5rem}.w-6{width:1.5rem}.transform{transform:var(--tw-transform)}.cursor-pointer{cursor:pointer}.select-none{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.list-disc{list-style-type:disc}.appearance-none{-webkit-appearance:none;-moz-appearance:none;appearance:none}.grid-rows-1{grid-template-rows:repeat(1,minmax(0,1fr))}.flex-row{flex-direction:row}.flex-col{flex-direction:column}.content-center{align-content:center}.items-start{align-items:flex-start}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-1{gap:.25rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-y-2{row-gap:.5rem}.gap-x-2{-moz-column-gap:.5rem;column-gap:.5rem}.divide-y>:not([hidden])~:not([hidden]){--tw-divide-y-reverse:0;border-bottom-width:calc(1px*var(--tw-divide-y-reverse));border-top-width:calc(1px*(1 - var(--tw-divide-y-reverse)))}.divide-gray-300>:not([hidden])~:not([hidden]){--tw-divide-opacity:1;border-color:rgba(209,213,219,var(--tw-divide-opacity))}.overflow-hidden{overflow:hidden}.whitespace-nowrap{white-space:nowrap}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-t-lg{border-top-left-radius:.5rem;border-top-right-radius:.5rem}.rounded-b-lg{border-bottom-left-radius:.5rem;border-bottom-right-radius:.5rem}.border{border-width:1px}.border-l{border-left-width:1px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-b{border-bottom-width:1px}.border-gray-500{--tw-border-opacity:1;border-color:rgba(107,114,128,var(--tw-border-opacity))}.border-gray-300{--tw-border-opacity:1;border-color:rgba(209,213,219,var(--tw-border-opacity))}.bg-gray-800{--tw-bg-opacity:1;background-color:rgba(31,41,55,var(--tw-bg-opacity))}.bg-white{--tw-bg-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.bg-gray-300{--tw-bg-opacity:1;background-color:rgba(209,213,219,var(--tw-bg-opacity))}.bg-opacity-70{--tw-bg-opacity:0.7}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-3{padding:.75rem}.py-2{padding-bottom:.5rem;padding-top:.5rem}.px-3{padding-left:.75rem;padding-right:.75rem}.py-5{padding-bottom:1.25rem;padding-top:1.25rem}.py-4{padding-bottom:1rem;padding-top:1rem}.px-4{padding-left:1rem;padding-right:1rem}.py-3{padding-bottom:.75rem;padding-top:.75rem}.py-1{padding-bottom:.25rem;padding-top:.25rem}.px-5{padding-left:1.25rem;padding-right:1.25rem}.pl-4{padding-left:1rem}.pb-3{padding-bottom:.75rem}.pl-2{padding-left:.5rem}.pb-4{padding-bottom:1rem}.pl-5{padding-left:1.25rem}.pb-5{padding-bottom:1.25rem}.pr-3{padding-right:.75rem}.text-center{text-align:center}.align-middle{vertical-align:middle}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.text-sm{font-size:.875rem;line-height:1.25rem}.font-semibold{font-weight:600}.font-light{font-weight:300}.font-normal{font-weight:400}.text-gray-800{--tw-text-opacity:1;color:rgba(31,41,55,var(--tw-text-opacity))}.text-gray-500{--tw-text-opacity:1;color:rgba(107,114,128,var(--tw-text-opacity))}.text-gray-700{--tw-text-opacity:1;color:rgba(55,65,81,var(--tw-text-opacity))}.text-white{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}.text-gray-100{--tw-text-opacity:1;color:rgba(243,244,246,var(--tw-text-opacity))}.text-gray-600{--tw-text-opacity:1;color:rgba(75,85,99,var(--tw-text-opacity))}.text-gray-400{--tw-text-opacity:1;color:rgba(156,163,175,var(--tw-text-opacity))}.shadow-none{--tw-shadow:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.transition{transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.duration-200{transition-duration:.2s}.ease-in{transition-timing-function:cubic-bezier(.4,0,1,1)}.hover\\:bg-gray-400:hover{--tw-bg-opacity:1;background-color:rgba(156,163,175,var(--tw-bg-opacity))}.hover\\:bg-opacity-25:hover{--tw-bg-opacity:0.25}.hover\\:p-3:hover{padding:.75rem}@media (min-width:1024px){.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.lg\\:flex-row{flex-direction:row}.lg\\:items-center{align-items:center}.lg\\:justify-between{justify-content:space-between}.lg\\:border-l{border-left-width:1px}.lg\\:border-gray-900{--tw-border-opacity:1;border-color:rgba(17,24,39,var(--tw-border-opacity))}.lg\\:pl-3{padding-left:.75rem}}";
const _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${slots.default ? slots.default({}) : ``}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
const _error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<center>page not found</center>`;
});
var __error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _error
});
var Modal_svelte_svelte_type_style_lang = ".modal{height:auto;left:50%;position:absolute;top:50%;transform:translate(-50%,-55%);width:55%;z-index:1}@media only screen and (max-width:600px){.modal{bottom:0;height:90%;overflow-y:scroll;position:absolute;transform:translate(-50%,-50%);width:100%;z-index:1}#footers-left.svelte-inu8eo.svelte-inu8eo,#footers.svelte-inu8eo.svelte-inu8eo{row-gap:1rem}}.rules.svelte-inu8eo>li.svelte-inu8eo{font-size:14px;padding:.25rem 0}.ln-color.svelte-inu8eo.svelte-inu8eo{color:#2867b2}#take.svelte-inu8eo.svelte-inu8eo{border:1px solid #2867b2;position:relative}#take.svelte-inu8eo.svelte-inu8eo:hover{background-color:rgba(40,103,178,.1);border:2px solid #2867b2}#startBtn.svelte-inu8eo.svelte-inu8eo{background-color:#0a66c2}#startBtn.svelte-inu8eo.svelte-inu8eo:hover{background-color:#004182}";
var index_svelte_svelte_type_style_lang = ".ln-color.svelte-gnkx6e{color:#2867b2}#take.svelte-gnkx6e{border:1px solid #2867b2}#take.svelte-gnkx6e:hover{background-color:rgba(40,103,178,.1);border:2px solid #2867b2}";
const css$3 = {
  code: ".ln-color.svelte-gnkx6e{color:#2867b2}#take.svelte-gnkx6e{border:1px solid #2867b2}#take.svelte-gnkx6e:hover{background-color:rgba(40,103,178,.1);border:2px solid #2867b2}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport { fade, fly } from 'svelte/transition';\\n\\timport { flip } from 'svelte/animate';\\n\\timport Modal from '../components/modal/Modal.svelte';\\n\\n\\tlet openModal = false;\\n\\n\\t// change modal state\\n\\tfunction handleModal() {\\n\\t\\topenModal = !openModal;\\n\\t}\\n\\n\\tfunction handleColseModal(e) {\\n\\t\\topenModal = e.detail.open;\\n\\t}\\n\\n\\t$: {\\n\\t\\topenModal;\\n\\t}\\n<\/script>\\n\\n<div class=\\"w-screen h-screen\\">\\n\\t<div class=\\"flex justify-center items-center h-full\\">\\n\\t\\t<button on:click={handleModal} id=\\"take\\" class=\\"ln-color rounded-full py-2 px-3 font-semibold\\"\\n\\t\\t\\t>Take skill quiz</button\\n\\t\\t>\\n\\t</div>\\n</div>\\n\\n{#if openModal}\\n\\t<div\\n\\t\\tclass=\\"absolute top-0 left-0 w-full h-full z-0 bg-gray-800 bg-opacity-70\\"\\n\\t\\tin:fade\\n\\t\\tout:fade={{ x: 100 }}\\n\\t>\\n\\t\\t<Modal open={openModal} on:closeModal={handleColseModal} />\\n\\t</div>\\n{/if}\\n\\n<style>.ln-color{color:#2867b2}.ln-bg{background-color:#2867b2}#take{border:1px solid #2867b2}#take:hover{background-color:rgba(40,103,178,.1);border:2px solid #2867b2}</style>\\n"],"names":[],"mappings":"AAuCO,uBAAS,CAAC,MAAM,OAAO,CAAC,AAAgC,mBAAK,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,OAAO,CAAC,mBAAK,MAAM,CAAC,iBAAiB,KAAK,EAAE,CAAC,GAAG,CAAC,GAAG,CAAC,EAAE,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,OAAO,CAAC"}`
};
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<div class="${"w-screen h-screen"}"><div class="${"flex justify-center items-center h-full"}"><button id="${"take"}" class="${"ln-color rounded-full py-2 px-3 font-semibold svelte-gnkx6e"}">Take skill quiz</button></div></div>

${``}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
var answers_svelte_svelte_type_style_lang = ".answer-check.svelte-1t593em{background-color:#0075af;border-radius:50%;height:70%;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:70%}";
const css$2 = {
  code: ".answer-check.svelte-1t593em{background-color:#0075af;border-radius:50%;height:70%;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:70%}",
  map: `{"version":3,"file":"answers.svelte","sources":["answers.svelte"],"sourcesContent":["<script>\\r\\n\\timport { createEventDispatcher } from 'svelte';\\r\\n\\r\\n\\texport let data;\\r\\n\\texport let clicked;\\r\\n\\r\\n\\tlet pressed = false;\\r\\n\\tconst dispatch = createEventDispatcher();\\r\\n\\r\\n\\tfunction choose(d) {\\r\\n\\t\\tpressed = !pressed;\\r\\n\\t\\tdispatch('selectedAnswer', {\\r\\n\\t\\t\\tselect: d.id\\r\\n\\t\\t});\\r\\n\\t}\\r\\n\\r\\n\\t$: {\\r\\n\\t\\tdata, pressed, clicked;\\r\\n\\t}\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"flex align-center py-4\\" on:click={choose(data)}>\\r\\n\\t<div class=\\"relative rounded-full border border-gray-500\\" style=\\"width:24px;height:24px;\\">\\r\\n\\t\\t<div class=\\"answer-check {data?.id == clicked ? '' : 'hidden'}\\" />\\r\\n\\t</div>\\r\\n\\t<span class=\\"pl-2 text-gray-600\\">{data?.text}</span>\\r\\n</div>\\r\\n\\r\\n<style>.answer-check{background-color:#0075af;border-radius:50%;height:70%;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:70%}</style>\\r\\n"],"names":[],"mappings":"AA4BO,4BAAa,CAAC,iBAAiB,OAAO,CAAC,cAAc,GAAG,CAAC,OAAO,GAAG,CAAC,KAAK,GAAG,CAAC,SAAS,QAAQ,CAAC,IAAI,GAAG,CAAC,UAAU,UAAU,IAAI,CAAC,IAAI,CAAC,CAAC,MAAM,GAAG,CAAC"}`
};
const Answers = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let { clicked } = $$props;
  createEventDispatcher();
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.clicked === void 0 && $$bindings.clicked && clicked !== void 0)
    $$bindings.clicked(clicked);
  $$result.css.add(css$2);
  return `<div class="${"flex align-center py-4"}"><div class="${"relative rounded-full border border-gray-500"}" style="${"width:24px;height:24px;"}"><div class="${"answer-check " + escape((data == null ? void 0 : data.id) == clicked ? "" : "hidden") + " svelte-1t593em"}"></div></div>
	<span class="${"pl-2 text-gray-600"}">${escape(data == null ? void 0 : data.text)}</span>
</div>`;
});
const quizTime = 2e3;
const quizName = "Cascade Style Sheet Quiz";
const details = [
  {
    id: 1,
    time: 70,
    rightAnswer: 1,
    question: "Question 1",
    answers: [
      {
        id: 1,
        text: "Q1 Answer A",
        selected: false
      },
      {
        id: 2,
        text: "Q1 Answer B",
        selected: false
      },
      {
        id: 3,
        text: "Q1 Answer C",
        selected: false
      },
      {
        id: 4,
        text: "Q1 Answer D",
        selected: false
      }
    ]
  },
  {
    id: 2,
    time: 90,
    rightAnswer: 0,
    question: "Question 2",
    answers: [
      {
        id: 1,
        text: "Q2 Answer A",
        selected: false
      },
      {
        id: 2,
        text: "Q2 Answer B",
        selected: false
      },
      {
        id: 3,
        text: "Q2 Answer C",
        selected: false
      },
      {
        id: 4,
        text: "Q2 Answer D",
        selected: false
      }
    ]
  },
  {
    id: 3,
    time: 120,
    rightAnswer: 3,
    question: "Question 3",
    answers: [
      {
        id: 1,
        text: "Q3 Answer A",
        selected: false
      },
      {
        id: 2,
        text: "Q3 Answer B",
        selected: false
      },
      {
        id: 3,
        text: "Q3 Answer C",
        selected: false
      },
      {
        id: 4,
        text: "Q3 Answer D",
        selected: false
      }
    ]
  },
  {
    id: 4,
    time: 145,
    rightAnswer: 2,
    question: "Question 4",
    answers: [
      {
        id: 1,
        text: "Q4 Answer A",
        selected: false
      },
      {
        id: 2,
        text: "Q4 Answer B",
        selected: false
      },
      {
        id: 3,
        text: "Q4 Answer C",
        selected: false
      },
      {
        id: 4,
        text: "Q4 Answer D",
        selected: false
      }
    ]
  }
];
var db = {
  quizTime,
  quizName,
  details
};
var TakeQuiz_svelte_svelte_type_style_lang = ".wrapper.svelte-1c5eu02{left:50%;top:50%;transform:translate(-50%,-50%);width:80%}@media(max-width:768px){.wrapper.svelte-1c5eu02{left:50%;top:50%;transform:translate(-50%,-50%);width:100%!important}}";
const css$1 = {
  code: ".wrapper.svelte-1c5eu02{left:50%;top:50%;transform:translate(-50%,-50%);width:80%}@media(max-width:768px){.wrapper.svelte-1c5eu02{left:50%;top:50%;transform:translate(-50%,-50%);width:100%!important}}",
  map: `{"version":3,"file":"TakeQuiz.svelte","sources":["TakeQuiz.svelte"],"sourcesContent":["<script>\\r\\n\\timport Answer from '../components/answers/answers.svelte';\\r\\n\\timport db from '../API/stages.json';\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\r\\n\\tlet current_stage = 0,\\r\\n\\t\\tpercentage = 0,\\r\\n\\t\\tviewed = false,\\r\\n\\t\\tnoAnswers = true,\\r\\n\\t\\tanswerClicked = null,\\r\\n\\t\\tcurrent_time,\\r\\n\\t\\tdone = false,\\r\\n\\t\\tadditionTime = 0,\\r\\n\\t\\ttotalQuestions = db.details.length;\\r\\n\\r\\n\\t$: {\\r\\n\\t\\tcurrent_stage, current_time, done, additionTime;\\r\\n\\t}\\r\\n\\r\\n\\t// event to next question\\r\\n\\tlet nextQuestion = (index) => {\\r\\n\\t\\tprogressCounter();\\r\\n\\t\\treturn db.details[index];\\r\\n\\t};\\r\\n\\r\\n\\t// calc pecentage of progress\\r\\n\\tlet progressCounter = () => {\\r\\n\\t\\tpercentage = (current_stage / totalQuestions) * 100;\\r\\n\\t};\\r\\n\\r\\n\\tprogressCounter();\\r\\n\\r\\n\\t// handle answer\\r\\n\\tfunction handleAnswer(e) {\\r\\n\\t\\tnoAnswers = false;\\r\\n\\t\\tlet index = nextQuestion(current_stage).answers.findIndex((item) => item.id == e.detail.select);\\r\\n\\r\\n\\t\\t// set all selected to false\\r\\n\\t\\tnextQuestion(current_stage).answers = nextQuestion(current_stage).answers.map(\\r\\n\\t\\t\\t(value, index) => {\\r\\n\\t\\t\\t\\tvalue.selected = false;\\r\\n\\t\\t\\t\\treturn value;\\r\\n\\t\\t\\t}\\r\\n\\t\\t);\\r\\n\\r\\n\\t\\tanswerClicked = nextQuestion(current_stage).answers[index].id;\\r\\n\\t\\tnextQuestion(current_stage).answers[index].selected =\\r\\n\\t\\t\\t!nextQuestion(current_stage).answers[index].selected;\\r\\n\\t}\\r\\n\\r\\n\\tlet counter = {\\r\\n\\t\\tminutes: 0,\\r\\n\\t\\tsecondes: 0\\r\\n\\t};\\r\\n\\r\\n\\t// countdown\\r\\n\\tlet countdown = () => {\\r\\n\\t\\tlet minutes = Math.floor(current_time / 60);\\r\\n\\t\\tlet secondes = current_time % 60;\\r\\n\\r\\n\\t\\tcurrent_time = nextQuestion(current_stage)?.time;\\r\\n\\r\\n\\t\\tlet intCountdown = setInterval(() => {\\r\\n\\t\\t\\t// decreament by 1\\r\\n\\t\\t\\tcurrent_time = current_time - 1;\\r\\n\\r\\n\\t\\t\\t// count down for minutes every 60 sec\\r\\n\\t\\t\\tminutes = Math.floor(current_time / 60);\\r\\n\\t\\t\\tsecondes = current_time % 60;\\r\\n\\r\\n\\t\\t\\tcounter.minutes = minutes < 10 ? '0' + minutes : minutes;\\r\\n\\t\\t\\tcounter.secondes = secondes < 10 ? '0' + secondes : secondes;\\r\\n\\r\\n\\t\\t\\tif (current_time == 0) {\\r\\n\\t\\t\\t\\tcurrent_stage += 1;\\r\\n\\t\\t\\t\\tdone = true;\\r\\n\\t\\t\\t\\tclearInterval(intCountdown);\\r\\n\\t\\t\\t\\tviewed = !viewed;\\r\\n\\t\\t\\t\\tnoAnswers = true;\\r\\n\\t\\t\\t\\tcountdown();\\r\\n\\t\\t\\t}\\r\\n\\t\\t}, 1000);\\r\\n\\t};\\r\\n\\r\\n\\t$: {\\r\\n\\t\\tnoAnswers, answerClicked, viewed, done;\\r\\n\\t}\\r\\n\\r\\n\\tcountdown(nextQuestion(current_stage)?.time);\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"w-screen h-screen\\">\\r\\n\\t<!-- outter container -->\\r\\n\\t<div class=\\"w-full h-full\\" style=\\"background-color: #F3F2EF;\\" />\\r\\n\\r\\n\\t<!-- inner conatainer -->\\r\\n\\t<div class=\\"wrapper absolute z-20\\">\\r\\n\\t\\t<div class=\\"holder\\">\\r\\n\\t\\t\\t<!-- header -->\\r\\n\\t\\t\\t<div\\r\\n\\t\\t\\t\\tclass=\\"text-center text-white border-l border-r border-t border-gray-500 rounded-t-lg py-3\\"\\r\\n\\t\\t\\t\\tstyle=\\"background-color:#666666\\"\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\t<h1 class=\\"text-xl text-gray-100 inline-block\\">{db.quizName}</h1>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"border-l border-b border-r rounded-b-lg border-gray-300\\">\\r\\n\\t\\t\\t\\t<!-- question -->\\r\\n\\t\\t\\t\\t<div class=\\"pl-4 border-b border-gray-300 bg-white py-4\\">\\r\\n\\t\\t\\t\\t\\t<h6 class=\\"text-md text-l font-normal text-gray-600\\">\\r\\n\\t\\t\\t\\t\\t\\t{nextQuestion(current_stage).question}\\r\\n\\t\\t\\t\\t\\t</h6>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<!-- answers -->\\r\\n\\t\\t\\t\\t{#if viewed}\\r\\n\\t\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\t\\tid=\\"answers-container\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"pl-4\\"\\r\\n\\t\\t\\t\\t\\t\\tstyle=\\"background-color: #F9FAFB;\\"\\r\\n\\t\\t\\t\\t\\t\\tin:fly={{ duration: 750, opacity: 0 }}\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"questions flex flex-col divide-y divide-gray-300\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<!-- answers -->\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each nextQuestion(current_stage)?.answers as answer}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<Answer clicked={answerClicked} data={answer} on:selectedAnswer={handleAnswer} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\t\\tid=\\"answers-container\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"pl-4\\"\\r\\n\\t\\t\\t\\t\\t\\tstyle=\\"background-color: #F9FAFB;\\"\\r\\n\\t\\t\\t\\t\\t\\tin:fly={{ duration: 750, opacity: 0 }}\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"questions flex flex-col divide-y divide-gray-300\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<!-- answers -->\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each nextQuestion(current_stage)?.answers as answer}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<Answer clicked={answerClicked} data={answer} on:selectedAnswer={handleAnswer} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t<!-- feedback -->\\r\\n\\t\\t\\t\\t<div class=\\"feedback pl-4 py-3 border-t border-gray-300\\" style=\\"background-color: #F9FAFB;\\">\\r\\n\\t\\t\\t\\t\\t<h6 class=\\"text-sm text-gray-600\\">\\r\\n\\t\\t\\t\\t\\t\\tSomething wrong with this question? <span class=\\"font-semibold\\">Give feedback</span>\\r\\n\\t\\t\\t\\t\\t</h6>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<!-- loading progress -->\\r\\n\\t\\t\\t\\t<div class=\\"w-full h-3\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"relative\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"overflow-hidden h-3 text-xs flex bg-gray-300\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"width:{percentage}%;background-color:#56687A;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<!-- next question -->\\r\\n\\t\\t\\t\\t<div class=\\"next rounded-b-lg bg-white px-4 py-3\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"holder flex justify-between items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"time text-gray-600\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<span>Q {current_stage + 1}/{db.details.length}</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"pl-4\\">{counter.minutes}:{counter.secondes}</span>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"button\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"rounded-full py-1 px-4\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"background-color: {noAnswers ? '#F3F2EF' : '#0075AF'};color:{noAnswers\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t? '#56687A'\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t: 'white'};cursor:{noAnswers ? 'default' : 'pointer'};transition:0.4s\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tif (current_stage + 1 >= totalQuestions) {\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t// navigate to results page\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\twindow.location.href = '/results';\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcurrent_stage = current_stage + 1;\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tanswerClicked = null;\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tviewed = !viewed;\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tnoAnswers = true;\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tNext\\r\\n\\t\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</div>\\r\\n\\r\\n<style>.wrapper{left:50%;top:50%;transform:translate(-50%,-50%);width:80%}@media (max-width:768px){.wrapper{left:50%;top:50%;transform:translate(-50%,-50%);width:100%!important}}</style>\\r\\n"],"names":[],"mappings":"AAkMO,uBAAQ,CAAC,KAAK,GAAG,CAAC,IAAI,GAAG,CAAC,UAAU,UAAU,IAAI,CAAC,IAAI,CAAC,CAAC,MAAM,GAAG,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,uBAAQ,CAAC,KAAK,GAAG,CAAC,IAAI,GAAG,CAAC,UAAU,UAAU,IAAI,CAAC,IAAI,CAAC,CAAC,MAAM,IAAI,UAAU,CAAC,CAAC"}`
};
const TakeQuiz = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a, _b, _c;
  let current_stage = 0, percentage = 0, viewed = false, noAnswers = true, answerClicked = null, current_time, totalQuestions = db.details.length;
  let nextQuestion = (index2) => {
    progressCounter();
    return db.details[index2];
  };
  let progressCounter = () => {
    percentage = current_stage / totalQuestions * 100;
  };
  progressCounter();
  let counter = { minutes: 0, secondes: 0 };
  let countdown = () => {
    var _a2;
    let minutes = Math.floor(current_time / 60);
    let secondes = current_time % 60;
    current_time = (_a2 = nextQuestion(current_stage)) == null ? void 0 : _a2.time;
    let intCountdown = setInterval(() => {
      current_time = current_time - 1;
      minutes = Math.floor(current_time / 60);
      secondes = current_time % 60;
      counter.minutes = minutes < 10 ? "0" + minutes : minutes;
      counter.secondes = secondes < 10 ? "0" + secondes : secondes;
      if (current_time == 0) {
        current_stage += 1;
        clearInterval(intCountdown);
        viewed = !viewed;
        noAnswers = true;
        countdown();
      }
    }, 1e3);
  };
  countdown((_a = nextQuestion(current_stage)) == null ? void 0 : _a.time);
  $$result.css.add(css$1);
  return `<div class="${"w-screen h-screen"}">
	<div class="${"w-full h-full"}" style="${"background-color: #F3F2EF;"}"></div>

	
	<div class="${"wrapper absolute z-20 svelte-1c5eu02"}"><div class="${"holder"}">
			<div class="${"text-center text-white border-l border-r border-t border-gray-500 rounded-t-lg py-3"}" style="${"background-color:#666666"}"><h1 class="${"text-xl text-gray-100 inline-block"}">${escape(db.quizName)}</h1></div>
			<div class="${"border-l border-b border-r rounded-b-lg border-gray-300"}">
				<div class="${"pl-4 border-b border-gray-300 bg-white py-4"}"><h6 class="${"text-md text-l font-normal text-gray-600"}">${escape(nextQuestion(current_stage).question)}</h6></div>
				
				${viewed ? `<div id="${"answers-container"}" class="${"pl-4"}" style="${"background-color: #F9FAFB;"}"><div class="${"questions flex flex-col divide-y divide-gray-300"}">
							${each((_b = nextQuestion(current_stage)) == null ? void 0 : _b.answers, (answer) => `${validate_component(Answers, "Answer").$$render($$result, { clicked: answerClicked, data: answer }, {}, {})}`)}</div></div>` : `<div id="${"answers-container"}" class="${"pl-4"}" style="${"background-color: #F9FAFB;"}"><div class="${"questions flex flex-col divide-y divide-gray-300"}">
							${each((_c = nextQuestion(current_stage)) == null ? void 0 : _c.answers, (answer) => `${validate_component(Answers, "Answer").$$render($$result, { clicked: answerClicked, data: answer }, {}, {})}`)}</div></div>`}
				
				<div class="${"feedback pl-4 py-3 border-t border-gray-300"}" style="${"background-color: #F9FAFB;"}"><h6 class="${"text-sm text-gray-600"}">Something wrong with this question? <span class="${"font-semibold"}">Give feedback</span></h6></div>
				
				<div class="${"w-full h-3"}"><div class="${"relative"}"><div class="${"overflow-hidden h-3 text-xs flex bg-gray-300"}"><div style="${"width:" + escape(percentage) + "%;background-color:#56687A;"}" class="${"shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"}"></div></div></div></div>
				
				<div class="${"next rounded-b-lg bg-white px-4 py-3"}"><div class="${"holder flex justify-between items-center"}"><div class="${"time text-gray-600"}"><span>Q ${escape(current_stage + 1)}/${escape(db.details.length)}</span>
							<span class="${"pl-4"}">${escape(counter.minutes)}:${escape(counter.secondes)}</span></div>
						<div class="${"button"}"><button class="${"rounded-full py-1 px-4"}" type="${"button"}" style="${"background-color: " + escape(noAnswers ? "#F3F2EF" : "#0075AF") + ";color:" + escape(noAnswers ? "#56687A" : "white") + ";cursor:" + escape(noAnswers ? "default" : "pointer") + ";transition:0.4s"}">Next
							</button></div></div></div></div></div></div>
</div>`;
});
var TakeQuiz$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": TakeQuiz
});
var results_svelte_svelte_type_style_lang = ".wrapper.svelte-sbef2a.svelte-sbef2a{left:50%;top:50%;transform:translate(-50%,-50%);width:90%}@media(max-width:768px){.wrapper.svelte-sbef2a.svelte-sbef2a{left:50%;top:50%;transform:translate(-50%,-50%);width:100%!important}}.toggle-checkbox.svelte-sbef2a.svelte-sbef2a:checked{border-color:#216e3e;right:0;transition:1s cubic-bezier(.075,.82,.165,1)}.toggle-checkbox.svelte-sbef2a:checked+.toggle-label.svelte-sbef2a{background-color:#216e3e;transition:1s cubic-bezier(.075,.82,.165,1)}";
const css = {
  code: ".wrapper.svelte-sbef2a.svelte-sbef2a{left:50%;top:50%;transform:translate(-50%,-50%);width:90%}@media(max-width:768px){.wrapper.svelte-sbef2a.svelte-sbef2a{left:50%;top:50%;transform:translate(-50%,-50%);width:100%!important}}.toggle-checkbox.svelte-sbef2a.svelte-sbef2a:checked{border-color:#216e3e;right:0;transition:1s cubic-bezier(.075,.82,.165,1)}.toggle-checkbox.svelte-sbef2a:checked+.toggle-label.svelte-sbef2a{background-color:#216e3e;transition:1s cubic-bezier(.075,.82,.165,1)}",
  map: `{"version":3,"file":"results.svelte","sources":["results.svelte"],"sourcesContent":["<script>\\r\\n\\t// your script goes here\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"w-screen h-screen\\">\\r\\n\\t<!-- outter container -->\\r\\n\\t<div class=\\"w-full h-full\\" style=\\"background-color: #F3F2EF;\\" />\\r\\n\\r\\n\\t<!-- inner conatainer -->\\r\\n\\t<div class=\\"wrapper absolute z-20\\">\\r\\n\\t\\t<div class=\\"holder\\">\\r\\n\\t\\t\\t<!-- header -->\\r\\n\\t\\t\\t<div class=\\"text-center bg-white rounded-t-lg py-5\\">\\r\\n\\t\\t\\t\\t<h1 class=\\"inline-block font-semibold text-gray-800 text-xl\\">\\r\\n\\t\\t\\t\\t\\tCascading Style Sheets (CSS) Assessment\\r\\n\\t\\t\\t\\t</h1>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<hr />\\r\\n\\t\\t\\t<div class=\\"rounded-b-lg\\">\\r\\n\\t\\t\\t\\t<!-- trophy section -->\\r\\n\\t\\t\\t\\t<div class=\\"pl-4 flex justify-center items-center bg-white py-5\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"flex flex-col content-center gap-1\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"trophy-icon flex justify-center py-4\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<svg\\r\\n\\t\\t\\t\\t\\t\\t\\t\\txmlns=\\"http://www.w3.org/2000/svg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"48.11\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\theight=\\"48.03\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tviewBox=\\"0 0 48.11 48.03\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"trophy-small\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tdata-supported-dps=\\"48x48\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M2.33 11.84a3.27 3.27 0 01.52-4.58 3.36 3.36 0 012.06-.71 3.29 3.29 0 012.6 1.27l5.54 7.1v-2.55L8.74 6.88A4.9 4.9 0 004.91 5a4.8 4.8 0 00-3.86 7.8l12 15.2v-2.32zM45.77 11.84a3.25 3.25 0 00-.52-4.58 3.32 3.32 0 00-2.06-.71 3.32 3.32 0 00-2.6 1.24l-5.54 7.13v-2.55l4.31-5.49A4.93 4.93 0 0143.19 5a4.79 4.79 0 013.86 7.8l-12 15.2v-2.32z\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"#f8c77e\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path fill=\\"#788fa5\\" d=\\"M20.05 32.02h8v9h-8z\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M24.13 39h-.08c-4.72 0-8.8 1.6-11 4h22c-2.12-2.43-6.22-4-10.92-4z\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"#9db3c8\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M12.58 43h22.94a1.61 1.61 0 011.53 1.67V48h-26v-3.31A1.62 1.62 0 0112.58 43z\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"#f8c77e\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M8.05 2v9.55c0 9.06 3.81 21.83 16 21.45 12.19.39 16-12.39 16-21.44V2z\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"#c0d1e2\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path d=\\"M39.05 4h-30a2 2 0 010-4h30a2 2 0 010 4z\\" fill=\\"#788fa5\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M30.05 11a3 3 0 010 6h-12a3 3 0 010-6h12m0-2h-12a5 5 0 000 10h12a5 5 0 000-10z\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"#fff\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<h1 class=\\"font-semibold text-lg text-center text-gray-800\\">\\r\\n\\t\\t\\t\\t\\t\\t\\tGreat Work! You earned a badge.\\r\\n\\t\\t\\t\\t\\t\\t</h1>\\r\\n\\t\\t\\t\\t\\t\\t<h1 class=\\"text-center font-light text-gray-500 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\tYou're in the <span class=\\"font-semibold text-gray-800\\">top 30</span>% of 1.1M people\\r\\n\\t\\t\\t\\t\\t\\t\\twho took this.\\r\\n\\t\\t\\t\\t\\t\\t</h1>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t<!-- divider -->\\r\\n\\t\\t\\t\\t<div class=\\"h-2\\" style=\\"background-color: #F3F2EF;\\" />\\r\\n\\r\\n\\t\\t\\t\\t<!-- setting section -->\\r\\n\\t\\t\\t\\t<div class=\\"bg-white py-4\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"flex justify-center py-4\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"w-10/12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"flex justify-between\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"font-light text-gray-500 pb-3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tShow your badge on your profile and in recruiter searches\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"siwtcher\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"toggle\\" class=\\"text-xs text-gray-700\\">on</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"checkbox\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"toggle\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"toggle\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border appearance-none cursor-pointer\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<label\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tfor=\\"toggle\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"border rounded-lg\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"p-4\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<!-- card -->\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"flex flex-col gap-2\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<!-- personal info -->\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"personal-information flex flex-row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"thumbnail\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"img/1621890409882.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"41\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\theight=\\"41\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"rounded-full mr-3\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"info flex flex-col\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"font-semibold text-gray-800\\">mohamed</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"mt-1 text-sm text-gray-800\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tBack End Developer at Maqsood.SET\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<!-- end personal info -->\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<!-- quiz info -->\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"mt-4\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"text-sm font-semibold mb-2 text-gray-800\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tCascading Style Sheets (CSS)\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"flex flex-row items-center\\" style=\\"color:#0a66c2\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<svg\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\txmlns=\\"http://www.w3.org/2000/svg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tviewBox=\\"0 0 24 24\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tdata-supported-dps=\\"24x24\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"currentColor\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"24\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\theight=\\"24\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tfocusable=\\"false\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M14.73 10H17l-5.5 8L8 14.5l1.34-1.34L11.21 15zM20 3v16a3 3 0 01-3 3H7a3 3 0 01-3-3V3h5.69l.52-1A2 2 0 0112 1a2 2 0 011.76 1l.52 1zm-2 2h-2.6l.6 1.1V7H8v-.9L8.6 5H6v14a1 1 0 001 1h10a1 1 0 001-1z\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"ml-2 text-sm text-gray-800\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tLinkedIn Skill Assessment badge\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<!-- end quiz info -->\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t<!-- divider -->\\r\\n\\t\\t\\t\\t<div class=\\"h-2\\" style=\\"background-color: #F3F2EF;\\" />\\r\\n\\r\\n\\t\\t\\t\\t<!-- Done -->\\r\\n\\t\\t\\t\\t<div class=\\"next rounded-b-lg bg-white px-4 py-3\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"holder flex justify-between items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"\\" />\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"button\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"rounded-full py-1 px-4\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"background-color: #0075AF;color:white;cursor:pointer;transition:0.4s\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tDone\\r\\n\\t\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</div>\\r\\n\\r\\n<style>.wrapper{left:50%;top:50%;transform:translate(-50%,-50%);width:90%}@media (max-width:768px){.wrapper{left:50%;top:50%;transform:translate(-50%,-50%);width:100%!important}}.toggle-checkbox:checked{border-color:#216e3e;right:0;transition:1s cubic-bezier(.075,.82,.165,1)}.toggle-checkbox:checked+.toggle-label{background-color:#216e3e;transition:1s cubic-bezier(.075,.82,.165,1)}</style>\\r\\n"],"names":[],"mappings":"AA8KO,oCAAQ,CAAC,KAAK,GAAG,CAAC,IAAI,GAAG,CAAC,UAAU,UAAU,IAAI,CAAC,IAAI,CAAC,CAAC,MAAM,GAAG,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,oCAAQ,CAAC,KAAK,GAAG,CAAC,IAAI,GAAG,CAAC,UAAU,UAAU,IAAI,CAAC,IAAI,CAAC,CAAC,MAAM,IAAI,UAAU,CAAC,CAAC,4CAAgB,QAAQ,CAAC,aAAa,OAAO,CAAC,MAAM,CAAC,CAAC,WAAW,EAAE,CAAC,aAAa,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,8BAAgB,QAAQ,CAAC,2BAAa,CAAC,iBAAiB,OAAO,CAAC,WAAW,EAAE,CAAC,aAAa,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC"}`
};
const Results = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="${"w-screen h-screen"}">
	<div class="${"w-full h-full"}" style="${"background-color: #F3F2EF;"}"></div>

	
	<div class="${"wrapper absolute z-20 svelte-sbef2a"}"><div class="${"holder"}">
			<div class="${"text-center bg-white rounded-t-lg py-5"}"><h1 class="${"inline-block font-semibold text-gray-800 text-xl"}">Cascading Style Sheets (CSS) Assessment
				</h1></div>
			<hr>
			<div class="${"rounded-b-lg"}">
				<div class="${"pl-4 flex justify-center items-center bg-white py-5"}"><div class="${"flex flex-col content-center gap-1"}"><div class="${"trophy-icon flex justify-center py-4"}"><svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"48.11"}" height="${"48.03"}" viewBox="${"0 0 48.11 48.03"}" id="${"trophy-small"}" data-supported-dps="${"48x48"}"><path d="${"M2.33 11.84a3.27 3.27 0 01.52-4.58 3.36 3.36 0 012.06-.71 3.29 3.29 0 012.6 1.27l5.54 7.1v-2.55L8.74 6.88A4.9 4.9 0 004.91 5a4.8 4.8 0 00-3.86 7.8l12 15.2v-2.32zM45.77 11.84a3.25 3.25 0 00-.52-4.58 3.32 3.32 0 00-2.06-.71 3.32 3.32 0 00-2.6 1.24l-5.54 7.13v-2.55l4.31-5.49A4.93 4.93 0 0143.19 5a4.79 4.79 0 013.86 7.8l-12 15.2v-2.32z"}" fill="${"#f8c77e"}"></path><path fill="${"#788fa5"}" d="${"M20.05 32.02h8v9h-8z"}"></path><path d="${"M24.13 39h-.08c-4.72 0-8.8 1.6-11 4h22c-2.12-2.43-6.22-4-10.92-4z"}" fill="${"#9db3c8"}"></path><path d="${"M12.58 43h22.94a1.61 1.61 0 011.53 1.67V48h-26v-3.31A1.62 1.62 0 0112.58 43z"}" fill="${"#f8c77e"}"></path><path d="${"M8.05 2v9.55c0 9.06 3.81 21.83 16 21.45 12.19.39 16-12.39 16-21.44V2z"}" fill="${"#c0d1e2"}"></path><path d="${"M39.05 4h-30a2 2 0 010-4h30a2 2 0 010 4z"}" fill="${"#788fa5"}"></path><path d="${"M30.05 11a3 3 0 010 6h-12a3 3 0 010-6h12m0-2h-12a5 5 0 000 10h12a5 5 0 000-10z"}" fill="${"#fff"}"></path></svg></div>
						<h1 class="${"font-semibold text-lg text-center text-gray-800"}">Great Work! You earned a badge.
						</h1>
						<h1 class="${"text-center font-light text-gray-500 "}">You&#39;re in the <span class="${"font-semibold text-gray-800"}">top 30</span>% of 1.1M people
							who took this.
						</h1></div></div>

				
				<div class="${"h-2"}" style="${"background-color: #F3F2EF;"}"></div>

				
				<div class="${"bg-white py-4"}"><div class="${"flex justify-center py-4"}"><div class="${"w-10/12"}"><div class="${"flex justify-between"}"><div class="${"font-light text-gray-500 pb-3"}">Show your badge on your profile and in recruiter searches
								</div>
								<div class="${"siwtcher"}"><label for="${"toggle"}" class="${"text-xs text-gray-700"}">on</label>
									<div class="${"relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in"}"><input type="${"checkbox"}" name="${"toggle"}" id="${"toggle"}" class="${"toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border appearance-none cursor-pointer svelte-sbef2a"}">
										<label for="${"toggle"}" class="${"toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer svelte-sbef2a"}"></label></div></div></div>
							<div class="${"border rounded-lg"}"><div class="${"p-4"}">
									<div class="${"flex flex-col gap-2"}">
										<div class="${"personal-information flex flex-row"}"><div class="${"thumbnail"}"><img src="${"img/1621890409882.jpg"}" width="${"41"}" height="${"41"}" class="${"rounded-full mr-3"}" alt="${""}"></div>
											<div class="${"info flex flex-col"}"><div class="${"font-semibold text-gray-800"}">mohamed</div>
												<div class="${"mt-1 text-sm text-gray-800"}">Back End Developer at Maqsood.SET
												</div></div></div>
										

										
										<div class="${"mt-4"}"><div class="${"text-sm font-semibold mb-2 text-gray-800"}">Cascading Style Sheets (CSS)
											</div>
											<div class="${"flex flex-row items-center"}" style="${"color:#0a66c2"}"><svg xmlns="${"http://www.w3.org/2000/svg"}" viewBox="${"0 0 24 24"}" data-supported-dps="${"24x24"}" fill="${"currentColor"}" class="${""}" width="${"24"}" height="${"24"}" focusable="${"false"}"><path d="${"M14.73 10H17l-5.5 8L8 14.5l1.34-1.34L11.21 15zM20 3v16a3 3 0 01-3 3H7a3 3 0 01-3-3V3h5.69l.52-1A2 2 0 0112 1a2 2 0 011.76 1l.52 1zm-2 2h-2.6l.6 1.1V7H8v-.9L8.6 5H6v14a1 1 0 001 1h10a1 1 0 001-1z"}"></path></svg>
												<div class="${"ml-2 text-sm text-gray-800"}">LinkedIn Skill Assessment badge
												</div></div></div>
										</div></div></div></div></div></div>

				
				<div class="${"h-2"}" style="${"background-color: #F3F2EF;"}"></div>

				
				<div class="${"next rounded-b-lg bg-white px-4 py-3"}"><div class="${"holder flex justify-between items-center"}"><div class="${""}"></div>
						<div class="${"button"}"><button class="${"rounded-full py-1 px-4"}" type="${"button"}" style="${"background-color: #0075AF;color:white;cursor:pointer;transition:0.4s"}">Done
							</button></div></div></div></div></div></div>
</div>`;
});
var results = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Results
});
export { init, render };
