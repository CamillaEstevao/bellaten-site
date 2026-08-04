const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const listeners = new Set()
const tokenKey = 'bellaten_supabase_session'

const getSessionValue = () => {
  try { return JSON.parse(localStorage.getItem(tokenKey) || 'null') } catch { return null }
}
const notify = (event, session) => listeners.forEach(fn => fn(event, session))
const headers = (extra = {}) => {
  const session = getSessionValue()
  return { apikey: key, Authorization: `Bearer ${session?.access_token || key}`, ...extra }
}

class Query {
  constructor(table) { this.table = table; this.method = 'GET'; this.body = null; this.filters = []; this.params = new URLSearchParams() }
  select(cols='*') { this.params.set('select', cols); return this }
  order(col, { ascending=true }={}) { this.params.set('order', `${col}.${ascending?'asc':'desc'}`); return this }
  insert(data) { this.method='POST'; this.body=data; return this }
  update(data) { this.method='PATCH'; this.body=data; return this }
  delete() { this.method='DELETE'; return this }
  eq(col, value) { this.filters.push(`${encodeURIComponent(col)}=eq.${encodeURIComponent(value)}`); return this }
  async run() {
    const qs = [this.params.toString(), ...this.filters].filter(Boolean).join('&')
    const res = await fetch(`${url}/rest/v1/${this.table}${qs?'?'+qs:''}`, { method:this.method, headers:headers({ 'Content-Type':'application/json', Prefer:'return=representation' }), body:this.body ? JSON.stringify(this.body) : undefined })
    const text = await res.text(); let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    return res.ok ? { data, error:null } : { data:null, error:{ message:data?.message || text || 'Erro no Supabase' } }
  }
  then(resolve, reject) { return this.run().then(resolve, reject) }
}

export const supabase = {
  from: table => new Query(table),
  auth: {
    async signInWithPassword({ email, password }) {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, { method:'POST', headers:{ apikey:key, 'Content-Type':'application/json' }, body:JSON.stringify({email,password}) })
      const data = await res.json()
      if (!res.ok) return { data:null, error:{message:data.error_description || data.msg || 'Login inválido'} }
      localStorage.setItem(tokenKey, JSON.stringify(data)); notify('SIGNED_IN', data); return { data:{session:data}, error:null }
    },
    async getSession() { return { data:{ session:getSessionValue() }, error:null } },
    async signOut() { localStorage.removeItem(tokenKey); notify('SIGNED_OUT', null); return {error:null} },
    onAuthStateChange(callback) { listeners.add(callback); return { data:{ subscription:{ unsubscribe:()=>listeners.delete(callback) } } } }
  },
  storage: {
    from(bucket) { return {
      async upload(path, file) {
        const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { method:'POST', headers:headers({ 'Content-Type':file.type || 'application/octet-stream', 'x-upsert':'false' }), body:file })
        const data = await res.json().catch(()=>null)
        return res.ok ? {data,error:null} : {data:null,error:{message:data?.message || 'Falha no upload'}}
      },
      getPublicUrl(path) { return { data:{ publicUrl:`${url}/storage/v1/object/public/${bucket}/${path}` } } }
    }}
  }
}
