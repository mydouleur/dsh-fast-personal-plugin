window.__ModuleLoader__.load({
	id: "dsh-fast-personal-plugin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/shared/types.ts
		const PLUGIN_ID = "dsh-fast-personal-plugin";
		const API_PREFIX = "/dsh-fast-personal-plugin";
		// src/client/store.ts
		let snapshot = {
			ready: false,
			checking: false,
			profile: "",
			configPath: "",
			config: {
				schemaVersion: 1,
				plugins: []
			},
			plugins: [],
			tasks: []
		};
		let listeners = /* @__PURE__ */ new Set();
		let refreshing = null;
		function getSnapshot() {
			return snapshot;
		}
		function getAttention() {
			return snapshot.plugins.some((plugin) => plugin.attention);
		}
		function subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		}
		function startStore() {
			refresh();
			const timer = setInterval(() => void refresh(), 2e3);
			return () => clearInterval(timer);
		}
		async function refresh() {
			if (refreshing !== null) return refreshing;
			refreshing = (async () => {
				try {
					const response = await fetch(`${API_PREFIX}/state`, { cache: "no-store" });
					if (!response.ok) return;
					snapshot = await response.json();
					for (const listener of listeners) listener();
				} catch {}
			})();
			try {
				await refreshing;
			} finally {
				refreshing = null;
			}
		}
		async function post(path, body) {
			const response = await fetch(`${API_PREFIX}/${path}`, {
				method: "POST",
				headers: body === void 0 ? void 0 : { "content-type": "application/json" },
				body: body === void 0 ? void 0 : JSON.stringify(body)
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
			await refresh();
			return data;
		}
		// \0dsh-css:F:\dsh-plugin-manage\src\client\styles.module.css.mjs
		const css = ".w2pR0a_root{color:var(--dsw-alias-label-primary,#1f2328);padding:4px 0 28px;font-size:13px;line-height:1.5}.w2pR0a_root *{box-sizing:border-box}.w2pR0a_root button,.w2pR0a_root input,.w2pR0a_root select,.w2pR0a_root textarea{font:inherit}.w2pR0a_header{justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px;display:flex}.w2pR0a_header h2{margin:0 0 6px;font-size:22px;line-height:1.3}.w2pR0a_header p{color:var(--dsw-alias-label-secondary,#6b7280);margin:0}.w2pR0a_headerActions,.w2pR0a_rowActions,.w2pR0a_modalActions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.w2pR0a_headerActions{justify-content:flex-end}.w2pR0a_primary,.w2pR0a_secondary,.w2pR0a_dangerButton{cursor:pointer;border-radius:7px;justify-content:center;align-items:center;min-height:32px;padding:5px 12px;text-decoration:none;transition:background .15s,border-color .15s;display:inline-flex}.w2pR0a_primary{background:var(--dsw-alias-button-primary-fill,#24292f);color:var(--dsw-alias-label-primary-foreground,#fff);border:1px solid #0000}.w2pR0a_primary:hover{background:var(--dsw-alias-button-primary-hover,#43454a)}.w2pR0a_secondary{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,#d0d7de);color:inherit}.w2pR0a_secondary:hover{background:var(--dsw-alias-interactive-bg-hover,#8080801f)}.w2pR0a_dangerButton{color:var(--dsw-alias-state-danger-primary,#d1242f);background:0 0;border:1px solid #d1242f59}.w2pR0a_dangerButton:hover{background:#d1242f14}.w2pR0a_primary:disabled,.w2pR0a_secondary:disabled,.w2pR0a_dangerButton:disabled{cursor:not-allowed;opacity:.5}.w2pR0a_summary{border-bottom:1px solid var(--dsw-alias-border-l1,#eceef1);color:var(--dsw-alias-label-secondary,#6b7280);flex-wrap:wrap;align-items:center;gap:18px;padding:0 0 14px;display:flex}.w2pR0a_attention{color:var(--dsw-alias-state-danger-primary,#d1242f);align-items:center;gap:6px;display:inline-flex}.w2pR0a_redDot{background:#e5484d;border-radius:50%;flex:none;width:8px;height:8px;display:inline-block}.w2pR0a_list{flex-direction:column;gap:10px;margin-top:14px;display:flex}.w2pR0a_card{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l1,#eceef1);border-radius:10px;justify-content:space-between;gap:18px;padding:16px;display:flex}.w2pR0a_cardMain{flex:1;min-width:0}.w2pR0a_titleLine{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.w2pR0a_titleLine h3{overflow-wrap:anywhere;margin:0;font-size:15px}.w2pR0a_badge,.w2pR0a_selfBadge{border-radius:999px;padding:2px 7px;font-size:11px;line-height:1.4}.w2pR0a_badge{color:var(--dsw-alias-label-secondary,#6b7280);background:#8080801f}.w2pR0a_selfBadge{color:var(--dsw-alias-state-business-primary,#4f6ef7);background:#4f6ef71a}.w2pR0a_source{color:var(--dsw-alias-label-secondary,#6b7280);overflow-wrap:anywhere;margin-top:4px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}.w2pR0a_meta{color:var(--dsw-alias-label-secondary,#6b7280);flex-wrap:wrap;gap:12px;margin-top:10px;font-size:12px;display:flex}.w2pR0a_danger{color:var(--dsw-alias-state-danger-primary,#d1242f)}.w2pR0a_warning{color:var(--dsw-alias-state-warning-primary,#b45309)}.w2pR0a_success{color:#16a34a}.w2pR0a_muted{color:var(--dsw-alias-label-tertiary,#8b93a1)}.w2pR0a_rowActions{place-content:flex-start flex-end;max-width:310px}.w2pR0a_error,.w2pR0a_inlineError{color:var(--dsw-alias-state-danger-primary,#d1242f);white-space:pre-wrap}.w2pR0a_error{background:#d1242f12;border:1px solid #d1242f40;border-radius:8px;margin-top:12px;padding:10px 12px}.w2pR0a_inlineError{margin-top:8px;font-size:12px}.w2pR0a_empty{color:var(--dsw-alias-label-secondary,#6b7280);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:10px;min-height:220px;display:flex}.w2pR0a_empty strong{color:var(--dsw-alias-label-primary,#1f2328);font-size:16px}.w2pR0a_tasks{border-top:1px solid var(--dsw-alias-border-l1,#eceef1);margin-top:20px;padding-top:16px}.w2pR0a_tasks h3{margin:0 0 8px;font-size:14px}.w2pR0a_taskOutput{margin-top:10px}.w2pR0a_taskOutput summary{color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer;font-size:12px}.w2pR0a_taskOutput pre{white-space:pre-wrap;background:#80808017;border-radius:6px;max-height:180px;padding:10px;font-size:11px;overflow:auto}.w2pR0a_footer{color:var(--dsw-alias-label-tertiary,#8b93a1);overflow-wrap:anywhere;flex-wrap:wrap;justify-content:space-between;gap:16px;margin-top:22px;font-size:11px;display:flex}.w2pR0a_overlay{z-index:1000;background:#00000061;justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.w2pR0a_modal{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l1,#eceef1);border-radius:12px;width:100%;max-width:520px;max-height:calc(100vh - 48px);padding:20px;overflow:auto;box-shadow:0 18px 60px #00000040}.w2pR0a_modal.w2pR0a_wide{max-width:850px}.w2pR0a_modalHeader{justify-content:space-between;align-items:center;margin-bottom:16px;display:flex}.w2pR0a_modalHeader h3{margin:0;font-size:17px}.w2pR0a_iconButton{color:inherit;cursor:pointer;background:0 0;border:0;padding:2px 6px;font-size:24px;line-height:1}.w2pR0a_form{flex-direction:column;gap:14px;display:flex}.w2pR0a_form label{flex-direction:column;gap:6px;font-weight:500;display:flex}.w2pR0a_form input,.w2pR0a_form select{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-input-border,#d0d7de);color:inherit;border-radius:6px;width:100%;min-height:34px;padding:6px 9px}.w2pR0a_form .w2pR0a_checkbox{flex-direction:row;align-items:center;font-weight:400}.w2pR0a_form .w2pR0a_checkbox input{width:auto;min-height:auto}.w2pR0a_modalActions{justify-content:flex-end;margin-top:18px}.w2pR0a_help{color:var(--dsw-alias-label-secondary,#6b7280);margin:0 0 12px}.w2pR0a_jsonInput{border:1px solid var(--dsw-alias-input-border,#d0d7de);color:inherit;resize:vertical;tab-size:2;background:#8080800f;border-radius:7px;width:100%;min-height:380px;padding:12px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}.w2pR0a_fileInput{opacity:0;width:0;height:0;position:absolute;overflow:hidden}.w2pR0a_spacer{flex:1}@media (width<=760px){.w2pR0a_header,.w2pR0a_card{flex-direction:column}.w2pR0a_headerActions,.w2pR0a_rowActions{justify-content:flex-start;max-width:none}.w2pR0a_footer{flex-direction:column}}";
		const tagId = "dsh-fast-personal-plugin/styles.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-fast-personal-plugin";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var styles_module_css_default = {
			"secondary": "w2pR0a_secondary",
			"checkbox": "w2pR0a_checkbox",
			"cardMain": "w2pR0a_cardMain",
			"wide": "w2pR0a_wide",
			"jsonInput": "w2pR0a_jsonInput",
			"redDot": "w2pR0a_redDot",
			"danger": "w2pR0a_danger",
			"empty": "w2pR0a_empty",
			"source": "w2pR0a_source",
			"taskOutput": "w2pR0a_taskOutput",
			"badge": "w2pR0a_badge",
			"fileInput": "w2pR0a_fileInput",
			"modal": "w2pR0a_modal",
			"dangerButton": "w2pR0a_dangerButton",
			"rowActions": "w2pR0a_rowActions",
			"primary": "w2pR0a_primary",
			"headerActions": "w2pR0a_headerActions",
			"inlineError": "w2pR0a_inlineError",
			"header": "w2pR0a_header",
			"modalHeader": "w2pR0a_modalHeader",
			"modalActions": "w2pR0a_modalActions",
			"list": "w2pR0a_list",
			"help": "w2pR0a_help",
			"overlay": "w2pR0a_overlay",
			"error": "w2pR0a_error",
			"spacer": "w2pR0a_spacer",
			"footer": "w2pR0a_footer",
			"success": "w2pR0a_success",
			"selfBadge": "w2pR0a_selfBadge",
			"meta": "w2pR0a_meta",
			"summary": "w2pR0a_summary",
			"iconButton": "w2pR0a_iconButton",
			"root": "w2pR0a_root",
			"warning": "w2pR0a_warning",
			"muted": "w2pR0a_muted",
			"form": "w2pR0a_form",
			"attention": "w2pR0a_attention",
			"tasks": "w2pR0a_tasks",
			"card": "w2pR0a_card",
			"titleLine": "w2pR0a_titleLine"
		};
		// src/client/App.tsx
		function App() {
			const snapshot = (0, react.useSyncExternalStore)(subscribe, getSnapshot);
			const [modal, setModal] = (0, react.useState)(null);
			const [editing, setEditing] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)("");
			const attention = snapshot.plugins.filter((plugin) => plugin.attention).length;
			const activeTasks = snapshot.tasks.filter((task) => task.status === "pending" || task.status === "running");
			const run = async (action) => {
				setError("");
				try {
					await action();
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: styles_module_css_default.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: styles_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: "个人插件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "用同一份 JSON 在不同电脑间初始化和管理 DSH 插件。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: styles_module_css_default.headerActions,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: styles_module_css_default.secondary,
									onClick: () => void run(() => post("check")),
									disabled: snapshot.checking,
									children: snapshot.checking ? "正在检查…" : "检查更新"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: styles_module_css_default.secondary,
									onClick: () => setModal("json"),
									children: "JSON"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: styles_module_css_default.primary,
									onClick: () => {
										setEditing(null);
										setModal("add");
									},
									children: "添加插件"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: styles_module_css_default.summary,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [snapshot.plugins.length, " 个插件"] }),
							attention > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: styles_module_css_default.attention,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: styles_module_css_default.redDot }),
									attention,
									" 项需要处理"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["当前环境：", snapshot.profile || "读取中"] })
						]
					}),
					(error || snapshot.defaultsError) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: styles_module_css_default.error,
						children: error || snapshot.defaultsError
					}),
					!snapshot.ready && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: styles_module_css_default.empty,
						children: "正在读取插件清单…"
					}),
					snapshot.ready && snapshot.plugins.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: styles_module_css_default.empty,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "清单还是空的" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "添加 npm 包或 GitHub 仓库，也可以直接编辑 JSON。" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: styles_module_css_default.primary,
								onClick: () => setModal("add"),
								children: "添加第一个插件"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: styles_module_css_default.list,
						children: snapshot.plugins.map((plugin) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PluginRow, {
							plugin,
							task: snapshot.tasks.find((task) => task.pluginId === plugin.entry.id),
							busy: activeTasks.some((task) => task.pluginId === plugin.entry.id),
							onInstall: () => void run(async () => {
								if (plugin.entry.source.type === "github" && plugin.entry.source.installMode !== "asset") {
									const message = plugin.installed === null ? "GitHub 源码安装可能执行插件作者的构建脚本。确认信任此来源并继续？" : "更新可能执行插件作者的构建脚本。确认继续？";
									if (!window.confirm(message)) return;
								}
								await post("install", { id: plugin.entry.id });
							}),
							onEdit: () => {
								setEditing(plugin);
								setModal("edit");
							},
							onToggle: () => void run(() => post("toggle", {
								id: plugin.entry.id,
								enabled: !plugin.entry.enabled
							})),
							onRemove: () => void run(async () => {
								if (!window.confirm("删除清单项并卸载此插件？此操作不会影响其他插件。")) return;
								await post("remove", { id: plugin.entry.id });
							})
						}, plugin.entry.id))
					}),
					activeTasks.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: styles_module_css_default.tasks,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "正在执行" }), activeTasks.map((task) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TaskOutput, {
							taskId: task.id,
							pluginId: task.pluginId,
							output: task.output,
							status: task.status
						}, task.id))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: styles_module_css_default.footer,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							title: snapshot.configPath,
							children: ["本地清单：", snapshot.configPath || "读取中"]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "启动时仅检查，不会自动安装更新" })]
					}),
					(modal === "add" || modal === "edit") && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PluginForm, {
						original: editing?.entry,
						onClose: () => setModal(null),
						onSave: (entry, originalId) => void run(async () => {
							await post("plugin", {
								entry,
								originalId
							});
							setModal(null);
						})
					}),
					modal === "json" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(JsonEditor, {
						onClose: () => setModal(null),
						onSave: (config) => void run(async () => {
							await post("config", { config });
							setModal(null);
						})
					})
				]
			});
		}
		function PluginRow(props) {
			const { plugin, task, busy } = props;
			const source = plugin.entry.source.type === "npm" ? plugin.entry.source.package : plugin.entry.source.repo;
			const status = !plugin.entry.enabled ? {
				text: "已停用",
				className: styles_module_css_default.muted
			} : plugin.installed === null ? {
				text: "未下载",
				className: styles_module_css_default.danger
			} : plugin.state.status === "update" ? {
				text: "有更新",
				className: styles_module_css_default.danger
			} : plugin.state.status === "checking" ? {
				text: "检查中",
				className: styles_module_css_default.muted
			} : plugin.state.status === "error" ? {
				text: "检查失败",
				className: styles_module_css_default.warning
			} : plugin.state.status === "no-release" ? {
				text: "无正式 Release",
				className: styles_module_css_default.warning
			} : plugin.state.status === "latest" ? {
				text: "已是最新",
				className: styles_module_css_default.success
			} : {
				text: "已安装",
				className: styles_module_css_default.muted
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: styles_module_css_default.card,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: styles_module_css_default.cardMain,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: styles_module_css_default.titleLine,
							children: [
								plugin.attention && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: styles_module_css_default.redDot }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: plugin.installed?.package ?? source }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: styles_module_css_default.badge,
									children: plugin.entry.source.type === "npm" ? "npm" : "GitHub"
								}),
								plugin.isSelf && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: styles_module_css_default.selfBadge,
									children: "管理器自身"
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: styles_module_css_default.source,
							children: source
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: styles_module_css_default.meta,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: status.className,
									children: status.text
								}),
								plugin.installed !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["当前 ", plugin.installed.version] }),
								plugin.state.latestVersion !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["最新 ", plugin.state.latestVersion] }),
								plugin.state.lastCheckedAt !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["检查于 ", new Date(plugin.state.lastCheckedAt).toLocaleString()] })
							]
						}),
						plugin.state.error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: styles_module_css_default.inlineError,
							children: plugin.state.error
						}),
						task?.status === "done" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: styles_module_css_default.success,
							children: task.needsRestart ? "操作完成，重启 DSH 后生效" : "操作完成，刷新页面后生效"
						}),
						task?.status === "failed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: styles_module_css_default.inlineError,
							children: task.error
						}),
						(busy || task !== void 0 && task.output.length > 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TaskOutput, {
							taskId: 0,
							pluginId: "",
							output: task?.output ?? [],
							status: task?.status ?? ""
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: styles_module_css_default.rowActions,
					children: [
						(plugin.installed === null || plugin.state.status === "update") && plugin.entry.enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: styles_module_css_default.primary,
							onClick: props.onInstall,
							disabled: busy,
							children: plugin.installed === null ? "下载安装" : "更新"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: styles_module_css_default.secondary,
							onClick: props.onEdit,
							disabled: busy,
							children: "编辑"
						}),
						!plugin.isSelf && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: styles_module_css_default.secondary,
							onClick: props.onToggle,
							disabled: busy,
							children: plugin.entry.enabled ? "停用" : "启用"
						}),
						!plugin.isSelf && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: styles_module_css_default.dangerButton,
							onClick: props.onRemove,
							disabled: busy,
							children: "删除并卸载"
						})
					]
				})]
			});
		}
		function TaskOutput(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: styles_module_css_default.taskOutput,
				open: props.status === "running",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
					props.status === "running" ? "查看实时输出" : "查看任务输出",
					" ",
					props.pluginId
				] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", { children: props.output.slice(-30).join("\n") || "等待命令输出…" })]
			});
		}
		function PluginForm(props) {
			const original = props.original;
			const [type, setType] = (0, react.useState)(original?.source.type ?? "npm");
			const [identity, setIdentity] = (0, react.useState)(original === void 0 ? "" : original.source.type === "npm" ? original.source.package : original.source.repo);
			const [packageName, setPackageName] = (0, react.useState)(original?.package ?? "");
			const github = original?.source.type === "github" ? original.source : null;
			const [installMode, setInstallMode] = (0, react.useState)(github?.installMode ?? "auto");
			const [asset, setAsset] = (0, react.useState)(github?.asset ?? "");
			const [enabled, setEnabled] = (0, react.useState)(original?.enabled ?? true);
			const submit = (event) => {
				event.preventDefault();
				const value = identity.trim();
				const source = type === "npm" ? {
					type: "npm",
					package: value
				} : {
					type: "github",
					repo: value,
					installMode,
					...asset.trim() === "" ? {} : { asset: asset.trim() }
				};
				const entry = {
					id: type === "npm" ? `npm:${value.toLowerCase()}` : `github:${value.toLowerCase()}`,
					source,
					enabled,
					...type === "github" && packageName.trim() !== "" ? { package: packageName.trim() } : {}
				};
				props.onSave(entry, original?.id);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Modal, {
				title: original === void 0 ? "添加插件" : "编辑插件",
				onClose: props.onClose,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
					className: styles_module_css_default.form,
					onSubmit: submit,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["来源类型", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							value: type,
							onChange: (event) => setType(event.target.value),
							disabled: original !== void 0,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "npm",
								children: "npm"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "github",
								children: "GitHub Release"
							})]
						})] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [type === "npm" ? "npm 包名" : "GitHub 仓库", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							value: identity,
							onChange: (event) => setIdentity(event.target.value),
							placeholder: type === "npm" ? "dsh-example 或 @scope/dsh-example" : "owner/repository",
							required: true
						})] }),
						type === "github" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["实际 npm 包名（可选）", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								value: packageName,
								onChange: (event) => setPackageName(event.target.value),
								placeholder: "安装后自动识别"
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["安装方式", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								value: installMode,
								onChange: (event) => setInstallMode(event.target.value),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "auto",
										children: "自动：唯一 .tgz 优先，否则源码"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "asset",
										children: "仅预构建 .tgz 资产"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "source",
										children: "仅 Release 标签源码"
									})
								]
							})] }),
							installMode !== "source" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [".tgz 资产文件名（可选）", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								value: asset,
								onChange: (event) => setAsset(event.target.value),
								placeholder: "plugin-1.0.0.tgz"
							})] })
						] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: styles_module_css_default.checkbox,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: enabled,
								onChange: (event) => setEnabled(event.target.checked)
							}), "启用此插件"]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: styles_module_css_default.modalActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: styles_module_css_default.secondary,
								onClick: props.onClose,
								children: "取消"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: styles_module_css_default.primary,
								type: "submit",
								children: "保存到清单"
							})]
						})
					]
				})
			});
		}
		function JsonEditor(props) {
			const snapshot = getSnapshot();
			const initial = (0, react.useMemo)(() => JSON.stringify(snapshot.config, null, 2), []);
			const [text, setText] = (0, react.useState)(initial);
			const [error, setError] = (0, react.useState)("");
			const save = () => {
				try {
					props.onSave(JSON.parse(text));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
				title: "JSON 清单",
				onClose: props.onClose,
				wide: true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: styles_module_css_default.help,
						children: "可在此直接编辑或粘贴其他电脑的清单。删除已安装插件会在保存后卸载；管理器自身会被自动保留。"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						className: styles_module_css_default.jsonInput,
						value: text,
						onChange: (event) => setText(event.target.value),
						spellCheck: false
					}),
					error !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: styles_module_css_default.inlineError,
						children: error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: styles_module_css_default.modalActions,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: styles_module_css_default.secondary,
								children: ["导入文件", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: styles_module_css_default.fileInput,
									type: "file",
									accept: "application/json,.json",
									onChange: (event) => {
										const file = event.target.files?.[0];
										if (file !== void 0) file.text().then(setText);
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								className: styles_module_css_default.secondary,
								href: `${API_PREFIX}/export`,
								download: "dsh-plugins.json",
								children: "导出文件"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: styles_module_css_default.spacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: styles_module_css_default.secondary,
								onClick: props.onClose,
								children: "取消"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: styles_module_css_default.primary,
								onClick: save,
								children: "保存并应用"
							})
						]
					})
				]
			});
		}
		function Modal(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: styles_module_css_default.overlay,
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) props.onClose();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: `${styles_module_css_default.modal} ${props.wide === true ? styles_module_css_default.wide : ""}`,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": props.title,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: styles_module_css_default.modalHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: props.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: styles_module_css_default.iconButton,
							onClick: props.onClose,
							"aria-label": "关闭",
							children: "×"
						})]
					}), props.children]
				})
			});
		}
		// src/client/index.tsx
		const name = PLUGIN_ID;
		const inject = ["slots"];
		function apply(ctx) {
			ctx.effect(startStore, `${PLUGIN_ID}: state`);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: PLUGIN_ID,
				order: 55,
				label: () => "个人插件"
			}, App));
			ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
				name: "settings.section.icon",
				id: PLUGIN_ID
			}, SectionIcon));
		}
		function SectionIcon({ size = 18 }) {
			const attention = (0, react.useSyncExternalStore)(subscribe, getAttention);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 20 20",
				fill: "none",
				"aria-label": attention ? "个人插件，有需要处理的项目" : "个人插件",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M10 2.2 16 5.5v7L10 16l-6-3.5v-7L10 2.2Z",
						stroke: "currentColor",
						strokeWidth: "1.5",
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "m4.4 5.7 5.6 3.2 5.6-3.2M10 8.9v6.4",
						stroke: "currentColor",
						strokeWidth: "1.5",
						strokeLinejoin: "round"
					}),
					attention && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "15.8",
						cy: "4.3",
						r: "3.3",
						fill: "#e5484d",
						stroke: "var(--dsw-alias-bg-layer-1, #fff)",
						strokeWidth: "1.2"
					})
				]
			});
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map