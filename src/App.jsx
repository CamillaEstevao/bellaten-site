import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, User, Menu, X, Truck, ShieldCheck, CircleDollarSign, LockKeyhole, Plus, Pencil, Trash2, Package, LayoutDashboard, Tags, LogOut, Minus, MessageCircle, Sparkles, Gift, Heart, Upload, LoaderCircle, ImagePlus } from 'lucide-react'
import logo from './assets/logo-bellaten-cropped.png'
import { categories as fallbackCategories } from './data'
import { supabase } from './supabase'

const WHATSAPP = '5511940746340'
const INSTAGRAM = 'https://instagram.com/bellaten.oficial'
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

function useStore() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('bellaten_cart') || '[]'))

  const loadData = async () => {
    setLoading(true)
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order', { ascending: true })
    ])
    if (productsResult.error) console.error(productsResult.error)
    if (categoriesResult.error) console.error(categoriesResult.error)
    setProducts(productsResult.data || [])
    setCategories(categoriesResult.data || fallbackCategories.map(([name, image], index) => ({ id: `fallback-${index}`, name, image, active: true, display_order: index + 1 })))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => localStorage.setItem('bellaten_cart', JSON.stringify(cart)), [cart])
  return { products, setProducts, categories, setCategories, loading, reload: loadData, cart, setCart }
}

function App() {
  const store = useStore()
  return <Routes>
    <Route path="/*" element={<Storefront {...store} />} />
    <Route path="/admin/*" element={<Admin {...store} />} />
  </Routes>
}

function Storefront({ products, categories, loading, cart, setCart }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const filtered = useMemo(() => products.filter(p => (category === 'Todos' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()) && p.active !== false), [products, query, category])
  const qty = cart.reduce((acc, item) => acc + item.qty, 0)
  const addToCart = product => setCart(prev => {
    const found = prev.find(i => i.id === product.id)
    return found ? prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, product.stock) } : i) : [...prev, { ...product, qty: 1 }]
  })
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, Math.min(i.stock, i.qty + delta)) } : i).filter(i => i.qty > 0))

  return <div className="site-shell">
    <header className="header"><div className="topbar container">
      <button className="icon-btn mobile-only" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <Link to="/" className="brand"><img src={logo} alt="BellaTen" /></Link>
      <div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produtos..." /></div>
      <div className="header-actions"><Link className="header-link desktop-only" to="/admin"><User size={19}/> Entrar</Link><button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingCart size={20}/><span className="desktop-only">Carrinho</span>{qty > 0 && <b>{qty}</b>}</button></div>
    </div><nav className={`nav ${menuOpen ? 'open' : ''}`}><div className="container nav-inner"><a href="#inicio">Início</a><a href="#produtos">Produtos</a><a href="#categorias">Categorias</a><a href="#sobre">Sobre nós</a><a href="#contato">Contato</a><Link to="/admin" className="mobile-only">Painel administrativo</Link></div></nav></header>

    <main><section className="hero" id="inicio"><a className="hero-click" href="#produtos" aria-label="Ver produtos"></a></section>
      <section className="benefits"><div className="container benefits-grid"><Benefit icon={<CircleDollarSign/>} title="Preços acessíveis" text="Produtos para todos os bolsos"/><Benefit icon={<ShieldCheck/>} title="Qualidade garantida" text="Produtos escolhidos com carinho"/><Benefit icon={<Truck/>} title="Entrega rápida" text="Combine diretamente pelo WhatsApp"/><Benefit icon={<LockKeyhole/>} title="Compra segura" text="Pedido confirmado com a vendedora"/></div></section>
      <section className="section container" id="categorias"><div className="section-heading"><span>Explore</span><h2>Categorias</h2><p>Encontre tudo o que você precisa</p></div><div className="categories-grid">{categories.filter(c => c.active !== false).map(c => <button key={c.id || c.name} className={category === c.name ? 'category active' : 'category'} onClick={() => { setCategory(c.name); document.getElementById('produtos')?.scrollIntoView({ behavior:'smooth' }) }}><img src={c.image || 'https://placehold.co/500x500?text=Categoria'} alt=""/><strong>{c.name}</strong></button>)}<button className="category" onClick={() => setCategory('Todos')}><span className="category-more">•••</span><strong>Todos</strong></button></div></section>
      <section className="section products-section" id="produtos"><div className="container"><div className="section-heading"><span>Catálogo</span><h2>{category === 'Todos' ? 'Nossos produtos' : category}</h2><p>Escolha seus favoritos</p></div><div className="mobile-search mobile-only"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produtos..." /></div>{loading ? <div className="empty">Carregando produtos...</div> : <><div className="products-grid">{filtered.map(p => <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />)}</div>{!filtered.length && <div className="empty">Nenhum produto encontrado.</div>}</>}</div></section>
      <section className="brand-section" id="sobre"><div className="container brand-panel"><div className="brand-copy"><span className="eyebrow">O universo BellaTen</span><h2>Beleza que combina com você</h2><p>Produtos escolhidos para deixar sua rotina mais bonita, prática e acessível.</p><a className="primary-btn" href="#produtos">Ver produtos</a></div><div className="brand-highlights"><div><Sparkles/><strong>Novidades</strong><span>Achadinhos para renovar sua nécessaire.</span></div><div><Gift/><strong>Para presentear</strong><span>Monte kits lindos e especiais.</span></div><div><Heart/><strong>Com carinho</strong><span>Produtos para todos os estilos.</span></div></div></div></section>
    </main>
    <footer id="contato" className="premium-footer"><div className="container footer-main"><div className="footer-brand"><img src={logo} alt="BellaTen"/><p>Seu novo jeito de comprar beleza.</p></div><div className="footer-links"><strong>Navegação</strong><a href="#inicio">Início</a><a href="#categorias">Categorias</a><a href="#produtos">Produtos</a></div><div className="footer-contact"><strong>Fale com a BellaTen</strong><a href={INSTAGRAM} target="_blank" rel="noreferrer"><span className="social-mark">◎</span> @bellaten.oficial</a><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"><MessageCircle/> WhatsApp</a></div></div><div className="container footer-bottom"><span>© 2026 BellaTen.</span><span>Desenvolvido por NexCode Studio.</span></div></footer>
    {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} updateQty={updateQty}/>} 
  </div>
}

const Benefit = ({icon,title,text}) => <div className="benefit">{icon}<div><strong>{title}</strong><span>{text}</span></div></div>
function ProductCard({ product, onAdd }) { return <article className="product-card"><div className="product-image"><img src={product.image} alt={product.name}/>{product.featured && <span>Destaque</span>}</div><div className="product-info"><small>{product.category}</small><h3>{product.name}</h3><div><strong>{money(product.price)}</strong><button disabled={product.stock <= 0} onClick={onAdd} aria-label="Adicionar ao carrinho"><ShoppingCart size={19}/></button></div>{product.stock <= 0 && <small>Produto indisponível</small>}</div></article> }
function CartDrawer({ cart, onClose, updateQty }) {
  const total = cart.reduce((a,i) => a + Number(i.price) * i.qty, 0)
  const checkout = () => {
    const lines = cart.map(i => `• ${i.name} — ${i.qty}x ${money(i.price)} = ${money(Number(i.price) * i.qty)}`)
    const text = `Olá, BellaTen! Gostaria de fazer este pedido:\n\n${lines.join('\n')}\n\nTotal: ${money(total)}`
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank')
  }
  return <><div className="drawer-backdrop" onClick={onClose}/><aside className="cart-drawer"><div className="drawer-title"><h2>Seu carrinho</h2><button onClick={onClose}><X/></button></div>{cart.length ? <><div className="cart-list">{cart.map(i => <div className="cart-item" key={i.id}><img src={i.image}/><div><strong>{i.name}</strong><span>{money(i.price)}</span><div className="qty"><button onClick={() => updateQty(i.id,-1)}><Minus size={14}/></button><b>{i.qty}</b><button onClick={() => updateQty(i.id,1)}><Plus size={14}/></button></div></div></div>)}</div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="primary-btn full" onClick={checkout}>Finalizar pelo WhatsApp</button></> : <div className="empty">Seu carrinho está vazio.</div>}</aside></>
}

function Admin({ products, categories, reload }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) }); const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => sub.subscription.unsubscribe() }, [])
  if (authLoading) return <div className="empty">Carregando...</div>
  if (!session) return <AdminLogin />
  return <AdminPanel products={products} categories={categories} reload={reload} />
}

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = async e => { e.preventDefault(); setLoading(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError('E-mail ou senha inválidos.'); setLoading(false) }
  return <div className="modal-backdrop"><form className="modal" onSubmit={login}><img src={logo} alt="BellaTen" style={{maxWidth:180,margin:'0 auto 20px'}}/><h2>Acesso administrativo</h2><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error && <p style={{color:'#b91c1c'}}>{error}</p>}<button className="primary-btn full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button><Link to="/" style={{textAlign:'center'}}>Voltar para a loja</Link></form></div>
}

function AdminPanel({ products, categories, reload }) {
  const [editing, setEditing] = useState(null)
  const [modal, setModal] = useState(false)
  const [categoryModal, setCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const currentView = location.pathname.includes('/categorias')
    ? 'categorias'
    : location.pathname.includes('/produtos')
      ? 'produtos'
      : 'dashboard'

  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  const remove = async id => {
    if (!confirm('Excluir este produto?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return alert(error.message)
    reload()
  }
  const save = async data => {
    const payload = {
      name: data.name,
      category: data.category,
      price: Number(data.price),
      stock: Number(data.stock),
      image: data.image,
      featured: Boolean(data.featured),
      active: Boolean(data.active)
    }
    const result = data.id
      ? await supabase.from('products').update(payload).eq('id', data.id)
      : await supabase.from('products').insert(payload)
    if (result.error) throw result.error
    setModal(false)
    setEditing(null)
    reload()
  }
  const saveCategory = async data => {
    const payload = {
      name: data.name.trim(),
      image: data.image || '',
      active: Boolean(data.active),
      display_order: Number(data.display_order || 0)
    }
    const result = data.id
      ? await supabase.from('categories').update(payload).eq('id', data.id)
      : await supabase.from('categories').insert(payload)
    if (result.error) throw result.error
    setCategoryModal(false)
    setEditingCategory(null)
    reload()
  }
  const removeCategory = async categoryItem => {
    const used = products.filter(p => p.category === categoryItem.name).length
    if (used > 0) return alert(`Esta categoria possui ${used} produto(s). Altere a categoria desses produtos antes de excluir.`)
    if (!confirm(`Excluir a categoria ${categoryItem.name}?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', categoryItem.id)
    if (error) return alert(error.message)
    reload()
  }
  const logout = async () => { await supabase.auth.signOut(); navigate('/') }

  const pageTitle = currentView === 'dashboard' ? 'Dashboard' : currentView === 'categorias' ? 'Categorias' : 'Produtos'

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <img src={logo} alt="BellaTen"/>
      <nav>
        <NavLink to="/admin" end><LayoutDashboard/> Dashboard</NavLink>
        <NavLink to="/admin/produtos"><Package/> Produtos</NavLink>
        <NavLink to="/admin/categorias"><Tags/> Categorias</NavLink>
      </nav>
      <button onClick={logout}><LogOut/> Sair</button>
    </aside>

    <main className="admin-main">
      <header>
        <div><span>Painel Administrativo</span><h1>{pageTitle}</h1></div>
        {currentView === 'produtos' && <button className="primary-btn compact" onClick={() => { setEditing(null); setModal(true) }}><Plus/> Novo produto</button>}
        {currentView === 'categorias' && <button className="primary-btn compact" onClick={() => { setEditingCategory(null); setCategoryModal(true) }}><Plus/> Nova categoria</button>}
      </header>

      {currentView === 'dashboard' && <>
        <div className="admin-stats">
          <div><span>Produtos cadastrados</span><strong>{products.length}</strong></div>
          <div><span>Unidades em estoque</span><strong>{products.reduce((a,p)=>a+Number(p.stock),0)}</strong></div>
          <div><span>Estoque baixo</span><strong>{products.filter(p=>p.stock<20).length}</strong></div>
        </div>
        <section className="admin-card dashboard-welcome">
          <Sparkles/>
          <div><h2>Bem-vinda ao painel BellaTen</h2><p>Use o menu lateral para cadastrar produtos e consultar as categorias da loja.</p></div>
          <button className="primary-btn compact" onClick={() => navigate('/admin/produtos')}>Ver produtos</button>
        </section>
      </>}

      {currentView === 'produtos' && <>
        <div className="admin-stats">
          <div><span>Produtos cadastrados</span><strong>{products.length}</strong></div>
          <div><span>Unidades em estoque</span><strong>{products.reduce((a,p)=>a+Number(p.stock),0)}</strong></div>
          <div><span>Estoque baixo</span><strong>{products.filter(p=>p.stock<20).length}</strong></div>
        </div>
        <section className="admin-card">
          <div className="admin-toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar produtos..."/></div></div>
          <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead><tbody>
            {filtered.map(p=><tr key={p.id}><td><div className="table-product"><img src={p.image || 'https://placehold.co/80x80?text=Produto'} alt=""/><strong>{p.name}</strong></div></td><td>{p.category}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><span className={p.active&&p.stock>0?'status':'status off'}>{p.active ? (p.stock>0?'Ativo':'Sem estoque') : 'Oculto'}</span></td><td><div className="actions"><button onClick={()=>{setEditing(p);setModal(true)}} title="Editar"><Pencil/></button><button className="danger" onClick={()=>remove(p.id)} title="Excluir"><Trash2/></button></div></td></tr>)}
            {!filtered.length && <tr><td colSpan="6" className="table-empty">Nenhum produto encontrado.</td></tr>}
          </tbody></table></div>
        </section>
      </>}

      {currentView === 'categorias' && <section className="admin-card categories-admin">
        <div className="categories-admin-header"><div><h2>Categorias da loja</h2><p>Cadastre, edite, oculte ou exclua categorias do catálogo.</p></div><span>{categories.length} categorias</span></div>
        <div className="categories-admin-grid">{categories.map(categoryItem => <article key={categoryItem.id}>
          <img src={categoryItem.image || 'https://placehold.co/120x120?text=Categoria'} alt=""/>
          <div className="category-card-content"><strong>{categoryItem.name}</strong><span>{products.filter(p => p.category === categoryItem.name).length} produto(s)</span><small>{categoryItem.active ? 'Visível na loja' : 'Oculta na loja'}</small></div>
          <div className="category-card-actions"><button onClick={() => { setEditingCategory(categoryItem); setCategoryModal(true) }} title="Editar"><Pencil/></button><button className="danger" onClick={() => removeCategory(categoryItem)} title="Excluir"><Trash2/></button></div>
        </article>)}</div>
        {!categories.length && <div className="table-empty">Nenhuma categoria cadastrada.</div>}
      </section>}
    </main>
    {modal && <ProductModal product={editing} categories={categories} onClose={()=>{setModal(false);setEditing(null)}} onSave={save}/>}
    {categoryModal && <CategoryModal category={editingCategory} onClose={()=>{setCategoryModal(false);setEditingCategory(null)}} onSave={saveCategory}/>} 
  </div>
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form,setForm]=useState(product || {name:'',category:categories[0]?.name || '',price:'',stock:0,image:'',featured:false,active:true})
  const [saving,setSaving]=useState(false), [error,setError]=useState('')
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}))
  const upload = async e => { const file=e.target.files?.[0]; if(!file)return; setSaving(true); const ext=file.name.split('.').pop(); const path=`${Date.now()}-${crypto.randomUUID()}.${ext}`; const { error }=await supabase.storage.from('products').upload(path,file); if(error){setError(error.message);setSaving(false);return} const { data }=supabase.storage.from('products').getPublicUrl(path); update('image',data.publicUrl); setSaving(false) }
  const submit=async e=>{e.preventDefault();setSaving(true);setError('');try{await onSave(form)}catch(err){setError(err.message)}finally{setSaving(false)}}
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="drawer-title"><h2>{product?'Editar produto':'Novo produto'}</h2><button type="button" onClick={onClose}><X/></button></div><label>Nome<input required value={form.name} onChange={e=>update('name',e.target.value)}/></label><label>Categoria<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.filter(c=>c.active!==false).map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></label><div className="form-row"><label>Preço<input required type="number" min="0" step="0.01" value={form.price} onChange={e=>update('price',e.target.value)}/></label><label>Estoque<input required type="number" min="0" value={form.stock} onChange={e=>update('stock',e.target.value)}/></label></div><div className="field-group"><span>Foto do produto</span><div className="file-upload"><input id="product-file" type="file" accept="image/*" onChange={upload}/><label htmlFor="product-file"><Upload size={18}/><span>Escolher imagem</span></label><small>{saving ? 'Enviando...' : 'JPG, PNG ou WEBP'}</small></div></div><label>Ou URL da imagem<input value={form.image} onChange={e=>update('image',e.target.value)} placeholder="https://..."/></label>{form.image&&<img className="preview" src={form.image}/>}<label><input type="checkbox" checked={form.featured} onChange={e=>update('featured',e.target.checked)}/> Produto em destaque</label><label><input type="checkbox" checked={form.active} onChange={e=>update('active',e.target.checked)}/> Produto visível na loja</label>{error&&<p style={{color:'#b91c1c'}}>{error}</p>}<button className="primary-btn full" disabled={saving}>{saving?<><LoaderCircle size={18}/> Salvando...</>:'Salvar produto'}</button></form></div>
}


function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState(category || { name: '', image: '', active: true, display_order: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const upload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    setError('')
    const ext = file.name.split('.').pop()
    const path = `categories/${Date.now()}-${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file)
    if (error) { setError(error.message); setSaving(false); return }
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    update('image', data.publicUrl)
    setSaving(false)
  }
  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try { await onSave(form) } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <div className="modal-backdrop"><form className="modal category-modal" onSubmit={submit}>
    <div className="drawer-title"><h2>{category ? 'Editar categoria' : 'Nova categoria'}</h2><button type="button" onClick={onClose}><X/></button></div>
    <label>Nome<input required value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Ex.: Perfumes"/></label>
    <div className="field-group"><span>Imagem da categoria</span><div className="file-upload"><input id="category-file" type="file" accept="image/*" onChange={upload}/><label htmlFor="category-file"><ImagePlus size={18}/><span>Escolher imagem</span></label><small>{saving ? 'Enviando...' : 'JPG, PNG ou WEBP'}</small></div></div>
    <label>Ou URL da imagem<input value={form.image} onChange={e=>update('image',e.target.value)} placeholder="https://..."/></label>
    {form.image && <img className="preview category-preview" src={form.image} alt="Prévia da categoria"/>}
    <label>Ordem de exibição<input type="number" min="0" value={form.display_order} onChange={e=>update('display_order',e.target.value)}/></label>
    <label><input type="checkbox" checked={form.active} onChange={e=>update('active',e.target.checked)}/> Categoria visível na loja</label>
    {error && <p style={{color:'#ff6f91'}}>{error}</p>}
    <button className="primary-btn full" disabled={saving}>{saving ? <><LoaderCircle size={18}/> Salvando...</> : 'Salvar categoria'}</button>
  </form></div>
}

export default App
