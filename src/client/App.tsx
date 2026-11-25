import { useMemo, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import { API_PREFIX, type GithubSource, type PluginEntry, type PluginView } from '../shared/types.ts'
import { getSnapshot, post, subscribe } from './store.ts'
import styles from './styles.module.css'

export function App() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const [modal, setModal] = useState<'add' | 'edit' | 'json' | null>(null)
  const [editing, setEditing] = useState<PluginView | null>(null)
  const [error, setError] = useState('')
  const attention = snapshot.plugins.filter((plugin) => plugin.attention).length
  const activeTasks = snapshot.tasks.filter((task) => task.status === 'pending' || task.status === 'running')

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setError('')
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h2>个人插件</h2>
          <p>用同一份 JSON 在不同电脑间初始化和管理 DSH 插件。</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondary} onClick={() => void run(() => post('check'))} disabled={snapshot.checking}>
            {snapshot.checking ? '正在检查…' : '检查更新'}
          </button>
          <button className={styles.secondary} onClick={() => setModal('json')}>JSON</button>
          <button className={styles.primary} onClick={() => { setEditing(null); setModal('add') }}>添加插件</button>
        </div>
      </header>

      <div className={styles.summary}>
        <span>{snapshot.plugins.length} 个插件</span>
        {attention > 0 && <span className={styles.attention}><i className={styles.redDot} />{attention} 项需要处理</span>}
        <span>当前环境：{snapshot.profile || '读取中'}</span>
      </div>
      {(error || snapshot.defaultsError) && <div className={styles.error}>{error || snapshot.defaultsError}</div>}
      {!snapshot.ready && <div className={styles.empty}>正在读取插件清单…</div>}
      {snapshot.ready && snapshot.plugins.length === 0 && (
        <div className={styles.empty}>
          <strong>清单还是空的</strong>
          <span>添加 npm 包或 GitHub 仓库，也可以直接编辑 JSON。</span>
          <button className={styles.primary} onClick={() => setModal('add')}>添加第一个插件</button>
        </div>
      )}
      <div className={styles.list}>
        {snapshot.plugins.map((plugin) => (
          <PluginRow
            key={plugin.entry.id}
            plugin={plugin}
            task={snapshot.tasks.find((task) => task.pluginId === plugin.entry.id)}
            busy={activeTasks.some((task) => task.pluginId === plugin.entry.id)}
            onInstall={() => void run(async () => {
              if (plugin.entry.source.type === 'github' && plugin.entry.source.installMode !== 'asset') {
                const message = plugin.installed === null
                  ? 'GitHub 源码安装可能执行插件作者的构建脚本。确认信任此来源并继续？'
                  : '更新可能执行插件作者的构建脚本。确认继续？'
                if (!window.confirm(message)) return
              }
              await post('install', { id: plugin.entry.id })
            })}
            onEdit={() => { setEditing(plugin); setModal('edit') }}
            onToggle={() => void run(() => post('toggle', { id: plugin.entry.id, enabled: !plugin.entry.enabled }))}
            onRemove={() => void run(async () => {
              if (!window.confirm('删除清单项并卸载此插件？此操作不会影响其他插件。')) return
              await post('remove', { id: plugin.entry.id })
            })}
          />
        ))}
      </div>

      {activeTasks.length > 0 && (
        <section className={styles.tasks}>
          <h3>正在执行</h3>
          {activeTasks.map((task) => <TaskOutput key={task.id} taskId={task.id} pluginId={task.pluginId} output={task.output} status={task.status} />)}
        </section>
      )}
      <footer className={styles.footer}>
        <span title={snapshot.configPath}>本地清单：{snapshot.configPath || '读取中'}</span>
        <span>启动时仅检查，不会自动安装更新</span>
      </footer>

      {(modal === 'add' || modal === 'edit') && (
        <PluginForm
          original={editing?.entry}
          onClose={() => setModal(null)}
          onSave={(entry, originalId) => void run(async () => {
            await post('plugin', { entry, originalId })
            setModal(null)
          })}
        />
      )}
      {modal === 'json' && (
        <JsonEditor
          onClose={() => setModal(null)}
          onSave={(config) => void run(async () => {
            await post('config', { config })
            setModal(null)
          })}
        />
      )}
    </div>
  )
}

function PluginRow(props: {
  plugin: PluginView
  task?: { status: string; output: string[]; error?: string; needsRestart: boolean }
  busy: boolean
  onInstall: () => void
  onEdit: () => void
  onToggle: () => void
  onRemove: () => void
}) {
  const { plugin, task, busy } = props
  const source = plugin.entry.source.type === 'npm' ? plugin.entry.source.package : plugin.entry.source.repo
  const status = !plugin.entry.enabled ? { text: '已停用', className: styles.muted }
    : plugin.installed === null ? { text: '未下载', className: styles.danger }
    : plugin.state.status === 'update' ? { text: '有更新', className: styles.danger }
    : plugin.state.status === 'checking' ? { text: '检查中', className: styles.muted }
    : plugin.state.status === 'error' ? { text: '检查失败', className: styles.warning }
    : plugin.state.status === 'no-release' ? { text: '无正式 Release', className: styles.warning }
    : plugin.state.status === 'latest' ? { text: '已是最新', className: styles.success }
    : { text: '已安装', className: styles.muted }
  return (
    <article className={styles.card}>
      <div className={styles.cardMain}>
        <div className={styles.titleLine}>
          {plugin.attention && <i className={styles.redDot} />}
          <h3>{plugin.installed?.package ?? source}</h3>
          <span className={styles.badge}>{plugin.entry.source.type === 'npm' ? 'npm' : 'GitHub'}</span>
          {plugin.isSelf && <span className={styles.selfBadge}>管理器自身</span>}
        </div>
        <div className={styles.source}>{source}</div>
        <div className={styles.meta}>
          <span className={status.className}>{status.text}</span>
          {plugin.installed !== null && <span>当前 {plugin.installed.version}</span>}
          {plugin.state.latestVersion !== undefined && <span>最新 {plugin.state.latestVersion}</span>}
          {plugin.state.lastCheckedAt !== undefined && <span>检查于 {new Date(plugin.state.lastCheckedAt).toLocaleString()}</span>}
        </div>
        {plugin.state.error !== undefined && <div className={styles.inlineError}>{plugin.state.error}</div>}
        {task?.status === 'done' && <div className={styles.success}>{task.needsRestart ? '操作完成，重启 DSH 后生效' : '操作完成，刷新页面后生效'}</div>}
        {task?.status === 'failed' && <div className={styles.inlineError}>{task.error}</div>}
        {(busy || (task !== undefined && task.output.length > 0)) && (
          <TaskOutput taskId={0} pluginId="" output={task?.output ?? []} status={task?.status ?? ''} />
        )}
      </div>
      <div className={styles.rowActions}>
        {(plugin.installed === null || plugin.state.status === 'update') && plugin.entry.enabled && (
          <button className={styles.primary} onClick={props.onInstall} disabled={busy}>
            {plugin.installed === null ? '下载安装' : '更新'}
          </button>
        )}
        <button className={styles.secondary} onClick={props.onEdit} disabled={busy}>编辑</button>
        {!plugin.isSelf && <button className={styles.secondary} onClick={props.onToggle} disabled={busy}>{plugin.entry.enabled ? '停用' : '启用'}</button>}
        {!plugin.isSelf && <button className={styles.dangerButton} onClick={props.onRemove} disabled={busy}>删除并卸载</button>}
      </div>
    </article>
  )
}

function TaskOutput(props: { taskId: number; pluginId: string; output: string[]; status: string }) {
  return (
    <details className={styles.taskOutput} open={props.status === 'running'}>
      <summary>{props.status === 'running' ? '查看实时输出' : '查看任务输出'} {props.pluginId}</summary>
      <pre>{props.output.slice(-30).join('\n') || '等待命令输出…'}</pre>
    </details>
  )
}

function PluginForm(props: { original?: PluginEntry; onClose: () => void; onSave: (entry: PluginEntry, originalId?: string) => void }) {
  const original = props.original
  const [type, setType] = useState<'npm' | 'github'>(original?.source.type ?? 'npm')
  const [identity, setIdentity] = useState(original === undefined ? '' : original.source.type === 'npm' ? original.source.package : original.source.repo)
  const [packageName, setPackageName] = useState(original?.package ?? '')
  const github = original?.source.type === 'github' ? original.source : null
  const [installMode, setInstallMode] = useState<GithubSource['installMode']>(github?.installMode ?? 'auto')
  const [asset, setAsset] = useState(github?.asset ?? '')
  const [enabled, setEnabled] = useState(original?.enabled ?? true)

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const value = identity.trim()
    const source = type === 'npm'
      ? { type: 'npm' as const, package: value }
      : { type: 'github' as const, repo: value, installMode, ...(asset.trim() === '' ? {} : { asset: asset.trim() }) }
    const entry: PluginEntry = {
      id: type === 'npm' ? `npm:${value.toLowerCase()}` : `github:${value.toLowerCase()}`,
      source,
      enabled,
      ...(type === 'github' && packageName.trim() !== '' ? { package: packageName.trim() } : {}),
    }
    props.onSave(entry, original?.id)
  }

  return (
    <Modal title={original === undefined ? '添加插件' : '编辑插件'} onClose={props.onClose}>
      <form className={styles.form} onSubmit={submit}>
        <label>来源类型
          <select value={type} onChange={(event) => setType(event.target.value as 'npm' | 'github')} disabled={original !== undefined}>
            <option value="npm">npm</option>
            <option value="github">GitHub Release</option>
          </select>
        </label>
        <label>{type === 'npm' ? 'npm 包名' : 'GitHub 仓库'}
          <input value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder={type === 'npm' ? 'dsh-example 或 @scope/dsh-example' : 'owner/repository'} required />
        </label>
        {type === 'github' && (
          <>
            <label>实际 npm 包名（可选）
              <input value={packageName} onChange={(event) => setPackageName(event.target.value)} placeholder="安装后自动识别" />
            </label>
            <label>安装方式
              <select value={installMode} onChange={(event) => setInstallMode(event.target.value as GithubSource['installMode'])}>
                <option value="auto">自动：唯一 .tgz 优先，否则源码</option>
                <option value="asset">仅预构建 .tgz 资产</option>
                <option value="source">仅 Release 标签源码</option>
              </select>
            </label>
            {installMode !== 'source' && (
              <label>.tgz 资产文件名（可选）
                <input value={asset} onChange={(event) => setAsset(event.target.value)} placeholder="plugin-1.0.0.tgz" />
              </label>
            )}
          </>
        )}
        <label className={styles.checkbox}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />启用此插件</label>
        <div className={styles.modalActions}><button type="button" className={styles.secondary} onClick={props.onClose}>取消</button><button className={styles.primary} type="submit">保存到清单</button></div>
      </form>
    </Modal>
  )
}

function JsonEditor(props: { onClose: () => void; onSave: (config: unknown) => void }) {
  const snapshot = getSnapshot()
  const initial = useMemo(() => JSON.stringify(snapshot.config, null, 2), [])
  const [text, setText] = useState(initial)
  const [error, setError] = useState('')
  const save = (): void => {
    try {
      props.onSave(JSON.parse(text))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }
  return (
    <Modal title="JSON 清单" onClose={props.onClose} wide>
      <p className={styles.help}>可在此直接编辑或粘贴其他电脑的清单。删除已安装插件会在保存后卸载；管理器自身会被自动保留。</p>
      <textarea className={styles.jsonInput} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
      {error !== '' && <div className={styles.inlineError}>{error}</div>}
      <div className={styles.modalActions}>
        <label className={styles.secondary}>导入文件<input className={styles.fileInput} type="file" accept="application/json,.json" onChange={(event) => {
          const file = event.target.files?.[0]
          if (file !== undefined) void file.text().then(setText)
        }} /></label>
        <a className={styles.secondary} href={`${API_PREFIX}/export`} download="dsh-plugins.json">导出文件</a>
        <span className={styles.spacer} />
        <button className={styles.secondary} onClick={props.onClose}>取消</button>
        <button className={styles.primary} onClick={save}>保存并应用</button>
      </div>
    </Modal>
  )
}

function Modal(props: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose() }}>
      <section className={`${styles.modal} ${props.wide === true ? styles.wide : ''}`} role="dialog" aria-modal="true" aria-label={props.title}>
        <div className={styles.modalHeader}><h3>{props.title}</h3><button className={styles.iconButton} onClick={props.onClose} aria-label="关闭">×</button></div>
        {props.children}
      </section>
    </div>
  )
}
